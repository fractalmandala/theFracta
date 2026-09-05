//! Wiki article store.
//!
//! Wiki articles are private user data: one Markdown file per article under
//! the store's `entries/` directory, Git-ignored inside the app folder. The
//! root resolves in priority order — an explicit `FRACTA_WIKI_ROOT` override,
//! the in-repo `wiki/` directory for development builds, then the documented
//! machine-local fallback (`~/.fracta/wiki`, docs/wiki-privacy.md). Resolving
//! never deletes or recreates anything (data safety): it only creates the
//! missing `entries/` directory so reads and writes have a home.

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
pub struct WikiRoot {
    pub path: String,
    /// Which resolution step produced the path: "override", "repo", or "home".
    pub source: String,
}

#[derive(Serialize)]
pub struct WikiEntryFile {
    pub name: String,
    pub path: String,
    pub modified: u64,
}

/// The maximum number of article files listed. The store is user-scale, so
/// this is a safety valve against a pathological directory, not a working cap.
const MAX_LISTED_ENTRIES: usize = 2000;

/// The in-repo candidate for development builds. Compile-time path, exactly
/// like the sidecar binary lookup in `sidecar.rs`.
fn repo_candidate() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("wiki")
}

fn explicit_root() -> Option<PathBuf> {
    std::env::var("FRACTA_WIKI_ROOT")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
}

/// Pure resolution so tests can inject candidates. Priority: explicit
/// override, an existing in-repo `wiki/` directory, then the home fallback.
fn wiki_root_from(
    explicit: Option<PathBuf>,
    repo: PathBuf,
    home: Option<PathBuf>,
) -> (PathBuf, &'static str) {
    if let Some(path) = explicit {
        return (path, "override");
    }
    if repo.is_dir() {
        return (repo, "repo");
    }
    if let Some(home) = home {
        return (home.join(".fracta").join("wiki"), "home");
    }
    (repo, "repo")
}

fn resolve_root() -> (PathBuf, &'static str) {
    wiki_root_from(explicit_root(), repo_candidate(), dirs::home_dir())
}

fn entries_dir() -> Result<PathBuf, String> {
    let (root, _) = resolve_root();
    let entries = root.join("entries");
    fs::create_dir_all(&entries)
        .map_err(|e| format!("Cannot create wiki entries directory: {e}"))?;
    Ok(entries)
}

fn list_entries_in(dir: &Path) -> Vec<WikiEntryFile> {
    let Ok(entries) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut files: Vec<WikiEntryFile> = entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if !path.is_file() {
                return None;
            }
            let is_markdown = path
                .extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| matches!(ext, "md" | "markdown" | "mdown" | "mkd"));
            if !is_markdown {
                return None;
            }
            let name = path
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
                .unwrap_or_default();
            let modified = entry
                .metadata()
                .ok()
                .and_then(|meta| meta.modified().ok())
                .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|duration| duration.as_millis() as u64)
                .unwrap_or(0);
            Some(WikiEntryFile {
                name,
                path: path.to_string_lossy().into_owned(),
                modified,
            })
        })
        .collect();
    // Newest first; ties break by name so the order is deterministic.
    files.sort_by(|a, b| {
        b.modified
            .cmp(&a.modified)
            .then_with(|| a.name.cmp(&b.name))
    });
    files.truncate(MAX_LISTED_ENTRIES);
    files
}

/// Resolve the wiki store root, creating only its missing `entries/`
/// directory. Never deletes, truncates, or recreates existing data.
#[tauri::command]
pub fn wiki_data_dir() -> Result<WikiRoot, String> {
    let (root, source) = resolve_root();
    let dir = root.join("entries");
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create wiki entries directory: {e}"))?;
    Ok(WikiRoot {
        path: root.to_string_lossy().into_owned(),
        source: source.to_string(),
    })
}

/// List article files in the store's `entries/` directory, newest first.
/// A missing store is an empty list, not an error: an empty wiki is a real
/// state, not a failure.
#[tauri::command]
pub fn list_wiki_entries() -> Result<Vec<WikiEntryFile>, String> {
    let dir = entries_dir()?;
    Ok(list_entries_in(&dir))
}

#[cfg(test)]
mod tests {
    use super::{list_entries_in, wiki_root_from};
    use std::fs;
    use std::path::PathBuf;

    fn temp_dir(label: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fracta-wiki-test-{label}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn override_wins_over_everything() {
        let override_dir = temp_dir("override");
        let repo_dir = temp_dir("repo");
        let (root, source) = wiki_root_from(
            Some(override_dir.clone()),
            repo_dir,
            Some(PathBuf::from("/home-test")),
        );
        assert_eq!((root, source), (override_dir, "override"));
    }

    #[test]
    fn existing_repo_dir_is_used_before_home() {
        let repo_dir = temp_dir("repo-present");
        let (root, source) =
            wiki_root_from(None, repo_dir.clone(), Some(PathBuf::from("/home-test")));
        assert_eq!((root, source), (repo_dir, "repo"));
    }

    #[test]
    fn home_fallback_when_repo_missing() {
        let missing = PathBuf::from("/nonexistent-fracta-wiki-candidate");
        let home = temp_dir("home");
        let (root, source) = wiki_root_from(None, missing, Some(home.clone()));
        assert_eq!((root, source), (home.join(".fracta/wiki"), "home"));
    }

    #[test]
    fn lists_flat_markdown_files_only() {
        let dir = temp_dir("list");
        fs::write(dir.join("b.md"), "later").unwrap();
        fs::write(dir.join("a.md"), "earlier").unwrap();
        fs::write(dir.join("notes.txt"), "ignored").unwrap();
        fs::create_dir_all(dir.join("sub")).unwrap();
        fs::write(dir.join("sub/nested.md"), "ignored").unwrap();

        let files = list_entries_in(&dir);
        let names: Vec<&str> = files.iter().map(|file| file.name.as_str()).collect();
        assert_eq!(names, vec!["a.md", "b.md"]);
    }
}
