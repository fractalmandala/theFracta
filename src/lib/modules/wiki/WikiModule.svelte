<script lang="ts">
	import { onMount } from 'svelte';
	import { wikiState } from '$lib/wiki/state.svelte';
	import { wikiStore } from '$lib/wiki/store.svelte';
	import { wikiCorpus } from '$lib/wiki/corpus.svelte';
	import Rail from '$lib/components/Rail.svelte';
	import WikiSidebar from './WikiSidebar.svelte';
	import WikiArticle from './WikiArticle.svelte';
	import WikiCorpusEntry from './WikiCorpusEntry.svelte';
	import WikiCompilePanel from './WikiCompilePanel.svelte';
	import WikiInspector from './WikiInspector.svelte';
	import WikiTelemetryView from './WikiTelemetryView.svelte';

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
	<Rail id="wiki-nav" side="left" label="Wiki navigation" initial={260} min={200} max={460}>
		<WikiSidebar />
	</Rail>

	<section class="main-section">
		{#if wikiState.viewMode === 'entry'}
			<WikiArticle />
		{:else if wikiState.viewMode === 'corpus'}
			<WikiCorpusEntry />
		{:else if wikiState.viewMode === 'compile'}
			<WikiCompilePanel />
		{:else if wikiState.viewMode === 'telemetry'}
			<WikiTelemetryView />
		{/if}
	</section>

	<Rail id="wiki-inspector" side="right" label="Entry inspector" initial={240} min={200} max={440}>
		<WikiInspector />
	</Rail>
</div>
