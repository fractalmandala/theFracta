//! Reads against the index.
//!
//! Expanding a folder is two indexed lookups, not a directory walk, so it costs
//! the same on a 20-file vault and a 20,000-file one.

use rusqlite::{params, Connection};
use serde::Serialize;

#[derive(Serialize)]
pub struct VaultSummary {
    pub id: i64,
    pub root: String,
    pub label: String,
    /// 'never' | 'discovering' | 'indexing' | 'ready' | 'stale' | 'error'
    pub state: String,
    pub discovered_at: Option<i64>,
    pub indexed_at: Option<i64>,
    pub last_error: Option<String>,
    pub file_count: i64,
    /// Files whose body has been read. Below file_count while indexing, which
    /// is what lets search say it is searching a partial index.
    pub indexed_count: i64,
}

#[derive(Serialize)]
pub struct DirEntry {
    pub rel_path: String,
    pub name: String,
    pub file_count: i64,
    pub subtree_count: i64,
}

#[derive(Serialize)]
pub struct FileEntry {
    pub id: i64,
    pub rel_path: String,
    pub name: String,
    pub title: Option<String>,
    pub mtime_ms: i64,
    pub size: i64,
    pub indexed: bool,
}

#[derive(Serialize)]
pub struct Children {
    pub dirs: Vec<DirEntry>,
    pub files: Vec<FileEntry>,
    /// Stamped so nothing renders index-derived data without saying how old it
    /// is.
    pub indexed_at: Option<i64>,
    pub state: String,
}

pub fn list_vaults(conn: &Connection) -> Result<Vec<VaultSummary>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, root, label, discovered_at, indexed_at, last_error, scan_started_at
             FROM vault ORDER BY added_at",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<i64>>(3)?,
                row.get::<_, Option<i64>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<i64>>(6)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for row in rows.flatten() {
        let (id, root, label, discovered_at, indexed_at, last_error, scan_started_at) = row;
        let file_count: i64 = conn
            .query_row(
                "SELECT count(*) FROM file WHERE vault_id = ?1 AND missing_since IS NULL",
                [id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let indexed_count: i64 = conn
            .query_row(
                "SELECT count(*) FROM file WHERE vault_id = ?1 AND missing_since IS NULL AND indexed_at IS NOT NULL",
                [id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        // Every state here is something the user can be told truthfully. A
        // scan that started and has not finished is reported as running, not as
        // ready with stale numbers.
        let state = if last_error.is_some() {
            "error"
        } else if discovered_at.is_none() {
            if scan_started_at.is_some() {
                "discovering"
            } else {
                "never"
            }
        } else if indexed_count < file_count {
            "indexing"
        } else {
            "ready"
        };

        out.push(VaultSummary {
            id,
            root,
            label,
            state: state.to_string(),
            discovered_at,
            indexed_at,
            last_error,
            file_count,
            indexed_count,
        });
    }
    Ok(out)
}

pub fn children(
    conn: &Connection,
    vault_id: i64,
    rel_path: &str,
    sort: &str,
) -> Result<Children, String> {
    let mut dirs = Vec::new();
    {
        let mut stmt = conn
            .prepare(
                "SELECT rel_path, name, file_count, subtree_count FROM dir
                 WHERE vault_id = ?1 AND parent_rel = ?2 AND missing_since IS NULL
                 ORDER BY name COLLATE NOCASE",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![vault_id, rel_path], |row| {
                Ok(DirEntry {
                    rel_path: row.get(0)?,
                    name: row.get(1)?,
                    file_count: row.get(2)?,
                    subtree_count: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for row in rows.flatten() {
            // A folder holding no markdown anywhere below it is noise in a
            // notes tree.
            if row.subtree_count > 0 {
                dirs.push(row);
            }
        }
    }

    let order = match sort {
        "mtime" => "mtime_ms DESC",
        "title" => "COALESCE(title, name) COLLATE NOCASE",
        _ => "name COLLATE NOCASE",
    };
    let sql = format!(
        "SELECT id, rel_path, name, title, mtime_ms, size, indexed_at FROM file
         WHERE vault_id = ?1 AND parent_rel = ?2 AND missing_since IS NULL
         ORDER BY {order}"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![vault_id, rel_path], |row| {
            Ok(FileEntry {
                id: row.get(0)?,
                rel_path: row.get(1)?,
                name: row.get(2)?,
                title: row.get(3)?,
                mtime_ms: row.get(4)?,
                size: row.get(5)?,
                indexed: row.get::<_, Option<i64>>(6)?.is_some(),
            })
        })
        .map_err(|e| e.to_string())?;
    let files: Vec<FileEntry> = rows.flatten().collect();

    let summary = list_vaults(conn)?.into_iter().find(|v| v.id == vault_id);

    Ok(Children {
        dirs,
        files,
        indexed_at: summary.as_ref().and_then(|v| v.discovered_at),
        state: summary.map(|v| v.state).unwrap_or_else(|| "never".into()),
    })
}
