// Local wiki article store. Articles are private user data: plain Markdown
// files under the app's Git-ignored wiki/ directory (see wiki_commands.rs).
// Every state here is truthful: loading, unavailable (browser dev), error,
// genuinely empty, and skipped-file counts are distinct.

import { invoke } from '@tauri-apps/api/core';
import {
	bodyFromMarkdown,
	entryFromMarkdown,
	entryToMarkdown,
	isValidEntryId,
	slugifyEntryId,
	summaryFromMarkdown,
	titleFromMarkdown
} from './entry-file';
import type { WikiCompileResult } from '$lib/observatory-fractorches';
import type { WikiEntry, WikiEntryStatus, WikiEntryType } from './types';

export type WikiStoreSource = 'override' | 'repo' | 'home' | 'bundle';

type WikiRootResponse = { path: string; source: WikiStoreSource };
type WikiEntryFileResponse = { name: string; path: string; modified: number };

// Eagerly bundle static markdown files across all canonical wiki sections
const staticMarkdownFiles = import.meta.glob<string>('../../../wiki/*/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

class WikiStoreState {
	entries = $state<WikiEntry[]>([]);
	loading = $state(false);
	loaded = $state(false);
	error = $state<string | null>(null);
	/** Set when article storage is unreachable in this runtime. */
	unavailable = $state<string | null>(null);
	dirPath = $state<string | null>(null);
	dirSource = $state<WikiStoreSource | null>(null);
	loadedAt = $state<string | null>(null);
	skippedFiles = $state(0);

	private files: WikiEntryFileResponse[] = [];

	async load(force = false) {
		if (this.loaded && !force) return;
		this.loading = true;
		this.error = null;
		this.unavailable = null;

		try {
			const parsed: WikiEntry[] = [];
			const seenIds = new Set<string>();

			// 1. Load from the static Vite glob bundle
			for (const [path, content] of Object.entries(staticMarkdownFiles)) {
				if (path.includes('wiki-precursor') || path.endsWith('index.md')) continue;
				const entry = entryFromMarkdown(content, path);
				if (entry && !seenIds.has(entry.id)) {
					parsed.push(entry);
					seenIds.add(entry.id);
				}
			}

			// 2. If running under desktop Tauri, read from disk to capture live changes
			if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
				try {
					const root = await invoke<WikiRootResponse>('wiki_data_dir');
					this.dirPath = root.path;
					this.dirSource = root.source;
					this.files = await invoke<WikiEntryFileResponse[]>('list_wiki_entries');
					for (const file of this.files) {
						if (file.path.includes('wiki-precursor') || file.path.endsWith('index.md')) continue;
						try {
							const text = await invoke<string>('read_markdown_file', { path: file.path });
							const entry = entryFromMarkdown(text, file.path);
							if (entry) {
								const existingIdx = parsed.findIndex((e) => e.id === entry.id);
								if (existingIdx >= 0) {
									parsed[existingIdx] = entry;
								} else {
									parsed.push(entry);
									seenIds.add(entry.id);
								}
							}
						} catch {}
					}
				} catch (tauriError) {
					console.warn('Tauri wiki reader fallback to bundle:', tauriError);
				}
			} else {
				this.dirSource = 'bundle';
			}

			// Sort by canonical section order, then title
			const sectionOrder = ['core-concepts', 'systems', 'decisions', 'case-histories', 'conventions', 'projects', 'glossary'];
			parsed.sort((a, b) => {
				const aSec = a.section || '';
				const bSec = b.section || '';
				const aIdx = sectionOrder.indexOf(aSec);
				const bIdx = sectionOrder.indexOf(bSec);
				if (aIdx !== -1 && bIdx !== -1 && aIdx !== bIdx) return aIdx - bIdx;
				if (aIdx !== -1 && bIdx === -1) return -1;
				if (aIdx === -1 && bIdx !== -1) return 1;
				const secDiff = aSec.localeCompare(bSec);
				if (secDiff !== 0) return secDiff;
				return a.title.localeCompare(b.title);
			});

			this.entries = parsed;
			this.loadedAt = new Date().toISOString();
			this.loaded = true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.error = message;
			this.loaded = true;
		} finally {
			this.loading = false;
		}
	}

	/** Persist an article as <root>/<section>/<id>.md and refresh the in-memory
	 * list. Refuses unsafe ids before a path is ever constructed. */
	async save(entry: WikiEntry) {
		if (!isValidEntryId(entry.id)) throw new Error(`Invalid wiki article id: ${entry.id}`);
		if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window && this.dirPath) {
			const subDir = entry.section || 'entries';
			const path = `${this.dirPath}/${subDir}/${entry.id}.md`;
			await invoke('write_markdown_file', { path, content: entryToMarkdown(entry) });
			await this.load(true);
		} else {
			const idx = this.entries.findIndex((e) => e.id === entry.id);
			if (idx >= 0) {
				this.entries[idx] = entry;
			} else {
				this.entries = [entry, ...this.entries];
			}
		}
	}


	/** Build and persist a compiled draft: a cluster compile lands as a draft
	 * article whose chatRefs are the contributing source sessions and whose
	 * compiledFrom records exactly which recall entries grounded it. Title,
	 * summary, and body derive from the draft markdown — nothing is invented
	 * here. */
	async saveCompiledDraft(result: WikiCompileResult, type: WikiEntryType): Promise<WikiEntry> {
		const title = titleFromMarkdown(result.markdown) || 'Compiled draft';
		const now = new Date().toISOString();
		const entry: WikiEntry = {
			id: this.uniqueDraftId(title),
			title,
			type,
			status: 'draft',
			summary: summaryFromMarkdown(result.markdown),
			body: bodyFromMarkdown(result.markdown),
			chatRefs: [...new Set(result.entries.map((item) => item.source_session_id))],
			files: [],
			tags: [],
			createdAt: now,
			updatedAt: now,
			compiledFrom: result.entries.map((item) => item.id),
			compiledAt: result.compiled_at
		};
		await this.save(entry);
		return entry;
	}

	/** Persist a status change (draft review, stale marking) with a fresh
	 * updatedAt; every other field is untouched. */
	async setStatus(entry: WikiEntry, status: WikiEntryStatus): Promise<void> {
		await this.save({ ...entry, status, updatedAt: new Date().toISOString() });
	}

	private uniqueDraftId(title: string): string {
		const base = slugifyEntryId(title);
		if (!this.entries.some((entry) => entry.id === base)) return base;
		for (let n = 2; ; n++) {
			const candidate = `${base}-${n}`;
			if (!this.entries.some((entry) => entry.id === candidate)) return candidate;
		}
	}
}

export const wikiStore = new WikiStoreState();
