<script lang="ts">
	/**
	 * What the range cost, and what it consumed.
	 *
	 * The same rows read two ways. In cost mode the headline is spend; in token
	 * mode it is whichever token types are selected, and the tiles that have no
	 * token analogue (spend, credits) drop out rather than being restated in a
	 * unit they do not have.
	 *
	 * Daily burn and peak day are averaged over the days the service returned,
	 * not over the calendar range: a range with gaps has fewer days of data than
	 * days, and dividing by the wrong denominator would understate the burn.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import { divideMoney, formatMoney, formatPercent, formatTokens, ZERO_MONEY } from './usageFormat';

	const usage = $derived(observatory.usage);
	const isTokenMode = $derived(observatory.usageMode === 'token');
	const daily = $derived(usage?.daily ?? []);

	const dayTokens = (day: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number }) =>
		observatory.sumTokens(day);

	const dailyBurnCost = $derived(daily.length === 0 ? ZERO_MONEY : divideMoney(usage?.totals.totalCost ?? ZERO_MONEY, daily.length));
	const dailyBurnTokens = $derived(daily.length === 0 ? 0 : daily.reduce((sum, day) => sum + dayTokens(day), 0) / daily.length);

	const peakCost = $derived.by(() => {
		if (daily.length === 0) return null;
		return daily.reduce((best, day) => (day.totalCost.microdollars > best.totalCost.microdollars ? day : best));
	});
	const peakTokens = $derived.by(() => {
		if (daily.length === 0) return null;
		return daily.reduce((best, day) => (dayTokens(day) > dayTokens(best) ? day : best));
	});

	const activeDays = $derived(
		daily.filter((day) => (isTokenMode ? dayTokens(day) > 0 : day.totalCost.microdollars > 0)).length
	);

	/** Which token types the headline tile is summing, said plainly. */
	const tokenLabel = $derived.by(() => {
		const types = observatory.usageTokenTypes;
		if (types.length === 4) return 'Total tokens';
		if (types.length > 1) return `Selected tokens (${types.length})`;
		return { input: 'Input tokens', output: 'Output tokens', cache_read: 'Cache reads', cache_write: 'Cache writes' }[types[0]];
	});

	/**
	 * The change against the prior period the service picked.
	 *
	 * A prior period with no spend has no percentage to state: the service
	 * returns a delta of 0, which would render as "+0% vs …" and read as
	 * "unchanged" when the truth is that there is nothing to compare against.
	 * That case says so instead.
	 */
	const vsPrior = $derived.by(() => {
		const comparison = usage?.comparison;
		if (!comparison) return '';
		const window = `${comparison.priorFrom} – ${comparison.priorTo}`;
		if (comparison.priorTotalCost.microdollars === 0) return `no spend in ${window}`;
		const pct = comparison.deltaPct * 100;
		return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% vs ${window}`;
	});

	type Tile = { label: string; value: string; sub?: string };

	const tiles = $derived.by<Tile[]>(() => {
		if (!usage) return [];
		const totals = usage.totals;
		const cached = totals.cacheReadTokens;
		const tail: Tile[] = [
			{ label: 'Cache hit', value: formatPercent(usage.cacheStats.hitRate) },
			{ label: 'Projects', value: String(Object.keys(usage.sessionCounts.byProject).length) },
			{ label: 'Models', value: String(usage.modelTotals.length) },
			{ label: 'Active days', value: String(activeDays) }
		];
		const inputTile: Tile = {
			label: 'Input tokens',
			value: formatTokens(totals.inputTokens),
			sub: cached > 0 ? `+${formatTokens(cached)} from cache` : undefined
		};
		const outputTile: Tile = { label: 'Output tokens', value: formatTokens(totals.outputTokens) };

		if (isTokenMode) {
			// Narrowed to a single type, the headline already *is* that type's
			// total; repeating it as its own tile would state the same number
			// twice under two names.
			const only = observatory.usageTokenTypes.length === 1 ? observatory.usageTokenTypes[0] : null;
			return [
				{ label: tokenLabel, value: formatTokens(observatory.sumTokens(totals)) },
				...(only === 'input' ? [] : [inputTile]),
				...(only === 'output' ? [] : [outputTile]),
				{ label: 'Daily burn', value: formatTokens(dailyBurnTokens), sub: 'avg / day' },
				{ label: 'Peak day', value: peakTokens ? formatTokens(dayTokens(peakTokens)) : '—', sub: peakTokens?.date },
				...tail
			];
		}

		return [
			{ label: 'Total cost', value: formatMoney(totals.totalCost), sub: vsPrior || undefined },
			// Copilot is the only provider that reports credits; the tile is
			// absent rather than zero for every other one.
			...(totals.copilotAICredits > 0 ? [{ label: 'Copilot AI credits', value: totals.copilotAICredits.toFixed(0) }] : []),
			inputTile,
			outputTile,
			{ label: 'Daily burn', value: formatMoney(dailyBurnCost), sub: 'avg / day' },
			{ label: 'Peak day', value: peakCost ? formatMoney(peakCost.totalCost) : '—', sub: peakCost?.date },
			...tail
		];
	});
</script>

<!--
  No heading: the view's own header already names the measure, and a second
  "Cost" directly beneath the first reads as two different things.
-->
<section class="box gap-2xs pad-md border-bottom" aria-label="Usage totals">
	{#if !usage}
		<p class="text-xs text-muted">Usage is unavailable for this range.</p>
	{:else}
		{#if usage.pricing.fallbackUsed}
			<!--
			  Every cost below is only as good as the price it was computed from.
			  Models the pricing table had no row for were priced from a default,
			  so they are named rather than folded silently into the total.
			-->
			<p class="text-2xs text-muted">
				{usage.pricing.fallbackModels.length} model{usage.pricing.fallbackModels.length === 1 ? '' : 's'}
				priced from a fallback rate rather than a published one:
				{usage.pricing.fallbackModels.slice(0, 4).join(', ')}{usage.pricing.fallbackModels.length > 4
					? ` and ${usage.pricing.fallbackModels.length - 4} more`
					: ''}.
			</p>
		{/if}

		<dl class="card-grid">
			{#each tiles as tile, index (index)}
				<div class="card border pad-sm box gap-3xs">
					<dt class="text-2xs weight-500 text-muted tt-u">{tile.label}</dt>
					<dd class="text-md weight-600 tabular-nums">
						{tile.value}
						{#if tile.sub}<span class="text-2xs text-muted weight-400">{tile.sub}</span>{/if}
					</dd>
				</div>
			{/each}
		</dl>
	{/if}
</section>
