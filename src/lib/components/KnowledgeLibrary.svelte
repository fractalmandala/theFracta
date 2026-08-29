<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { open } from '@tauri-apps/plugin-dialog';
	import { Icon } from 'fractalicons';
	import { luBookOpen, luFilePlus, luFolderOpen, luPin, luX } from 'fractalicons/lucide';
	import { openFile, newDocument } from '$lib/tauri/files';
	import { pinnedFolders } from '$lib/stores/pinned';
	import { recentFiles, removeRecentFile } from '$lib/stores/recents';

	let {
		onPaste = () => {},
		onOpen = () => {},
		onUrl = () => {}
	}: {
		onPaste?: () => void;
		onOpen?: () => void;
		onUrl?: () => void;
	} = $props();

	interface MdFile {
		name: string;
		path: string;
		rel_path: string;
		modified: number;
	}

	let folderFiles = $state<Record<string, MdFile[]>>({});
	let expandedFolders = $state<Set<string>>(new Set());

	$effect(() => {
		for (const folder of $pinnedFolders) {
			if (folder in folderFiles) continue;
			void loadFolder(folder);
		}
	});

	async function loadFolder(folder: string) {
		try {
			const files = await invoke<MdFile[]>('list_folder_md_files', { folder, maxDepth: 3 });
			folderFiles = { ...folderFiles, [folder]: files };
		} catch {
			folderFiles = { ...folderFiles, [folder]: [] };
		}
	}

	async function addPinnedFolder() {
		try {
			const selected = await open({ directory: true, multiple: false });
			if (!selected || typeof selected !== 'string') return;
			pinnedFolders.add(selected);
			await loadFolder(selected);
			expandedFolders = new Set([...expandedFolders, selected]);
		} catch {
			// Cancelling the native picker is an intentional no-op.
		}
	}

	function toggleFolder(path: string) {
		const next = new Set(expandedFolders);
		if (next.has(path)) next.delete(path);
		else next.add(path);
		expandedFolders = next;
	}

	function unpin(path: string) {
		pinnedFolders.remove(path);
		const { [path]: _removed, ...remaining } = folderFiles;
		folderFiles = remaining;
		const next = new Set(expandedFolders);
		next.delete(path);
		expandedFolders = next;
	}

	function folderName(path: string) {
		return path.replace(/\/+$/, '').split('/').pop() || path;
	}

	function relativeTime(timestamp: number) {
		const elapsed = Math.max(0, Date.now() - timestamp);
		const minutes = Math.floor(elapsed / 60_000);
		if (minutes < 1) return 'now';
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		return days < 7 ? `${days}d` : new Date(timestamp).toLocaleDateString();
	}
</script>

<aside class="sidebar-left box gap-2xs" aria-label="Notes library">
	<!-- Quick entry actions -->
	<div class="box gap-3xs pad-x-xs pad-top-2xs pad-bottom-xs">
		<div class="row gap-3xs">
			<button class="button small ghost text-xs" onclick={onOpen}>Open</button>
			<button class="button small ghost text-xs" onclick={onPaste}>Paste</button>
			<button class="button small ghost text-xs" onclick={onUrl}>URL</button>
		</div>
	</div>

	<!-- Pinned folders -->
	<section class="box gap-2xs pad-x-xs pad-bottom-sm" aria-labelledby="pinned-folders-heading">
		<header class="row ycenter xbetween pad-x-2xs pad-y-2xs">
			<h2 id="pinned-folders-heading" class="text-xs weight-600 tt-u text-muted m-0">Pinned folders</h2>
			<button class="library-icon-btn is-icon" onclick={addPinnedFolder} title="Pin folder" aria-label="Pin folder">
				<Icon icon={luPin} size={14} />
			</button>
		</header>

		{#if $pinnedFolders.length === 0}
			<p class="text-xs text-muted pad-x-2xs m-0">Pin a folder to keep its recent Markdown files within reach.</p>
		{:else}
			<ul class="box gap-3xs reset-list">
				{#each $pinnedFolders as folder (folder)}
					<li class="box gap-3xs">
						<div class="row ycenter gap-3xs">
							<button class="library-row-btn row ycenter gap-2xs grow min0" onclick={() => toggleFolder(folder)} aria-expanded={expandedFolders.has(folder)}>
								<Icon icon={luFolderOpen} size={15} class="shrink-0" />
								<span class="text-sm weight-500 truncate grow min0">{folderName(folder)}</span>
								<span class="text-xs text-muted tabular-nums">{folderFiles[folder]?.length ?? '…'}</span>
							</button>
							<button class="library-row-remove is-icon" onclick={() => unpin(folder)} aria-label={`Unpin ${folderName(folder)}`} title="Unpin folder">
								<Icon icon={luX} size={13} />
							</button>
						</div>
						{#if expandedFolders.has(folder)}
							<ul class="box gap-3xs pad-left-md reset-list">
								{#if !folderFiles[folder]}
									<li class="text-xs text-muted pad-x-2xs">Loading files…</li>
								{:else if folderFiles[folder].length === 0}
									<li class="text-xs text-muted pad-x-2xs">No Markdown files found.</li>
								{:else}
									{#each folderFiles[folder] as file (file.path)}
										<li>
											<button class="library-file-btn row ycenter gap-2xs" onclick={() => void openFile(file.path)} title={file.rel_path}>
												<Icon icon={luBookOpen} size={13} class="shrink-0" />
												<span class="text-xs text-secondary truncate grow min0">{file.rel_path}</span>
											</button>
										</li>
									{/each}
								{/if}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Recent files -->
	<section class="box gap-2xs pad-x-xs pad-bottom-sm" aria-labelledby="recent-notes-heading">
		<header class="row ycenter xbetween pad-x-2xs pad-y-2xs">
			<h2 id="recent-notes-heading" class="text-xs weight-600 tt-u text-muted m-0">Recent</h2>
			<span class="text-xs text-muted tabular-nums">{$recentFiles.length}</span>
		</header>
		{#if $recentFiles.length === 0}
			<p class="text-xs text-muted pad-x-2xs m-0">Notes you open will appear here.</p>
		{:else}
			<ul class="box gap-3xs reset-list">
				{#each $recentFiles as file (file.path)}
					<li class="row ycenter gap-3xs">
						<button class="library-row-btn row ycenter gap-2xs grow min0" onclick={() => void openFile(file.path)} title={file.path}>
							<Icon icon={luBookOpen} size={14} class="shrink-0" />
							<span class="box gap-3xs grow min0">
								<span class="text-sm weight-500 truncate">{file.name}</span>
								<small class="text-xs text-muted">{relativeTime(file.openedAt)} ago</small>
							</span>
						</button>
						<button class="library-row-remove is-icon" onclick={() => removeRecentFile(file.path)} aria-label={`Remove ${file.name} from recents`} title="Remove from recents">
							<Icon icon={luX} size={13} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</aside>
