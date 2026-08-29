<script lang="ts">
	import { page } from '$app/state';
	import { logsState } from '$lib/observatory-state/logs.svelte';
	import LogCalendar from '$lib/observatory-components/logs/LogCalendar.svelte';
	import DayList from '$lib/observatory-components/logs/DayList.svelte';
	import LogTimeline from '$lib/observatory-components/logs/LogTimeline.svelte';
	import LogEntryDetail from '$lib/observatory-components/logs/LogEntryDetail.svelte';
	import { onMount } from 'svelte';

	const date = $derived(page.params.date);

	onMount(async () => {
		await logsState.fetchIndex();
		if (date) {
			logsState.loadDate(date);
		}
	});

	$effect(() => {
		if (date && logsState.activeDate !== date) {
			logsState.loadDate(date);
		}
	});
</script>

<div class="logs-page-layout">
	<aside class="logs-sidebar">
		<LogCalendar />
		<DayList />
	</aside>

	<div class="timeline-pane">
		<LogTimeline />
	</div>

	<LogEntryDetail />
</div>

<style>
	.logs-page-layout {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	.logs-sidebar {
		width: 320px;
		background: var(--bg-panel);
		border-right: 1px solid var(--border);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow-y: auto;
		flex: none;
	}
	.timeline-pane {
		flex: 1;
		height: 100%;
		overflow: hidden;
		background: var(--bg);
	}
</style>
