import { get } from 'svelte/store';
import { document as docStore } from '$lib/stores/document';
import { tabStore } from '$lib/stores/tabs';
import { settings } from '$lib/stores/settings';
import { tocVisible, tocEntries, toggleToc } from '$lib/stores/toc';
import { copyAsRichText, copyAsMarkdown } from '$lib/utils/clipboard';
import { newDocument } from '$lib/tauri/files';
import { appState } from './appState.svelte';

class NotesState {
	rawMode = $state(false);
	splitMode = $state(false);
	presenting = $state(false);
	showReaderControls = $state(false);
	showCopyMenu = $state(false);
	copyFeedback = $state('');

	// Action hooks registered by NotesModule
	onSaveCallback: (() => Promise<void> | void) | null = null;
	onSetModeCallback: ((mode: 'view' | 'split' | 'edit') => void) | null = null;
	onRawToggleCallback: (() => void) | null = null;
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

	async exportPdf() {
		this.closeOverlays();
		window.print();
	}

	async copyRichText() {
		const article = globalThis.document?.querySelector('article.md-content');
		const doc = get(docStore);
		if (!article || !doc.content) return;
		const success = await copyAsRichText(article.innerHTML, doc.content);
		this.copyFeedback = success ? 'Copied!' : 'Failed';
		this.showCopyMenu = false;
		setTimeout(() => (this.copyFeedback = ''), 1500);
	}

	async copyMarkdown() {
		const doc = get(docStore);
		if (!doc.content) return;
		const success = await copyAsMarkdown(doc.content);
		this.copyFeedback = success ? 'Copied!' : 'Failed';
		this.showCopyMenu = false;
		setTimeout(() => (this.copyFeedback = ''), 1500);
	}

	setMode(mode: 'view' | 'split' | 'edit') {
		this.closeOverlays();
		if (this.onSetModeCallback) {
			this.onSetModeCallback(mode);
		}
	}

	toggleRaw() {
		this.closeOverlays();
		if (this.onRawToggleCallback) {
			this.onRawToggleCallback();
		} else {
			this.rawMode = !this.rawMode;
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
