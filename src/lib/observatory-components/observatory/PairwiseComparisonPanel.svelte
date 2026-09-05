<script lang="ts">
	/**
	 * Two slices of usage, side by side.
	 *
	 * Both sides and every delta come from the service. Computing the deltas
	 * here would give the panel a second definition of "cost per session" that
	 * could drift from the one the rest of the surface uses.
	 *
	 * A ratio against a zero baseline has no value, so those cells are em dashes
	 * rather than 0% or ∞% — both of which would be claims the data cannot make.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import type { PairwiseDimension } from '$lib/observatory-fractorches';
	import { formatMoney, formatRatio, formatSignedMoney, formatSignedTokens, formatTokens } from './usageFormat';

	const usage = $derived(observatory.usage);
	const isTokenMode = $derived(observatory.usageMode === 'token');
	const comparison = $derived(observatory.pairwise);

	/** Options are addressed the way the service addresses them: keys, not labels. */
	const optionsFor = (dimension: PairwiseDimension) =>
		(dimension === 'project' ? (usage?.projectTotals ?? []) : (usage?.modelTotals ?? []))
			.filter((row) => row.id)
			.map((row) => ({ id: row.id, label: row.label || row.id }));

	const leftOptions = $derived(optionsFor(observatory.pairwiseLeft.dimension));
	const rightOptions = $derived(optionsFor(observatory.pairwiseRight.dimension));

	const labelFor = (dimension: PairwiseDimension, id: string) =>
		optionsFor(dimension).find((option) => option.id === id)?.label ?? id;

	type Row = { label: string; left: string; right: string; delta: string; ratio: string };

	const maybeTokens = (value: number | null) => (value === null ? '—' : formatTokens(value));

	const rows = $derived.by<Row[]>(() => {
		if (!comparison) return [];
		const { left, right, deltas } = comparison;

		if (isTokenMode) {
			const leftTokens = observatory.sumTokens(left);
			const rightTokens = observatory.sumTokens(right);
			const leftPer = left.sessionCount > 0 ? leftTokens / left.sessionCount : null;
			const rightPer = right.sessionCount > 0 ? rightTokens / right.sessionCount : null;
			const perDelta = leftPer === null || rightPer === null ? null : rightPer - leftPer;
			return [
				{
					label: 'Selected tokens',
					left: formatTokens(leftTokens),
					right: formatTokens(rightTokens),
					delta: formatSignedTokens(rightTokens - leftTokens),
					ratio: formatRatio(leftTokens === 0 ? null : (rightTokens - leftTokens) / leftTokens)
				},
				{
					label: 'Sessions',
					left: left.sessionCount.toLocaleString(),
					right: right.sessionCount.toLocaleString(),
					delta: `${deltas.sessionCountDelta >= 0 ? '+' : ''}${deltas.sessionCountDelta.toLocaleString()}`,
					ratio: formatRatio(deltas.sessionCountDeltaRatio)
				},
				{
					label: 'Tokens / session',
					left: maybeTokens(leftPer),
					right: maybeTokens(rightPer),
					delta: perDelta === null ? '—' : formatSignedTokens(perDelta),
					ratio: formatRatio(leftPer === null || leftPer === 0 || perDelta === null ? null : perDelta / leftPer)
				},
				{
					label: 'Input tokens',
					left: formatTokens(left.inputTokens),
					right: formatTokens(right.inputTokens),
					delta: formatSignedTokens(deltas.inputTokensDelta),
					ratio: formatRatio(deltas.inputTokensDeltaRatio)
				},
				{
					label: 'Output tokens',
					left: formatTokens(left.outputTokens),
					right: formatTokens(right.outputTokens),
					delta: formatSignedTokens(deltas.outputTokensDelta),
					ratio: formatRatio(deltas.outputTokensDeltaRatio)
				}
			];
		}

		return [
			{
				label: 'Total cost',
				left: formatMoney(left.totalCost),
				right: formatMoney(right.totalCost),
				delta: formatSignedMoney(deltas.totalCostDelta),
				ratio: formatRatio(deltas.totalCostDeltaRatio)
			},
			{
				label: 'Sessions',
				left: left.sessionCount.toLocaleString(),
				right: right.sessionCount.toLocaleString(),
				delta: `${deltas.sessionCountDelta >= 0 ? '+' : ''}${deltas.sessionCountDelta.toLocaleString()}`,
				ratio: formatRatio(deltas.sessionCountDeltaRatio)
			},
			{
				label: 'Cost / session',
				left: formatMoney(left.costPerSession),
				right: formatMoney(right.costPerSession),
				delta: formatSignedMoney(deltas.costPerSessionDelta),
				ratio: formatRatio(deltas.costPerSessionRatio)
			},
			{
				label: 'Total tokens',
				left: formatTokens(left.totalTokens),
				right: formatTokens(right.totalTokens),
				delta: formatSignedTokens(deltas.totalTokensDelta),
				ratio: formatRatio(deltas.totalTokensDeltaRatio)
			},
			{
				label: 'Tokens / session',
				left: formatTokens(left.tokensPerSession),
				right: formatTokens(right.tokensPerSession),
				delta: formatSignedTokens(deltas.tokensPerSessionDelta),
				ratio: formatRatio(deltas.tokensPerSessionRatio)
			},
			{
				label: 'Cache reads',
				left: formatTokens(left.cacheReadTokens),
				right: formatTokens(right.cacheReadTokens),
				delta: formatSignedTokens(deltas.cacheReadDelta),
				ratio: formatRatio(deltas.cacheReadDeltaRatio)
			},
			{
				label: 'Cache writes',
				left: formatTokens(left.cacheCreationTokens),
				right: formatTokens(right.cacheCreationTokens),
				delta: formatSignedTokens(deltas.cacheCreationDelta),
				ratio: formatRatio(deltas.cacheCreationDeltaRatio)
			}
		];
	});

	const dimensions: Array<[PairwiseDimension, string]> = [
		['model', 'Model'],
		['project', 'Project']
	];
