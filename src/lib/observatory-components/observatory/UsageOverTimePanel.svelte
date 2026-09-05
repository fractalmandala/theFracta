<script lang="ts">
	/**
	 * Spend (or tokens) per day, stacked by project, model or agent.
	 *
	 * Stacked rather than overlaid because the question is where a day's total
	 * went, not how two series compare in isolation — the stack height is the
	 * day's total, which is the figure the tiles above report.
	 *
	 * The series are chosen from whole-range totals, not per day. Picking the
	 * top eight of each day separately would make a band mean a different thing
	 * from one column to the next.
	 */
	import { observatory, type UsageGroupBy } from '$lib/observatory-state/observatory.svelte';
	import { formatMoney, formatTokens } from './usageFormat';
	import { OTHER_ID, dailyBreakdown, measure, rankedSeries, seriesClass, withOther } from './usageSeries';

	const TOP = 8;
	const PLOT_H = 180;
	const AXIS_W = 46;
	const LABEL_H = 20;

	const usage = $derived(observatory.usage);
	const isTokenMode = $derived(observatory.usageMode === 'token');
	const groupBy = $derived(observatory.usageTimeSeriesGroupBy);
	const format = $derived(isTokenMode ? formatTokens : (value: number) => formatMoney({ microdollars: value }));

	const series = $derived.by(() => {
		if (!usage) return { kept: [], other: null };
		return withOther(
			rankedSeries(usage, groupBy, observatory.usageMode, observatory.usageTokenTypes, observatory.usageHidden[groupBy]),
			TOP
		);
	});

	/** Every band that gets drawn, in stacking order: largest at the bottom. */
	const bands = $derived([...series.kept, ...(series.other ? [series.other] : [])]);

	/** One column per day, each carrying a value for every band. */
	const columns = $derived.by(() => {
		if (!usage) return [];
		const keptIds = new Set(series.kept.map((row) => row.id));
		const hidden = observatory.usageHidden[groupBy];
		return usage.daily.map((day) => {
			const values = new Map<string, number>(bands.map((band) => [band.id, 0]));
			for (const row of dailyBreakdown(day, groupBy)) {
				if (hidden.includes(row.id)) continue;
				const key = keptIds.has(row.id) ? row.id : OTHER_ID;
				if (!values.has(key)) continue;
				values.set(key, (values.get(key) ?? 0) + measure(row, observatory.usageMode, observatory.usageTokenTypes));
			}
			const total = [...values.values()].reduce((sum, value) => sum + value, 0);
			return { date: day.date, values, total };
		});
	});

	const peak = $derived(Math.max(1, ...columns.map((column) => column.total)));
	const plotWidth = $derived(Math.max(320, columns.length * 12));

	const x = (index: number) =>
		AXIS_W + (columns.length <= 1 ? plotWidth / 2 : (index / (columns.length - 1)) * plotWidth);
	const y = (value: number) => PLOT_H - (value / peak) * PLOT_H;

	/**
	 * One filled path per band, each drawn between its own running baseline and
	 * the one below it — an explicit stack rather than overlapping opacities,
	 * which would make a band's colour depend on what sits under it.
	 */
	const paths = $derived.by(() => {
		if (columns.length === 0) return [];
		const baseline = columns.map(() => 0);
		return bands.map((band, index) => {
			const upper = columns.map((column, dayIndex) => baseline[dayIndex] + (column.values.get(band.id) ?? 0));
			const top = upper.map((value, dayIndex) => `${dayIndex === 0 ? 'M' : 'L'}${x(dayIndex).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
			const bottom = baseline
				.map((value, dayIndex) => `L${x(baseline.length - 1 - dayIndex).toFixed(1)},${y(baseline[baseline.length - 1 - dayIndex]).toFixed(1)}`)
				.slice(1)
				.join(' ');
			const closing = `L${x(0).toFixed(1)},${y(baseline[0]).toFixed(1)} Z`;
			for (let i = 0; i < baseline.length; i += 1) baseline[i] = upper[i];
			return { id: band.id, cls: seriesClass(band.id, index), d: `${top} ${bottom} ${closing}` };
		});
	});

	// Keyed by position rather than by label: on a small range two gridlines can
	// format to the same string (`<$0.01`), and duplicate keys abort the render.
	const ticks = $derived([0, 0.5, 1].map((fraction) => ({ y: y(peak * fraction), label: format(peak * fraction) })));

	/** Roughly six dated ticks, whatever the range length. */
	const xLabels = $derived.by(() => {
		if (columns.length === 0) return [];
		const step = Math.max(1, Math.ceil(columns.length / 6));
		return columns.flatMap((column, index) =>
			index % step === 0 ? [{ index, x: x(index), label: column.date.slice(5) }] : []
		);
	});

	const groupings: Array<[UsageGroupBy, string]> = [
		['project', 'Project'],
		['model', 'Model'],
		['agent', 'Agent']
	];
</script>

<section class="box gap-2xs pad-md border-bottom" aria-labelledby="usage-time-title">
	<header class="row ycenter xbetween gap-sm">
		<h3 id="usage-time-title" class="text-sm weight-600">
			{isTokenMode ? 'Tokens over time' : 'Cost over time'}
		</h3>
		<div class="segmented shrink-0" role="group" aria-label="Group the time series by">
			{#each groupings as [id, label] (id)}
				<button
					class="segmented-item"
					class:active={groupBy === id}
					onclick={() => (observatory.usageTimeSeriesGroupBy = id)}>{label}</button
				>
			{/each}
		</div>
	</header>

	{#if columns.length === 0 || bands.length === 0}
		<p class="text-xs text-muted">No usage reported for this range.</p>
	{:else}
		<div class="scroll-x">
			<svg
				class="areachart"
				viewBox="0 0 {AXIS_W + plotWidth + 8} {PLOT_H + LABEL_H}"
				preserveAspectRatio="xMidYMid meet"
				role="img"
				aria-label="{isTokenMode ? 'Tokens' : 'Cost'} per day, stacked by {groupBy}"
			>
				{#each ticks as tick, index (index)}
					<line class="areachart-grid" x1={AXIS_W} y1={tick.y} x2={AXIS_W + plotWidth} y2={tick.y} />
					<text class="areachart-label" x={AXIS_W - 4} y={tick.y + 3} text-anchor="end">{tick.label}</text>
				{/each}
				{#each paths as path (path.id)}
					<path class="series-fill {path.cls}" d={path.d} />
				{/each}
				{#each xLabels as label (label.index)}
					<text class="areachart-label" x={label.x} y={PLOT_H + 13} text-anchor="middle">{label.label}</text>
				{/each}
			</svg>
		</div>

		<div class="row ycenter gap-2xs wrap text-2xs text-muted">
			{#each bands as band, index (band.id)}
				<span class="row ycenter gap-3xs">
					<i class="series-swatch {seriesClass(band.id, index)}"></i>{band.label}
				</span>
			{/each}
		</div>
	{/if}
</section>
