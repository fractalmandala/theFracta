mod commands;
mod fonts;
pub mod menu;
mod observatory_commands;
mod sidecar;
mod vault;
mod watcher;
mod wiki_commands;

use std::sync::Mutex;
use tauri::Manager;

/// Stores file paths received from OS "Open With" events.
/// These arrive before the webview is ready, so we buffer them.
pub struct OpenedFiles {
    pub paths: Mutex<Vec<String>>,
}

impl Default for OpenedFiles {
    fn default() -> Self {
        Self {
            paths: Mutex::new(Vec::new()),
        }
    }
}

#[tauri::command]
fn get_opened_files(state: tauri::State<'_, OpenedFiles>) -> Vec<String> {
    let mut paths = state.paths.lock().unwrap();
    let result = paths.clone();
    paths.clear();
    result
}

/// Parse a `fracta://open?path=<url-encoded-abs-path>` deep link into an
/// absolute markdown file path. Returns None for any other action, a relative
/// path, a non-markdown extension, or a file that doesn't exist — the scheme is
/// a door any webpage can knock on, so we validate strictly before opening. The
/// path only ever routes to `openFile` (read + render), never a write or exec.
#[cfg(target_os = "macos")]
fn parse_fracta_url(url: &tauri::Url) -> Option<String> {
    let home = std::env::var("HOME").ok()?;
    parse_fracta_url_with_home(url, &home)
}

