<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let rows = $derived(observatory.activityCalendar);
</script>

<section class="box gap-md pad-md">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Calendar activity</p>
		<h2 class="text-lg weight-600">Activity</h2>
		<p class="text-muted text-sm">Calendar-day buckets use the selected local timezone and active Fractorches filter.</p>
	</header>

	<div class="card border overflow-hidden">
		<table class="table-clean">
			<thead>
				<tr><th>Date</th><th>Sessions</th><th>Messages</th><th>Tool calls</th></tr>
			</thead>
			<tbody>
				{#each rows as row (row.date)}
					<tr>
						<td>{row.date}</td>
						<td>{row.sessions}</td>
						<td>{row.messages}</td>
						<td>{row.tool_calls}</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="text-muted text-sm">No activity was reported for this filter.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<section class="box gap-2xs">
		<h3 class="text-sm weight-600">Hour of week</h3>
		<ol class="box gap-3xs unstyled">
			{#each observatory.hourlyMatrix as cell (`${cell.day_of_week}-${cell.hour}`)}
				<li class="text-sm pad-x-2xs pad-y-3xs border-bottom text-muted">
					Day {cell.day_of_week}, {cell.hour}:00 — <strong class="text-primary">{cell.messages}</strong> messages
				</li>
			{:else}
				<li class="text-sm text-muted">No hourly activity was reported.</li>
			{/each}
		</ol>
	</section>
</section>
