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

export type WikiStoreSource = 'override' | 'repo' | 'home';

type WikiRootResponse = { path: string; source: WikiStoreSource };
type WikiEntryFileResponse = { name: string; path: string; modified: number };

class WikiStoreState {
	entries = $state<WikiEntry[]>([]);
	loading = $state(false);
	loaded = $state(false);
	error = $state<string | null>(null);
	/** Set when article storage is unreachable in this runtime (web dev). */
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
			const root = await invoke<WikiRootResponse>('wiki_data_dir');
			this.dirPath = root.path;
			this.dirSource = root.source;
			this.files = await invoke<WikiEntryFileResponse[]>('list_wiki_entries');
			const parsed: WikiEntry[] = [];
			let skipped = 0;
			for (const file of this.files) {
				try {
					const text = await invoke<string>('read_markdown_file', { path: file.path });
					const entry = entryFromMarkdown(text);
					if (entry) parsed.push(entry);
					else skipped++;
				} catch {
					skipped++;
				}
			}
			this.entries = parsed;
			this.skippedFiles = skipped;
			this.loadedAt = new Date().toISOString();
			this.loaded = true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
				// Browser dev mode has no native file bridge. The corpus browsing
				// side of the surface still works; only the article store cannot.
				this.unavailable = 'Article storage needs the Fracta desktop app (native file access).';
			} else {
				this.error = message;
			}
			this.loaded = true;
		} finally {
			this.loading = false;
		}
	}

	/** Persist an article as <root>/entries/<id>.md and refresh the in-memory
	 * list. Refuses unsafe ids before a path is ever constructed. */
	async save(entry: WikiEntry) {
		if (!isValidEntryId(entry.id)) throw new Error(`Invalid wiki article id: ${entry.id}`);
		if (!this.dirPath) throw new Error('Wiki storage is unavailable');
		const path = `${this.dirPath}/entries/${entry.id}.md`;
		await invoke('write_markdown_file', { path, content: entryToMarkdown(entry) });
		await this.load(true);
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
