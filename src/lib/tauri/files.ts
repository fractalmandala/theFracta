import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { beginOpen, clearOpenStatus, failOpen } from "../stores/document";
import { draftOf, resolveExternalChange, tabStore, type Tab } from "../stores/tabs";
import { renderFull } from "../renderer/pipeline";
import { get } from "svelte/store";
import { addRecentFile } from "../stores/recents";

export async function readMarkdownFile(path: string): Promise<string> {
  return invoke<string>("read_markdown_file", { path });
}

export async function saveFile(path: string, content: string): Promise<void> {
  await invoke("write_markdown_file", { path, content });
}

export async function openFile(path: string): Promise<void> {
  const absolutePath = await resolvePath(path);
  const fileName = absolutePath.split("/").pop() ?? absolutePath;
  const baseDir = getBaseDir(absolutePath);

  beginOpen(absolutePath, fileName);

  try {
    const content = await readMarkdownFile(absolutePath);
    const result = renderFull(content, baseDir);

    // Whitelist the document's local images with the asset protocol before the
    // HTML hits the DOM, so images outside the static $HOME scope load (#31).
    await allowAssets(result.assetPaths);

    const tabId = tabStore.addTab(absolutePath, fileName, content, result.html, result.frontmatter, result.wordCount);

    // An empty file has nothing to read — drop straight into the editor so the
    // user can start writing, instead of staring at a blank viewer (#52).
    if (content.trim() === "") tabStore.setEditing(tabId, true);

    // The tab above is the document; `document` derives from it. Clearing the
    // open status is all that remains.
    clearOpenStatus();

    addRecentFile(absolutePath, fileName);
    getCurrentWindow().setTitle(`${fileName} — Fracta Knowledge`).catch(() => {});
  } catch (err) {
    failOpen(absolutePath, fileName, `Failed to open file: ${err}`);
  }
}

let newDocCounter = 0;

/**
 * Start a fresh, unsaved markdown document in a new tab, opened straight into
 * the editor — the "new tab" behavior the UI already advertised (#63). It has
 * no filesystem path yet (a `new://` sentinel, like `paste://`); the location
 * is chosen on the first save via `saveAsNewDocument`. The watcher and
 * copy-path/link resolution skip `new://` tabs until they're saved.
 */
export function newDocument(): void {
  const filePath = `new://${Date.now()}-${newDocCounter++}`;
  const result = renderFull("");
  const tabId = tabStore.addTab(
    filePath,
    "Untitled",
    "",
    result.html,
    result.frontmatter,
    result.wordCount
  );
  tabStore.setEditing(tabId, true);
}

/**
 * First-save flow for a `new://` document: prompt for a location, write the
 * content, then re-point the tab at the chosen real path (watch + recents +
 * title). Returns the chosen absolute path, or null if the user cancelled the
 * dialog (caller should leave the tab dirty and in the editor).
 */
export async function saveAsNewDocument(tabId: string, content: string): Promise<string | null> {
  const chosen = await save({
    defaultPath: "Untitled.md",
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd"] }],
  });
  if (!chosen) return null;

  const fileName = chosen.split("/").pop() ?? chosen;
  await saveFile(chosen, content);
  tabStore.rebindPath(tabId, chosen, fileName);
  addRecentFile(chosen, fileName);
  getCurrentWindow().setTitle(`${fileName} — Fracta Knowledge`).catch(() => {});
  return chosen;
}

export async function openFileDialog(): Promise<void> {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Markdown",
          extensions: ["md", "markdown", "mdown", "mkd", "txt"],
        },
      ],
    });

    if (selected) {
      // selected can be string or string[] depending on version
      const path = typeof selected === "string" ? selected : (selected as any)?.path ?? String(selected);
      await openFile(path);
    }
  } catch (err) {
    console.error("File dialog error:", err);
  }
}

/**
 * Take up a change made to the file on disk by something other than us.
 *
 * Three cases, decided by comparing the bytes rather than by timing:
 *
 * 1. **Disk matches what the tab already has.** This is our own write coming
 *    back as a change event, or a touch that changed nothing. Do nothing. This
 *    replaced a 1.5-second "was that us?" suppression window, which both missed
 *    slow events and could swallow a real external change that arrived quickly.
 * 2. **Disk matches the unsaved draft.** Somebody wrote what the user was
 *    about to write. Adopt it, and the draft stops being unsaved.
 * 3. **Disk and the unsaved draft disagree.** Two versions exist and only the
 *    user can say which one is wanted, so both are held and autosave stops for
 *    this file until they choose.
 */
export async function reloadCurrentFile(path: string): Promise<void> {
  try {
    const absolutePath = await resolvePath(path);
    const content = await readMarkdownFile(absolutePath);
    const tab = get(tabStore.tabs).find((t) => t.filePath === absolutePath);
    if (!tab) return;

    const decision = resolveExternalChange(tab, content);
    if (decision === "ignore") return;
    if (decision === "conflict") {
      tabStore.markConflict(absolutePath, content);
      return;
    }

    const baseDir = getBaseDir(absolutePath);
    const result = renderFull(content, baseDir);
    await allowAssets(result.assetPaths);
    tabStore.updateTabContent(absolutePath, content, result.html, result.frontmatter, result.wordCount);
  } catch (err) {
    console.error("Failed to reload file:", err);
  }
}

/** Paths that name a real file, as opposed to a pasted, fetched or unsaved one. */
export function isOnDisk(filePath: string): boolean {
  return (
    !!filePath &&
    !filePath.startsWith("paste://") &&
    !filePath.startsWith("url://") &&
    !filePath.startsWith("new://")
  );
}

/**
 * Write a tab's draft to its own path.
 *
 * The single write path, shared by Cmd+S and by autosave, so the two cannot
 * drift into saving different things. It refuses a document with no location —
 * choosing one is a decision that belongs to an explicit save, never to a
 * background write.
 */
export async function writeDraft(tab: Tab): Promise<void> {
  if (!isOnDisk(tab.filePath)) throw new Error("This document has no location yet.");
  const text = draftOf(tab);
  await saveFile(tab.filePath, text);
  const result = renderFull(text, tab.baseDir);
  await allowAssets(result.assetPaths);
  tabStore.markSaved(tab.id);
  tabStore.updateTabContent(tab.filePath, text, result.html, result.frontmatter, result.wordCount);
}

export function getBaseDir(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(0, idx) : ".";
}

export async function resolvePath(path: string): Promise<string> {
  return invoke<string>("resolve_path", { path });
}

/** Whether a path exists on disk (for the local-file-link existence check, #30). */
export async function pathExists(path: string): Promise<boolean> {
  return invoke<boolean>("path_exists", { path });
}

/** Open a non-markdown local file in the OS default app (#30). */
export async function openWithSystem(path: string): Promise<void> {
  const { openPath } = await import("@tauri-apps/plugin-opener");
  await openPath(path);
}

/**
 * Whitelist resolved local image paths with the webview's asset protocol so
 * they can be fetched regardless of the static $HOME scope (issue #31). A
 * failure here must not block text rendering — a broken image is acceptable
 * degradation, a blank document is not — so it's swallowed.
 */
export async function allowAssets(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await invoke("allow_assets", { paths }).catch(() => {});
}
