import { get } from 'svelte/store';
import { document as docStore } from '$lib/stores/document';
import { draftOf, tabStore } from '$lib/stores/tabs';
import { settings } from '$lib/stores/settings';
import { tocVisible, tocEntries, toggleToc } from '$lib/stores/toc';
import { copyAsRichText, copyAsMarkdown } from '$lib/utils/clipboard';
import { newDocument, getBaseDir } from '$lib/tauri/files';
import { renderFull } from '$lib/renderer/pipeline';
import { appState } from './appState.svelte';

/**
 * Read the document, edit it as rich text, or edit its markdown source.
 *
 * These replace View / Split / Edit. Split was a second way of looking at one
 * editing state rather than a mode of its own, and the read-only source view
 * that used to hang off a separate toolbar button is now simply what Raw shows
 * for a document that cannot be edited.
 */
export type NotesMode = 'read' | 'rich' | 'raw';

class NotesState {
	// Which of the three modes the active document is in. Read is the absence
	// of both: the segmented control is the single source of that truth now,
	// where View/Split/Edit needed two flags and a rule about their overlap.
	richMode = $state(false);
	rawMode = $state(false);
	presenting = $state(false);
	showReaderControls = $state(false);
	showCopyMenu = $state(false);
	copyFeedback = $state('');

	// Action hooks registered by NotesModule
	onSaveCallback: (() => Promise<void> | void) | null = null;
	onSetModeCallback: ((mode: NotesMode) => void) | null = null;
	onTogglePresentCallback: (() => void) | null = null;

	toggleReaderControls() {
		this.showCopyMenu = false;
		this.showReaderControls = !this.showReaderControls;
	}

	toggleCopyMenu() {
		this.showReaderControls = false;
		this.showCopyMenu = !this.showCopyMenu;
	}

	closeOverlays() {
		this.showReaderControls = false;
		this.showCopyMenu = false;
	}

	toggleWidthMode() {
		this.closeOverlays();
		settings.update((s) => ({
			...s,
			widthMode: s.widthMode === 'wide' ? 'comfortable' : 'wide'
		}));
	}

	/**
	 * The document's markdown as it stands right now.
	 *
	 * docStore holds the content as it was last rendered, which is not the same
	 * thing while a document is being edited: the store is only refreshed when
	 * edit mode is left. The live text is the active tab's edit buffer, so
	 * anything that acts on "the document" has to read it from there, or it
	 * silently operates on a stale copy — or, for a document that has never
	 * left edit mode, on nothing at all.
	 */
	private currentMarkdown(): { markdown: string; baseDir: string } {
		const tab = tabStore.getActiveTab();
		// `document` is derived from the active tab now, so it can no longer
		// disagree with it. The editing case is still read from the tab because
		// the live buffer is the thing being copied, not the rendered view.
		if (tab?.isEditing) {
			return { markdown: draftOf(tab), baseDir: tab.baseDir };
		}
		const doc = get(docStore);
		return { markdown: doc.content, baseDir: getBaseDir(doc.filePath ?? '') };
	}

	/** The same document as HTML. Rendering is a pure function of the text. */
	private currentHtml(): string {
		const tab = tabStore.getActiveTab();
		if (!tab?.isEditing) return get(docStore).renderedHtml;
		const { markdown, baseDir } = this.currentMarkdown();
		return markdown ? renderFull(markdown, baseDir).html : '';
	}

	/**
	 * Export the document, not the screen.
	 *
	 * This was a bare window.print(), which prints whatever happens to be
	 * mounted — in edit mode, the textarea and its line-number gutter. That is
	 * why the button was disabled while editing: not because a document being
	 * edited cannot be exported, but because printing the screen would have
	 * exported the wrong thing.
	 *
	 * Render the document instead and mount it in a print root that only the
	 * print stylesheet reveals. Then the view mode stops mattering.
	 */
	async exportPdf() {
		this.closeOverlays();
		const html = this.currentHtml();
		if (!html) return;

		const root = globalThis.document.createElement('div');
		root.className = 'print-root';
		// The wrapper the viewer uses, so the document prints with the
		// typography it is read with.
		const article = globalThis.document.createElement('article');
		article.className = 'content-shell';
		article.innerHTML = html;
		root.appendChild(article);
		globalThis.document.body.appendChild(root);

		// remove() on an already-detached node is a no-op, so this is safe to
		// call more than once.
		const cleanup = () => root.remove();
		window.addEventListener('afterprint', cleanup, { once: true });
		try {
			window.print();
		} catch {
			cleanup();
			return;
		}
		// Both engines this runs on block inside print() and then fire
		// afterprint. The timer is only so the node cannot be orphaned if one
		// does neither; it is display:none off-print, so waiting costs nothing.
		setTimeout(cleanup, 60_000);
	}

	async copyRichText() {
		// This used to scrape the rendered HTML off the page with
		// querySelector('article.md-content'), which is why it could not run
		// while editing — and why it had stopped working at all: the viewer's
		// article is .content-shell now, so the query matched nothing and Copy →
		// Rich Text quietly did nothing in every mode. The clipboard helper
		// builds its own offscreen container, so no article need be mounted.
		const html = this.currentHtml();
		const { markdown } = this.currentMarkdown();
		if (!html || !markdown) return;
		const success = await copyAsRichText(html, markdown);
		this.copyFeedback = success ? 'Copied!' : 'Failed';
		this.showCopyMenu = false;
		setTimeout(() => (this.copyFeedback = ''), 1500);
	}

	async copyMarkdown() {
		// docStore.content is the text as it was last rendered, so copying from
		// it while editing silently copied the pre-edit version.
		const { markdown } = this.currentMarkdown();
		if (!markdown) return;
		const success = await copyAsMarkdown(markdown);
		this.copyFeedback = success ? 'Copied!' : 'Failed';
		this.showCopyMenu = false;
		setTimeout(() => (this.copyFeedback = ''), 1500);
	}

	setMode(mode: NotesMode) {
		this.closeOverlays();
		if (this.onSetModeCallback) {
			this.onSetModeCallback(mode);
		}
	}

	togglePresent() {
		this.closeOverlays();
		if (this.onTogglePresentCallback) {
			this.onTogglePresentCallback();
		} else {
			this.presenting = !this.presenting;
		}
	}

	save() {
		this.closeOverlays();
		if (this.onSaveCallback) {
			this.onSaveCallback();
		}
	}

	openSettings() {
		this.closeOverlays();
		// Settings is app-scoped: one dialog, owned by the shell, reachable from
		// every surface rather than only from an open document.
		appState.openSettings();
	}

	newDoc() {
		newDocument();
	}
}

export const notesState = new NotesState();
