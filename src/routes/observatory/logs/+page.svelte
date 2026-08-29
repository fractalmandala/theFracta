<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';
	import LogCalendar from '$lib/observatory-components/logs/LogCalendar.svelte';
	import DayList from '$lib/observatory-components/logs/DayList.svelte';
	import LogTimeline from '$lib/observatory-components/logs/LogTimeline.svelte';
	import LogEntryDetail from '$lib/observatory-components/logs/LogEntryDetail.svelte';
	import { onMount } from 'svelte';

	onMount(() => logsState.fetchIndex());
</script>

<!-- Page type: logs browser with persistent left sidebar (calendar + day list) and main timeline. -->
<div class="logs-page row grow min0 wfull">
	<aside class="logs-sidebar border-right box gap-sm pad-sm overflow-y-auto">
		<LogCalendar />
		<DayList />
	</aside>
	<div class="timeline-pane grow min0">
		<LogTimeline />
	</div>
	<LogEntryDetail />
</div>
