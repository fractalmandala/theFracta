<script lang="ts">
	import { observatory } from "$lib/observatory-state/observatory.svelte";
	let signals = $derived(observatory.quality);
</script>

<section class="quality">
	<header>
		<p class="eyebrow">Canonical signals</p>
		<h2>Quality health</h2>
		<p class="muted">
			These values are descriptive signal aggregates; no causal claims are
			inferred.
		</p>
	</header>
	{#if signals}<div class="metrics">
			<div>
				<strong>{signals.scored_sessions}</strong><span
					>Scored sessions</span
				>
			</div>
			<div>
				<strong>{signals.unscored_sessions}</strong><span
					>Unscored sessions</span
				>
			</div>
			<div>
				<strong
					>{signals.avg_health_score === null
						? "Unscored"
						: signals.avg_health_score.toFixed(2)}</strong
				><span>Average health</span>
			</div>
			<div>
				<strong
					>{signals.context_health.sessions_with_compaction}</strong
				><span>Sessions with compaction</span>
			</div>
		</div>
		<h3>Outcome distribution</h3>
		<ul>
			{#each Object.entries(signals.outcome_distribution) as [name, count]}<li
				>
					<span>{name}</span><strong>{count}</strong>
				</li>{/each}
		</ul>
		<h3>Quality signals</h3>
		<ul>
			{#each Object.entries(signals.quality_health.totals) as [name, count]}<li
				>
					<span>{name}</span><strong>{count}</strong>
				</li>{/each}
		</ul>{:else}<p class="muted">Quality signals are unavailable.</p>{/if}
</section>
