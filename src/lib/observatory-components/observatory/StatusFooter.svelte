<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
</script>

<footer class="shrink-0 gap-md mono footer row ycenter xbetween pad-x-sm pad-y-3xs text-xs text-muted border-top">
	<div class="row ycenter gap-2xs">
		<span class="w-8 h-8 radius-32 shrink-0 bg-success" aria-hidden="true"></span>
		<span>
			{#if observatory.syncing}
				Reconciling with Fractorches…
			{:else if observatory.lastRefresh}
				Read {new Date(observatory.lastRefresh).toLocaleString()}{#if observatory.syncedCount > 0}
					· {observatory.syncedCount} session{observatory.syncedCount === 1 ? '' : 's'} updated{/if}
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
