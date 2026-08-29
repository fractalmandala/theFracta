<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';
	import LogCalendar from '$lib/observatory-components/logs/LogCalendar.svelte';
	import DayList from '$lib/observatory-components/logs/DayList.svelte';
	import LogTimeline from '$lib/observatory-components/logs/LogTimeline.svelte';
	import LogEntryDetail from '$lib/observatory-components/logs/LogEntryDetail.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		logsState.fetchIndex();
	});
</script>

<div class="logs-page-layout">
	<!-- Left Logs Navigation Sidebar -->
	<aside class="logs-sidebar">
		<LogCalendar />
		<DayList />
	</aside>

	<!-- Main Timeline Pane -->
	<div class="timeline-pane">
		<LogTimeline />
	</div>

	<!-- Modal Detail -->
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
