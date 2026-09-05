//! The notes vault index.
//!
//! A vault is a folder of markdown the user has told the app to treat as their
//! knowledge base. The index is a local SQLite database that records what is in
//! it — and later, what each note says and what it links to — so the app can
//! show a real tree with real counts, and search across the whole thing.
//!
//! # The vault is read-only
//!
//! Every filesystem call in this module is `read_dir`, `metadata` or `read`.
//! Nothing here writes, renames, creates or deletes inside a vault, and the
//! index lives in the app's own data directory rather than in a dotfolder
//! beside the user's notes. Their notes are theirs.
//!
//! # The index is disposable
//!
//! It is a derived cache: every row can be rebuilt from the markdown. That is
//! what makes it safe to drop on a schema change instead of migrating it, and
//! it is the reason a failure to open it degrades the app to the old
//! folder-listing path rather than breaking Notes.

pub mod commands;
pub mod db;
pub mod query;
pub mod scan;

use rusqlite::Connection;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

/// Held by Tauri for the life of the app.
#[derive(Default)]
pub struct VaultState {
    /// `None` until the first successful open. A failure is remembered so the
    /// UI can report why the vault is unavailable instead of showing an empty
    /// tree that looks like an empty vault.
    pub conn: Mutex<Option<Connection>>,
    pub open_error: Mutex<Option<String>>,
    /// Set when the schema was rebuilt, so the first scan can be explained.
    pub rebuilt: Mutex<bool>,
    /// Cancellation flags for running scans, keyed by vault id.
    pub jobs: Mutex<std::collections::HashMap<i64, Arc<AtomicBool>>>,
}

impl VaultState {
    /// Open the index once at startup. Never panics: a vault index that cannot
    /// be opened is a degraded feature, not a broken app.
    pub fn open(&self, app_data: &std::path::Path) {
        match db::open(&db::index_path(app_data)) {
            Ok((conn, rebuilt)) => {
                *self.conn.lock().unwrap() = Some(conn);
                *self.rebuilt.lock().unwrap() = rebuilt;
                *self.open_error.lock().unwrap() = None;
            }
            Err(error) => {
                *self.open_error.lock().unwrap() = Some(error);
            }
        }
    }
}
