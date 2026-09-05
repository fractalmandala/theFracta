// Recall corpus state for the Wiki surface. Entries come exclusively from
// the Fractorches recall HTTP API — server-side filters and cursor
// pagination, no client-side corpus copies. Text/type/review-state filters
// refetch so the list and every derived count always describe the same
// query (B7).

import { listRecallEntries } from '$lib/observatory-fractorches';
import type { RecallEntry } from '$lib/observatory-fractorches';

/** Beyond this client cap the list reports itself truncated instead of
 * pretending it is the whole corpus. */
const MAX_CORPUS_ENTRIES = 1000;

class WikiCorpusState {
	entries = $state<RecallEntry[]>([]);
	loading = $state(false);
	loaded = $state(false);
	error = $state<string | null>(null);
	loadedAt = $state<string | null>(null);
	truncated = $state(false);

	query = $state('');
	selectedType = $state<string | null>(null);
	selectedReviewState = $state<string | null>(null);
	/** Cluster selection for compilation. Pruned to the loaded list after
	 * every refresh so it never references entries the list no longer shows. */
	selectedIds = $state<string[]>([]);

	selectionCount = $derived(this.selectedIds.length);

	private debounce: ReturnType<typeof setTimeout> | null = null;
	private refreshSeq = 0;

	availableTypes = $derived([...new Set(this.entries.map((entry) => entry.type))].sort());
	availableReviewStates = $derived([...new Set(this.entries.map((entry) => entry.review_state))].sort());

	/** Corpus entry counts per agent, largest first. "unattributed" covers
	 * entries the service stored without an agent label. */
	byAgent = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of this.entries) {
			const key = entry.agent || 'unattributed';
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	});

	byReviewState = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of this.entries) {
			counts.set(entry.review_state, (counts.get(entry.review_state) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	});

	byType = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of this.entries) {
			counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	});

	async load(force = false) {
		if (this.loaded && !force) return;
		await this.refresh();
	}

	async refresh() {
		const seq = ++this.refreshSeq;
		this.loading = true;
		this.error = null;
		try {
			const result = await listRecallEntries({
				q: this.query.trim() || undefined,
				type: this.selectedType ?? undefined,
				review_state: this.selectedReviewState ?? undefined
			});
			if (seq !== this.refreshSeq) return;
			this.entries = result.entries.slice(0, MAX_CORPUS_ENTRIES);
			this.selectedIds = this.selectedIds.filter((id) =>
				this.entries.some((entry) => entry.id === id)
			);
			this.truncated = result.truncated;
			this.loadedAt = new Date().toISOString();
			this.loaded = true;
		} catch (error) {
			if (seq !== this.refreshSeq) return;
			this.error = error instanceof Error ? error.message : 'Fractorches is unavailable';
			this.loaded = true;
		} finally {
			if (seq === this.refreshSeq) this.loading = false;
		}
	}

	setQuery(query: string) {
		this.query = query;
		if (this.debounce) clearTimeout(this.debounce);
		this.debounce = setTimeout(() => void this.refresh(), 300);
	}

	setType(type: string | null) {
		this.selectedType = type;
		void this.refresh();
	}

	setReviewState(reviewState: string | null) {
		this.selectedReviewState = reviewState;
		void this.refresh();
	}

	isSelected(id: string): boolean {
		return this.selectedIds.includes(id);
	}

	toggleSelected(id: string): void {
		this.selectedIds = this.isSelected(id)
			? this.selectedIds.filter((existing) => existing !== id)
			: [...this.selectedIds, id];
	}

	clearSelection(): void {
		this.selectedIds = [];
	}
}

export const wikiCorpus = new WikiCorpusState();
