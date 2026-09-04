<script lang="ts">
	import { wikiState } from '$lib/wiki/state';
	import WikiSidebar from './WikiSidebar.svelte';
	import WikiArticle from './WikiArticle.svelte';
	import WikiInspector from './WikiInspector.svelte';
	import WikiTelemetryView from './WikiTelemetryView.svelte';

	const viewMode = wikiState.viewMode;
</script>

<!--
  The app shell already provides .app-main; this module fills it rather than
  nesting a second one. Role-bound rails: .sidebar-left is nav, .sidebar-right
  is the inspector — the inspector was previously marked .sidebar-left, which
  put its border on the wrong edge and revealed it at the wrong breakpoint.
-->
<div class="row grow min0 hfull">
	<aside class="sidebar-left" aria-label="Wiki navigation">
		<WikiSidebar />
	</aside>

	<section class="main-section">
		{#if $viewMode === 'entry'}
			<WikiArticle />
		{:else if $viewMode === 'telemetry'}
			<WikiTelemetryView />
		{/if}
	</section>

	<aside class="sidebar-right" aria-label="Entry inspector">
		<WikiInspector />
	</aside>
</div>
