<script lang="ts">
	/**
	 * Where the range's spend (or tokens) went.
	 *
	 * The same ranking twice over: a treemap, where relative area is read at a
	 * glance, and a list, where exact shares and long labels are readable. Both
	 * are the same rows in the same order, so switching view never changes what
	 * is being claimed.
	 *
	 * Clicking a row removes it from this panel and from the chart above, which
	 * is how a dominant project stops flattening everything behind it. Hidden
	 * rows are named and restorable — a chart that silently omits rows is a
	 * different chart, not a filtered one.
	 */
	import { observatory, type UsageGroupBy } from '$lib/observatory-state/observatory.svelte';
	import Treemap, { type Tile } from './Treemap.svelte';
	import { formatMoney, formatTokens } from './usageFormat';
	import { rankedSeries, seriesClass, totalsFor, withOther } from './usageSeries';

	const TOP = 12;

	const usage = $derived(observatory.usage);
	const isTokenMode = $derived(observatory.usageMode === 'token');
	const groupBy = $derived(observatory.usageAttributionGroupBy);
	const view = $derived(observatory.usageAttributionView);
	const hidden = $derived(observatory.usageHidden[groupBy]);
	const format = $derived(isTokenMode ? formatTokens : (value: number) => formatMoney({ microdollars: value }));

	const series = $derived.by(() => {
		if (!usage) return { kept: [], other: null };
		return withOther(rankedSeries(usage, groupBy, observatory.usageMode, observatory.usageTokenTypes, hidden), TOP);
	});

	const rows = $derived([...series.kept, ...(series.other ? [series.other] : [])]);
	const total = $derived(rows.reduce((sum, row) => sum + row.value, 0));

	/**
	 * The rolled-up band is not clickable: it stands for many rows, so hiding it
	 * would be an action with no single subject to undo.
	 */
	const tiles = $derived<Tile[]>(
		rows.map((row, index) => ({
			id: row.id,
			label: row.label,
			value: row.value,
			cls: seriesClass(row.id, index),
			note: total > 0 ? `${((row.value / total) * 100).toFixed(1)}%` : undefined
		}))
	);

	/** Hidden rows, named so they can be put back. */
	const hiddenRows = $derived.by(() => {
		if (!usage) return [];
		return totalsFor(usage, groupBy)
			.filter((row) => hidden.includes(row.id))
			.map((row) => ({ id: row.id, label: row.label || 'Unattributed' }));
	});

	let host = $state<HTMLElement | undefined>();
	$effect(() => {
		if (!host) return;
		const widths = rows.map((row) => (total > 0 ? Math.max(1, (row.value / total) * 100) : 0));
		host.querySelectorAll<HTMLElement>('.usage-fill').forEach((element, index) => {
			element.style.setProperty('--bar-width', `${widths[index] ?? 0}%`);
		});
	});

	const groupings: Array<[UsageGroupBy, string]> = [
		['project', 'Project'],
		['model', 'Model'],
		['agent', 'Agent']
	];

	function hide(id: string) {
		if (id === '__other__') return;
		observatory.toggleUsageHidden(groupBy, id);
	}
</script>

<section class="box gap-2xs pad-md border-bottom" aria-labelledby="usage-attribution-title">
	<header class="row ycenter xbetween gap-sm wrap">
		<h3 id="usage-attribution-title" class="text-sm weight-600">
			{isTokenMode ? 'Token attribution' : 'Cost attribution'}
		</h3>
		<div class="row ycenter gap-xs shrink-0">
			<div class="segmented" role="group" aria-label="Group attribution by">
				{#each groupings as [id, label] (id)}
					<button
						class="segmented-item"
						class:active={groupBy === id}
						onclick={() => (observatory.usageAttributionGroupBy = id)}>{label}</button
					>
				{/each}
			</div>
			<div class="segmented" role="group" aria-label="Attribution view">
				<button
					class="segmented-item"
					class:active={view === 'treemap'}
					onclick={() => (observatory.usageAttributionView = 'treemap')}>Treemap</button
				>
				<button
					class="segmented-item"
					class:active={view === 'list'}
					onclick={() => (observatory.usageAttributionView = 'list')}>List</button
				>
			</div>
		</div>
	</header>

	{#if rows.length === 0}
		<p class="text-xs text-muted">
			{hidden.length > 0 ? 'Every row in this dimension is hidden.' : 'No usage reported for this range.'}
		</p>
	{:else}
		<p class="text-2xs text-muted">Click a row to hide it from this panel and the chart above.</p>

		{#if view === 'treemap'}
			<Treemap items={tiles} onSelect={hide} formatValue={format} />
		{/if}

		<div bind:this={host} class="box gap-3xs">
			{#each rows as row, index (row.id)}
				<button
					class="usage-row {seriesClass(row.id, index)}"
					aria-disabled={row.id === '__other__' ? 'true' : undefined}
					title={row.id === '__other__' ? 'A roll-up of the remaining rows' : `Hide ${row.label}`}
					onclick={() => hide(row.id)}
				>
					<span class="text-2xs text-muted tabular-nums">{index + 1}</span>
					<i class="series-swatch"></i>
					{#if view === 'treemap'}
						<span class="truncate text-xs">{row.label}</span>
					{:else}
						<span class="box gap-3xs min0">
							<span class="truncate text-xs">{row.label}</span>
							<span class="usage-track"><i class="usage-fill"></i></span>
						</span>
					{/if}
					<span class="text-2xs text-muted tabular-nums">
						{total > 0 ? `${((row.value / total) * 100).toFixed(1)}%` : '—'}
					</span>
					<span class="text-xs tabular-nums">{format(row.value)}</span>
				</button>
			{/each}
		</div>

		{#if hiddenRows.length > 0}
			<div class="row ycenter gap-2xs wrap text-2xs text-muted">
				<span>Hidden:</span>
				{#each hiddenRows as row (row.id)}
					<button class="button small ghost text-2xs" onclick={() => observatory.toggleUsageHidden(groupBy, row.id)}>
						{row.label} ✕
					</button>
				{/each}
				<button class="button small ghost text-2xs" onclick={() => observatory.clearUsageHidden(groupBy)}>Show all</button>
			</div>
		{/if}
	{/if}
</section>
