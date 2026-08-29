<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let rows = $derived(observatory.activityCalendar);
</script>
<section class="resource-view"><h2>Activity</h2><p>Calendar-day buckets use the selected local timezone and active Fractorches filter.</p><table><thead><tr><th>Date</th><th>Sessions</th><th>Messages</th><th>Tool calls</th></tr></thead><tbody>{#each rows as row (row.date)}<tr><td>{row.date}</td><td>{row.sessions}</td><td>{row.messages}</td><td>{row.tool_calls}</td></tr>{:else}<tr><td colspan="4">No activity was reported for this filter.</td></tr>{/each}</tbody></table><h3>Hour of week</h3><ul>{#each observatory.hourlyMatrix as cell (`${cell.day_of_week}-${cell.hour}`)}<li>Day {cell.day_of_week}, {cell.hour}:00 — {cell.messages} messages</li>{:else}<li>No hourly activity was reported.</li>{/each}</ul></section>
