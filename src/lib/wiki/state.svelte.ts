// Wiki surface state. Articles come from the local git-ignored store
// (wikiStore); corpus entries come from the Fractorches recall API
// (wikiCorpus). This facade owns only selection, search, and view mode.

import type { WikiEntry, WikiEntryType, WikiSectionGroup } from './types';
import { wikiStore } from './store.svelte';
import { wikiCorpus } from './corpus.svelte';
import { formatSectionTitle } from './entry-file';

export type WikiViewMode = 'entry' | 'telemetry' | 'corpus' | 'compile';

const CANONICAL_SECTION_ORDER = [
	'core-concepts',
	'systems',
	'decisions',
	'case-histories',
	'conventions',
	'projects',
	'glossary'
];

class WikiState {
	viewMode = $state<WikiViewMode>('entry');
	currentEntryId = $state<string | null>(null);
	currentCorpusId = $state<string | null>(null);
	searchQuery = $state('');
	selectedCategory = $state<WikiEntryType | null>(null);
	selectedSection = $state<string | null>(null);
	selectedTags = $state<string[]>([]);
	tagMatchMode = $state<'any' | 'all'>('any');

	current = $derived.by(
		() => wikiStore.entries.find((entry) => entry.id === this.currentEntryId) ?? null
	);

	currentCorpus = $derived.by(
		() => wikiCorpus.entries.find((entry) => entry.id === this.currentCorpusId) ?? null
	);

	allTags = $derived.by(() => {
		const tagCounts = new Map<string, number>();
		for (const entry of wikiStore.entries) {
			if (Array.isArray(entry.tags)) {
				for (const rawTag of entry.tags) {
					const tag = rawTag.trim();
					if (tag) {
						tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
					}
				}
			}
		}
		return [...tagCounts.entries()]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([tag, count]) => ({ tag, count }));
	});

	/** All sections with their total counts from the whole store */
	allSections = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of wikiStore.entries) {
			const sec = entry.section || 'core-concepts';
			counts.set(sec, (counts.get(sec) ?? 0) + 1);
		}

		// Sort by canonical order, then any custom sections alphabetically
		const sortedKeys = [...counts.keys()].sort((a, b) => {
			const aIdx = CANONICAL_SECTION_ORDER.indexOf(a);
			const bIdx = CANONICAL_SECTION_ORDER.indexOf(b);
			if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
			if (aIdx !== -1) return -1;
			if (bIdx !== -1) return 1;
			return a.localeCompare(b);
		});

		return sortedKeys.map((key) => ({
			key,
			title: formatSectionTitle(key),
			count: counts.get(key) ?? 0
		}));
	});

	filteredArticles = $derived.by(() => {
		let list = wikiStore.entries;

		if (this.selectedSection) {
			list = list.filter((entry) => (entry.section || 'core-concepts') === this.selectedSection);
		}

		if (this.selectedCategory) {
			const catLower = this.selectedCategory.toLowerCase();
			list = list.filter((entry) => (entry.type || '').toLowerCase() === catLower);
		}

		if (this.selectedTags.length > 0) {
			list = list.filter((entry) => {
				if (!Array.isArray(entry.tags)) return false;
				if (this.tagMatchMode === 'all') {
					return this.selectedTags.every((t) => entry.tags.includes(t));
				} else {
					return this.selectedTags.some((t) => entry.tags.includes(t));
				}
			});
		}

		const needle = this.searchQuery.trim().toLowerCase();
		if (!needle) return list;
		return list.filter(
			(entry) =>
				entry.title.toLowerCase().includes(needle) ||
				(entry.summary && entry.summary.toLowerCase().includes(needle)) ||
				(entry.description && entry.description.toLowerCase().includes(needle)) ||
				(entry.sectionTitle && entry.sectionTitle.toLowerCase().includes(needle)) ||
				entry.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
				entry.body.toLowerCase().includes(needle)
		);
	});

	/** Filtered articles grouped by concept section */
	sectionGroups = $derived.by<WikiSectionGroup[]>(() => {
		const groupsMap = new Map<string, WikiEntry[]>();

		for (const entry of this.filteredArticles) {
			const sec = entry.section || 'core-concepts';
			if (!groupsMap.has(sec)) {
				groupsMap.set(sec, []);
			}
			groupsMap.get(sec)!.push(entry);
		}

		const sortedKeys = [...groupsMap.keys()].sort((a, b) => {
			const aIdx = CANONICAL_SECTION_ORDER.indexOf(a);
			const bIdx = CANONICAL_SECTION_ORDER.indexOf(b);
			if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
			if (aIdx !== -1) return -1;
			if (bIdx !== -1) return 1;
			return a.localeCompare(b);
		});

		return sortedKeys.map((key) => {
			const entries = groupsMap.get(key) || [];
			return {
				key,
				title: formatSectionTitle(key),
				count: entries.length,
				entries
			};
		});
	});


	toggleTag(tag: string) {
		if (this.selectedTags.includes(tag)) {
			this.selectedTags = this.selectedTags.filter((t) => t !== tag);
		} else {
			this.selectedTags = [...this.selectedTags, tag];
		}
	}

	clearTags() {
		this.selectedTags = [];
	}

	setTagMatchMode(mode: 'any' | 'all') {
		this.tagMatchMode = mode;
	}

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

	setSection(section: string | null) {
		this.selectedSection = section;
	}

	clearSelection() {
		this.currentEntryId = null;
	}

	setView(mode: WikiViewMode) {
		this.viewMode = mode;
	}
}


export const wikiState = new WikiState();
