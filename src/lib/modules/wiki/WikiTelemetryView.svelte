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
</script>

<div class="min0 box grow hfull scroll-y pad-md gap-md">
	<!-- Top Bar -->
	<div class="row ycenter xbetween pad-bottom-xs border-bottom">
		<div class="row ycenter gap-xs mono text-xs text-secondary">
			<Icon icon={luActivity} size={14} />
			<span class="tt-u weight-600 text-primary">KNOWLEDGE TELEMETRY & SYSTEM STATE</span>
		</div>
		<div class="row ycenter gap-xs mono text-xs text-secondary">
			<span>articles {totalArticles}</span>
			<span>•</span>
			<span>corpus {corpusTotal}{wikiCorpus.truncated ? '+' : ''}</span>
			{#if wikiCorpus.loadedAt}
				<span>•</span>
				<span>fetched {new Date(wikiCorpus.loadedAt).toLocaleTimeString()}</span>
			{/if}
		</div>
	</div>

	<!-- 4-Card Telemetry Grid (matching Screenshot 1) -->
	<div class="card-grid gap-sm grid-4 gap-md">
		<!-- Card 1: Article store -->
		<div class="radius-4 box gap-sm border pad-sm">
			<div class="ybase gap-sm pad-bottom-xs border-bottom row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>ARTICLE STORE ▸</span>
			</div>

			<div class="row gap-sm ycenter">
				<!-- Matrix Visual -->
				<div class="wiki-matrix-grid">
					{#each matrixBlocks as block (block.id)}
						<div class="pad-2xs text-xs" class:active={block.active}></div>
					{/each}
				</div>

				<!-- Stats column -->
				<div class="box gap-2xs mono text-xs grow">
					<div class="text-2xs text-secondary tt-u">Articles</div>
					<div class="mono text-xl tabular-nums text-primary weight-600">{totalArticles} items</div>
					<div class="badge mono pad-x-2xs pad-y-2xs text-2xs border">
						{stableCount} stable
					</div>
					<div class="badge mono pad-x-2xs pad-y-2xs text-2xs border">
						{draftCount} draft or proposed
					</div>
				</div>
			</div>

			<div class="text-muted text-xs mono text-2xs text-secondary border-top pad-top-xs">
				{#if wikiStore.loading}
					Loading local article store…
				{:else if wikiStore.unavailable}
					{wikiStore.unavailable}
				{:else if wikiStore.error}
					Store error: {wikiStore.error}
				{:else if wikiStore.skippedFiles > 0}
					{wikiStore.skippedFiles} malformed file{wikiStore.skippedFiles === 1 ? '' : 's'} skipped ·
					loaded {new Date(wikiStore.loadedAt ?? '').toLocaleTimeString()}
				{:else}
					Loaded from local store
					{#if wikiStore.loadedAt}
						· {new Date(wikiStore.loadedAt).toLocaleTimeString()}
					{/if}
				{/if}
			</div>
		</div>

		<!-- Card 2: Recall corpus by agent -->
		<div class="radius-4 box gap-sm border pad-sm">
			<div class="ybase gap-sm pad-bottom-xs border-bottom row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>CORPUS BY AGENT ▸</span>
				<Icon icon={luDatabase} size={12} />
			</div>

			<div class="box gap-2xs mono text-xs">
				{#if wikiCorpus.loading && !wikiCorpus.loaded}
					<span class="text-2xs text-secondary">Loading corpus…</span>
				{:else if wikiCorpus.error}
					<span class="text-2xs text-secondary">Corpus unavailable: {wikiCorpus.error}</span>
				{:else if wikiCorpus.byAgent.length === 0}
					<span class="text-2xs text-secondary">No corpus entries in the current filter.</span>
				{:else}
					{#each wikiCorpus.byAgent.slice(0, 6) as [agent, count] (agent)}
						<div class="row ycenter xbetween pad-y-2xs border-bottom">
							<span class="badge radius-32 gap-3xs text-2xs tt-u">{agent}</span>
							<span class="text-secondary text-2xs">{count} entries</span>
						</div>
					{/each}
				{/if}
			</div>

			<div class="text-muted text-xs mono text-2xs text-secondary border-top pad-top-xs">
				{#if wikiCorpus.truncated}
					First {corpusTotal} matching entries shown; more exist server-side
				{:else}
					{corpusTotal} entries from the Fractorches recall corpus
				{/if}
			</div>
		</div>

		<!-- Card 3: Article taxonomy distribution -->
		<div class="radius-4 box gap-sm border pad-sm">
			<div class="ybase gap-sm pad-bottom-xs border-bottom row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>ARTICLE TAXONOMY ▸</span>
				<Icon icon={luLayers} size={12} />
			</div>

			<div class="box gap-2xs mono text-xs">
				{#if articleTypeCounts.length === 0}
					<span class="text-2xs text-secondary">No articles yet.</span>
				{:else}
					{#each articleTypeCounts as [type, count] (type)}
						<div class="row ycenter xbetween text-2xs">
							<span class="text-secondary tt-u">{type}</span>
							<span class="weight-500">{count}</span>
						</div>
					{/each}
				{/if}
			</div>

			<div class="text-muted text-xs mono text-2xs text-secondary border-top pad-top-xs">
				{totalChatRefs} chat citation{totalChatRefs === 1 ? '' : 's'} across all articles
			</div>
		</div>

		<!-- Card 4: Corpus review states + store facts -->
		<div class="radius-4 box gap-sm border pad-sm">
			<div class="ybase gap-sm pad-bottom-xs border-bottom row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>CORPUS REVIEW STATES ▸</span>
				<Icon icon={luShield} size={12} />
			</div>

			<div class="box gap-2xs mono text-xs">
				{#if wikiCorpus.error}
					<span class="text-2xs text-secondary">Corpus unavailable.</span>
				{:else if wikiCorpus.byReviewState.length === 0}
					<span class="text-2xs text-secondary">No corpus entries in the current filter.</span>
				{:else}
					{#each wikiCorpus.byReviewState as [state, count] (state)}
						<div class="row ycenter xbetween text-2xs">
							<span class="text-secondary">{state}</span>
							<span class="weight-500">{count}</span>
						</div>
					{/each}
				{/if}
			</div>

			<div class="text-muted text-xs mono text-2xs text-secondary border-top pad-top-xs">
				{#if wikiStore.dirSource}
					Store: {wikiStore.dirSource} · Git-ignored
				{:else}
					Store: Git-ignored local articles
				{/if}
			</div>
		</div>
	</div>

	<!-- Recent Topics Table -->
	<div class="radius-4 box gap-xs border pad-sm">
		<div class="row ycenter xbetween mono text-xs border-bottom pad-bottom-xs">
			<span class="tt-u weight-600">ARTICLE REGISTER</span>
			<span class="text-secondary">{totalArticles} TOPICS</span>
		</div>

		<div class="box gap-2xs mono text-xs">
			{#if articles.length === 0}
				<span class="text-2xs text-secondary">No articles yet.</span>
			{:else}
				{#each articles as entry (entry.id)}
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
