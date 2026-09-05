import { describe, expect, it } from 'vitest';
import { entryFromMarkdown, entryToMarkdown, isRenderableDate, isValidEntryId } from '../../src/lib/wiki/entry-file';
import type { WikiEntry } from '../../src/lib/wiki/types';

const base: WikiEntry = {
	id: 'shell-canon',
	title: 'Three-Column Shell',
	type: 'pattern',
	status: 'stable',
	summary: 'Sidebar + main + inspector.',
	body: '# Three-Column Shell\n\nBody text.',
	chatRefs: ['claude:8f4a2e91', 'codex:b2c3d4e5'],
	files: ['src/app.svelte'],
	tags: ['layout', 'shell'],
	compiledFrom: [],
	compiledAt: '',
	createdAt: '2026-08-29T20:45:00Z',
	updatedAt: '2026-08-30T02:15:00Z'
};

describe('wiki entry file format', () => {
	it('round-trips an entry through markdown', () => {
		const parsed = entryFromMarkdown(entryToMarkdown(base));
		expect(parsed).toEqual(base);
	});

	it('rejects malformed files instead of half-parsing them', () => {
		expect(entryFromMarkdown('no frontmatter at all')).toBeNull();
		expect(entryFromMarkdown('---\nbroken: [unclosed\n---\nbody')).toBeNull();
		expect(entryFromMarkdown('---\nid: Bad_ID\ntitle: x\ntype: pattern\nstatus: stable\n---\nbody')).toBeNull();
		expect(entryFromMarkdown('---\nid: ok-id\ntitle: T\ntype: not-a-type\nstatus: stable\n---\nbody')).toBeNull();
		expect(entryFromMarkdown('---\nid: ok-id\ntitle: T\ntype: pattern\nstatus: not-a-status\n---\nbody')).toBeNull();
	});

	it('keeps values the simple parser can read back: no commas in arrays', () => {
		const dirty: WikiEntry = {
			...base,
			tags: ['good-tag', 'bad,tag', ''],
			chatRefs: ['claude:8f4a,comma', 'claude:clean']
		};
		const parsed = entryFromMarkdown(entryToMarkdown(dirty));
		expect(parsed?.tags).toEqual(['good-tag']);
		expect(parsed?.chatRefs).toEqual(['claude:clean']);
	});

	it('leaves dates empty when missing or unparseable', () => {
		const text = entryToMarkdown({ ...base, createdAt: '', updatedAt: 'not-a-date' })
			.replace('createdAt: unknown', 'createdAt:')
			.replace('updatedAt: unknown', 'updatedAt: not-a-date');
		const parsed = entryFromMarkdown(text);
		expect(parsed?.createdAt).toBe('');
		expect(parsed?.updatedAt).toBe('');
	});

	it('validates entry ids used to build file paths', () => {
		expect(isValidEntryId('shell-canon')).toBe(true);
		expect(isValidEntryId('a')).toBe(true);
		expect(isValidEntryId('')).toBe(false);
		expect(isValidEntryId('../escape')).toBe(false);
		expect(isValidEntryId('Has Space')).toBe(false);
		expect(isValidEntryId('x'.repeat(81))).toBe(false);
	});

	it('recognizes renderable dates', () => {
		expect(isRenderableDate('2026-08-29T20:45:00Z')).toBe(true);
		expect(isRenderableDate('')).toBe(false);
		expect(isRenderableDate('not-a-date')).toBe(false);
	});
});
