//! Fractorches sidecar ownership.
//!
//! The desktop app owns the sidecar process it spawns: it starts Fractorches on
//! a loopback port at launch and stops it on exit (PRODUCT-TECH, sidecar
//! lifecycle). An externally started server can be attached with
//! `FRACTA_FRACTORCHES_URL`; a spawned binary is configured with
//! `FRACTA_FRACTORCHES_BIN`. With neither, Observatory reports its data source
//! as unavailable instead of guessing.
//!
//! # Fracta runs its own Fractorches, not somebody else's
//!
//! The binary is single-instance *per data directory*: it takes a lock inside
//! the directory it is given. Left on the default `~/.agentsview`, Fracta and a
//! separately installed AgentsView.app fight over one lock and one SQLite file
//! — whoever starts second is refused, and Fracta ends up riding on an instance
//! it does not own, which disappears when the other app quits.
//!
//! So Fracta gives the sidecar its own data directory, under the app's own
//! support folder. Its own lock, its own database, its own lifecycle. Both apps
//! can run at once and neither can take the other down.
//!
//! The cost is a second sessions database: Fractorches re-ingests from the
//! provider logs rather than sharing AgentsView's. That is the price of not
//! depending on another application being installed.
//!
//! # Why an already-running instance is adopted rather than replaced
//!
//! The Fractorches binary enforces a single instance per machine: started while
//! another is alive, it prints `agentsview already running at <url> (pid N)` and
//! exits immediately, ignoring the `--port` it was given. It has to — the two
//! would contend for one SQLite database.
//!
//! That collided badly with spawning blind. `shutdown()` only runs on a graceful
//! exit, so an app killed or rebuilt — which `tauri dev` does on every Rust
//! change — leaves its sidecar orphaned and holding the lock. The next launch
//! spawned a sidecar that died on the spot, then waited the full 90s readiness
//! timeout on a port nothing would ever bind, and left the URL empty for the
//! rest of the session. The Observatory said "did not become reachable within
//! 90 seconds" while a perfectly healthy sidecar was serving the whole time,
//! and Retry could not help because resolution ran once at startup.
//!
//! So: look for a live instance first and adopt it. An adopted instance is not
//! ours, so `shutdown()` leaves it alone — killing a server another app may be
//! using would be worse than leaving one running.
//!
//! # How orphans are prevented
//!
//! Three layers, because no single one is sufficient on macOS:
//!
//! 1. `RunEvent::Exit` stops the child on a normal quit. This already existed
//!    and covers only the graceful path.
//! 2. SIGTERM / SIGINT / SIGHUP handlers stop it too. This is the layer that was
//!    missing: `tauri dev` terminates the app on every Rust change, and a
//!    signalled process runs no `RunEvent`, so each rebuild leaked a sidecar.
//! 3. SIGKILL cannot be caught, and macOS has no `PR_SET_PDEATHSIG`, so a hard
//!    kill will always be able to strand a child. That case is closed from the
//!    other end: the pid of a sidecar we spawn is written to a pid file, and the
//!    next launch that finds that pid still alive **reclaims ownership of it**
//!    rather than merely borrowing it. The orphan is then killed by any of the
//!    layers above. So at most one can exist, and it never outlives the next
//!    clean exit.

