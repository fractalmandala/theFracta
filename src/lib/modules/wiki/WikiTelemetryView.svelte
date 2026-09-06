<script lang="ts">
	import { wikiState } from '$lib/wiki/state.svelte';
	import { wikiStore } from '$lib/wiki/store.svelte';
	import { wikiCorpus } from '$lib/wiki/corpus.svelte';
	import { Icon } from 'fractalicons';
	import { luActivity, luDatabase, luLayers, luShield } from 'fractalicons/lucide';

	// Every value on this page is measured from one of two sources: the local
	// article store (wikiStore) or the Fractorches recall corpus (wikiCorpus).
	// Counts derived from the loaded lists are labeled as such.
	const articles = $derived(wikiStore.entries);
	const totalArticles = $derived(articles.length);
	const stableCount = $derived(articles.filter((entry) => entry.status === 'stable').length);
	const draftCount = $derived(
		articles.filter((entry) => entry.status === 'draft' || entry.status === 'proposed').length
	);
	const totalChatRefs = $derived(articles.reduce((acc, entry) => acc + entry.chatRefs.length, 0));
	const corpusTotal = $derived(wikiCorpus.entries.length);

	// The matrix is a density visual tied to the real article count: one cell
	// per article up to the grid size.
	const matrixBlocks = $derived.by(() =>
		Array.from({ length: 64 }, (_, i) => ({
			id: i,
			active: i < Math.min(64, totalArticles)
		}))
	);

	// Article counts per taxonomy type, only for types that actually occur.
	const articleTypeCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of articles) {
			counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	});

	// Tags and filtering are owned by wikiState so telemetry and sidebar filters stay in sync.
	const distinctTags = $derived(wikiState.allTags);
	const selectedTags = $derived(wikiState.selectedTags);
	const matchMode = $derived(wikiState.tagMatchMode);
	const filteredArticles = $derived(wikiState.filteredArticles);
</script>

<div class="min0 box grow hfull scroll-y pad-md gap-md">
	<div class="box">
		<h1 class="text-3xl">Wiki Telemetry</h1>
		<p class="tt-u mono text-theme">[ {totalArticles} articles | {corpusTotal}{wikiCorpus.truncated ? '+' : ''} corpus | {draftCount} draft ]</p>
	</div>
	<div class="card-grid outline-grid">
		{#each articleTypeCounts as [type, count] (type)}
			<div class="in-outline-grid box pad-sm gap-3xs">
				<span class="card-title text-xl">{type}</span>
				<span class="text-bs text-theme">{count}</span>
			</div>
		{/each}
	</div>

	<!-- Distinct Tags Register / Filter Section -->
	<div class="radius-4 box gap-xs border pad-sm">
		<div class="row ycenter xbetween mono text-xs border-bottom pad-bottom-xs">
			<div class="row ycenter gap-sm">
				<span class="tt-u weight-600">TAGS REGISTER</span>
				<span class="text-secondary">{distinctTags.length} DISTINCT TAGS</span>
			</div>
			<div class="row ycenter gap-sm">
				{#if selectedTags.length > 1}
					<div class="row ycenter gap-3xs">
						<span class="text-2xs text-secondary">MATCH:</span>
						<div class="segmented">
							<button
								type="button"
								class="segmented-item text-2xs mono"
								class:active={matchMode === 'any'}
								onclick={() => wikiState.setTagMatchMode('any')}
							>
								ANY
							</button>
							<button
								type="button"
								class="segmented-item text-2xs mono"
								class:active={matchMode === 'all'}
								onclick={() => wikiState.setTagMatchMode('all')}
							>
								ALL
							</button>
						</div>
					</div>
				{/if}
				{#if selectedTags.length > 0}
					<button
						type="button"
						class="button text-2xs mono pad-x-xs pad-y-3xs text-theme"
						onclick={() => wikiState.clearTags()}
					>
						CLEAR ({selectedTags.length})
					</button>
				{/if}
			</div>
		</div>

		{#if distinctTags.length === 0}
			<span class="text-2xs text-secondary mono pad-y-xs">No tags recorded across articles.</span>
		{:else}
			<div class="row wrap gap-xs pad-y-2xs">
				{#each distinctTags as { tag, count } (tag)}
					{@const isSelected = selectedTags.includes(tag)}
					<button
						type="button"
						class="badge mono text-2xs cursor-pointer pad-x-xs pad-y-3xs row ycenter gap-3xs"
						class:bg-theme={isSelected}
						class:text-inverse={isSelected}
						aria-pressed={isSelected}
						onclick={() => wikiState.toggleTag(tag)}
					>
						<span>#{tag}</span>
						<span class="text-2xs" class:text-secondary={!isSelected} class:text-inverse={isSelected}>
							{count}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recent Topics Table -->
	<div class="radius-4 box gap-xs border pad-sm">
		<div class="row ycenter xbetween mono text-xs border-bottom pad-bottom-xs">
			<span class="tt-u weight-600">ARTICLE REGISTER</span>
			<div class="row ycenter gap-sm">
				{#if selectedTags.length > 0}
					<span class="text-theme">
						FILTERED: {filteredArticles.length} OF {totalArticles} TOPICS
					</span>
				{:else}
					<span class="text-secondary">{totalArticles} TOPICS</span>
				{/if}
			</div>
		</div>

		<div class="box gap-2xs mono text-xs">
			{#if filteredArticles.length === 0}
				<span class="text-2xs text-secondary pad-y-sm">
					{totalArticles === 0 ? 'No articles yet.' : 'No articles match the selected tags.'}
				</span>
			{:else}
				{#each filteredArticles as entry (entry.id)}
					<button
						class="gap-sm pad-y-3xs text-sm row ycenter xbetween pad-xs border-bottom"
						onclick={() => wikiState.pick(entry.id)}
					>
						<div class="row ycenter gap-sm">
							<span class="badge mono text-2xs tt-u" data-type={entry.type}>
								{entry.type}
							</span>
							<span class="weight-500 text-primary">{entry.title}</span>
						</div>
						<div class="row ycenter gap-md text-secondary text-2xs">
							<span>{entry.tags.join(', ')}</span>
							<span class="badge mono text-2xs tt-u" data-status={entry.status}>
								{entry.status}
							</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
