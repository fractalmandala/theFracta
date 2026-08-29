<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
</script>

<footer class="status-footer footer row ycenter xbetween pad-x-sm pad-y-3xs text-xs text-muted border-top">
	<div class="row ycenter gap-2xs">
		<span class="status-dot" aria-hidden="true"></span>
		<span>
			{#if observatory.lastRefresh}
				Fractorches response received {new Date(observatory.lastRefresh).toLocaleString()}
			{:else}
				Fractorches has not returned Observatory data yet.
			{/if}
		</span>
	</div>
	<div class="row ycenter gap-2xs">
		<span>{observatory.totalSessions} sessions</span>
		<span aria-hidden="true">·</span>
		<span>{observatory.overview?.active_projects ?? 0} active projects</span>
	</div>
</footer>
