<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';
</script>

<div class="day-list-shell">
	<div class="search-bar">
		<input
			type="text"
			placeholder="Filter dates..."
			bind:value={logsState.searchQuery}
			class="search-input"
		/>
	</div>

	<div class="list-scroll">
		{#each logsState.filteredDays as day}
			<button
				class="day-card"
				class:active={logsState.activeDate === day.date}
				onclick={() => logsState.loadDate(day.date)}
			>
				<div class="day-top">
					<strong class="date-str">{day.date}</strong>
					<span class="day-week">{day.day_of_week.slice(0, 3)}</span>
				</div>

				<div class="stats-pills">
					{#if typeof day.commits === 'number' && day.commits > 0}
						<span class="stat-badge green">{day.commits}c</span>
					{/if}
					{#if typeof day.agent_sessions === 'number' && day.agent_sessions > 0}
						<span class="stat-badge purple">{day.agent_sessions}s</span>
					{/if}
					{#if typeof day.browsing_entries === 'number' && day.browsing_entries > 0}
						<span class="stat-badge blue">{day.browsing_entries}b</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.day-list-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
	}
	.search-bar {
		padding: 2px;
	}
	.search-input {
		width: 100%;
		padding: 6px 10px;
		font-size: 12px;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		outline: none;
		&:focus {
			border-color: var(--theme-color);
		}
	}
	.list-scroll {
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}
	.day-card {
		all: unset;
		cursor: pointer;
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-subtle);
		background: var(--bg-panel);
		display: flex;
		flex-direction: column;
		gap: 4px;
		transition: all 0.15s ease;
		&:hover {
			background: var(--state-hover);
			border-color: var(--border);
		}
		&.active {
			background: var(--state-selected);
			border-color: var(--theme-color);
		}
	}
	.day-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.date-str {
		font-size: 12px;
		color: var(--text-primary);
	}
	.day-week {
		font-size: 10px;
		color: var(--text-muted);
	}
	.stats-pills {
		display: flex;
		gap: 4px;
	}
	.stat-badge {
		font-size: 9px;
		padding: 1px 4px;
		border-radius: 3px;
		font-weight: 600;
		&.green {
			background: rgba(63, 185, 80, 0.15);
			color: var(--green);
		}
		&.purple {
			background: rgba(188, 140, 255, 0.15);
			color: var(--purple);
		}
		&.blue {
			background: rgba(88, 166, 255, 0.15);
			color: var(--accent);
		}
	}
</style>
