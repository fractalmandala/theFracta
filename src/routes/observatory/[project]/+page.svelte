<script lang="ts">
	import { page } from '$app/state';
	import { projectsState } from '$lib/observatory-state/projects.svelte';
	import Sidebar from '$lib/observatory-components/shell/Sidebar.svelte';
	import GraphCanvas from '$lib/observatory-components/graph/GraphCanvas.svelte';
	import TreemapCanvas from '$lib/observatory-components/graph/TreemapCanvas.svelte';
	import FlowPlayer from '$lib/observatory-components/graph/FlowPlayer.svelte';
	import NodeInspector from '$lib/observatory-components/graph/NodeInspector.svelte';

	const projectSlug = $derived(page.params.project);

	$effect(() => {
		if (projectSlug) projectsState.loadScan(projectSlug, 'layout');
	});
</script>

<!--
  Page type: project shell with persistent sidebar nav (Sidebar component)
  and a main canvas area that hosts the graph/treemap/flow/inspector.
-->
<div class="text-muted text-xs row grow min0 wfull">
	<Sidebar />
	<div class="box gap-sm pad-sm scroll-y grow min0">
		{#if projectsState.isLoading}
			<div class="box ycenter xcenter gap-sm pad-2xl">
				<div class="spinner" aria-hidden="true"></div>
				<span class="text-muted">Loading project scan…</span>
			</div>
		{:else if projectsState.error}
			<div class="box ycenter xcenter gap-sm pad-2xl text-danger">
				<h3 class="text-md weight-600">Scan not found</h3>
				<p class="text-sm text-muted">{projectsState.error}</p>
			</div>
		{:else if projectsState.activeScan}
			{#if projectsState.activeScan.scan === 'health'}
				<TreemapCanvas scan={projectsState.activeScan} />
			{:else}
				<GraphCanvas scan={projectsState.activeScan} />
				<FlowPlayer flows={projectsState.activeScan.flows ?? []} />
			{/if}
			<NodeInspector />
		{/if}
	</div>
</div>
