<script lang="ts">
	import { observatory } from "$lib/observatory-state/observatory.svelte";
	let agents = $derived(observatory.healthByAgent);
</script>

<section class="agent-comparison">
	<header>
		<h3>Agent comparison</h3>
		<p>Canonical quality signals by agent.</p>
	</header>
	<table>
		<thead
			><tr
				><th>Agent</th><th>Sessions</th><th>Completed rate</th><th
					>Failure signals</th
				><th>Health</th></tr
			></thead
		><tbody
			>{#each agents as row}<tr
					><td>{row.agent}</td><td>{row.session_count}</td><td
						>{(row.completed_rate * 100).toFixed(1)}%</td
					><td>{row.avg_failure_signals.toFixed(2)}</td><td
						>{row.avg_health_score === null
							? "Unscored"
							: row.avg_health_score.toFixed(2)}</td
					></tr
				>{:else}<tr><td colspan="5">No agent signals reported.</td></tr
				>{/each}</tbody
		>
	</table>
</section>
