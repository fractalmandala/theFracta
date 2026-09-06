// Wiki article file format: one Markdown file per article with YAML frontmatter.
// Scalar values must not contain newlines. Serialization filters offending items
// instead of writing a file the parser cannot read back.

import type { WikiEntry, WikiEntryStatus, WikiEntryType, WikiSourceRef } from './types';

const ENTRY_ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
function isValidType(type: string): boolean {
	if (!type) return false;
	const lower = type.toLowerCase().replace(/[-_]/g, ' ').trim();
	return [
		'pattern',
		'decision',
		'concept',
		'system',
		'broken',
		'recipe',
		'case history',
		'convention',
		'project',
		'glossary term',
		'glossary',
		'directory index'
	].includes(lower);
}
const VALID_STATUSES = new Set(['proposed', 'draft', 'stable', 'stale']);


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

export function formatSectionTitle(section: string): string {
	const map: Record<string, string> = {
		'core-concepts': 'Core Concepts',
		'systems': 'Systems',
		'decisions': 'Decisions',
		'case-histories': 'Case Histories',
		'conventions': 'Conventions',
		'projects': 'Projects',
		'glossary': 'Glossary',
		'entries': 'Articles'
	};
	if (map[section]) return map[section];
	return section
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
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

function parseYamlFrontmatter(yamlStr: string): Record<string, any> {
	const lines = yamlStr.split('\n');
	const result: Record<string, any> = {};
	let currentKey: string | null = null;
	let currentList: any[] | null = null;
	let currentObj: Record<string, any> | null = null;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		// List item under currentKey
		const listItemMatch = line.match(/^(\s*)-\s+(.*)$/);
		if (listItemMatch) {
			const content = listItemMatch[2].trim();
			if (!currentList) {
				currentList = [];
				if (currentKey) result[currentKey] = currentList;
			}
			const kv = content.match(/^([^:]+):\s*(.*)$/);
			if (kv) {
				currentObj = {};
				const k = kv[1].trim();
				const v = kv[2].trim().replace(/^['"]|['"]$/g, '');
				currentObj[k] = v;
				currentList.push(currentObj);
			} else {
				currentObj = null;
				const val = content.replace(/^['"]|['"]$/g, '');
				currentList.push(val);
			}
			continue;
		}

		// Sub-property inside a list item object (indented at least 4 spaces)
		const subPropMatch = line.match(/^(\s{4,})([^:]+):\s*(.*)$/);
		if (subPropMatch && currentObj) {
			const k = subPropMatch[2].trim();
			const v = subPropMatch[3].trim().replace(/^['"]|['"]$/g, '');
			currentObj[k] = v;
			continue;
		}

		// Nested property under currentKey (indented 2+ spaces)
		const nestedPropMatch = line.match(/^(\s{2,})([^:]+):\s*(.*)$/);
		if (nestedPropMatch && currentKey && typeof result[currentKey] === 'object' && !Array.isArray(result[currentKey])) {
			const k = nestedPropMatch[2].trim();
			const v = nestedPropMatch[3].trim().replace(/^['"]|['"]$/g, '');
			result[currentKey][k] = v;
			continue;
		}

		// Top-level key: value
		const topMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (topMatch) {
			currentKey = topMatch[1].trim();
			currentList = null;
			currentObj = null;
			const rawVal = topMatch[2].trim();

			if (rawVal === '') {
				result[currentKey] = {};
			} else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
				const inner = rawVal.slice(1, -1).trim();
				result[currentKey] = inner
					? inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
					: [];
			} else if (rawVal.startsWith('[') && !rawVal.endsWith(']')) {
				return { __malformed: true };
			} else {
				result[currentKey] = rawVal.replace(/^['"]|['"]$/g, '');
			}
		}
	}
	return result;
}

/** Parse an article file. Returns null for anything malformed — callers count
 * skipped files and say so rather than rendering a half-valid entry. */
export function entryFromMarkdown(text: string, pathOrFallbackId?: string): WikiEntry | null {
	const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return null;

	const meta = parseYamlFrontmatter(match[1]);
	if (meta.__malformed) return null;

	// Extract title
	let title = scalar(meta.title);
	if (!title) {
		title = titleFromMarkdown(match[2]);
	}
	if (!title) return null;

	// Extract or infer id
	let id = scalar(meta.id);
	if (id) {
		if (!isValidEntryId(id)) return null;
	} else if (pathOrFallbackId) {
		const basename = pathOrFallbackId.split('/').pop()?.replace(/\.md$/, '') || '';
		id = slugifyEntryId(basename);
	} else {
		id = slugifyEntryId(title);
	}
	if (!isValidEntryId(id)) return null;

	// Determine type
	const rawType = scalar(meta.type);
	if (!rawType || !isValidType(rawType)) return null;
	const type = rawType as WikiEntryType;


	// Determine status
	const rawStatus = scalar(meta.status, 'draft');
	if (!VALID_STATUSES.has(rawStatus)) return null;
	const status = rawStatus as WikiEntryStatus;

	// Determine section
	let section = scalar(meta.section);
	if (!section && pathOrFallbackId) {
		const parts = pathOrFallbackId.split('/');
		if (parts.length >= 2) {
			const candidate = parts[parts.length - 2];
			if (candidate !== '.' && candidate !== '..') {
				section = candidate;
			}
		}
	}
	if (!section && pathOrFallbackId) {
		// Infer section from type if path was supplied
		const lowerType = type.toLowerCase();
		if (lowerType.includes('concept')) section = 'core-concepts';
		else if (lowerType.includes('system')) section = 'systems';
		else if (lowerType.includes('decision')) section = 'decisions';
		else if (lowerType.includes('history')) section = 'case-histories';
		else if (lowerType.includes('convention')) section = 'conventions';
		else if (lowerType.includes('project')) section = 'projects';
		else if (lowerType.includes('glossary')) section = 'glossary';
		else section = 'core-concepts';
	}
	const sectionTitle = section ? formatSectionTitle(section) : undefined;

	// Summary or description
	const summary = scalar(meta.summary) || scalar(meta.description) || summaryFromMarkdown(match[2]);

	// Tags
	let tags: string[] = [];
	if (Array.isArray(meta.tags)) {
		tags = arrayValue(meta.tags);
	} else if (typeof meta.tags === 'string' && meta.tags.trim()) {
		tags = [meta.tags.trim()];
	}

	// Chat references
	const chatRefs = arrayValue(meta.chatRefs);

	// Files
	const files = arrayValue(meta.files);

	// Sources
	let sources: WikiSourceRef[] = [];
	if (Array.isArray(meta.sources)) {
		for (const s of meta.sources) {
			if (typeof s === 'object' && s !== null) {
				sources.push({
					id: scalar(s.id),
					title: scalar(s.title),
					reference: scalar(s.reference),
					timestamp: scalar(s.timestamp)
				});
			} else if (typeof s === 'string') {
				sources.push({ reference: s });
			}
		}
	}

	// Generated metadata
	let generated: { by?: string; at?: string } | undefined;
	if (typeof meta.generated === 'object' && meta.generated !== null) {
		generated = {
			by: scalar(meta.generated.by),
			at: scalar(meta.generated.at)
		};
	}

	const entry: WikiEntry = {
		id,
		title,
		type,
		status,
		summary,
		body: match[2].replace(/^\r?\n/, ''),
		chatRefs,
		files,
		tags,
		compiledFrom: arrayValue(meta.compiledFrom),
		compiledAt: isRenderableDate(scalar(meta.compiledAt)) ? scalar(meta.compiledAt) : '',
		createdAt: isRenderableDate(scalar(meta.createdAt)) ? scalar(meta.createdAt) : '',
		updatedAt: isRenderableDate(scalar(meta.updatedAt)) ? scalar(meta.updatedAt) : ''
	};

	if (section) {
		entry.section = section;
		entry.sectionTitle = sectionTitle;
	}
	if (meta.description) {
		entry.description = scalar(meta.description);
	}
	if (sources.length > 0) {
		entry.sources = sources;
	}
	if (generated) {
		entry.generated = generated;
	}
	if (pathOrFallbackId) {
		entry.filePath = pathOrFallbackId;
	}

	return entry;
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

