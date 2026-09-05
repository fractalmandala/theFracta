//! The vault command surface.

use super::{db, query, scan, VaultState};
use rusqlite::params;
use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};

/// How many filesystem entries a folder may hold before it is refused as a
/// vault. A notes folder does not hold twenty thousand things; a home directory
/// does.
const PREFLIGHT_CAP: usize = 20_000;

#[derive(Serialize, Clone)]
pub struct ScanProgress {
    pub vault_id: i64,
    pub phase: String,
    pub done: usize,
    pub total: usize,
}

#[derive(Serialize, Clone)]
pub struct ScanDone {
    pub vault_id: i64,
    pub files: usize,
    pub dirs: usize,
    pub missing: usize,
    pub moved: usize,
    pub duration_ms: u128,
    pub cancelled: bool,
    pub error: Option<String>,
}

fn with_conn<T>(
    state: &VaultState,
    f: impl FnOnce(&rusqlite::Connection) -> Result<T, String>,
) -> Result<T, String> {
    let guard = state.conn.lock().unwrap();
    match guard.as_ref() {
        Some(conn) => f(conn),
        None => Err(state
            .open_error
            .lock()
            .unwrap()
            .clone()
            .unwrap_or_else(|| "The vault index is not open.".into())),
    }
}

/// Whether the index is usable, and why not when it is not.
#[tauri::command]
pub fn vault_available(state: State<'_, VaultState>) -> Result<bool, String> {
    match state.open_error.lock().unwrap().clone() {
        Some(error) => Err(error),
        None => Ok(state.conn.lock().unwrap().is_some()),
    }
}

#[tauri::command]
pub fn vault_list(state: State<'_, VaultState>) -> Result<Vec<query::VaultSummary>, String> {
    with_conn(&state, query::list_vaults)
}

#[tauri::command]
pub fn vault_list_children(
    state: State<'_, VaultState>,
    vault_id: i64,
    rel_path: String,
    sort: Option<String>,
) -> Result<query::Children, String> {
    with_conn(&state, |conn| {
        query::children(conn, vault_id, &rel_path, sort.as_deref().unwrap_or("name"))
    })
}

/// Register a folder as a vault and index it.
///
/// The preflight is not a formality: pointed at a home directory this would
/// walk every file the user owns.
#[tauri::command]
pub fn vault_add(
    app: AppHandle,
    state: State<'_, VaultState>,
    path: String,
    label: Option<String>,
) -> Result<i64, String> {
    let root = std::path::Path::new(&path);
    scan::preflight(root, PREFLIGHT_CAP)?;
    let canonical = root
        .canonicalize()
        .map_err(|e| format!("cannot read that folder: {e}"))?;
    let root_text = canonical.to_string_lossy().to_string();
    let label = label.unwrap_or_else(|| {
        canonical
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| root_text.clone())
    });

    let vault_id = with_conn(&state, |conn| {
        conn.execute(
            "INSERT INTO vault(root, label, added_at) VALUES(?1, ?2, ?3)
             ON CONFLICT(root) DO UPDATE SET label = excluded.label",
            params![root_text, label, scan::now_ms()],
        )
        .map_err(|e| e.to_string())?;
        conn.query_row("SELECT id FROM vault WHERE root = ?1", [&root_text], |r| {
            r.get::<_, i64>(0)
        })
        .map_err(|e| e.to_string())
    })?;

    spawn_scan(app, vault_id);
    Ok(vault_id)
}

