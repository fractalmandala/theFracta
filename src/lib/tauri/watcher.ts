import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { reloadCurrentFile } from "./files";

let unlisten: UnlistenFn | null = null;
let reloadTimeout: ReturnType<typeof setTimeout> | null = null;

export async function startFileWatcher(filePath: string): Promise<void> {
  if (unlisten) {
    unlisten();
  }

  unlisten = await listen<{ path: string }>("file-changed", () => {
    // Debounce on frontend too — editors may trigger multiple events
    if (reloadTimeout) clearTimeout(reloadTimeout);
    // Whether this was our own write is decided by comparing the file's
    // contents against the tab, in reloadCurrentFile — not by a time window.
    // A window both missed events that arrived late and swallowed real external
    // changes that arrived promptly after a save. Autosave writes often enough
    // that a 1.5-second window would have suppressed almost everything.
    reloadTimeout = setTimeout(() => reloadCurrentFile(filePath), 100);
  });

  // The Rust watcher tracks only one file. Re-start it whenever the active
  // tab changes so returning to a previously opened tab watches its file again.
  invoke("start_watching", { path: filePath }).catch(() => {});

  // Nothing was watching this file while it sat in a background tab, so it may
  // have changed since it was read. Reconcile once on arrival rather than
  // showing a version of the document that is quietly out of date — and, worse,
  // letting an edit be written on top of it. `reloadCurrentFile` makes the same
  // byte comparison as any other change, so an unchanged file costs one read.
  void reloadCurrentFile(filePath);
}

export function stopFileWatcher(): void {
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
    reloadTimeout = null;
  }
  if (unlisten) {
    unlisten();
    unlisten = null;
  }
}
