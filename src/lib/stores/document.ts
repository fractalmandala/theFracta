import { derived, writable } from "svelte/store";
import { draftOf, HOME_TAB_ID, renderOf, tabStore } from "./tabs";

export interface DocumentState {
  filePath: string | null;
  fileName: string | null;
  content: string;
  renderedHtml: string;
  frontmatter: Record<string, unknown> | null;
  wordCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * The state of an open *operation*, which is the only part of a document that
 * is not already a tab. A read that is still in flight has no tab yet, and one
 * that failed never gets one.
 */
export type OpenStatus = {
  loading: boolean;
  error: string | null;
  filePath: string | null;
  fileName: string | null;
};

const idle: OpenStatus = { loading: false, error: null, filePath: null, fileName: null };

export const openStatus = writable<OpenStatus>(idle);

export function beginOpen(filePath: string, fileName: string): void {
  openStatus.set({ loading: true, error: null, filePath, fileName });
}

export function failOpen(filePath: string, fileName: string, error: string): void {
  openStatus.set({ loading: false, error, filePath, fileName });
}

export function clearOpenStatus(): void {
  openStatus.set(idle);
}

const empty: DocumentState = {
  filePath: null,
  fileName: null,
  content: "",
  renderedHtml: "",
  frontmatter: null,
  wordCount: 0,
  loading: false,
  error: null,
};

/**
 * The active document, derived from the tab that is showing it.
 *
 * This used to be a writable that every caller set alongside `tabStore.addTab`
 * with the same values — a third copy of the document's text and HTML, kept in
 * step by hand. Any path that updated one and not the other left the two
 * disagreeing, which is the staleness `notesState` had to work around.
 *
 * Reading it through `renderOf` also means the HTML comes from the bounded
 * render cache rather than being retained per tab.
 */
export const document = derived(
  [tabStore.tabs, tabStore.activeTabId, openStatus],
  ([tabs, activeId, status]): DocumentState => {
    if (status.loading || status.error) {
      return {
        ...empty,
        filePath: status.filePath,
        fileName: status.fileName,
        loading: status.loading,
        error: status.error,
      };
    }
    if (!activeId || activeId === HOME_TAB_ID) return empty;
    const tab = tabs.find((t) => t.id === activeId);
    if (!tab) return empty;
    const render = renderOf(tab);
    return {
      filePath: tab.filePath,
      fileName: tab.fileName,
      // The text that was rendered, so copy and export cannot disagree with
      // what is on screen — including a draft the user has not saved.
      content: tab.isEditing ? tab.content : draftOf(tab),
      renderedHtml: render.html,
      frontmatter: tab.frontmatter,
      wordCount: tab.wordCount,
      loading: false,
      error: null,
    };
  }
);
