<script lang="ts">
	import { wikiState } from '$lib/wiki/state';
	import type { WikiEntry, WikiEntryType } from '$lib/wiki/types';
	import { Icon } from 'fractalicons';
	import {
		luSearch,
		luBookOpen,
		luLayers,
		luActivity,
		luTag,
		luChevronRight,
		luSlidersHorizontal,
		luShield,
		luFileText
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

	const currentEntryId = wikiState.currentEntryId;
	const filteredRegistry = wikiState.filteredRegistry;
	const selectedCategory = wikiState.selectedCategory;
	const viewMode = wikiState.viewMode;

	function onSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchInput = val;
		wikiState.setSearch(val);
	}

	function selectCategory(cat: WikiEntryType | null) {
		wikiState.setCategory(cat);
	}

	function selectEntry(id: string) {
		wikiState.pick(id);
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
				placeholder="search..."
				value={searchInput}
				oninput={onSearchInput}
			/>
		</div>
		<!-- Category Filter Pills -->
		<div class="row wrap gap-3xs">
			{#each categories as cat}
				<button
					class="button ghost small"
					class:active={$selectedCategory === cat.value}
					onclick={() => selectCategory(cat.value)}
				>
					{cat.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Entry List -->
	<div class="grow scroll-y box gap-sm">
		{#if $filteredRegistry.length === 0}
			<div class="box">
				<Icon icon={luFileText} size={24} />
				<span class="text-xs text-secondary">No entries match your filter.</span>
			</div>
		{:else}
			{#each $filteredRegistry as entry (entry.id)}
				<button
					class="blank pad0 box xleft gap-3xs"
					class:active={$currentEntryId === entry.id && $viewMode === 'entry'}
					onclick={() => selectEntry(entry.id)}
				>


					<p class="text-sm text-primary">{entry.title}</p>
					<div class="row wrap gap-3xs">
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
	<div class="wiki-sidebar-footer row ycenter xbetween pad-xs border-top">
		<button
			class="button small is-ghost text-xs"
			class:active={$viewMode === 'entry'}
			onclick={() => wikiState.setView('entry')}
			title="Document view"
		>
			<Icon icon={luBookOpen} size={14} />
			<span>Article</span>
		</button>
		<button
			class="button small is-ghost text-xs"
			class:active={$viewMode === 'telemetry'}
			onclick={() => wikiState.setView('telemetry')}
			title="Telemetry & Matrix view"
		>
			<Icon icon={luActivity} size={14} />
			<span>Telemetry</span>
		</button>
	</div>
</aside>
