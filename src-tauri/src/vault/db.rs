//! Opening the vault index, and the rule for when it is thrown away.

use rusqlite::Connection;
use std::path::PathBuf;

/// Bumped whenever `schema.sql` changes shape. A mismatch rebuilds the index
/// rather than migrating it: this is a derived cache, and rebuilding is a few
/// seconds of reading files the user still has. Migrating a cache is effort
/// spent protecting data that was never the source of truth.
pub const SCHEMA_VERSION: i64 = 1;

const SCHEMA: &str = include_str!("schema.sql");

/// Where the index lives. Deliberately in the app's own data directory and
/// never inside the vault: the user's notes folder is theirs, and this code
/// does not write to it.
pub fn index_path(app_data: &std::path::Path) -> PathBuf {
    app_data.join("notes-index").join("index.sqlite3")
}

/// Open the index, creating or rebuilding it as needed.
///
/// Returns the connection and whether the file was rebuilt, so the caller can
/// tell the user their index is being rebuilt rather than silently spending
/// their first minute reindexing.
pub fn open(path: &std::path::Path) -> Result<(Connection, bool), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("index directory: {e}"))?;
    }

    let mut rebuilt = false;
    if path.exists() && stored_version(path) != Some(SCHEMA_VERSION) {
        discard(path)?;
        rebuilt = true;
    }

    let conn = Connection::open(path).map_err(|e| format!("open index: {e}"))?;
    conn.execute_batch(SCHEMA)
        .map_err(|e| format!("apply schema: {e}"))?;
    conn.execute(
        "INSERT INTO meta(key, value) VALUES('schema_version', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [SCHEMA_VERSION.to_string()],
    )
    .map_err(|e| format!("record schema version: {e}"))?;

    assert_fts5(&conn)?;
    Ok((conn, rebuilt))
}

fn stored_version(path: &std::path::Path) -> Option<i64> {
    let conn = Connection::open(path).ok()?;
    conn.query_row(
        "SELECT value FROM meta WHERE key = 'schema_version'",
        [],
        |row| row.get::<_, String>(0),
    )
    .ok()?
    .parse()
    .ok()
}

/// Remove the index and the files WAL mode leaves beside it.
fn discard(path: &std::path::Path) -> Result<(), String> {
    for suffix in ["", "-wal", "-shm"] {
        let mut p = path.as_os_str().to_owned();
        p.push(suffix);
        let p = PathBuf::from(p);
        if p.exists() {
            std::fs::remove_file(&p).map_err(|e| format!("discard stale index: {e}"))?;
        }
    }
    Ok(())
}

/// Fail loudly at open rather than per query.
///
/// FTS5 is a compile-time option. `rusqlite`'s `bundled` feature enables it, but
/// a build that somehow linked a system SQLite without it would otherwise look
/// healthy until the first search, and report "search failed" forever.
fn assert_fts5(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("CREATE VIRTUAL TABLE IF NOT EXISTS temp.fts5_probe USING fts5(x)")
        .map_err(|e| format!("this SQLite build has no FTS5, so vault search cannot work: {e}"))?;
    let _ = conn.execute_batch("DROP TABLE IF EXISTS temp.fts5_probe");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("fracta-vault-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    #[test]
    fn opens_and_reports_fts5() {
        let dir = temp_dir("open");
        let (conn, rebuilt) = open(&index_path(&dir)).expect("open index");
        assert!(!rebuilt, "a fresh index is created, not rebuilt");
        // Proves FTS5 is actually available in this build, not just that the
        // schema text parsed.
        conn.execute_batch(
            "INSERT INTO note_fts(rowid, title, body) VALUES(1, 'a', 'hello world')",
        )
        .expect("write fts row");
        let hits: i64 = conn
            .query_row(
                "SELECT count(*) FROM note_fts WHERE note_fts MATCH 'hello'",
                [],
                |r| r.get(0),
            )
            .expect("query fts");
        assert_eq!(hits, 1);
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A schema change must rebuild rather than migrate, and must say so.
    #[test]
    fn version_mismatch_rebuilds() {
        let dir = temp_dir("rebuild");
        let path = index_path(&dir);
        {
            let (conn, _) = open(&path).expect("first open");
            conn.execute(
                "UPDATE meta SET value = '0' WHERE key = 'schema_version'",
                [],
            )
            .expect("age the index");
        }
        let (_, rebuilt) = open(&path).expect("second open");
        assert!(rebuilt, "an index from another schema version is rebuilt");
        let _ = std::fs::remove_dir_all(&dir);
    }
}
