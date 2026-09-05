import { beforeEach, describe, expect, it } from 'vitest';
import {
	clearRenderCache,
	dropRenders,
	getRender,
	peekRender,
	putRender,
	renderCacheStats
} from '../../src/lib/renderer/renderCache';

/**
 * The cache exists to bound memory, so what is tested is the bounding: that it
 * evicts, that it evicts the least recently used entry, and that a changed
 * document does not serve the previous version's HTML.
 */

const html = (chars: number) => 'x'.repeat(chars);

const seed = (path: string, content: string, size = 10) =>
	putRender(path, content, { html: html(size), frontmatter: null, wordCount: 1 });

describe('render cache', () => {
	beforeEach(() => clearRenderCache());

	it('serves a stored render back', () => {
		putRender('/a.md', 'hello', { html: '<p>hello</p>', frontmatter: { a: 1 }, wordCount: 1 });
		const got = getRender('/a.md', 'hello');
		expect(got.html).toBe('<p>hello</p>');
		expect(got.frontmatter).toEqual({ a: 1 });
	});

	it('keys on content, so an edited document cannot hit the old version', () => {
		putRender('/a.md', 'v1', { html: '<p>v1</p>', frontmatter: null, wordCount: 1 });
		expect(peekRender('/a.md', 'v1')?.html).toBe('<p>v1</p>');
		// The edited text is a different key, so it misses and is re-rendered
		// rather than being served the previous version's HTML.
		expect(peekRender('/a.md', 'v2')).toBeUndefined();
	});

	it('keeps at most twelve entries', () => {
		for (let i = 0; i < 20; i += 1) seed(`/note-${i}.md`, 'body');
		expect(renderCacheStats().entries).toBe(12);
	});

	it('evicts the least recently used, not the least recently written', () => {
		for (let i = 0; i < 12; i += 1) seed(`/note-${i}.md`, 'body');
		// Touch the oldest so it is no longer the eviction candidate.
		getRender('/note-0.md', 'body');
		seed('/note-12.md', 'body');

		expect(renderCacheStats().entries).toBe(12);
		// note-0 survived because it was read; note-1 was next in line.
		expect(peekRender('/note-0.md', 'body')?.html).toBe(html(10));
		expect(peekRender('/note-1.md', 'body')).toBeUndefined();
	});

	it('evicts on the character budget even when well under twelve entries', () => {
		// Three notes of 1.8M characters each: two fit in the 4M budget, three
		// do not. This is the case the entry count alone would not catch.
		const big = 1_800_000;
		seed('/big-1.md', 'body', big);
		seed('/big-2.md', 'body', big);
		seed('/big-3.md', 'body', big);

		const stats = renderCacheStats();
		expect(stats.entries).toBe(2);
		expect(stats.chars).toBeLessThanOrEqual(4_000_000);
	});

	it('drops every version of one document when its tab closes', () => {
		seed('/a.md', 'v1');
		seed('/a.md', 'v2');
		seed('/b.md', 'v1');
		expect(renderCacheStats().entries).toBe(3);

		dropRenders('/a.md');
		expect(renderCacheStats().entries).toBe(1);
		expect(renderCacheStats().chars).toBe(10);
	});

	it('does not drop a document whose path merely shares a prefix', () => {
		seed('/notes/a.md', 'v1');
		seed('/notes/a.md.bak', 'v1');
		dropRenders('/notes/a.md');
		expect(renderCacheStats().entries).toBe(1);
	});
});
