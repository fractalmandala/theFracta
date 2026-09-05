<script lang="ts">
	import { wikiState } from '$lib/wiki/state.svelte';
	import { wikiStore } from '$lib/wiki/store.svelte';
	import { wikiCorpus } from '$lib/wiki/corpus.svelte';
	import { wikiCompile } from '$lib/wiki/compile.svelte';
	import type { WikiEntryType } from '$lib/wiki/types';
	import { Icon } from 'fractalicons';
	import {
		luSearch,
		luBookOpen,
		luActivity,
		luDatabase,
		luFileText,
		luSparkles,
		luSquare,
		luCheck,
		luX
	} from 'fractalicons/lucide';

	const categories: { label: string; value: WikiEntryType | null }[] = [
		{ label: 'All', value: null },
		{ label: 'System', value: 'system' },
		{ label: 'Pattern', value: 'pattern' },
		{ label: 'Decision', value: 'decision' },
		{ label: 'Concept', value: 'concept' },
		{ label: 'Recipe', value: 'recipe' }
	];

	let searchInput = $state('');

	function onSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchInput = val;
		// One search box; it routes to whichever list is in view.
		if (wikiState.viewMode === 'corpus') wikiCorpus.setQuery(val);
		else wikiState.setSearch(val);
	}

	function selectCategory(cat: WikiEntryType | null) {
		wikiState.setCategory(cat);
	}

	function selectEntry(id: string) {
		wikiState.pick(id);
	}

	function selectCorpusEntry(id: string) {
		wikiState.pickCorpus(id);
	}

	function openCompilePanel() {
		wikiCompile.openPanel();
		wikiState.setView('compile');
	}
</script>

