import { describe, expect, it } from 'vitest';
import { compileFreshness } from '../../src/lib/wiki/freshness';
import type { RecallEntry } from '../../src/lib/observatory-fractorches';
import type { WikiEntry } from '../../src/lib/wiki/types';

const article = (overrides: Partial<WikiEntry> = {}): WikiEntry => ({
	id: 'test-article',
	title: 'Test Article',
	type: 'pattern',
	status: 'draft',
	summary: '',
	body: '',
	chatRefs: [],
	files: [],
	tags: [],
	createdAt: '2026-09-05T00:00:00Z',
	updatedAt: '2026-09-05T00:00:00Z',
	...overrides
});

const corpusEntry = (overrides: Partial<RecallEntry> = {}): RecallEntry => ({
	id: 'rec-1',
	type: 'insight',
	scope: '',
	status: 'active',
	review_state: 'human_reviewed',
	title: 'Recall 1',
	body: '',
	source_session_id: 'sess-1',
	transferable: true,
	provenance_ok: true,
	created_at: '2026-09-04T00:00:00Z',
	updated_at: '2026-09-04T00:00:00Z',
	...overrides
});

describe('compileFreshness', () => {
	it('is untestable without compile metadata', () => {
		expect(compileFreshness(article(), [corpusEntry()]).state).toBe('untestable');
		expect(
			compileFreshness(article({ compiledAt: '2026-09-05T00:00:00Z' }), []).state
		).toBe('untestable');
	});

	it('is fresh when every grounding entry is visible and unchanged', () => {
		const entry = article({
			compiledAt: '2026-09-05T00:00:00Z',
			compiledFrom: ['rec-1', 'rec-2']
		});
		const corpus = [corpusEntry({ id: 'rec-1' }), corpusEntry({ id: 'rec-2' })];
		expect(compileFreshness(entry, corpus).state).toBe('fresh');
	});

	it('is stale when a visible grounding entry changed after compile', () => {
		const entry = article({
			compiledAt: '2026-09-05T00:00:00Z',
			compiledFrom: ['rec-1', 'rec-2']
		});
		const corpus = [
			corpusEntry({ id: 'rec-1' }),
			corpusEntry({ id: 'rec-2', updated_at: '2026-09-06T00:00:00Z' })
		];
		const report = compileFreshness(entry, corpus);
		expect(report.state).toBe('stale');
		expect(report.changedIds).toEqual(['rec-2']);
	});

	it('is untestable when grounding entries are missing from the loaded corpus view', () => {
		const entry = article({
			compiledAt: '2026-09-05T00:00:00Z',
			compiledFrom: ['rec-1', 'rec-3']
		});
		const report = compileFreshness(entry, [corpusEntry({ id: 'rec-1' })]);
		expect(report.state).toBe('untestable');
		expect(report.unseenIds).toEqual(['rec-3']);
	});

	it('reports stale even when other grounding entries are unseen', () => {
		const entry = article({
			compiledAt: '2026-09-05T00:00:00Z',
			compiledFrom: ['rec-1', 'rec-3']
		});
		const report = compileFreshness(entry, [
			corpusEntry({ id: 'rec-1', updated_at: '2026-09-06T00:00:00Z' })
		]);
		expect(report.state).toBe('stale');
		expect(report.changedIds).toEqual(['rec-1']);
		expect(report.unseenIds).toEqual(['rec-3']);
	});

	it('treats an unparseable compile time as untestable', () => {
		const entry = article({
			compiledAt: 'not-a-date',
			compiledFrom: ['rec-1']
		});
		expect(compileFreshness(entry, [corpusEntry()]).state).toBe('untestable');
	});
});
