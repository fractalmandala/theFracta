// Wiki surface state. Articles come from the local git-ignored store
// (wikiStore); corpus entries come from the Fractorches recall API
// (wikiCorpus). This facade owns only selection, search, and view mode.

import type { WikiEntryType } from './types';
import { wikiStore } from './store.svelte';
import { wikiCorpus } from './corpus.svelte';

export type WikiViewMode = 'entry' | 'telemetry' | 'corpus' | 'compile';

class WikiState {
	viewMode = $state<WikiViewMode>('entry');
	currentEntryId = $state<string | null>(null);
	currentCorpusId = $state<string | null>(null);
	searchQuery = $state('');
	selectedCategory = $state<WikiEntryType | null>(null);

	current = $derived.by(
		() => wikiStore.entries.find((entry) => entry.id === this.currentEntryId) ?? null
	);

	currentCorpus = $derived.by(
		() => wikiCorpus.entries.find((entry) => entry.id === this.currentCorpusId) ?? null
	);

	filteredArticles = $derived.by(() => {
		let list = wikiStore.entries;
		if (this.selectedCategory) list = list.filter((entry) => entry.type === this.selectedCategory);
		const needle = this.searchQuery.trim().toLowerCase();
		if (!needle) return list;
		return list.filter(
			(entry) =>
				entry.title.toLowerCase().includes(needle) ||
				entry.summary.toLowerCase().includes(needle) ||
				entry.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
				entry.body.toLowerCase().includes(needle)
		);
	});

	pick(id: string) {
		this.currentEntryId = id;
		this.viewMode = 'entry';
	}

	pickCorpus(id: string) {
		this.currentCorpusId = id;
		this.viewMode = 'corpus';
	}

	setSearch(query: string) {
		this.searchQuery = query;
	}

	setCategory(category: WikiEntryType | null) {
		this.selectedCategory = category;
	}

	setView(mode: WikiViewMode) {
		this.viewMode = mode;
	}
}

export const wikiState = new WikiState();