<aside class="box gap-sm">
	<!-- Top Filter & Search Section -->
	<div class="box gap-xs">
		<!-- Search Box -->
		<div class="row ycenter xbetween gap-2xs">
			<Icon icon={luSearch} size={14} />
			<input
				type="text"
				class="input"
				placeholder={wikiState.viewMode === 'corpus' ? 'search corpus...' : 'search...'}
				value={searchInput}
				oninput={onSearchInput}
			/>
		</div>
		<!-- Category Filter Pills -->
		<div class="row wrap gap-3xs">
			{#if wikiState.viewMode === 'corpus'}
				<button
					class="button ghost small"
					class:active={wikiCorpus.selectedType === null}
					onclick={() => wikiCorpus.setType(null)}
				>
					All
				</button>
				{#each wikiCorpus.availableTypes as type (type)}
					<button
						class="button ghost small"
						class:active={wikiCorpus.selectedType === type}
						onclick={() => wikiCorpus.setType(type)}
					>
						{type}
					</button>
				{/each}
			{:else}
				{#each categories as cat}
					<button
						class="button ghost small"
						class:active={wikiState.selectedCategory === cat.value}
						onclick={() => selectCategory(cat.value)}
					>
						{cat.label}
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Entry List -->
	<div class="grow scroll-y box gap-sm">
		{#if wikiState.viewMode === 'corpus'}
			<!-- Corpus list: recall entries from the Fractorches service -->
			{#if wikiCorpus.loading && !wikiCorpus.loaded}
				<div class="box gap-3xs pad-y-sm">
					<span class="text-xs text-secondary">Loading recall corpus…</span>
				</div>
			{:else if wikiCorpus.error}
				<div class="box gap-3xs pad-y-sm">
					<span class="text-xs">Corpus unavailable</span>
					<span class="text-xs text-secondary mono">{wikiCorpus.error}</span>
					<button class="button small ghost text-xs" onclick={() => wikiCorpus.refresh()}>Retry</button>
				</div>
			{:else if wikiCorpus.entries.length === 0}
				<div class="box gap-3xs pad-y-sm">
					<Icon icon={luFileText} size={24} />
					<span class="text-xs text-secondary">
						{wikiCorpus.query.trim() || wikiCorpus.selectedType
							? 'No corpus entries match this filter.'
							: 'The recall corpus is empty. Enable extraction in the Fractorches service to populate it.'}
					</span>
				</div>
			{:else}
				<!-- Cluster selection bar for compilation -->
				{#if wikiCorpus.selectionCount > 0}
					<div class="box gap-3xs border pad-2xs">
						<span class="text-xs text-theme">{wikiCorpus.selectionCount} selected</span>
						<div class="box gap-3xs">
							<button class="button small ghost text-xs" onclick={() => wikiCorpus.clearSelection()}>
								<Icon icon={luX} size={12} />
							</button>
							<button class="button small ghost text-xs" onclick={openCompilePanel} title="Compile the selected cluster into a draft">
								<Icon icon={luSparkles} size={12} />
								<span>Compile</span>
							</button>
						</div>
					</div>
				{/if}
				{#each wikiCorpus.entries as entry (entry.id)}
					<div class="box gap-3xs">
						<button
							class="blank pad0 box xleft gap-3xs grow"
							class:active={wikiState.currentCorpusId === entry.id && wikiState.viewMode === 'corpus'}
							onclick={() => selectCorpusEntry(entry.id)}
						>
							<p class="text-sm text-primary">{entry.title}</p>
							<div class="row wrap gap-3xs">
								{#if entry.agent}
									<span class="text-xs text-theme">{entry.agent}</span>
								{/if}
								{#if entry.project}
									<span class="text-xs text-secondary">{entry.project}</span>
								{/if}
								<span class="text-xs mono text-secondary">{entry.review_state}</span>
							</div>
						</button>
						<button
							class="button small ghost text-xs"
							class:active={wikiCorpus.isSelected(entry.id)}
							onclick={() => wikiCorpus.toggleSelected(entry.id)}
							title={wikiCorpus.isSelected(entry.id) ? 'Remove from compile cluster' : 'Add to compile cluster'}
						>
							<Icon icon={wikiCorpus.isSelected(entry.id) ? luCheck : luSquare} size={12} />
						</button>
					</div>
				{/each}
				{#if wikiCorpus.truncated}
					<span class="text-xs text-secondary">
						Showing the first {wikiCorpus.entries.length} matching entries; refine the filter to see more.
					</span>
				{/if}
			{/if}
		{:else if wikiStore.loading}
			<div class="box gap-3xs pad-y-sm">
				<span class="text-xs text-secondary">Loading articles…</span>
			</div>
		{:else if wikiStore.unavailable}
			<div class="box gap-3xs pad-y-sm">
				<Icon icon={luFileText} size={24} />
				<span class="text-xs text-secondary">{wikiStore.unavailable}</span>
			</div>
		{:else if wikiStore.error}
			<div class="box gap-3xs pad-y-sm">
				<span class="text-xs">Article store unavailable</span>
				<span class="text-xs text-secondary mono">{wikiStore.error}</span>
				<button class="button small ghost text-xs" onclick={() => wikiStore.load(true)}>Retry</button>
			</div>
		{:else if wikiStore.entries.length === 0}
			<div class="box gap-3xs pad-y-sm">
				<Icon icon={luFileText} size={24} />
				<span class="text-xs text-secondary">No wiki articles yet.</span>
			</div>
		{:else}
			{#each wikiState.filteredArticles as entry (entry.id)}
				<button
					class="blank pad0 box xleft gap-3xs"
					class:active={wikiState.currentEntryId === entry.id && wikiState.viewMode === 'entry'}
					onclick={() => selectEntry(entry.id)}
				>
					<p class="text-sm text-primary">{entry.title}</p>
					<div class="box gap-3xs">
						{#each entry.tags.slice(0, 3) as tag}
							<span class="text-xs text-theme">
								#{tag}
							</span>
						{/each}
					</div>
				</button>
			{/each}
		{/if}
	</div>

	<!-- Footer Navigation Toolbar -->
	<div class="pad-top-xs text-muted text-xs row ycenter xbetween pad-xs border-top">
		<button
			class="button small ghost text-xs"
			class:active={wikiState.viewMode === 'compile'}
			onclick={openCompilePanel}
			title="Compile selected corpus entries into a draft article"
		>
			<Icon icon={luSparkles} size={14} />
			<span>Compile</span>
		</button>
		<button
			class="button small ghost text-xs"
			class:active={wikiState.viewMode === 'entry'}
			onclick={() => wikiState.setView('entry')}
			title="Article view"
		>
			<Icon icon={luBookOpen} size={14} />
			<span>Article</span>
		</button>
		<button
			class="button small ghost text-xs"
			class:active={wikiState.viewMode === 'corpus'}
			onclick={() => wikiState.setView('corpus')}
			title="Recall corpus from the Fractorches service"
		>
			<Icon icon={luDatabase} size={14} />
			<span>Corpus</span>
		</button>
		<button
			class="button small ghost text-xs"
			class:active={wikiState.viewMode === 'telemetry'}
			onclick={() => wikiState.setView('telemetry')}
			title="Telemetry & Matrix view"
		>
			<Icon icon={luActivity} size={14} />
			<span>Telemetry</span>
		</button>
	</div>
</aside>
