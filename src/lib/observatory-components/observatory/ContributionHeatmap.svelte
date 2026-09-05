<script lang="ts">
	/**
	 * A year of activity as a calendar.
	 *
	 * The banding is the service's own (`level`, 0–4), not recomputed here: it
	 * is decided against the whole range, so a filtered view and an unfiltered
	 * one stay comparable. Switching metric re-reads rather than re-scales,
	 * because messages, sessions and output tokens each band differently.
	 *
	 * Cells are placed by grid flow rather than by coordinates. A `--col`/`--row`
	 * per cell would mean 366 inline custom properties, which the styling
	 * contract does not allow in markup; `grid-auto-flow: column` over seven
	 * rows puts each week in its own column for free.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	const heatmap = $derived(observatory.resources?.heatmap ?? null);

	type Day = { date: string; value: number; level: number };

	/** Weeks of seven, padded so the first column starts on the right weekday. */
	const weeks = $derived.by(() => {
		const entries = heatmap?.entries ?? [];
		if (entries.length === 0) return [];
		const out: Array<Array<Day | null>> = [];
		let week: Array<Day | null> = [];
		const firstDay = new Date(entries[0].date + 'T00:00:00').getDay();
		for (let i = 0; i < firstDay; i += 1) week.push(null);
		for (const entry of entries) {
			week.push(entry);
			if (week.length === 7) {
				out.push(week);
				week = [];
			}
		}
		if (week.length > 0) {
			while (week.length < 7) week.push(null);
			out.push(week);
		}
		return out;
	});

	/** One label slot per week column; filled only where the month changes. */
	const monthLabels = $derived.by(() => {
		let seen = '';
		return weeks.map((week) => {
			const first = week.find(Boolean) as Day | undefined;
			if (!first) return '';
			const month = first.date.slice(0, 7);
			if (month === seen) return '';
			seen = month;
			return new Date(first.date + 'T00:00:00').toLocaleString(undefined, { month: 'short' });
		});
	});

	const total = $derived((heatmap?.entries ?? []).reduce((sum, day) => sum + day.value, 0));

	const metrics = [
		['messages', 'Messages'],
		['sessions', 'Sessions'],
		['output_tokens', 'Output tokens']
	] as const;
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Activity</h3>
		<div class="segmented shrink-0" role="group" aria-label="Heatmap metric">
			{#each metrics as [id, label] (id)}
				<button
					class="segmented-item"
					class:active={observatory.heatmapMetric === id}
					onclick={() => observatory.setHeatmapMetric(id)}
				>{label}</button>
			{/each}
		</div>
	</header>

	{#if !heatmap}
		<p class="text-xs text-muted">No activity reported for this range.</p>
	{:else if heatmap.entries.length === 0}
		<p class="text-xs text-muted">No days in this range.</p>
	{:else}
		<div class="scroll-x">
			<div class="box gap-3xs">
				<div class="heatmap-months">
					{#each monthLabels as label, index (index)}
						<span class="text-2xs text-muted">{label}</span>
					{/each}
				</div>
				<div class="heatmap-grid">
					{#each weeks as week, w (w)}
						{#each week as day, d (`${w}-${d}`)}
							{#if day}
								<!--
								  A native title, not the app's .tip: this sits inside a
								  horizontal scroll container, which clips a pseudo-element
								  tooltip, and there are ~366 of these.
								-->
								<i
									class="heatmap-cell heatmap-l{day.level}"
									title="{day.date}: {day.value.toLocaleString()}"
								></i>
							{:else}
								<i class="heatmap-cell heatmap-pad"></i>
							{/if}
						{/each}
					{/each}
				</div>
			</div>
		</div>
		<p class="text-2xs text-muted tabular-nums">
			{total.toLocaleString()}
			{heatmap.metric.replace(/_/g, ' ')} over {heatmap.entries.length.toLocaleString()} days
		</p>
	{/if}
</section>
