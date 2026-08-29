<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let agents = $derived(observatory.healthByAgent);
</script>

<section class="box gap-md pad-md" aria-labelledby="agent-comparison-title">
	<header class="box gap-3xs">
		<h3 id="agent-comparison-title" class="text-sm weight-600 m-0">Agent comparison</h3>
		<p class="muted text-xs m-0">Canonical quality signals by agent.</p>
	</header>
	<div class="card border overflow-hidden">
		<table class="table-clean">
			<thead><tr><th>Agent</th><th>Sessions</th><th>Completed rate</th><th>Failure signals</th><th>Health</th></tr></thead>
			<tbody>
				{#each agents as row (row.agent)}
					<tr>
						<td>{row.agent}</td>
						<td class="tabular-nums">{row.session_count}</td>
						<td class="tabular-nums">{(row.completed_rate * 100).toFixed(1)}%</td>
						<td class="tabular-nums">{row.avg_failure_signals.toFixed(2)}</td>
						<td class="tabular-nums">{row.avg_health_score === null ? 'Unscored' : row.avg_health_score.toFixed(2)}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="text-muted text-sm">No agent signals reported.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
