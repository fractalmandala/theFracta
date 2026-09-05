<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { open } from '@tauri-apps/plugin-dialog';
	import { Icon } from 'fractalicons';
	import { luBookOpen, luFilePlus, luFolderOpen, luPin, luX } from 'fractalicons/lucide';
	import { openFile, newDocument } from '$lib/tauri/files';
	import { pinnedFolders } from '$lib/stores/pinned';
	import { recentFiles, removeRecentFile } from '$lib/stores/recents';
	import { vaultState } from '$lib/states/vaultState.svelte';
	import VaultTree from './VaultTree.svelte';

	// One store owns vault data for every component that shows it.
	$effect(() => {
		void vaultState.init();
	});

	async function addVault() {
		try {
			const selected = await open({ directory: true, multiple: false });
			if (!selected || typeof selected !== 'string') return;
			await vaultState.addVault(selected);
		} catch (error) {
			// A cancelled picker is a no-op; a refused folder is not, and the
			// reason (too broad, unreadable) has to reach the user.
			vaultAddError = error instanceof Error ? error.message : String(error);
		}
	}

	let vaultAddError = $state<string | null>(null);

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

<aside class="box gap-2xs" aria-label="Notes library">
	<!--
	  Vaults come first: a vault is a folder the app has indexed, so it browses
	  as a real tree with real counts at any size. Pinned folders below are the
	  unindexed shortcut — the same folder picker, none of the tree.
	-->
	<section class="box gap-2xs" aria-labelledby="vaults-heading">
		<header class="row ycenter xbetween pad-sm border-bottom">
			<h2 id="vaults-heading" class="text-sm weight-400 tt-u text-muted">Vaults</h2>
			<button
				class="is-ghost row ycenter gap-3xs is-icon tip tip-end"
				onclick={addVault}
				data-tip="Add vault"
				aria-label="Add vault"
				disabled={vaultState.busy}
			>
				<Icon icon={luFolderOpen} size={14} />
			</button>
		</header>

		{#if vaultState.unavailable}
			<p class="text-2xs text-danger pad-x-sm">{vaultState.unavailable}</p>
		{:else if vaultAddError}
			<p class="text-2xs text-danger pad-x-sm">{vaultAddError}</p>
		{/if}

		{#each vaultState.vaults as vault (vault.id)}
			<VaultTree {vault} />
		{/each}
	</section>

	<!-- Pinned folders -->
	<section class="box gap-2xs" aria-labelledby="pinned-folders-heading">
		<header class="row ycenter xbetween pad-sm border-bottom">
			<h2 class="text-sm weight-400 tt-u text-muted">Pinned</h2>
			<button class="is-ghost row ycenter gap-3xs is-icon" onclick={addPinnedFolder} title="Pin folder" aria-label="Pin folder">
				<Icon icon={luPin} size={14} />
			</button>
		</header>
		{#if $pinnedFolders.length !== 0}
			<div class="box gap-3xs">
				{#each $pinnedFolders as folder (folder)}
					<div class="box gap-3xs">
						<div class="row ycenter gap-3xs wfull">
							<button class="wfull ta-l pad-y-3xs pad-x-2xs row ycenter gap-2xs grow min0" onclick={() => toggleFolder(folder)} aria-expanded={expandedFolders.has(folder)}>
								<Icon icon={luFolderOpen} size={15}/>
								<span class="text-sm weight-500 truncate grow min0">{folderName(folder)}</span>
								<span class="text-xs text-muted tabular-nums">{folderFiles[folder]?.length ?? '…'}</span>
							</button>
							<button class="is-ghost row ycenter gap-3xs is-icon" onclick={() => unpin(folder)} aria-label={`Unpin ${folderName(folder)}`} title="Unpin folder">
								<Icon icon={luX} size={13} />
							</button>
						</div>
						{#if expandedFolders.has(folder)}
							<ul class="box gap-3xs pad-left-md unstyled">
								{#if !folderFiles[folder]}
									<li class="text-xs text-muted pad-x-2xs">Loading files…</li>
								{:else if folderFiles[folder].length === 0}
									<li class="text-xs text-muted pad-x-2xs">No Markdown files found.</li>
								{:else}
									{#each folderFiles[folder] as file (file.path)}
										<li>
											<button class="wfull ta-l pad-y-3xs pad-x-2xs row ycenter gap-2xs" onclick={() => void openFile(file.path)} title={file.rel_path}>
												<Icon icon={luBookOpen} size={13} class="shrink-0" />
												<span class="text-xs text-secondary truncate grow min0">{file.rel_path}</span>
											</button>
										</li>
									{/each}
								{/if}
							</ul>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>
	<!-- Recent files -->
	<section class="box gap-2xs wfull" aria-labelledby="recent-notes-heading">
		<header class="row ycenter xbetween pad-sm">
			<h2 class="text-sm weight-400 tt-u text-muted">Recent</h2>
		</header>
		{#if $recentFiles.length !== 0}
			<ul class="box gap-3xs unstyled wfull">
				{#each $recentFiles as file (file.path)}
					<li class="row ytop xbetween gap-3xs wfull border-bottom pad-sm">
							<button class="box xleft blank gap-3xs ytop pad0" onclick={() => void openFile(file.path)} title={file.path}>
								<p class="text-xs text-secondary">{file.name}</p>
								<small class="text-xs text-muted">{relativeTime(file.openedAt)} ago</small>
						</button>
						<button class="button row ytop is-icon" onclick={() => removeRecentFile(file.path)} aria-label={`Remove ${file.name} from recents`} title="Remove from recents">
							<Icon icon={luX} size={13} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</aside>
