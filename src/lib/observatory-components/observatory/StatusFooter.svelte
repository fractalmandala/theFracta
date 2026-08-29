<script lang="ts">import { observatory } from '$lib/observatory-state/observatory.svelte';</script>
<footer class="status-footer">
	<div class="footer-left">
		<span class="status-dot" class:ok={Boolean(observatory.lastRefresh)} aria-hidden="true"></span>
		<span class="status-text">
			{#if observatory.lastRefresh}Fractorches response received {new Date(observatory.lastRefresh).toLocaleString()}{:else}Fractorches has not returned Observatory data yet.{/if}
		</span>
	</div>
	<div class="footer-right">
		<span class="footer-stat">{observatory.totalSessions} sessions</span>
		<span class="footer-dot" aria-hidden="true">·</span>
		<span class="footer-stat">{observatory.overview?.active_projects ?? 0} active projects</span>
	</div>
</footer>
