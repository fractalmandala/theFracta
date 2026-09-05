// Wiki article file format: one Markdown file per article with a simple
// YAML-ish frontmatter block. Scalar values must not contain newlines; array
// values must not contain commas (the renderer's frontmatter parser splits
// inline arrays on commas). Serialization filters offending items instead of
// writing a file the parser cannot read back.

import type { WikiEntry, WikiEntryStatus, WikiEntryType } from './types';

const ENTRY_ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const ENTRY_TYPES: WikiEntryType[] = ['pattern', 'decision', 'concept', 'system', 'broken', 'recipe'];
const ENTRY_STATUSES: WikiEntryStatus[] = ['proposed', 'draft', 'stable', 'stale'];

export function isValidEntryId(id: string): boolean {
	return ENTRY_ID_RE.test(id);
}

function scalar(value: unknown, fallback = ''): string {
	return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function arrayValue(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '' && !item.includes(','));
}

/** True when the string parses as a date the UI can render. */
export function isRenderableDate(value: string): boolean {
	return value !== '' && !Number.isNaN(new Date(value).getTime());
}

export function entryToMarkdown(entry: WikiEntry): string {
	const frontmatter = [
		`id: ${entry.id}`,
		`title: ${scalar(entry.title)}`,
		`type: ${entry.type}`,
		`status: ${entry.status}`,
		`summary: ${scalar(entry.summary)}`,
		`tags: [${arrayValue(entry.tags).join(', ')}]`,
		`chatRefs: [${arrayValue(entry.chatRefs).join(', ')}]`,
		`files: [${arrayValue(entry.files).join(', ')}]`,
		`compiledFrom: [${arrayValue(entry.compiledFrom).join(', ')}]`,
		`compiledAt: ${scalar(entry.compiledAt, 'unknown')}`,
		`createdAt: ${scalar(entry.createdAt, 'unknown')}`,
		`updatedAt: ${scalar(entry.updatedAt, 'unknown')}`
	].join('\n');
	const body = entry.body.startsWith('\n') || entry.body === '' ? entry.body : `\n${entry.body}`;
	return `---\n${frontmatter}\n---\n${body}`;
}

/** Parse an article file. Returns null for anything malformed — callers count
 * skipped files and say so rather than rendering a half-valid entry. */
export function entryFromMarkdown(text: string): WikiEntry | null {
	const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return null;

	const meta: Record<string, string | string[]> = {};
	for (const line of match[1].split('\n')) {
		const colon = line.indexOf(':');
		if (colon <= 0) continue;
		const key = line.slice(0, colon).trim();
		let value: string | string[] = line.slice(colon + 1).trim();
		if (value.startsWith('[') && value.endsWith(']')) {
			const inner = value.slice(1, -1).trim();
			value = inner === '' ? [] : inner.split(',').map((item) => item.trim()).filter(Boolean);
		}
		if (key) meta[key] = value;
	}

	const id = scalar(meta.id);
	const title = scalar(meta.title);
	const type = scalar(meta.type) as WikiEntryType;
	const status = scalar(meta.status) as WikiEntryStatus;
	if (!isValidEntryId(id) || title === '') return null;
	if (!ENTRY_TYPES.includes(type) || !ENTRY_STATUSES.includes(status)) return null;

	return {
		id,
		title,
		type,
		status,
		summary: scalar(meta.summary),
		body: match[2].replace(/^\r?\n/, ''),
		chatRefs: arrayValue(meta.chatRefs),
		files: arrayValue(meta.files),
		tags: arrayValue(meta.tags),
		compiledFrom: arrayValue(meta.compiledFrom),
		compiledAt: isRenderableDate(scalar(meta.compiledAt)) ? scalar(meta.compiledAt) : '',
		createdAt: isRenderableDate(scalar(meta.createdAt)) ? scalar(meta.createdAt) : '',
		updatedAt: isRenderableDate(scalar(meta.updatedAt)) ? scalar(meta.updatedAt) : ''
	};
}

/** First `# ` heading of a compiled draft; '' when the draft has none. */
export function titleFromMarkdown(markdown: string): string {
	const match = markdown.match(/^#\s+(.+)$/m);
	return match ? match[1].trim() : '';
}

/** First content line under the title, capped — a summary derived from the
 * draft's own words, never invented. */
export function summaryFromMarkdown(markdown: string, cap = 160): string {
	const withoutTitle = markdown.replace(/^#\s+.+$/m, '');
	for (const line of withoutTitle.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		return trimmed.length > cap ? `${trimmed.slice(0, cap - 1)}…` : trimmed;
	}
	return '';
}

/** Draft body without its leading title heading line. */
export function bodyFromMarkdown(markdown: string): string {
	return markdown.replace(/^#\s[^\n]*\n?/, '').trim();
}

/** Kebab-case entry-id candidate from a title. Still needs a uniqueness
 * check against the store before saving. */
export function slugifyEntryId(title: string): string {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
	return isValidEntryId(slug) ? slug : 'draft';
}