#[cfg(target_os = "macos")]
fn parse_fracta_url_with_home(url: &tauri::Url, home: &str) -> Option<String> {
    // Action lives in the authority slot: fracta://open?path=...
    if url.host_str() != Some("open") {
        return None;
    }
    // query_pairs() percent-decodes once. ponytail: it also maps `+`→space
    // (form-urlencoding); paths with a literal `+` should encode it as %2B.
    let raw = url
        .query_pairs()
        .find(|(k, _)| k == "path")
        .map(|(_, v)| v.into_owned())?;

    let expanded = match raw.strip_prefix("~/") {
        Some(rest) => format!("{home}/{rest}"),
        None => raw,
    };

    let path = std::path::Path::new(&expanded);
    let is_md = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .map(|e| matches!(e.as_str(), "md" | "markdown" | "mdown" | "mkd"))
        .unwrap_or(false);

    if path.is_absolute() && is_md && path.exists() {
        Some(expanded)
    } else {
        None
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_cli::init())
        .manage(watcher::WatcherState::default())
        .manage(OpenedFiles::default())
        .manage(sidecar::SidecarState::default())
        .manage(vault::VaultState::default())
        .invoke_handler(tauri::generate_handler![
            commands::read_markdown_file,
            commands::write_markdown_file,
            commands::resolve_path,
            commands::path_exists,
            commands::allow_assets,
            commands::list_claude_plans,
            commands::list_folder_md_files,
            commands::quit_app,
            commands::show_ai_context_menu,
            watcher::start_watching,
            watcher::stop_watching,
            get_opened_files,
            observatory_commands::get_projects,
            observatory_commands::get_scan,
            observatory_commands::get_daily_logs_index,
            observatory_commands::get_daily_log,
            observatory_commands::open_in_editor,
            sidecar::fractorches_base_url,
            wiki_commands::wiki_data_dir,
            wiki_commands::list_wiki_entries,
            vault::commands::vault_available,
            vault::commands::vault_list,
            vault::commands::vault_list_children,
            vault::commands::vault_add,
            vault::commands::vault_remove,
            vault::commands::vault_scan,
            vault::commands::vault_cancel_scan,
            vault::commands::vault_index_path,
            fonts::list_system_fonts,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let menu = menu::create_menu(&handle)?;
            app.set_menu(menu)?;

            app.state::<sidecar::SidecarState>().resolve();

            // The notes index. A failure to open is recorded rather than
            // raised: Notes still works without it, on the folder-listing path.
            if let Ok(dir) = app.path().app_data_dir() {
                app.state::<vault::VaultState>().open(&dir);
            }

            // Pick up on disk changes made while the app was closed, so a vault
            // is never quietly out of date on the first screen.
            {
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    let ids: Vec<i64> = {
                        let state = handle.state::<vault::VaultState>();
                        let guard = state.conn.lock().unwrap();
                        guard
                            .as_ref()
                            .and_then(|conn| {
                                conn.prepare("SELECT id FROM vault")
                                    .ok()
                                    .and_then(|mut stmt| {
                                        stmt.query_map([], |r| r.get::<_, i64>(0))
                                            .ok()
                                            .map(|rows| rows.flatten().collect())
                                    })
                            })
                            .unwrap_or_default()
                    };
                    for id in ids {
                        let _ = vault::commands::vault_scan(handle.clone(), id);
                    }
                });
            }

            // Red-button (window) close routes through the frontend quit guard
            // instead of closing, so unsaved changes get a confirm dialog (#54).
            // Cmd+Q / menu Quit go through the custom "quit" menu event above.
            // quit_app (AppHandle::exit) is a hard exit that bypasses this, so a
            // confirmed quit can't loop back here.
            if let Some(main_window) = app.get_webview_window("main") {
                let quit_win = main_window.clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = quit_win.eval("window.__fracta_quit?.()");
                    }
                });
            }

            app.on_menu_event(move |app_handle, event| {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let id = event.id().as_ref();
                    match id {
                        "open" => {
                            let _ = window.eval("window.__fracta_open_file?.()");
                        }
                        "paste_md" => {
                            let _ = window.eval("window.__fracta_paste?.()");
                        }
                        "theme" => {
                            let _ = window.eval("window.__fracta_toggle_theme?.()");
                        }
                        "find" => {
                            let _ = window.eval("window.__fracta_find?.()");
                        }
                        "about" => {
                            let _ = window.eval("window.__fracta_about?.()");
                        }
                        "quit" => {
                            let _ = window.eval("window.__fracta_quit?.()");
                        }
                        // AI lookup right-click menu items — forward the
                        // structured ID to the frontend router. JSON-stringify
                        // the ID so embedded colons (and any future special
                        // chars) survive the eval boundary cleanly.
                        s if s.starts_with("aimenu:") => {
                            let js =
                                format!("window.__fracta_ai_lookup?.({})", serde_json::json!(s));
                            let _ = window.eval(&js);
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                _app_handle
                    .try_state::<sidecar::SidecarState>()
                    .map(|state| state.shutdown());
            }
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = event {
                let app_handle = _app_handle;
                let mut file_paths: Vec<String> = Vec::new();

                for url in urls {
                    // "Open With" / double-click deliver a file: URL; the
                    // fracta:// scheme delivers a link to parse. Unknown
                    // schemes are dropped (openFile can't do anything with them).
                    let path = match url.scheme() {
                        "file" => url
                            .to_file_path()
                            .ok()
                            .map(|p| p.to_string_lossy().to_string()),
                        "fracta" => parse_fracta_url(&url),
                        _ => None,
                    };

                    if let Some(p) = path {
                        file_paths.push(p);
                    }
                }

                if file_paths.is_empty() {
                    return;
                }

                // Try to send directly to frontend if webview is ready
                if let Some(window) = app_handle.get_webview_window("main") {
                    for file_path in &file_paths {
                        let js = format!(
                            "window.__fracta_open_path?.({})",
                            serde_json::json!(file_path)
                        );
                        let _ = window.eval(&js);
                    }
                }

                // Also buffer in state in case webview isn't ready yet
                if let Some(state) = app_handle.try_state::<OpenedFiles>() {
                    if let Ok(mut paths) = state.paths.lock() {
                        paths.extend(file_paths);
                    }
                }
            }
        });
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::parse_fracta_url;
    use tauri::Url;

    fn u(s: &str) -> Url {
        Url::parse(s).unwrap()
    }

    #[test]
    fn parses_valid_open_url_with_encoded_space() {
        let file = std::env::temp_dir().join("fracta knowledge deep link.md");
        std::fs::write(&file, "# hi").unwrap();
        let enc = format!(
            "fracta://open?path={}",
            file.to_string_lossy().replace(' ', "%20")
        );
        assert_eq!(
            parse_fracta_url(&u(&enc)),
            Some(file.to_string_lossy().to_string())
        );
        std::fs::remove_file(&file).ok();
    }

    #[test]
    fn expands_tilde() {
        let home = std::env::temp_dir().join("fracta-knowledge-home-test");
        std::fs::create_dir_all(&home).unwrap();
        let file = home.join("fracta_knowledge_tilde_test.md");
        std::fs::write(&file, "x").unwrap();
        assert_eq!(
            super::parse_fracta_url_with_home(
                &u("fracta://open?path=~/fracta_knowledge_tilde_test.md"),
                home.to_str().unwrap(),
            ),
            Some(file.to_string_lossy().to_string())
        );
        std::fs::remove_file(&file).ok();
        std::fs::remove_dir(&home).ok();
    }

    #[test]
    fn rejects_wrong_action() {
        assert_eq!(parse_fracta_url(&u("fracta://delete?path=/tmp/x.md")), None);
    }

    #[test]
    fn rejects_non_markdown_extension() {
        // /etc/passwd exists but isn't markdown → refused before any open.
        assert_eq!(parse_fracta_url(&u("fracta://open?path=/etc/passwd")), None);
    }

    #[test]
    fn rejects_relative_path() {
        assert_eq!(parse_fracta_url(&u("fracta://open?path=notes.md")), None);
    }

    #[test]
    fn rejects_missing_file() {
        assert_eq!(
            parse_fracta_url(&u("fracta://open?path=/tmp/does-not-exist-abc.md")),
            None
        );
    }

    #[test]
    fn rejects_missing_path_param() {
        assert_eq!(parse_fracta_url(&u("fracta://open")), None);
    }
}
