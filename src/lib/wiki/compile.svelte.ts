// Wiki compile state: drives draft compilation through the Fractorches
// service's insight machinery. The service generates; this state only tracks
// availability, the in-flight request, the result, and truthful failures.
// The panel is explicitly opened from the sidebar so browsing corpus entries
// is never hijacked by a selection.

import { compileWikiArticle, wikiCompileStatus } from '$lib/observatory-fractorches';
import type { WikiCompileResult, WikiCompileStatus } from '$lib/observatory-fractorches';

class WikiCompileState {
	status = $state<WikiCompileStatus | null>(null);
	statusError = $state<string | null>(null);
	statusLoading = $state(false);
	compiling = $state(false);
	compileError = $state<string | null>(null);
	result = $state<WikiCompileResult | null>(null);
	topic = $state('');
	panelOpen = $state(false);

	available = $derived(this.status?.available ?? false);

	async loadStatus() {
		if (this.status || this.statusLoading) return;
		this.statusLoading = true;
		this.statusError = null;
		try {
			this.status = await wikiCompileStatus();
		} catch (error) {
			this.statusError = error instanceof Error ? error.message : 'Fractorches is unavailable';
		} finally {
			this.statusLoading = false;
		}
	}

	async compile(entryIds: string[]) {
		if (this.compiling) return;
		this.compiling = true;
		this.compileError = null;
		this.result = null;
		try {
			this.result = await compileWikiArticle(entryIds, this.topic.trim() || undefined);
		} catch (error) {
			this.compileError = error instanceof Error ? error.message : 'Compilation failed';
		} finally {
			this.compiling = false;
		}
	}

	openPanel() {
		this.panelOpen = true;
		void this.loadStatus();
	}

	closePanel() {
		this.panelOpen = false;
		this.discard();
	}

	discard() {
		this.result = null;
		this.compileError = null;
		this.topic = '';
	}
}

export const wikiCompile = new WikiCompileState();
