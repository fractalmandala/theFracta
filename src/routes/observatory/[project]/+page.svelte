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
		if (projectSlug) {
			projectsState.loadScan(projectSlug, 'layout');
		}
	});
</script>

<div class="project-view-shell">
	<Sidebar />

	<div class="canvas-area">
		{#if projectsState.isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<span>Loading project scan...</span>
			</div>
		{:else if projectsState.error}
			<div class="error-state">
				<h3>Scan not found</h3>
				<p>{projectsState.error}</p>
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

<style>
	.project-view-shell {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	.canvas-area {
		flex: 1;
		height: 100%;
		position: relative;
		overflow: hidden;
		background: var(--bg);
	}
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 12px;
		color: var(--text-muted);
	}
	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
