<script lang="ts">
	import { page } from '$app/state';
	import { projectsState } from '$lib/observatory-state/projects.svelte';
	import Sidebar from '$lib/observatory-components/shell/Sidebar.svelte';
	import GraphCanvas from '$lib/observatory-components/graph/GraphCanvas.svelte';
	import TreemapCanvas from '$lib/observatory-components/graph/TreemapCanvas.svelte';
	import FlowPlayer from '$lib/observatory-components/graph/FlowPlayer.svelte';
	import NodeInspector from '$lib/observatory-components/graph/NodeInspector.svelte';

	const projectSlug = $derived(page.params.project);
	const scanType = $derived((page.params.scan || 'layout') as 'layout' | 'system' | 'boundary' | 'health');

	$effect(() => {
		if (projectSlug && scanType) projectsState.loadScan(projectSlug, scanType);
	});
</script>

<div class="observatory-project row grow min0 wfull">
	<Sidebar />
	<div class="observatory-canvas grow min0">
		{#if projectsState.isLoading}
			<div class="box ycenter xcenter gap-sm pad-2xl">
				<div class="spinner" aria-hidden="true"></div>
				<span class="text-muted">Loading {scanType} scan…</span>
			</div>
		{:else if projectsState.error}
			<div class="box ycenter xcenter gap-sm pad-2xl text-danger">
				<h3 class="text-md weight-600 m-0">Scan not found</h3>
				<p class="text-sm text-muted m-0">{projectsState.error}</p>
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
