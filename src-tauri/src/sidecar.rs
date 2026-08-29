//! Fractorches sidecar ownership.
//!
//! The desktop app is the only owner of the sidecar process it spawns:
//! it starts Fractorches on a loopback port at launch and stops it on
//! exit (PRODUCT-TECH, sidecar lifecycle). An externally started server
//! can be attached with `FRACTA_FRACTORCHES_URL`; a spawned binary is
//! configured with `FRACTA_FRACTORCHES_BIN`. With neither, Observatory
//! reports its data source as unavailable instead of guessing.

use std::net::TcpListener;
use std::net::TcpStream;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

pub struct SidecarState {
    pub base_url: Arc<Mutex<Option<String>>>,
    pub child: Arc<Mutex<Option<Child>>>,
}

impl Default for SidecarState {
    fn default() -> Self {
        Self {
            base_url: Arc::new(Mutex::new(None)),
            child: Arc::new(Mutex::new(None)),
        }
    }
}

impl SidecarState {
    /// Resolve the Fractorches base URL. Attaches to an external server when
    /// configured, spawns an owned sidecar when a binary is configured, and
    /// otherwise leaves the URL empty so the UI reports unavailability.
    /// Spawning never blocks startup: readiness is awaited on a background
    /// thread and the URL appears once the sidecar accepts connections.
    pub fn resolve(&self) {
        if let Ok(external) = std::env::var("FRACTA_FRACTORCHES_URL") {
            let external = external.trim().trim_end_matches('/').to_string();
            if !external.is_empty() {
                *self.base_url.lock().unwrap() = Some(external);
                return;
            }
        }

        let Some(binary) = configured_binary() else {
            return;
        };

        let Some(port) = free_port() else {
            return;
        };
        // The webview origin must be trusted by the sidecar or the browser
        // refuses same-status responses cross-origin. 1420 is Fracta's fixed
        // Tauri dev URL. Packaged builds use tauri://localhost, which this
        // flag's http/https normalizer rejects; those will proxy through a
        // Tauri protocol instead of direct fetches.
        let url_slot = Arc::clone(&self.base_url);
        let child_slot = Arc::clone(&self.child);
        std::thread::spawn(move || {
            let child = Command::new(&binary)
                .args([
                    "serve",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    &port.to_string(),
                    "--public-origin",
                    "http://localhost:1420",
                ])
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn();
            let mut child = match child {
                Ok(child) => child,
                Err(_) => return,
            };
            if !wait_for_port(port, Duration::from_secs(90)) {
                let _ = child.kill();
                let _ = child.wait();
                return;
            }
            *url_slot.lock().unwrap() = Some(format!("http://127.0.0.1:{port}"));
            *child_slot.lock().unwrap() = Some(child);
        });
    }

    /// Stop only the sidecar process this app owns. An attached external
    /// server is never touched.
    pub fn shutdown(&self) {
        if let Some(mut child) = self.child.lock().unwrap().take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

/// The resolved base URL, or an empty string when no Fractorches source is
/// configured. The frontend treats empty as "unavailable" and says so.
#[tauri::command]
pub fn fractorches_base_url(state: tauri::State<'_, SidecarState>) -> String {
    state.base_url.lock().unwrap().clone().unwrap_or_default()
}

/// The sidecar binary, in priority order: an explicit override via
/// FRACTA_FRACTORCHES_BIN, then the in-repo build produced by `pnpm sidecar`
/// into the crate's gitignored binaries directory.
fn configured_binary() -> Option<String> {
    if let Ok(bin) = std::env::var("FRACTA_FRACTORCHES_BIN") {
        let bin = bin.trim().to_string();
        if !bin.is_empty() {
            return Some(bin);
        }
    }
    let in_repo = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("binaries")
        .join("fractorches");
    in_repo
        .exists()
        .then(|| in_repo.to_string_lossy().into_owned())
}

fn free_port() -> Option<u16> {
    let listener = TcpListener::bind("127.0.0.1:0").ok()?;
    listener.local_addr().ok().map(|addr| addr.port())
}

fn wait_for_port(port: u16, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(250));
    }
    false
}

#[cfg(test)]
mod tests {
    use super::{free_port, wait_for_port, Duration};

    #[test]
    fn free_port_binds_and_reports() {
        let port = free_port().expect("free port");
        assert!(port > 0);
    }

    #[test]
    fn wait_for_port_times_out_on_closed_port() {
        let port = free_port().expect("free port");
        assert!(!wait_for_port(port, Duration::from_millis(300)));
    }
}
