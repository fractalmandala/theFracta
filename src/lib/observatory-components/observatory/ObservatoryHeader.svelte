<script lang="ts">
	import { observatory, type ObservatoryTab } from '$lib/observatory-state/observatory.svelte';
	import type { Money } from '$lib/observatory-fractorches';

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

	// Every figure here is read from the Fractorches response. When a response
	// has not arrived the tile shows an em dash rather than a zero, so an
	// unloaded dashboard is never mistaken for an empty one.
	const summary = $derived(observatory.overview);
	const totals = $derived(observatory.resources?.usage?.totals ?? null);

	const compact = (n: number | undefined) =>
		n === undefined ? '—' : new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
	const plain = (n: number | undefined) =>
		n === undefined ? '—' : new Intl.NumberFormat().format(n);
	// Fractorches reports cost in microdollars. No cost is inferred here: an
	// absent total renders as an em dash, never as $0.00.
	const money = (m: Money | undefined) =>
		m === undefined ? '—' : `$${(m.microdollars / 1_000_000).toFixed(2)}`;
</script>

<!--
  The Observatory's entire chrome: one toolbar row, then the summary strip.
  Filters are controls in the toolbar rather than a standing column, because
  every pixel of width belongs to the dashboards below.
-->
<header class="observatory-header">
	<div class="row ycenter gap-xs pad-x-sm">
		<nav class="row ycenter grow min0 scroll-x" aria-label="Observatory views">
			{#each tabs as tab}
				<button
					class="observatory-tab"
					class:observatory-tab-active={observatory.activeTab === tab.id}
					aria-current={observatory.activeTab === tab.id ? 'page' : undefined}
					onclick={() => {
						observatory.activeTab = tab.id;
						observatory.clearSelectedSession();
					}}
				>
					{tab.label}
				</button>
			{/each}
		</nav>

		<label class="row ycenter gap-3xs text-xs text-muted shrink-0" title="Time range">
			<span>Range</span>
			<select class="select text-xs mono" bind:value={observatory.timeRange} onchange={() => observatory.applyFilters()}>
				<option value="week">7d</option>
				<option value="month">30d</option>
				<option value="year">1y</option>
			</select>
		</label>
		<label class="row ycenter gap-3xs text-xs text-muted shrink-0" title="Filter by project">
			<span>Project</span>
			<select class="select text-xs mono" bind:value={observatory.selectedProject} onchange={() => observatory.applyFilters()}>
				<option value="all">all</option>
				{#each observatory.availableProjects as project}<option value={project}>{project}</option>{/each}
			</select>
		</label>
		<label class="row ycenter gap-3xs text-xs text-muted shrink-0" title="Filter by model">
			<span>Model</span>
			<select class="select text-xs mono" bind:value={observatory.selectedModel} onchange={() => observatory.applyFilters()}>
				<option value="all">all</option>
				{#each observatory.availableModels as model}<option value={model}>{model}</option>{/each}
			</select>
		</label>

		<button
			class="button small ghost shrink-0"
			class:observatory-tab-active={observatory.filterPanelOpen}
			onclick={() => (observatory.filterPanelOpen = !observatory.filterPanelOpen)}
		>More filters</button>
		<button class="button small ghost shrink-0" onclick={() => observatory.refresh()} disabled={observatory.loading}>
			{observatory.loading ? 'Refreshing…' : 'Refresh'}
		</button>
		<button class="button small ghost shrink-0" onclick={() => observatory.exportSessionsCSV()}>Export</button>
	</div>

	<div class="metrics-grid">
		<div class="metric-tile">
			<div class="metric-tile-num">{plain(summary?.total_sessions)}</div>
			<div class="metric-tile-lbl">Sessions</div>
		</div>
		<div class="metric-tile">
			<div class="metric-tile-num">{compact(summary?.total_messages)}</div>
			<div class="metric-tile-lbl">Messages</div>
		</div>
		<div class="metric-tile">
			<div class="metric-tile-num">{compact(summary?.total_output_tokens)}</div>
			<div class="metric-tile-lbl">Output tokens</div>
		</div>
		<div class="metric-tile">
			<div class="metric-tile-num">{money(totals?.totalCost)}</div>
			<div class="metric-tile-lbl">Spend</div>
		</div>
		<div class="metric-tile">
			<div class="metric-tile-num">{plain(summary?.active_projects)}</div>
			<div class="metric-tile-lbl">Projects</div>
		</div>
	</div>
</header>
