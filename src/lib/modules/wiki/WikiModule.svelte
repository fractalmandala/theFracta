<script lang="ts">
	import { wikiState } from '$lib/wiki/state';
	import Rail from '$lib/components/Rail.svelte';
	import WikiSidebar from './WikiSidebar.svelte';
	import WikiArticle from './WikiArticle.svelte';
	import WikiInspector from './WikiInspector.svelte';
	import WikiTelemetryView from './WikiTelemetryView.svelte';

	const viewMode = wikiState.viewMode;
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
		{#if $viewMode === 'entry'}
			<WikiArticle />
		{:else if $viewMode === 'telemetry'}
			<WikiTelemetryView />
		{/if}
	</section>

	<Rail id="wiki-inspector" side="right" label="Entry inspector" initial={240} min={200} max={440}>
		<WikiInspector />
	</Rail>
</div>
