<script lang="ts">
	/**
	 * A vault's folder tree, read from the index.
	 *
	 * Expanding a folder is an indexed lookup, not a directory walk, so it costs
	 * the same in a 20-file vault and a 20,000-file one. Counts are the real
	 * counts: the folder listing this replaces walked the whole tree, sorted by
	 * modified time and then threw away everything past the fiftieth file, while
	 * rendering that fifty as the folder's total.
	 */
	import { Icon } from 'fractalicons';
	import { luChevronRight, luChevronDown, luFileText, luFolder, luRefreshCw, luX } from 'fractalicons/lucide';
	import { openFile } from '$lib/tauri/files';
	import { vaultState, type VaultSummary } from '$lib/states/vaultState.svelte';

	let { vault }: { vault: VaultSummary } = $props();

	const rootOpen = $derived(vaultState.isExpanded(vault.id, ''));

	$effect(() => {
		if (rootOpen) void vaultState.loadChildren(vault.id, '');
	});

	function openNote(relPath: string) {
		// The index stores paths relative to the vault; the file layer wants an
		// absolute one.
		void openFile(`${vault.root}/${relPath}`);
	}

	const scanning = $derived(vaultState.scanning[vault.id] === true);

	/** Truthful, and specific about which of the several "not ready" it is. */
	const status = $derived.by(() => {
		if (scanning) return 'Reading folder…';
		if (vault.last_error) return vault.last_error;
		if (vault.state === 'never') return 'Not indexed yet';
		if (vault.state === 'indexing')
			return `${vault.indexed_count.toLocaleString()} of ${vault.file_count.toLocaleString()} notes read`;
		return `${vault.file_count.toLocaleString()} notes`;
	});
</script>

{#snippet folder(relPath: string, name: string, count: number, depth: number)}
	{@const open = vaultState.isExpanded(vault.id, relPath)}
	{@const kids = vaultState.childrenOf(vault.id, relPath)}
	<li>
		<button
			class="navtree-link row ycenter gap-2xs wfull ta-l"
			aria-expanded={open}
			onclick={() => vaultState.toggle(vault.id, relPath)}
		>
			<Icon icon={open ? luChevronDown : luChevronRight} size={12} decorative />
			<Icon icon={luFolder} size={13} decorative />
			<span class="truncate grow min0">{name}</span>
			<span class="text-2xs text-muted tabular-nums shrink-0">{count.toLocaleString()}</span>
		</button>
		{#if open}
			{#if kids}
				<ul class="navtree-sub unstyled">
					{#each kids.dirs as dir (dir.rel_path)}
						{@render folder(dir.rel_path, dir.name, dir.subtree_count, depth + 1)}
					{/each}
					{#each kids.files as file (file.id)}
						<li>
							<button
								class="navtree-link row ycenter gap-2xs wfull ta-l"
								onclick={() => openNote(file.rel_path)}
								data-tip={file.rel_path}
							>
								<Icon icon={luFileText} size={13} decorative />
								<span class="truncate grow min0">{file.title || file.name}</span>
							</button>
						</li>
					{:else}
						{#if kids.dirs.length === 0}
							<li class="text-2xs text-muted pad-x-xs pad-y-3xs">Empty</li>
						{/if}
					{/each}
				</ul>
			{:else}
				<ul class="navtree-sub unstyled">
					<li class="text-2xs text-muted pad-x-xs pad-y-3xs">Reading…</li>
				</ul>
			{/if}
		{/if}
	</li>
{/snippet}

<section class="box gap-3xs">
	<header class="row ycenter gap-2xs pad-x-xs">
		<button
			class="navtree-link row ycenter gap-2xs grow min0 ta-l"
			aria-expanded={rootOpen}
			onclick={() => vaultState.toggle(vault.id, '')}
		>
			<Icon icon={rootOpen ? luChevronDown : luChevronRight} size={12} decorative />
			<span class="truncate weight-600 text-xs tt-u tracking-wider">{vault.label}</span>
		</button>
		<button
			class="button is-icon tip shrink-0"
			data-tip="Re-read this folder"
			aria-label="Re-read this folder"
			onclick={() => vaultState.rescan(vault.id)}
		>
			<Icon icon={luRefreshCw} size={12} decorative />
		</button>
		<button
			class="button is-icon tip shrink-0"
			data-tip="Remove from the library. The folder and its notes are not touched."
			aria-label="Remove vault"
			onclick={() => vaultState.removeVault(vault.id)}
		>
			<Icon icon={luX} size={12} decorative />
		</button>
	</header>

	<p class="text-2xs text-muted pad-x-xs" class:text-danger={!!vault.last_error}>{status}</p>

	{#if rootOpen}
		{@const kids = vaultState.childrenOf(vault.id, '')}
		{#if kids}
			<ul class="navtree unstyled">
				{#each kids.dirs as dir (dir.rel_path)}
					{@render folder(dir.rel_path, dir.name, dir.subtree_count, 1)}
				{/each}
				{#each kids.files as file (file.id)}
					<li>
						<button
							class="navtree-link row ycenter gap-2xs wfull ta-l"
							onclick={() => openNote(file.rel_path)}
							data-tip={file.rel_path}
						>
							<Icon icon={luFileText} size={13} decorative />
							<span class="truncate grow min0">{file.title || file.name}</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-2xs text-muted pad-x-xs">Reading…</p>
		{/if}
	{/if}
</section>
