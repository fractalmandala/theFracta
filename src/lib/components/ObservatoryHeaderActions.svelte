<script lang="ts">
	import { observatory, type ObservatoryTab } from '$lib/observatory-state/observatory.svelte';
	import { Icon } from 'fractalicons';
	import { luRefreshCw, luDownload } from 'fractalicons/lucide';

	const tabs: Array<{ id: ObservatoryTab; label: string }> = [
		{ id: 'sessions', label: 'Sessions' },
		{ id: 'usage', label: 'Usage' },
		{ id: 'activity', label: 'Activity' },
		{ id: 'trends', label: 'Trends' },
		{ id: 'quality', label: 'Quality' },
		{ id: 'recalls', label: 'Recall' },
		{ id: 'pinned', label: 'Pinned' },
		{ id: 'recent_edits', label: 'Recent' },
		{ id: 'data', label: 'Data' }
	];
</script>

<div class="box gap-sm">
	<!-- Sub Navigation Tabs -->
	<nav class="box gap-3xs" aria-label="Observatory views">
		{#each tabs as tab}
			<button
				class="observatory-tab"
				class:observatory-tab-active={observatory.activeTab === tab.id}
				onclick={() => {
					observatory.activeTab = tab.id;
					observatory.clearSelectedSession();
				}}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	<span aria-hidden="true" class="separator"></span>

	<!-- Filters Strip -->
	<div class="box gap-2xs">
		<label class="box gap-3xs text-xs text-secondary" title="Time range">
			<span class="mono text-2xs">Range</span>
			<select
				class="select text-2xs pad-x-2xs pad-y-3xs mono"
				bind:value={observatory.timeRange}
				onchange={() => observatory.applyFilters()}
			>
				<option value="week">Last 7d</option>
				<option value="month">Last month</option>
				<option value="year">Last year</option>
			</select>
		</label>

		<label class="box gap-3xs text-xs text-secondary" title="Filter by project">
			<span class="mono text-2xs">Project</span>
			<select
				class="select text-2xs pad-x-2xs pad-y-3xs mono"
				bind:value={observatory.selectedProject}
				onchange={() => observatory.applyFilters()}
			>
				<option value="all">All</option>
				{#each observatory.availableProjects as project}
					<option value={project}>{project}</option>
				{/each}
			</select>
		</label>

		<label class="box gap-3xs text-xs text-secondary" title="Filter by agent">
			<span class="mono text-2xs">Agent</span>
			<select
				class="select text-2xs pad-x-2xs pad-y-3xs mono"
				bind:value={observatory.selectedAgent}
				onchange={() => observatory.applyFilters()}
			>
				<option value="all">All</option>
				{#each observatory.availableAgents as agent}
					<option value={agent}>{agent}</option>
				{/each}
			</select>
		</label>

		<label class="box gap-3xs text-2xs text-secondary" title="Filter by model">
			<span class="mono text-2xs">Model</span>
			<select
				class="select text-2xs pad-x-2xs pad-y-3xs mono"
				bind:value={observatory.selectedModel}
				onchange={() => observatory.applyFilters()}
			>
				<option value="all">All</option>
				{#each observatory.availableModels as model}
					<option value={model}>{model}</option>
				{/each}
			</select>
		</label>

		<button
			class="button is-icon"
			onclick={() => observatory.refresh()}
			disabled={observatory.loading}
			title="Refresh observatory data"
			aria-label="Refresh observatory data"
		>
			<Icon icon={luRefreshCw} size={14} />
		</button>

		<button
			class="button is-icon"
			onclick={() => observatory.exportSessionsCSV()}
			title="Export sessions to CSV"
			aria-label="Export sessions to CSV"
		>
			<Icon icon={luDownload} size={14} />
		</button>
	</div>

	{#if observatory.totalSessions > 0}
		<span class="badge text-2xs mono">{observatory.totalSessions} ses</span>
	{/if}
</div>
