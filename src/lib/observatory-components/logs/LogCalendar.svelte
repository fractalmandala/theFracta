<script lang="ts">
	import { logsState, type DaySummary } from '$lib/observatory-state/logs.svelte';

	let currentMonthIndex = $state(0);

	const daysMap = $derived.by(() => {
		const map = new Map<string, DaySummary>();
		for (const d of logsState.index?.days ?? []) map.set(d.date, d);
		return map;
	});

	const months = $derived.by(() => {
		const set = new Set<string>();
		for (const d of logsState.index?.days ?? []) set.add(d.date.slice(0, 7));
		return [...set].sort();
	});

	const activeMonth = $derived(
		months[currentMonthIndex] ?? months[months.length - 1] ?? '2026-08'
	);

	const calendarDays = $derived.by(() => {
		if (!activeMonth) return [];
		const [yearStr, monthStr] = activeMonth.split('-');
		const year = parseInt(yearStr, 10);
		const month = parseInt(monthStr, 10) - 1;

		const firstDay = new Date(year, month, 1).getDay();
		const totalDays = new Date(year, month + 1, 0).getDate();

		const grid: any[] = [];

		// Monday-aligned week
		const offset = (firstDay + 6) % 7;
		for (let i = 0; i < offset; i++) grid.push({ empty: true });

		for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
			const dateStr = `${yearStr}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
			const summary = daysMap.get(dateStr);
			grid.push({
				dayNum,
				date: dateStr,
				summary,
				isActive: logsState.activeDate === dateStr,
				hasActivity: summary && (
					(summary.browsing_entries ?? 0) > 0 ||
					(summary.commits ?? 0) > 0 ||
					(summary.agent_sessions ?? 0) > 0
				),
			});
		}
		return grid;
	});

	function prevMonth() { if (currentMonthIndex > 0) currentMonthIndex--; }
	function nextMonth() { if (currentMonthIndex < months.length - 1) currentMonthIndex++; }
</script>

<section class="radius-4 raised pad-xs card border pad-2xs box gap-3xs">
	<header class="row ycenter xbetween gap-2xs">
		<button class="button is-icon text-muted" onclick={prevMonth} disabled={currentMonthIndex <= 0} aria-label="Previous month">◀</button>
		<strong class="text-sm weight-600">{activeMonth}</strong>
		<button class="button is-icon text-muted" onclick={nextMonth} disabled={currentMonthIndex >= months.length - 1} aria-label="Next month">▶</button>
	</header>

	<div class="grid-7 mono ta-c row text-2xs text-muted">
		{#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as w}
			<span class="grow min0 ta-c">{w}</span>
		{/each}
	</div>

	<div class="grid-7">
		{#each calendarDays as cell}
			{#if cell.empty}
				<span class="cal-cell-empty"></span>
			{:else}
				<button
					class="cal-cell box ycenter xcenter gap-3xs pad-3xs text-xs"
					class:border-theme={cell.isActive}
					class:bg-state-hover={cell.hasActivity}
					onclick={() => logsState.loadDate(cell.date)}
				>
					<span class="text-sm">{cell.dayNum}</span>
					{#if cell.summary}
						<div class="gap-1 row gap-3xs">
							{#if cell.summary.commits > 0}<span class="w-4 h-4 radius-32 bg-success" aria-hidden="true"></span>{/if}
							{#if cell.summary.agent_sessions > 0}<span class="w-4 h-4 radius-32 bg-theme" aria-hidden="true"></span>{/if}
							{#if cell.summary.browsing_entries > 0}<span class="w-4 h-4 radius-32 bg-info" aria-hidden="true"></span>{/if}
						</div>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
</section>
