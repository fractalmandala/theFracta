<script lang="ts">
	/**
	 * When in the week the work happens.
	 *
	 * A weekday × hour grid rather than a single timeline: the question is
	 * whether Tuesday afternoons look like Saturday mornings, which a flat
	 * series cannot show. Banding is relative to the busiest cell in the range.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	const cells = $derived(observatory.resources?.hours ?? []);
	const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const peak = $derived(Math.max(1, ...cells.map((c) => c.messages)));

	/** Dense 7 × 24 grid; the service omits empty cells. */
	const grid = $derived.by(() => {
		const lookup = new Map(cells.map((c) => [`${c.day_of_week}:${c.hour}`, c.messages]));
		return DAYS.map((day, d) => ({
			day,
			hours: Array.from({ length: 24 }, (_, h) => {
				const value = lookup.get(`${d}:${h}`) ?? 0;
				// Five bands, matching the calendar heatmap's vocabulary.
				const level = value === 0 ? 0 : Math.min(4, Math.ceil((value / peak) * 4));
				return { hour: h, value, level };
			})
		}));
	});

	const busiest = $derived.by(() => {
		if (cells.length === 0) return null;
		const top = cells.reduce((best, c) => (c.messages > best.messages ? c : best), cells[0]);
		return `${DAYS[top.day_of_week]} ${String(top.hour).padStart(2, '0')}:00`;
	});
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Activity by day and hour</h3>
		{#if busiest}
			<span class="text-2xs text-muted">busiest {busiest}</span>
		{/if}
	</header>

	{#if cells.length === 0}
		<p class="text-xs text-muted">No activity reported for this range.</p>
	{:else}
		<div class="scroll-x">
			<div class="box gap-3xs">
				{#each grid as row (row.day)}
					<div class="row ycenter gap-2xs">
						<span class="hourgrid-day text-2xs text-muted shrink-0">{row.day}</span>
						<div class="hourgrid">
							{#each row.hours as cell (cell.hour)}
								<i
									class="heatmap-cell heatmap-l{cell.level}"
									title="{row.day} {String(cell.hour).padStart(2, '0')}:00 — {cell.value.toLocaleString()} messages"
								></i>
							{/each}
						</div>
					</div>
				{/each}
				<div class="row ycenter gap-2xs">
					<span class="hourgrid-day shrink-0"></span>
					<div class="hourgrid text-2xs text-muted">
						{#each Array.from({ length: 24 }, (_, h) => h) as hour (hour)}
							<span class="ta-c">{hour % 6 === 0 ? hour : ''}</span>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</section>
