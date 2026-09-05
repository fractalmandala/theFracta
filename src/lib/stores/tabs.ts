import { writable, get } from "svelte/store";
import { dropRenders, getRender, putRender } from "../renderer/renderCache";

/**
 * One open document.
 *
 * A tab holds the document's *text* and the user's place in it. What it
 * deliberately does not hold:
 *
 * - **Rendered HTML.** It lives in `renderer/renderCache`, bounded across all
 *   tabs, because HTML is several times the size of its source and a tab the
 *   user has not looked at in an hour has no claim on that memory. Read it with
 *   `renderOf(tab)`.
 * - **A second copy of the text while not editing.** `editContent` is the
 *   edit buffer, and it is `null` whenever there is no edit in progress; before
 *   this it duplicated `content` for the life of every tab.
 */
export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  /** The directory the document's relative links and images resolve against. */
  baseDir: string;
  content: string;
  frontmatter: Record<string, unknown> | null;
  wordCount: number;
  scrollTop: number;
  isEditing: boolean;
  /** The edit buffer, or `null` when the document is not being edited. */
  editContent: string | null;
  dirty: boolean;
  lastSavedAt: number;
  /**
   * Set when the file changed underneath an unsaved edit.
   *
   * Two versions of the document now exist and the app cannot know which one
   * the user wants, so it holds both and stops writing until they say. Without
   * this, autosave would answer the question by overwriting whatever the other
   * writer — a sync client, a git checkout, another editor — had just put there.
   */
  conflict: { diskContent: string; at: number } | null;
}

export const HOME_TAB_ID = "__home__";

/** What the user is currently editing, or the saved text if they are not. */
export function draftOf(tab: Tab): string {
  return tab.editContent ?? tab.content;
}

/**
 * This tab's rendered form, rendering it on a cache miss.
 *
 * While the document is being edited the rendered HTML is not on screen — the
 * textarea is — so this renders the saved text, which is already cached and
 * therefore free on every keystroke. On leaving edit mode it renders the draft
 * instead, so a reader who steps out of the editor without saving sees their
 * unsaved changes rather than the version still on disk.
 */
export function renderOf(tab: Tab) {
  const source = tab.isEditing ? tab.content : draftOf(tab);
  return getRender(tab.filePath, source, tab.baseDir);
}

/**
 * What to do about content that appeared on disk under an open document.
 *
 * Decided by comparing bytes, never by timing. This is the whole of the safety
 * argument for autosave, so it is a pure function with its own tests rather
 * than a branch inside an async reload.
 *
 * - `ignore` — disk already matches what the tab holds. Our own write coming
 *   back as a change event, or a touch that changed nothing.
 * - `adopt` — there is no unsaved draft to lose, or the draft is exactly what
 *   landed. Take the file's version.
 * - `conflict` — an unsaved draft disagrees with what is now on disk. Two
 *   versions exist and only the user can choose; nothing is written until they
 *   do.
 */
export function resolveExternalChange(
  tab: Pick<Tab, "content" | "dirty" | "editContent">,
  diskContent: string
): "ignore" | "adopt" | "conflict" {
  if (diskContent === tab.content) return "ignore";
  if (!tab.dirty) return "adopt";
  return draftOf(tab as Tab) === diskContent ? "adopt" : "conflict";
}

function baseDirOf(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(0, idx) : ".";
}

