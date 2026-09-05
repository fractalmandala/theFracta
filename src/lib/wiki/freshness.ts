// Compile freshness for wiki articles grounded in recall entries. The check
// compares an article's compile time against the grounding entries as the
// loaded corpus view currently shows them. It never guesses: entries that
// are not visible in the loaded corpus make the check untestable rather
// than fresh.

import type { RecallEntry } from '$lib/observatory-fractorches';
import type { WikiEntry } from './types';

export type WikiFreshness = 'fresh' | 'stale' | 'untestable';

export type WikiFreshnessReport = {
	state: WikiFreshness;
	/** Grounding entries whose updated_at is newer than the compile time. */
	changedIds: string[];
	/** Grounding entries not present in the loaded corpus view. */
	unseenIds: string[];
};

export function compileFreshness(entry: WikiEntry, corpus: RecallEntry[]): WikiFreshnessReport {
	const grounding = entry.compiledFrom ?? [];
	const compiledAt = entry.compiledAt;
	const corpusById = new Map(corpus.map((corpusEntry) => [corpusEntry.id, corpusEntry]));

	if (grounding.length === 0 || !compiledAt) {
		return { state: 'untestable', changedIds: [], unseenIds: grounding };
	}

	const compiledTime = new Date(compiledAt).getTime();
	if (Number.isNaN(compiledTime)) {
		return { state: 'untestable', changedIds: [], unseenIds: grounding };
	}

	const changedIds: string[] = [];
	const unseenIds: string[] = [];
	for (const id of grounding) {
		const corpusEntry = corpusById.get(id);
		if (!corpusEntry) {
			unseenIds.push(id);
			continue;
		}
		const updatedTime = new Date(corpusEntry.updated_at).getTime();
		if (!Number.isNaN(updatedTime) && updatedTime > compiledTime) {
			changedIds.push(id);
		}
	}

	// Stale wins over unseen: a known-changed source is evidence enough.
	if (changedIds.length > 0) return { state: 'stale', changedIds, unseenIds };
	// Fresh only when every grounding entry was actually checked.
	if (unseenIds.length === 0) return { state: 'fresh', changedIds, unseenIds };
	return { state: 'untestable', changedIds, unseenIds };
}
