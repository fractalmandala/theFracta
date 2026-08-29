<script lang="ts">
	import { observatory, type ObservatoryTab } from '$lib/observatory-state/observatory.svelte';
	const tabs: Array<{ id: ObservatoryTab; label: string }> = [
		{ id: 'sessions', label: 'Sessions' }, { id: 'usage', label: 'Usage' }, { id: 'activity', label: 'Activity' }, { id: 'trends', label: 'Trends' }, { id: 'quality', label: 'Quality' }, { id: 'recalls', label: 'Recall' }, { id: 'pinned', label: 'Pinned' }, { id: 'recent_edits', label: 'Recent' }, { id: 'data', label: 'Data' }
	];
</script>

<header class="header-bar">
	<div class="header-top">
		<nav class="tab-bar" aria-label="Observatory views">
			{#each tabs as tab}
				<button class="tab-btn" class:active={observatory.activeTab === tab.id} onclick={() => { observatory.activeTab = tab.id; observatory.clearSelectedSession(); }}>
					<span class="tab-label">{tab.label}</span>
				</button>
			{/each}
		</nav>
		<div class="header-controls">
			{#if observatory.totalSessions > 0}
				<span class="session-count-badge">{observatory.totalSessions} SESSIONS</span>
			{/if}
		</div>
	</div>
	<div class="filters-row">
		<label>Range
			<select class="select-box" bind:value={observatory.timeRange} onchange={() => observatory.applyFilters()}>
				<option value="week">Last 7 local calendar days</option>
				<option value="month">Last local calendar month</option>
				<option value="year">Last local calendar year</option>
			</select>
		</label>
		<label>Project
			<select class="select-box" bind:value={observatory.selectedProject} onchange={() => observatory.applyFilters()}>
				<option value="all">All projects</option>
				{#each observatory.availableProjects as project}<option value={project}>{project}</option>{/each}
			</select>
		</label>
		<label>Agent
			<select class="select-box" bind:value={observatory.selectedAgent} onchange={() => observatory.applyFilters()}>
				<option value="all">All agents</option>
				{#each observatory.availableAgents as agent}<option value={agent}>{agent}</option>{/each}
			</select>
		</label>
		<label>Model
			<select class="select-box" bind:value={observatory.selectedModel} onchange={() => observatory.applyFilters()}>
				<option value="all">All models</option>
				{#each observatory.availableModels as model}<option value={model}>{model}</option>{/each}
			</select>
		</label>
		<label><input type="checkbox" bind:checked={observatory.includeAutomated} onchange={() => observatory.applyFilters()} /> Automated</label>
		<label><input type="checkbox" bind:checked={observatory.includeOneShot} onchange={() => observatory.applyFilters()} /> One-shot</label>
		<button class="filter-action" onclick={() => observatory.refresh()} disabled={observatory.loading}>Refresh</button>
		<button class="filter-action" onclick={() => observatory.exportSessionsCSV()}>Export filtered sessions</button>
	</div>
</header>