use std::net::TcpListener;
use std::net::TcpStream;
use std::process::{Child, Command};
use std::sync::atomic::{AtomicI32, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

pub struct SidecarState {
    pub base_url: Arc<Mutex<Option<String>>>,
    pub child: Arc<Mutex<Option<Child>>>,
}

/// The pid of the sidecar this app is responsible for, or 0.
///
/// A signal handler may only call async-signal-safe functions, which rules out
/// locking a Mutex. An atomic read and `kill(2)` are both safe, so the pid is
/// mirrored here for the handlers to use.
static OWNED_SIDECAR_PID: AtomicI32 = AtomicI32::new(0);

/// Stop the sidecar and leave. Installed for the signals that terminate the app
/// without running any Rust cleanup.
extern "C" fn stop_sidecar_and_exit(signal: libc::c_int) {
    let pid = OWNED_SIDECAR_PID.load(Ordering::SeqCst);
    if pid > 0 {
        // SAFETY: kill(2) is async-signal-safe.
        unsafe { libc::kill(pid, libc::SIGTERM) };
    }
    // SAFETY: _exit(2) is async-signal-safe. The normal exit path runs atexit
    // handlers that are not, so it cannot be used here.
    unsafe { libc::_exit(128 + signal) };
}

/// Take responsibility for a sidecar process: remember it for `shutdown()`, for
/// the signal handlers, and for the next launch to find if we are killed.
fn take_ownership(pid: u32) {
    OWNED_SIDECAR_PID.store(pid as i32, Ordering::SeqCst);
    if let Some(path) = pid_file_path() {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(path, pid.to_string());
    }
}

fn release_ownership() {
    OWNED_SIDECAR_PID.store(0, Ordering::SeqCst);
    if let Some(path) = pid_file_path() {
        let _ = std::fs::remove_file(path);
    }
}

/// Where the pid of our sidecar is recorded between runs. Deliberately outside
/// `~/.agentsview`, which belongs to Fractorches.
fn pid_file_path() -> Option<std::path::PathBuf> {
    Some(
        dirs::data_dir()?
            .join("fracta-knowledge")
            .join("sidecar.pid"),
    )
}

/// The pid this app recorded on a previous run, if it is still a live process.
fn previously_owned_pid() -> Option<u32> {
    let text = std::fs::read_to_string(pid_file_path()?).ok()?;
    let pid: u32 = text.trim().parse().ok()?;
    // Signal 0 tests for existence and permission without delivering anything.
    // SAFETY: kill(2) with signal 0 has no effect beyond the return code.
    (unsafe { libc::kill(pid as i32, 0) } == 0).then_some(pid)
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
        install_signal_handlers();

        if let Ok(external) = std::env::var("FRACTA_FRACTORCHES_URL") {
            let external = external.trim().trim_end_matches('/').to_string();
            if !external.is_empty() {
                *self.base_url.lock().unwrap() = Some(external);
                return;
            }
        }

        // A live instance already holds the single-instance lock, so spawning
        // would only produce a process that exits at once. Adopt it.
        if let Some((url, pid)) = running_instance() {
            // If it is the one we spawned before being killed, take it back
            // rather than merely borrowing it, so this run is responsible for
            // stopping it. That is what keeps an orphan from outliving more
            // than one launch.
            if previously_owned_pid() == Some(pid) {
                take_ownership(pid);
            }
            *self.base_url.lock().unwrap() = Some(url);
            return;
        }

        let Some(binary) = configured_binary() else {
            return;
        };

        let Some(port) = free_port() else {
            return;
        };
        // 1420 is Fracta's fixed Tauri dev URL. Packaged builds use
        // tauri://localhost, which the sidecar's http/https origin normalizer
        // rejects; those proxy through a Tauri protocol instead of direct
        // fetches.
        let url_slot = Arc::clone(&self.base_url);
        let child_slot = Arc::clone(&self.child);
        let parent = std::process::id();
        std::thread::spawn(move || {
            // Launched under a supervising shell rather than directly. SIGKILL
            // cannot be caught and macOS has no PR_SET_PDEATHSIG, so a hard kill
            // of this app — which is exactly what `tauri dev` does on a rebuild
            // — would otherwise strand the sidecar. The shell is a separate
            // process: it survives our death, notices it, and stops the sidecar.
            // It also exits when the sidecar exits, so the readiness check below
            // still sees a dead child promptly when the single-instance guard
            // refuses the launch.
            let supervisor = format!(
                r#""$1" serve --host 127.0.0.1 --port "$2" --public-origin "$3" &
child=$!
while kill -0 {parent} 2>/dev/null && kill -0 "$child" 2>/dev/null; do sleep 1; done
kill "$child" 2>/dev/null"#
            );
            let dir = data_dir();
            if let Some(dir) = dir.as_ref() {
                let _ = std::fs::create_dir_all(dir);
            }
            let mut command = Command::new("/bin/sh");
            if let Some(dir) = dir {
                // The sidecar reads this to place its lock and its database.
                command.env("AGENTSVIEW_DATA_DIR", dir);
            }
            let child = command
                .arg("-c")
                .arg(&supervisor)
                .arg("fracta-sidecar-supervisor")
                .arg(&binary)
                .arg(port.to_string())
                // The webview origin must be trusted by the sidecar or the
                // browser refuses same-status responses cross-origin.
                .arg("http://localhost:1420")
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn();
            let mut child = match child {
                Ok(child) => child,
                Err(_) => return,
            };
            // Watch the child as well as the port: a sidecar refused by the
            // single-instance guard exits in milliseconds, and waiting the full
            // timeout on its port would burn 90 seconds to learn nothing.
            match wait_for_sidecar(&mut child, port, Duration::from_secs(30)) {
                Ready::Listening => {
                    // child.id() is the supervising shell, not the sidecar. The
                    // pid that matters for reclaiming an orphan is the sidecar's
                    // own, which it publishes in its descriptor — and it does
                    // that just after it starts listening, so the descriptor is
                    // briefly absent at exactly this moment. Wait for it rather
                    // than reading once and recording nothing.
                    if let Some(pid) = await_descriptor_pid(Duration::from_secs(5)) {
                        take_ownership(pid);
                    }
                    *url_slot.lock().unwrap() = Some(format!("http://127.0.0.1:{port}"));
                    *child_slot.lock().unwrap() = Some(child);
                }
                Ready::Exited => {
                    // It refused to start. The usual reason is that another
                    // instance came up in the race between our check and our
                    // spawn, so look once more before giving up.
                    let _ = child.wait();
                    if let Some((url, pid)) = running_instance() {
                        if previously_owned_pid() == Some(pid) {
                            take_ownership(pid);
                        }
                        *url_slot.lock().unwrap() = Some(url);
                    }
                }
                Ready::TimedOut => {
                    let _ = child.kill();
                    let _ = child.wait();
                }
            }
        });
    }

    /// Stop only the sidecar process this app owns. An attached external
    /// server is never touched.
    pub fn shutdown(&self) {
        if let Some(mut child) = self.child.lock().unwrap().take() {
            let _ = child.kill();
            let _ = child.wait();
            release_ownership();
            return;
        }
        // A sidecar reclaimed from a previous run has no Child handle — this
        // process never spawned it — so it is stopped by pid instead.
        let pid = OWNED_SIDECAR_PID.load(Ordering::SeqCst);
        if pid > 0 {
            // SAFETY: kill(2) on a pid this app owns.
            unsafe { libc::kill(pid, libc::SIGTERM) };
            release_ownership();
        }
    }
}