</script>

<section class="box gap-2xs pad-md" aria-labelledby="usage-pairwise-title">
	<header class="box gap-3xs">
		<h3 id="usage-pairwise-title" class="text-sm weight-600">Compare two slices</h3>
		<p class="text-2xs text-muted">
			Both sides are read under the filters above, so this compares like with like within the current range.
		</p>
	</header>

	<div class="grid grid-2 gap-md">
		{#each [{ side: 'left', selection: observatory.pairwiseLeft, options: leftOptions, title: 'Left' }, { side: 'right', selection: observatory.pairwiseRight, options: rightOptions, title: 'Right' }] as pane (pane.side)}
			<div class="card border pad-sm box gap-2xs">
				<span class="text-2xs weight-500 text-muted tt-u">{pane.title}</span>
				<div class="row ycenter gap-2xs">
					<select
						class="select select-compact text-xs"
						aria-label="{pane.title} dimension"
						value={pane.selection.dimension}
						onchange={(event) =>
							observatory.setPairwiseSide(pane.side as 'left' | 'right', {
								dimension: event.currentTarget.value as PairwiseDimension
							})}
					>
						{#each dimensions as [id, label] (id)}<option value={id}>{label}</option>{/each}
					</select>
					<select
						class="select select-compact text-xs grow min0"
						aria-label="{pane.title} value"
						value={pane.selection.value}
						disabled={pane.options.length === 0}
						onchange={(event) =>
							observatory.setPairwiseSide(pane.side as 'left' | 'right', { value: event.currentTarget.value })}
					>
						<option value="">Select…</option>
						{#each pane.options as option (option.id)}<option value={option.id}>{option.label}</option>{/each}
					</select>
				</div>
			</div>
		{/each}
	</div>

	{#if observatory.pairwiseError}
		<div class="card border error-card row ycenter gap-sm pad-sm" role="alert">
			<span class="text-xs mono text-muted grow min0">{observatory.pairwiseError}</span>
			<button class="button small ghost" onclick={() => observatory.loadPairwise()}>Retry</button>
		</div>
	{:else if !observatory.pairwiseLeft.value || !observatory.pairwiseRight.value}
		<p class="text-xs text-muted">Pick a value on each side to compare them.</p>
	{:else if observatory.pairwiseLoading && rows.length === 0}
		<p class="text-xs text-muted">Comparing…</p>
	{:else if rows.length > 0}
		<div class="scroll-x">
			<table class="table-clean text-xs">
				<thead>
					<tr>
						<th class="ta-l">Metric</th>
						<th class="ta-r">{labelFor(observatory.pairwiseLeft.dimension, observatory.pairwiseLeft.value)}</th>
						<th class="ta-r">{labelFor(observatory.pairwiseRight.dimension, observatory.pairwiseRight.value)}</th>
						<th class="ta-r">Difference</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.label)}
						<tr>
							<td>{row.label}</td>
							<td class="ta-r tabular-nums">{row.left}</td>
							<td class="ta-r tabular-nums">{row.right}</td>
							<td class="ta-r tabular-nums">
								{row.delta}
								<span class="text-2xs text-muted">{row.ratio}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
