<script lang="ts">
	import { logsState, type DaySummary } from '$lib/observatory-state/logs.svelte';

	let currentMonthIndex = $state(0); // offset from current displayed month

	const daysMap = $derived.by(() => {
		const map = new Map<string, DaySummary>();
		for (const d of logsState.index?.days ?? []) {
			map.set(d.date, d);
		}
		return map;
	});

	// Get all available months from date range
	const months = $derived.by(() => {
		const set = new Set<string>();
		for (const d of logsState.index?.days ?? []) {
			set.add(d.date.slice(0, 7)); // YYYY-MM
		}
		return [...set].sort();
	});

	const activeMonth = $derived(months[currentMonthIndex] ?? months[months.length - 1] ?? '2026-08');

	// Build 7-column calendar grid for active month
	const calendarDays = $derived.by(() => {
		if (!activeMonth) return [];
		const [yearStr, monthStr] = activeMonth.split('-');
		const year = parseInt(yearStr, 10);
		const month = parseInt(monthStr, 10) - 1;

		const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
		const totalDays = new Date(year, month + 1, 0).getDate();

		const grid: any[] = [];

		// Empty prefix cells (align Monday as first column: Mon=0, Sun=6)
		const offset = (firstDay + 6) % 7;
		for (let i = 0; i < offset; i++) {
			grid.push({ empty: true });
		}

		for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
			const dateStr = `${yearStr}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
			const summary = daysMap.get(dateStr);
			grid.push({
				dayNum,
				date: dateStr,
				summary,
				isActive: logsState.activeDate === dateStr,
				hasActivity:
					summary &&
					((summary.browsing_entries ?? 0) > 0 ||
						(summary.commits ?? 0) > 0 ||
						(summary.agent_sessions ?? 0) > 0)
			});
		}
		return grid;
	});

	function prevMonth() {
		if (currentMonthIndex > 0) currentMonthIndex--;
	}

	function nextMonth() {
		if (currentMonthIndex < months.length - 1) currentMonthIndex++;
	}
</script>

<div class="calendar-card">
	<div class="cal-nav">
		<button class="nav-btn" onclick={prevMonth} disabled={currentMonthIndex <= 0}>◀</button>
		<strong class="month-title">{activeMonth}</strong>
		<button class="nav-btn" onclick={nextMonth} disabled={currentMonthIndex >= months.length - 1}>▶</button>
	</div>

	<div class="weekdays-row">
		<span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
	</div>

	<div class="days-grid">
		{#each calendarDays as cell}
			{#if cell.empty}
				<div class="day-cell empty"></div>
			{:else}
				<button
					class="day-cell"
					class:active={cell.isActive}
					class:has-activity={cell.hasActivity}
					onclick={() => logsState.loadDate(cell.date)}
				>
					<span class="day-num">{cell.dayNum}</span>
					{#if cell.summary}
						<div class="activity-dots">
							{#if cell.summary.commits > 0}
								<span class="dot commit"></span>
							{/if}
							{#if cell.summary.agent_sessions > 0}
								<span class="dot agent"></span>
							{/if}
							{#if cell.summary.browsing_entries > 0}
								<span class="dot browse"></span>
							{/if}
						</div>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
</div>

<style>
	.calendar-card {
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.cal-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.month-title {
		font-size: 12px;
		color: var(--text-primary);
	}
	.nav-btn {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		color: var(--text-muted);
		width: 24px;
		height: 22px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 10px;
		display: grid;
		place-items: center;
		&:hover:not(:disabled) {
			background: var(--bg-hover);
			color: var(--text-primary);
		}
		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}
	}
	.weekdays-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
		font-size: 10px;
		color: var(--text-secondary);
		font-weight: 600;
	}
	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 3px;
	}
	.day-cell {
		all: unset;
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		border-radius: 4px;
		border: 1px solid transparent;
		cursor: pointer;
		color: var(--text-muted);
		transition: all 0.15s;
		&:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
			border-color: var(--border);
		}
		&.active {
			background: var(--accent-glow);
			border-color: var(--accent);
			color: var(--accent);
			font-weight: 600;
		}
		&.empty {
			cursor: default;
			pointer-events: none;
		}
	}
	.activity-dots {
		display: flex;
		gap: 2px;
		margin-top: 1px;
	}
	.dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		&.commit {
			background: var(--green);
		}
		&.agent {
			background: var(--purple);
		}
		&.browse {
			background: var(--accent);
		}
	}
</style>
