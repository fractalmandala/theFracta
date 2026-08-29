<script lang="ts">
	import { observatory, type ObservatoryTab } from '$lib/observatory-state/observatory.svelte';

	const tabs: Array<{ id: ObservatoryTab; label: string }> = [
		{ id: 'sessions', label: 'Sessions' },
		{ id: 'usage', label: 'Usage' },
		{ id: 'activity', label: 'Activity' },
		{ id: 'trends', label: 'Trends' },
		{ id: 'quality', label: 'Quality' },
		{ id: 'recalls', label: 'Recall' },
		{ id: 'pinned', label: 'Pinned' },
		{ id: 'recent_edits', label: 'Recent' },
		{ id: 'data', label: 'Data' },
	];
</script>

<header class="observatory-header sticky surface-blur border-bottom">
	<!-- Top: tab strip + total count -->
	<div class="row ycenter xbetween pad-x-sm pad-y-2xs">
		<nav class="row ycenter gap-3xs" aria-label="Observatory views">
			{#each tabs as tab}
				<button
					class="observatory-tab"
					class:observatory-tab-active={observatory.activeTab === tab.id}
					onclick={() => { observatory.activeTab = tab.id; observatory.clearSelectedSession(); }}
				>
					{tab.label}
				</button>
			{/each}
		</nav>
		<div class="row ycenter gap-2xs">
			{#if observatory.totalSessions > 0}
				<span class="badge text-xs">{observatory.totalSessions} sessions</span>
			{/if}
		</div>
	</div>

	<!-- Filters row -->
	<div class="row wrap ycenter gap-xs pad-x-sm pad-y-2xs border-top">
		<label class="row ycenter gap-2xs text-sm text-secondary">
			<span>Range</span>
			<select class="select text-xs" bind:value={observatory.timeRange} onchange={() => observatory.applyFilters()}>
				<option value="week">Last 7 days</option>
				<option value="month">Last month</option>
				<option value="year">Last year</option>
			</select>
		</label>
		<label class="row ycenter gap-2xs text-sm text-secondary">
			<span>Project</span>
			<select class="select text-xs" bind:value={observatory.selectedProject} onchange={() => observatory.applyFilters()}>
				<option value="all">All projects</option>
				{#each observatory.availableProjects as project}<option value={project}>{project}</option>{/each}
			</select>
		</label>
		<label class="row ycenter gap-2xs text-sm text-secondary">
			<span>Agent</span>
			<select class="select text-xs" bind:value={observatory.selectedAgent} onchange={() => observatory.applyFilters()}>
				<option value="all">All agents</option>
				{#each observatory.availableAgents as agent}<option value={agent}>{agent}</option>{/each}
			</select>
		</label>
		<label class="row ycenter gap-2xs text-sm text-secondary">
			<span>Model</span>
			<select class="select text-xs" bind:value={observatory.selectedModel} onchange={() => observatory.applyFilters()}>
				<option value="all">All models</option>
				{#each observatory.availableModels as model}<option value={model}>{model}</option>{/each}
			</select>
		</label>
		<span aria-hidden="true" class="grow"></span>
		<label class="row ycenter gap-2xs text-xs text-secondary cursor-pointer">
			<input type="checkbox" bind:checked={observatory.includeAutomated} onchange={() => observatory.applyFilters()} />
			<span>Automated</span>
		</label>
		<label class="row ycenter gap-2xs text-xs text-secondary cursor-pointer">
			<input type="checkbox" bind:checked={observatory.includeOneShot} onchange={() => observatory.applyFilters()} />
			<span>One-shot</span>
		</label>
		<button class="button ghost text-xs" onclick={() => observatory.refresh()} disabled={observatory.loading}>Refresh</button>
		<button class="button ghost text-xs" onclick={() => observatory.exportSessionsCSV()}>Export CSV</button>
	</div>
</header>
