<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';
</script>

<section class="box gap-2xs">
	<div class="wfull row">
		<input
			type="text"
			placeholder="Filter dates..."
			bind:value={logsState.searchQuery}
			class="input text-sm wfull"
		/>
	</div>

	<div class="min0 box gap-3xs scroll-y">
		{#each logsState.filteredDays as day}
			<button
				class="wfull border radius-4 raised pad-y-2xs pad-x-xs box gap-3xs pad-x-2xs pad-y-3xs ta-l cursor-pointer"
				class:border-theme={logsState.activeDate === day.date}
				onclick={() => logsState.loadDate(day.date)}
			>
				<div class="row ycenter xbetween gap-2xs">
					<strong class="text-sm weight-600">{day.date}</strong>
					<span class="text-xs text-muted">{day.day_of_week.slice(0, 3)}</span>
				</div>

				<div class="row gap-3xs wrap">
					{#if typeof day.commits === 'number' && day.commits > 0}
						<span class="mono text-xs text-muted text-success">{day.commits}c</span>
					{/if}
					{#if typeof day.agent_sessions === 'number' && day.agent_sessions > 0}
						<span class="mono text-xs text-muted text-theme">{day.agent_sessions}s</span>
					{/if}
					{#if typeof day.browsing_entries === 'number' && day.browsing_entries > 0}
						<span class="mono text-xs text-muted text-info">{day.browsing_entries}b</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</section>
