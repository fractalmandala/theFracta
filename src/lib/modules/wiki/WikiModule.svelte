<script lang="ts">
	import { onMount } from "svelte";
	import { wikiState } from "$lib/wiki/state.svelte";
	import { wikiStore } from "$lib/wiki/store.svelte";
	import { wikiCorpus } from "$lib/wiki/corpus.svelte";
	import Rail from "$lib/components/Rail.svelte";
	import WikiSidebar from "./WikiSidebar.svelte";
	import WikiArticle from "./WikiArticle.svelte";
	import WikiCorpusEntry from "./WikiCorpusEntry.svelte";
	import WikiCompilePanel from "./WikiCompilePanel.svelte";
	import WikiInspector from "./WikiInspector.svelte";
	import WikiTelemetryView from "./WikiTelemetryView.svelte";

	const articles = $derived(wikiStore.entries);
	const totalArticles = $derived(articles.length);
	const stableCount = $derived(
		articles.filter((entry) => entry.status === "stable").length,
	);
	const draftCount = $derived(
		articles.filter(
			(entry) => entry.status === "draft" || entry.status === "proposed",
		).length,
	);
	const current = $derived(wikiState.current);
	const totalChatRefs = $derived(
		articles.reduce((acc, entry) => acc + entry.chatRefs.length, 0),
	);
	const corpusTotal = $derived(wikiCorpus.entries.length);
	const entry = $derived(wikiState.currentCorpus);
	const articleTypeCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of articles) {
			counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]);
	});

	onMount(() => {
		void wikiStore.load();
		void wikiCorpus.load();
	});
</script>

<!--
  The app shell already provides .app-main; this module fills it rather than
  nesting a second one. Both side columns are rails: collapsible, drag-resizable
  and remembered per surface.
-->
<div class="row grow min0 hfull">
	<Rail
		id="wiki-nav"
		side="left"
		label="Wiki navigation"
		initial={260}
		min={200}
		max={460}
	>
		<WikiSidebar />
	</Rail>

	<section class="main-section">
		{#if wikiState.viewMode === "entry"}
			{#if !current}
				<div class="box ycenter hfull pad-xl gap-md scroll-y">
					<div class="box ycenter gap-2xs">
						<div class="text-2xl weight-600">Fracta Engineering Knowledge Wiki</div>
						<div class="text-sm text-secondary">
							Select a concept from the sidebar or click a section below to explore.
						</div>
						<p class="tt-u mono text-theme text-xs pad-top-2xs">
							[ {totalArticles} concepts across {wikiState.allSections.length} sections | {stableCount} stable | {draftCount} draft ]
						</p>
					</div>

					<div class="card-grid outline-grid wfull pad-x-lg">
						{#each wikiState.allSections as sec (sec.key)}
							<button
								type="button"
								class="in-outline-grid box pad-md gap-3xs grow cursor-pointer xleft blank"
								onclick={() => {
									wikiState.setSection(sec.key);
									const first = wikiStore.entries.find((e) => (e.section || 'core-concepts') === sec.key);
									if (first) wikiState.pick(first.id);
								}}
								title="Explore {sec.title}"
							>
								<span class="card-title text-xl weight-600">{sec.title}</span>
								<span class="text-bs text-theme mono">{sec.count} concepts</span>
								<span class="text-2xs text-secondary pad-top-3xs">
									Click to view section entries &rarr;
								</span>
							</button>
						{/each}
					</div>
				</div>
			{:else}

				<WikiArticle />
			{/if}
		{:else if wikiState.viewMode === "compile"}
			<WikiCompilePanel />
		{/if}
	</section>

	<!--
	<Rail
		id="wiki-inspector"
		side="right"
		label="Entry inspector"
		initial={240}
		min={200}
		max={440}
	>
		<WikiInspector />
	</Rail>
	-->
</div>
