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
		if (date) logsState.loadDate(date);
	});

	$effect(() => {
		if (date && logsState.activeDate !== date) logsState.loadDate(date);
	});
</script>

<div class="row grow min0 wfull">
	<aside class="surface shrink-0 pad-xs border-right box gap-sm pad-sm scroll-y">
		<LogCalendar />
		<DayList />
	</aside>
	<div class="scroll-y pad-sm grow min0">
		<LogTimeline />
	</div>
	<LogEntryDetail />
</div>
