import { writable, derived } from 'svelte/store';
import type { WikiEntry, WikiEntryType } from './types';
import { REGISTRY } from './registry-seed';

class WikiState {
	currentEntryId = writable<string | null>(REGISTRY.entries[0]?.id ?? null);
	searchQuery = writable<string>('');
	selectedCategory = writable<WikiEntryType | null>(null);
	viewMode = writable<'entry' | 'telemetry' | 'registry'>('entry');

	current = derived(this.currentEntryId, ($id) =>
		$id ? (REGISTRY.entries.find((e: WikiEntry) => e.id === $id) ?? null) : null
	);

	filteredRegistry = derived(
		[this.searchQuery, this.selectedCategory],
		([$q, $cat]) => {
			let list = REGISTRY.entries;
			if ($cat) {
				list = list.filter((e: WikiEntry) => e.type === $cat);
			}
			if (!$q.trim()) return list;
			const needle = $q.toLowerCase();
			return list.filter(
				(e: WikiEntry) =>
					e.title.toLowerCase().includes(needle) ||
					e.summary.toLowerCase().includes(needle) ||
					e.tags.some((t: string) => t.toLowerCase().includes(needle)) ||
					e.body.toLowerCase().includes(needle)
			);
		}
	);

	pick(id: string) {
		this.currentEntryId.set(id);
		this.viewMode.set('entry');
	}

	setSearch(q: string) {
		this.searchQuery.set(q);
	}

	setCategory(cat: WikiEntryType | null) {
		this.selectedCategory.set(cat);
	}

	setView(mode: 'entry' | 'telemetry' | 'registry') {
		this.viewMode.set(mode);
	}
}

export const wikiState = new WikiState();