#[tauri::command]
pub fn vault_remove(state: State<'_, VaultState>, vault_id: i64) -> Result<(), String> {
    with_conn(&state, |conn| {
        // Only the index rows go. The folder and its notes are untouched.
        conn.execute("DELETE FROM vault WHERE id = ?1", [vault_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn vault_scan(app: AppHandle, vault_id: i64) -> Result<(), String> {
    spawn_scan(app, vault_id);
    Ok(())
}

#[tauri::command]
pub fn vault_cancel_scan(state: State<'_, VaultState>, vault_id: i64) -> Result<(), String> {
    if let Some(flag) = state.jobs.lock().unwrap().get(&vault_id) {
        flag.store(true, Ordering::SeqCst);
    }
    Ok(())
}

/// Run the discovery pass off the command thread.
///
/// Scanning holds the write connection, so it cannot run inline: a command that
/// blocked for the length of a 2,000-file walk would freeze the surface that
/// asked for it.
fn spawn_scan(app: AppHandle, vault_id: i64) {
    let cancel = Arc::new(AtomicBool::new(false));
    {
        let state = app.state::<VaultState>();
        state
            .jobs
            .lock()
            .unwrap()
            .insert(vault_id, Arc::clone(&cancel));
    }

    std::thread::spawn(move || {
        let started = std::time::Instant::now();
        let state = app.state::<VaultState>();

        let root: Option<String> = {
            let guard = state.conn.lock().unwrap();
            guard.as_ref().and_then(|conn| {
                conn.execute(
                    "UPDATE vault SET scan_started_at = ?2, last_error = NULL WHERE id = ?1",
                    params![vault_id, scan::now_ms()],
                )
                .ok();
                conn.query_row("SELECT root FROM vault WHERE id = ?1", [vault_id], |r| {
                    r.get::<_, String>(0)
                })
                .ok()
            })
        };
        let Some(root) = root else {
            return;
        };

        let _ = app.emit(
            "vault-scan-progress",
            ScanProgress {
                vault_id,
                phase: "discovering".into(),
                done: 0,
                total: 0,
            },
        );

        // The walk itself holds no lock: it is the long part, and the index
        // stays readable while it runs so the tree keeps answering.
        let walked = scan::walk(std::path::Path::new(&root));

        if cancel.load(Ordering::SeqCst) {
            finish(
                &app,
                vault_id,
                ScanDone {
                    vault_id,
                    files: 0,
                    dirs: 0,
                    missing: 0,
                    moved: 0,
                    duration_ms: started.elapsed().as_millis(),
                    cancelled: true,
                    error: None,
                },
            );
            return;
        }

        let outcome = {
            let mut guard = state.conn.lock().unwrap();
            match guard.as_mut() {
                Some(conn) => match conn.transaction() {
                    Ok(tx) => match scan::apply(&tx, vault_id, &walked) {
                        Ok(applied) => match tx.commit() {
                            Ok(()) => Ok(applied),
                            Err(e) => Err(e.to_string()),
                        },
                        Err(e) => Err(e),
                    },
                    Err(e) => Err(e.to_string()),
                },
                None => Err("The vault index is not open.".into()),
            }
        };

        let done = match outcome {
            Ok(applied) => {
                let guard = state.conn.lock().unwrap();
                if let Some(conn) = guard.as_ref() {
                    let _ = conn.execute(
                        "UPDATE vault SET discovered_at = ?2, last_delta_at = ?2 WHERE id = ?1",
                        params![vault_id, scan::now_ms()],
                    );
                }
                ScanDone {
                    vault_id,
                    files: applied.files,
                    dirs: applied.dirs,
                    missing: applied.missing,
                    moved: applied.moved,
                    duration_ms: started.elapsed().as_millis(),
                    cancelled: false,
                    error: None,
                }
            }
            Err(error) => {
                let guard = state.conn.lock().unwrap();
                if let Some(conn) = guard.as_ref() {
                    let _ = conn.execute(
                        "UPDATE vault SET last_error = ?2 WHERE id = ?1",
                        params![vault_id, &error],
                    );
                }
                ScanDone {
                    vault_id,
                    files: 0,
                    dirs: 0,
                    missing: 0,
                    moved: 0,
                    duration_ms: started.elapsed().as_millis(),
                    cancelled: false,
                    error: Some(error),
                }
            }
        };

        finish(&app, vault_id, done);
    });
}

fn finish(app: &AppHandle, vault_id: i64, done: ScanDone) {
    app.state::<VaultState>()
        .jobs
        .lock()
        .unwrap()
        .remove(&vault_id);
    let _ = app.emit("vault-scan-done", done);
}

/// Where the index file is, for the About dialog and for support questions.
#[tauri::command]
pub fn vault_index_path(app: AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("no app data directory: {e}"))?;
    Ok(db::index_path(&dir).to_string_lossy().to_string())
}