/// The resolved base URL, or an empty string when no Fractorches source is
/// configured. The frontend treats empty as "unavailable" and says so.
///
/// The answer is re-checked rather than remembered. Resolution used to happen
/// once at startup and the result was handed out unchanged for the rest of the
/// session, so a sidecar that went away — killed, crashed, or replaced by the
/// standalone AgentsView app taking the single-instance lock — left every
/// request pointed at a dead port with no way back. "Retry" could not work,
/// because there was nothing to retry: the same dead URL came back each time.
///
/// A loopback TCP connect costs well under a millisecond, so verifying on each
/// call is cheaper than being wrong.
#[tauri::command]
pub fn fractorches_base_url(state: tauri::State<'_, SidecarState>) -> String {
    let current = state.base_url.lock().unwrap().clone();

    if let Some(url) = current {
        if answers(&url) {
            return url;
        }
        // Whatever we were pointed at has gone. Drop it and look again — most
        // often another instance is already serving, and adopting it is exactly
        // the recovery the user is asking for when they press Retry.
        *state.base_url.lock().unwrap() = None;
        if state.child.lock().unwrap().is_none() {
            release_ownership();
        }
    }

    if let Some((url, pid)) = running_instance() {
        if previously_owned_pid() == Some(pid) {
            take_ownership(pid);
        }
        *state.base_url.lock().unwrap() = Some(url.clone());
        return url;
    }

    // Nothing is serving. resolve() will spawn one; the URL appears when it is
    // listening, and the caller is told "unavailable" until then rather than
    // being given a port that is not up yet.
    state.resolve();
    String::new()
}