function createTabStore() {
  const tabs = writable<Tab[]>([]);
  const activeTabId = writable<string | null>(HOME_TAB_ID);

  function generateId(): string {
    return Math.random().toString(36).slice(2, 10);
  }

  function addTab(filePath: string, fileName: string, content: string, renderedHtml: string, frontmatter?: Record<string, unknown> | null, wordCount?: number): string {
    // The caller has just rendered this; seed the cache rather than throwing
    // the work away and re-rendering on the first read.
    putRender(filePath, content, { html: renderedHtml, frontmatter: frontmatter ?? null, wordCount: wordCount ?? 0 });
    const currentTabs = get(tabs);

    // If file is already open, switch to it
    const existing = currentTabs.find((t) => t.filePath === filePath);
    if (existing) {
      activeTabId.set(existing.id);
      tabs.update((ts) =>
        ts.map((t) => {
          if (t.id !== existing.id) return t;
          // Preserve edit state on re-add — only refresh content/render if not dirty
          if (t.isEditing) {
            const dirty = draftOf(t) !== content;
            return { ...t, content, frontmatter: frontmatter ?? null, wordCount: wordCount ?? 0, dirty };
          }
          return { ...t, content, frontmatter: frontmatter ?? null, wordCount: wordCount ?? 0, editContent: null, dirty: false };
        })
      );
      return existing.id;
    }

    const id = generateId();
    const newTab: Tab = {
      id,
      filePath,
      fileName,
      baseDir: baseDirOf(filePath),
      content,
      frontmatter: frontmatter ?? null,
      wordCount: wordCount ?? 0,
      scrollTop: 0,
      isEditing: false,
      editContent: null,
      dirty: false,
      lastSavedAt: 0,
      conflict: null,
    };

    tabs.update((ts) => [...ts, newTab]);
    activeTabId.set(id);
    return id;
  }

  function closeTab(id: string) {
    if (id === HOME_TAB_ID) return; // Can't close home tab
    saveScrollPosition();
    const currentTabs = get(tabs);
    const idx = currentTabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const closed = currentTabs[idx];
    const newTabs = currentTabs.filter((t) => t.id !== id);
    tabs.set(newTabs);
    // Free its HTML now rather than waiting for the cache bounds to evict it.
    if (!newTabs.some((t) => t.filePath === closed.filePath)) dropRenders(closed.filePath);

    // If closing the active tab, switch to adjacent or home
    if (get(activeTabId) === id) {
      if (newTabs.length === 0) {
        activeTabId.set(HOME_TAB_ID);
      } else {
        const newIdx = Math.min(idx, newTabs.length - 1);
        activeTabId.set(newTabs[newIdx].id);
      }
    }
  }

  /**
   * Close every tab but one.
   *
   * There is no cap on how many tabs may be open — a cap would throw away scroll
   * positions and edit buffers to save a few megabytes the render cache already
   * bounds. This is the deliberate version of the same thing: the user decides
   * what to discard. Tabs with unsaved edits are kept, because closing them
   * would destroy work without asking.
   */
  function closeOthers(keepId: string): number {
    saveScrollPosition();
    const currentTabs = get(tabs);
    const kept = currentTabs.filter((t) => t.id === keepId || t.dirty);
    const removed = currentTabs.filter((t) => !kept.includes(t));
    if (removed.length === 0) return 0;
    tabs.set(kept);
    for (const tab of removed) {
      if (!kept.some((t) => t.filePath === tab.filePath)) dropRenders(tab.filePath);
    }
    if (!kept.some((t) => t.id === get(activeTabId))) activeTabId.set(keepId);
    return removed.length;
  }

  function goHome() {
    saveScrollPosition();
    activeTabId.set(HOME_TAB_ID);
  }

  function saveScrollPosition() {
    const currentId = get(activeTabId);
    if (currentId) {
      const scrollTop = window.scrollY;
      tabs.update((ts) =>
        ts.map((t) => (t.id === currentId ? { ...t, scrollTop } : t))
      );
    }
  }

  function switchTab(id: string) {
    if (get(activeTabId) === id) return;
    saveScrollPosition();
    activeTabId.set(id);
  }

  function updateTabContent(filePath: string, content: string, renderedHtml: string, frontmatter?: Record<string, unknown> | null, wordCount?: number) {
    putRender(filePath, content, { html: renderedHtml, frontmatter: frontmatter ?? null, wordCount: wordCount ?? 0 });
    tabs.update((ts) =>
      ts.map((t) => {
        if (t.filePath !== filePath) return t;
        const next: Tab = {
          ...t,
          content,
          frontmatter: frontmatter ?? t.frontmatter,
          wordCount: wordCount ?? t.wordCount,
          // This content is now what is on disk, so whatever disagreement
          // there was is settled.
          conflict: null,
        };
        // Preserve in-progress edits when content updates from external sources (file watcher)
        if (t.isEditing) {
          next.dirty = draftOf(t) !== content;
        } else {
          next.editContent = null;
          next.dirty = false;
        }
        return next;
      })
    );
  }

  /**
   * Record that the file changed on disk while an unsaved edit was in progress.
   *
   * The draft is left exactly as it is. Nothing is merged and nothing is
   * chosen; both versions are held until the user picks one.
   */
  function markConflict(filePath: string, diskContent: string) {
    tabs.update((ts) =>
      ts.map((t) =>
        t.filePath === filePath ? { ...t, conflict: { diskContent, at: Date.now() } } : t
      )
    );
  }

  /** Discard the conflict without changing content — "keep mine". */
  function clearConflict(id: string) {
    tabs.update((ts) => ts.map((t) => (t.id === id ? { ...t, conflict: null } : t)));
  }

  function getActiveTab(): Tab | null {
    const id = get(activeTabId);
    if (!id) return null;
    return get(tabs).find((t) => t.id === id) ?? null;
  }

  function reorderTabs(fromIndex: number, toIndex: number) {
    tabs.update((ts) => {
      const arr = [...ts];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
  }

  function setEditing(id: string, editing: boolean) {
    tabs.update((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        // When entering edit mode, sync editContent to current content if not already dirty
        if (editing && !t.isEditing && !t.dirty) {
          return { ...t, isEditing: true, editContent: t.content };
        }
        // Leaving edit mode with nothing unsaved: drop the buffer rather than
        // keep a second copy of text that is identical to `content`.
        if (!editing && !t.dirty) {
          return { ...t, isEditing: false, editContent: null };
        }
        return { ...t, isEditing: editing };
      })
    );
  }

  function updateEditContent(id: string, newContent: string) {
    tabs.update((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        return { ...t, editContent: newContent, dirty: newContent !== t.content };
      })
    );
  }

  function markSaved(id: string) {
    tabs.update((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        return { ...t, content: draftOf(t), dirty: false, lastSavedAt: Date.now() };
      })
    );
  }

  function getLastSavedAt(filePath: string): number {
    const t = get(tabs).find((x) => x.filePath === filePath);
    return t?.lastSavedAt ?? 0;
  }

  // Re-point a tab at a real filesystem path + name. Used when an unsaved
  // `new://` document gets a location on its first save (#63).
  function rebindPath(id: string, filePath: string, fileName: string) {
    tabs.update((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, filePath, fileName, baseDir: baseDirOf(filePath) } : t
      )
    );
  }

  return {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    closeOthers,
    switchTab,
    updateTabContent,
    getActiveTab,
    reorderTabs,
    goHome,
    setEditing,
    updateEditContent,
    markSaved,
    markConflict,
    clearConflict,
    getLastSavedAt,
    rebindPath,
    saveScrollPosition,
  };
}

export const tabStore = createTabStore();
