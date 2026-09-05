//! Walking a vault and recording what is in it.
//!
//! This is the discovery pass: metadata only, never file contents. One
//! `metadata()` per markdown file, no reads, no parsing. For a 2,000-file vault
//! that is a few thousand stat calls and finishes in well under a second, and
//! it is all the tree needs — real names, real counts, no truncation.
//!
//! Reading bodies for search and links is a separate, later pass, so a vault
//! becomes browsable long before it becomes searchable.

use rusqlite::{params, Transaction};
use std::collections::HashMap;
use std::path::Path;
use walkdir::WalkDir;

/// Directories that are never notes. The same list the old
/// `list_folder_md_files` used, plus anything dotted.
const SKIP_DIRS: [&str; 7] = [
    "node_modules",
    "target",
    "dist",
    "build",
    ".git",
    "__pycache__",
    "vendor",
];

pub const MARKDOWN_EXTENSIONS: [&str; 4] = ["md", "markdown", "mdown", "mkd"];

fn is_markdown(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| MARKDOWN_EXTENSIONS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

fn is_hidden_or_skipped(name: &str) -> bool {
    name.starts_with('.') || SKIP_DIRS.contains(&name)
}

/// One markdown file as the walk saw it.
pub struct Found {
    pub rel_path: String,
    pub parent_rel: String,
    pub name: String,
    pub stem_fold: String,
    pub ext: String,
    pub mtime_ms: i64,
    pub size: i64,
    pub inode: Option<i64>,
}

pub struct Walked {
    pub files: Vec<Found>,
    /// Every directory encountered, including empty ones, so the tree can show
    /// a folder that exists but holds nothing yet.
    pub dirs: Vec<String>,
}

/// Walk a vault root. Never follows symlinks and never leaves the filesystem it
/// started on, so a link back into the tree or a mounted volume cannot turn
/// this into an unbounded traversal.
pub fn walk(root: &Path) -> Walked {
    let mut files = Vec::new();
    let mut dirs = vec![String::new()];

    let iter = WalkDir::new(root)
        .follow_links(false)
        .same_file_system(true)
        .into_iter()
        .filter_entry(|entry| {
            if entry.depth() == 0 {
                return true;
            }
            entry
                .file_name()
                .to_str()
                .map(|name| !is_hidden_or_skipped(name))
                .unwrap_or(false)
        });

    for entry in iter.flatten() {
        let path = entry.path();
        let Ok(rel) = path.strip_prefix(root) else {
            continue;
        };
        // POSIX separators throughout: the index is keyed by these strings and
        // they cross into JSON and back.
        let rel_path = rel.to_string_lossy().replace('\\', "/");

        if entry.file_type().is_dir() {
            if entry.depth() > 0 {
                dirs.push(rel_path);
            }
            continue;
        }
        if !entry.file_type().is_file() || !is_markdown(path) {
            continue;
        }
        let Ok(meta) = entry.metadata() else {
            continue;
        };

        let name = entry.file_name().to_string_lossy().to_string();
        let parent_rel = rel_path
            .rsplit_once('/')
            .map(|(p, _)| p)
            .unwrap_or("")
            .to_string();
        let stem = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| name.clone());
        let ext = path
            .extension()
            .map(|e| e.to_string_lossy().to_ascii_lowercase())
            .unwrap_or_default();

        files.push(Found {
            rel_path,
            parent_rel,
            name,
            stem_fold: stem.to_lowercase(),
            ext,
            mtime_ms: mtime_ms(&meta),
            size: meta.len() as i64,
            inode: inode_of(&meta),
        });
    }

    Walked { files, dirs }
}