/// Does this base URL still accept connections?
fn answers(url: &str) -> bool {
    let Some(authority) = url.split("://").nth(1) else {
        return false;
    };
    // A non-loopback attachment (FRACTA_FRACTORCHES_URL) is not ours to probe
    // by address; assume it stands.
    let Ok(address) = authority
        .trim_end_matches('/')
        .parse::<std::net::SocketAddr>()
    else {
        return true;
    };
    TcpStream::connect_timeout(&address, Duration::from_millis(300)).is_ok()
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

/// Fracta's own Fractorches data directory.
///
/// Never `~/.agentsview`: that belongs to the standalone app, and sharing it is
/// what made the two fight over one lock.
fn data_dir() -> Option<std::path::PathBuf> {
    Some(
        dirs::data_dir()?
            .join("fracta-knowledge")
            .join("fractorches"),
    )
}

fn free_port() -> Option<u16> {
    let listener = TcpListener::bind("127.0.0.1:0").ok()?;
    listener.local_addr().ok().map(|addr| addr.port())
}

/// Outcome of waiting for a freshly spawned sidecar.
enum Ready {
    /// The port accepted a connection.
    Listening,
    /// The process exited before the port opened.
    Exited,
    /// Neither happened before the deadline.
    TimedOut,
}

fn wait_for_sidecar(child: &mut Child, port: u16, timeout: Duration) -> Ready {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return Ready::Listening;
        }
        // try_wait does not block, so a child that has already died is noticed
        // on the next quarter-second tick rather than at the deadline.
        if matches!(child.try_wait(), Ok(Some(_))) {
            return Ready::Exited;
        }
        std::thread::sleep(Duration::from_millis(250));
    }
    Ready::TimedOut
}

/// A Fractorches instance already serving on this machine, if there is one.
///
/// The binary records itself in `~/.agentsview/daemon.<pid>.json` with the
/// address it bound. A descriptor can outlive its process, so the address is
/// probed before it is trusted; a stale file simply yields nothing.
fn running_instance() -> Option<(String, u32)> {
    // Deliberately our data directory and not ~/.agentsview. An instance
    // belonging to the standalone AgentsView app is not ours to adopt: doing so
    // made Fracta depend on another application being open, and go dark when it
    // closed.
    running_instance_in(data_dir()?)
}

/// The descriptor-scanning half, taking the directory so it can be tested
/// against a fixture rather than the real `~/.agentsview`.
fn running_instance_in(dir: std::path::PathBuf) -> Option<(String, u32)> {
    let mut newest: Option<(std::time::SystemTime, String, u32)> = None;

    for entry in std::fs::read_dir(dir).ok()?.flatten() {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if !name.starts_with("daemon.") || !name.ends_with(".json") {
            continue;
        }
        let Ok(text) = std::fs::read_to_string(entry.path()) else {
            continue;
        };
        let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) else {
            continue;
        };
        let Some(address) = value.get("address").and_then(|v| v.as_str()) else {
            continue;
        };
        let Some(pid) = value.get("pid").and_then(|v| v.as_u64()) else {
            continue;
        };
        if TcpStream::connect_timeout(
            &match address.parse() {
                Ok(addr) => addr,
                Err(_) => continue,
            },
            Duration::from_millis(500),
        )
        .is_err()
        {
            continue;
        }
        // More than one descriptor can be present after an unclean exit; the
        // most recently written one is the live instance.
        let modified = entry
            .metadata()
            .and_then(|m| m.modified())
            .unwrap_or(std::time::UNIX_EPOCH);
        let url = format!("http://{address}");
        if newest.as_ref().is_none_or(|(seen, _, _)| modified > *seen) {
            newest = Some((modified, url, pid as u32));
        }
    }

    newest.map(|(_, url, pid)| (url, pid))
}

