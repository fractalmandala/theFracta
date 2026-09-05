<script lang="ts">
	/**
	 * How much of the token traffic was served from cache.
	 *
	 * Cache *reads* are replays; cache *writes* are fresh input paying a
	 * surcharge to be stored. They are kept apart because folding writes into
	 * "cached" would make a workload that only ever warms the cache look like
	 * one that benefits from it.
	 *
	 * The savings line is the service's own comparison against an uncached
	 * baseline, and it can come out negative — cache writes cost more than plain
	 * input. That case is stated rather than clamped to zero.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import { formatMoney, formatPercent, formatTokens } from './usageFormat';

	const stats = $derived(observatory.usage?.cacheStats ?? null);

	const rows = $derived.by(() => {
		if (!stats) return [];
		const total = stats.cacheReadTokens + stats.cacheCreationTokens + stats.uncachedInputTokens + stats.outputTokens;
		if (total === 0) return [];
		return [
			{ label: 'Cache reads', value: stats.cacheReadTokens, cls: 'series-3' },
			{ label: 'Cache writes', value: stats.cacheCreationTokens, cls: 'series-0' },
			{ label: 'Uncached input', value: stats.uncachedInputTokens, cls: 'series-2' },
			{ label: 'Output', value: stats.outputTokens, cls: 'series-1' }
		].map((row) => ({ ...row, pct: row.value / total }));
	});

	let host = $state<HTMLElement | undefined>();
	$effect(() => {
		if (!host) return;
		const widths = rows.map((row) => Math.max(row.pct * 100, 1));
		host.querySelectorAll<HTMLElement>('.usage-fill').forEach((element, index) => {
			element.style.setProperty('--bar-width', `${widths[index] ?? 0}%`);
		});
	});

	const savings = $derived(stats?.savingsVsUncached.microdollars ?? 0);
</script>

<section class="box gap-2xs pad-md border-bottom" aria-labelledby="usage-cache-title">
	<header class="row ycenter xbetween gap-sm">
		<h3 id="usage-cache-title" class="text-sm weight-600">Cache efficiency</h3>
		{#if stats}
			<span class="text-2xs text-muted tabular-nums shrink-0">{formatPercent(stats.hitRate)} hit rate</span>
		{/if}
	</header>

	{#if rows.length === 0}
		<p class="text-xs text-muted">No token data reported for this range.</p>
	{:else}
		<div bind:this={host} class="box gap-3xs">
			{#each rows as row (row.label)}
				<div class="usage-row {row.cls}">
					<span class="text-2xs text-muted tabular-nums">{(row.pct * 100).toFixed(0)}%</span>
					<i class="series-swatch"></i>
					<span class="box gap-3xs min0">
						<span class="truncate text-xs">{row.label}</span>
						<span class="usage-track"><i class="usage-fill"></i></span>
					</span>
					<span></span>
					<span class="text-xs tabular-nums">{formatTokens(row.value)}</span>
				</div>
			{/each}
		</div>

		{#if savings > 0}
			<p class="text-2xs text-muted">
				{formatMoney({ microdollars: savings })} saved against the same traffic uncached.
			</p>
		{:else if savings < 0}
			<p class="text-2xs text-muted">
				{formatMoney({ microdollars: Math.abs(savings) })} more than the same traffic uncached — cache writes
				outweighed the replays.
			</p>
		{/if}
	{/if}
</section>