fn mtime_ms(meta: &std::fs::Metadata) -> i64 {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[cfg(unix)]
fn inode_of(meta: &std::fs::Metadata) -> Option<i64> {
    use std::os::unix::fs::MetadataExt;
    Some(meta.ino() as i64)
}

#[cfg(not(unix))]
fn inode_of(_meta: &std::fs::Metadata) -> Option<i64> {
    None
}

pub struct Applied {
    pub files: usize,
    pub dirs: usize,
    pub missing: usize,
    pub moved: usize,
}

/// Write a walk into the index.
///
/// Rows the walk did not visit are marked missing rather than deleted, so
/// inbound links to a note that has gone can still say so. A file that moved is
/// matched by inode first, then by size and content hash, and keeps its id —
/// which is what preserves its backlinks and its full-text row across a rename.
pub fn apply(tx: &Transaction<'_>, vault_id: i64, walked: &Walked) -> Result<Applied, String> {
    let now = now_ms();

    let mut before: HashMap<String, (i64, Option<i64>, i64, Option<String>)> = HashMap::new();
    {
        let mut stmt = tx
            .prepare("SELECT rel_path, id, inode, size, content_hash FROM file WHERE vault_id = ?1 AND missing_since IS NULL")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([vault_id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, Option<i64>>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, Option<String>>(4)?,
                ))
            })
            .map_err(|e| e.to_string())?;
        for row in rows.flatten() {
            before.insert(row.0, (row.1, row.2, row.3, row.4));
        }
    }

    // Directories first: the tree needs a parent row before its children.
    for rel in &walked.dirs {
        let name = rel
            .rsplit_once('/')
            .map(|(_, n)| n)
            .unwrap_or(rel)
            .to_string();
        let parent: Option<String> = if rel.is_empty() {
            None
        } else {
            Some(
                rel.rsplit_once('/')
                    .map(|(p, _)| p)
                    .unwrap_or("")
                    .to_string(),
            )
        };
        tx.execute(
            "INSERT INTO dir(vault_id, rel_path, parent_rel, name, missing_since)
             VALUES(?1, ?2, ?3, ?4, NULL)
             ON CONFLICT(vault_id, rel_path) DO UPDATE SET
               parent_rel = excluded.parent_rel, name = excluded.name, missing_since = NULL",
            params![vault_id, rel, parent, name],
        )
        .map_err(|e| e.to_string())?;
    }

    let mut moved = 0usize;
    for found in &walked.files {
        if before.remove(&found.rel_path).is_some() {
            // Same path: update in place, keeping the id.
            tx.execute(
                "UPDATE file SET parent_rel = ?3, name = ?4, stem_fold = ?5, ext = ?6,
                                 mtime_ms = ?7, size = ?8, inode = ?9, missing_since = NULL
                 WHERE vault_id = ?1 AND rel_path = ?2",
                params![
                    vault_id,
                    found.rel_path,
                    found.parent_rel,
                    found.name,
                    found.stem_fold,
                    found.ext,
                    found.mtime_ms,
                    found.size,
                    found.inode
                ],
            )
            .map_err(|e| e.to_string())?;
            continue;
        }

        // A new path. Before creating a row, see whether it is a file we already
        // know that has moved — matching by inode, then by size and hash.
        let previous = before.iter().find(|(_, (_, inode, size, hash))| {
            (found.inode.is_some() && *inode == found.inode)
                || (*size == found.size && hash.is_some() && *hash == hash_of(found))
        });

        if let Some((old_path, id)) = previous.map(|(k, v)| (k.clone(), v.0)) {
            tx.execute(
                "UPDATE file SET rel_path = ?2, parent_rel = ?3, name = ?4, stem_fold = ?5,
                                 mtime_ms = ?6, size = ?7, inode = ?8, missing_since = NULL
                 WHERE id = ?1",
                params![
                    id,
                    found.rel_path,
                    found.parent_rel,
                    found.name,
                    found.stem_fold,
                    found.mtime_ms,
                    found.size,
                    found.inode
                ],
            )
            .map_err(|e| e.to_string())?;
            before.remove(&old_path);
            moved += 1;
            continue;
        }

        tx.execute(
            "INSERT INTO file(vault_id, rel_path, parent_rel, name, stem_fold, ext,
                              mtime_ms, size, inode)
             VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(vault_id, rel_path) DO UPDATE SET
               mtime_ms = excluded.mtime_ms, size = excluded.size,
               inode = excluded.inode, missing_since = NULL",
            params![
                vault_id,
                found.rel_path,
                found.parent_rel,
                found.name,
                found.stem_fold,
                found.ext,
                found.mtime_ms,
                found.size,
                found.inode
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // Whatever is left was not seen this pass.
    let missing = before.len();
    for (_, (id, _, _, _)) in before {
        tx.execute(
            "UPDATE file SET missing_since = ?2 WHERE id = ?1 AND missing_since IS NULL",
            params![id, now],
        )
        .map_err(|e| e.to_string())?;
    }

    roll_up_counts(tx, vault_id)?;

    Ok(Applied {
        files: walked.files.len(),
        dirs: walked.dirs.len(),
        missing,
        moved,
    })
}

/// The discovery pass has no hashes yet, so a size-only match is not enough on
/// its own to call something a move.
fn hash_of(_found: &Found) -> Option<String> {
    None
}

/// Direct and subtree markdown counts per directory.
///
/// Computed in SQL over the whole vault rather than incrementally: at a few
/// thousand rows it is milliseconds, and an incremental roll-up is the kind of
/// bookkeeping that silently drifts until a folder badge lies.
fn roll_up_counts(tx: &Transaction<'_>, vault_id: i64) -> Result<(), String> {
    tx.execute(
        "UPDATE dir SET file_count = (
             SELECT count(*) FROM file f
             WHERE f.vault_id = dir.vault_id AND f.parent_rel = dir.rel_path
               AND f.missing_since IS NULL
         )
         WHERE vault_id = ?1",
        [vault_id],
    )
    .map_err(|e| e.to_string())?;

    // A file is in a directory's subtree when its path starts with that
    // directory's path plus a separator; the root holds everything.
    tx.execute(
        "UPDATE dir SET subtree_count = (
             SELECT count(*) FROM file f
             WHERE f.vault_id = dir.vault_id AND f.missing_since IS NULL
               AND (dir.rel_path = '' OR f.rel_path LIKE dir.rel_path || '/%')
         )
         WHERE vault_id = ?1",
        [vault_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Refuse a root that would swallow the machine.
///
/// A vault is a notes folder. Pointed at `/` or a home directory it would walk
/// every file the user owns, and the recursive watcher that follows would then
/// register against all of it.
pub fn preflight(root: &Path, cap: usize) -> Result<usize, String> {
    let canonical = root
        .canonicalize()
        .map_err(|e| format!("cannot read that folder: {e}"))?;
    if canonical.parent().is_none() {
        return Err("The filesystem root is not a notes vault.".into());
    }
    if dirs::home_dir().map(|h| h == canonical).unwrap_or(false) {
        return Err(
            "Your home folder is too broad to index as a vault. Choose the notes folder inside it."
                .into(),
        );
    }

    let mut count = 0usize;
    for _entry in WalkDir::new(&canonical)
        .follow_links(false)
        .same_file_system(true)
        .into_iter()
        .filter_entry(|e| {
            e.depth() == 0
                || e.file_name()
                    .to_str()
                    .map(|n| !is_hidden_or_skipped(n))
                    .unwrap_or(false)
        })
        .flatten()
    {
        count += 1;
        if count > cap {
            return Err(format!(
                "That folder holds more than {cap} entries, which is larger than a notes vault is meant to be. Choose a narrower folder."
            ));
        }
    }
    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn fixture(tag: &str) -> std::path::PathBuf {
        let root = std::env::temp_dir().join(format!("fracta-walk-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("sub/deeper")).unwrap();
        fs::create_dir_all(root.join("node_modules/pkg")).unwrap();
        fs::create_dir_all(root.join(".obsidian")).unwrap();
        fs::write(root.join("one.md"), "# One").unwrap();
        fs::write(root.join("sub/two.markdown"), "# Two").unwrap();
        fs::write(root.join("sub/deeper/three.md"), "# Three").unwrap();
        fs::write(root.join("sub/notes.txt"), "not markdown").unwrap();
        fs::write(root.join("node_modules/pkg/readme.md"), "# skip me").unwrap();
        fs::write(root.join(".obsidian/config.md"), "# skip me too").unwrap();
        root
    }

    #[test]
    fn walks_every_depth_and_skips_the_noise() {
        let root = fixture("depth");
        let walked = walk(&root);
        let mut paths: Vec<_> = walked.files.iter().map(|f| f.rel_path.clone()).collect();
        paths.sort();
        // No depth limit: three.md is three levels down and still found. The
        // old list_folder_md_files defaulted to depth 3 and truncated at 50.
        assert_eq!(
            paths,
            vec!["one.md", "sub/deeper/three.md", "sub/two.markdown"]
        );
        let _ = fs::remove_dir_all(&root);
    }

    /// The whole point of the index: a vault is never reported short.
    #[test]
    fn counts_roll_up_without_truncation() {
        let root = fixture("counts");
        let (mut conn, _) = crate::vault::db::open(&root.join(".idx/index.sqlite3")).unwrap();
        let vault_id = {
            let tx = conn.transaction().unwrap();
            tx.execute(
                "INSERT INTO vault(root, label, added_at) VALUES(?1, 'fixture', 0)",
                [root.to_string_lossy()],
            )
            .unwrap();
            let id = tx.last_insert_rowid();
            let walked = walk(&root);
            let applied = apply(&tx, id, &walked).unwrap();
            assert_eq!(applied.files, 3);
            tx.commit().unwrap();
            id
        };

        let root_subtree: i64 = conn
            .query_row(
                "SELECT subtree_count FROM dir WHERE vault_id = ?1 AND rel_path = ''",
                [vault_id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(
            root_subtree, 3,
            "the root counts every markdown file below it"
        );

        let sub_direct: i64 = conn
            .query_row(
                "SELECT file_count FROM dir WHERE vault_id = ?1 AND rel_path = 'sub'",
                [vault_id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(sub_direct, 1, "direct children only");
        let _ = fs::remove_dir_all(&root);
    }

    /// A renamed note keeps its row, which is what keeps its backlinks and its
    /// full-text entry alive across the rename.
    #[test]
    fn a_moved_file_keeps_its_id() {
        let root = fixture("move");
        let (mut conn, _) = crate::vault::db::open(&root.join(".idx/index.sqlite3")).unwrap();
        let tx = conn.transaction().unwrap();
        tx.execute(
            "INSERT INTO vault(root, label, added_at) VALUES(?1, 'fixture', 0)",
            [root.to_string_lossy()],
        )
        .unwrap();
        let vault_id = tx.last_insert_rowid();
        apply(&tx, vault_id, &walk(&root)).unwrap();
        let before: i64 = tx
            .query_row(
                "SELECT id FROM file WHERE vault_id = ?1 AND rel_path = 'one.md'",
                [vault_id],
                |r| r.get(0),
            )
            .unwrap();
        tx.commit().unwrap();

        fs::rename(root.join("one.md"), root.join("sub/renamed.md")).unwrap();

        let tx = conn.transaction().unwrap();
        let applied = apply(&tx, vault_id, &walk(&root)).unwrap();
        assert_eq!(
            applied.moved, 1,
            "recognised as a move, not a delete plus an add"
        );
        let after: i64 = tx
            .query_row(
                "SELECT id FROM file WHERE vault_id = ?1 AND rel_path = 'sub/renamed.md'",
                [vault_id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(before, after, "the row survives the move");
        tx.commit().unwrap();
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn preflight_refuses_the_home_directory() {
        if let Some(home) = dirs::home_dir() {
            assert!(preflight(&home, 20_000).is_err());
        }
    }
}