/// The pid of the live instance, once it has published its descriptor.
///
/// A sidecar accepts connections a moment before it writes
/// `~/.agentsview/daemon.<pid>.json`, so a single read right after readiness
/// usually finds nothing.
fn await_descriptor_pid(timeout: Duration) -> Option<u32> {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if let Some((_, pid)) = running_instance() {
            return Some(pid);
        }
        std::thread::sleep(Duration::from_millis(250));
    }
    None
}

/// Stop the sidecar on the signals that end the process without running any
/// Rust cleanup. `tauri dev` terminates the app this way on every rebuild.
/// Installed once; re-entry is harmless because the handler is idempotent.
fn install_signal_handlers() {
    use std::sync::Once;
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        for signal in [libc::SIGTERM, libc::SIGINT, libc::SIGHUP] {
            // SAFETY: the handler calls only async-signal-safe functions.
            unsafe {
                libc::signal(
                    signal,
                    stop_sidecar_and_exit as *const () as libc::sighandler_t,
                )
            };
        }
    });
}

#[allow(dead_code)]
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
    use super::{free_port, running_instance_in, wait_for_port, Duration};
    use std::net::TcpListener;

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

    fn write_descriptor(dir: &std::path::Path, pid: u32, address: &str) {
        std::fs::write(
            dir.join(format!("daemon.{pid}.json")),
            format!(r#"{{"pid":{pid},"address":"{address}","service":"agentsview"}}"#),
        )
        .expect("write descriptor");
    }

    /// A descriptor can outlive the process that wrote it. Trusting one without
    /// probing is what would send the app at a dead address and leave the
    /// Observatory reporting a source that is not there.
    #[test]
    fn stale_descriptor_is_ignored() {
        let dir = std::env::temp_dir().join(format!("fracta-sidecar-stale-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("temp dir");

        let dead = free_port().expect("free port");
        write_descriptor(&dir, 999_001, &format!("127.0.0.1:{dead}"));

        assert!(running_instance_in(dir.clone()).is_none());
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// With both a stale and a live descriptor present — the state left by an
    /// unclean exit — the live one is the answer, and its pid comes back so the
    /// caller can tell whether it is reclaiming its own orphan.
    #[test]
    fn live_descriptor_is_adopted_with_its_pid() {
        let dir = std::env::temp_dir().join(format!("fracta-sidecar-live-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("temp dir");

        let dead = free_port().expect("free port");
        write_descriptor(&dir, 999_002, &format!("127.0.0.1:{dead}"));

        let listener = TcpListener::bind("127.0.0.1:0").expect("listener");
        let live = listener.local_addr().expect("addr").port();
        write_descriptor(&dir, 999_003, &format!("127.0.0.1:{live}"));

        let (url, pid) = running_instance_in(dir.clone()).expect("live instance");
        assert_eq!(url, format!("http://127.0.0.1:{live}"));
        assert_eq!(pid, 999_003);
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// The pid file is how a sidecar orphaned by SIGKILL is recognised as ours
    /// on the next launch. A pid that is no longer alive must not be claimed.
    #[test]
    fn dead_pid_is_not_reclaimed() {
        // A pid this high is not in use, and kill(pid, 0) reports as much.
        assert_eq!(unsafe { libc::kill(999_999_i32, 0) }, -1);
    }
}
