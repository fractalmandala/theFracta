<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let signals = $derived(observatory.quality);
</script>

<section class="box gap-md pad-md" aria-labelledby="quality-title">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Canonical signals</p>
		<h2 id="quality-title" class="text-lg weight-600 m-0">Quality health</h2>
		<p class="muted text-sm m-0">These values are descriptive signal aggregates; no causal claims are inferred.</p>
	</header>

	{#if signals}
		<dl class="metrics-grid">
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Scored sessions</dt>
				<dd class="text-md weight-600 m-0">{signals.scored_sessions}</dd>
			</div>
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Unscored sessions</dt>
				<dd class="text-md weight-600 m-0">{signals.unscored_sessions}</dd>
			</div>
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Average health</dt>
				<dd class="text-md weight-600 m-0">
					{signals.avg_health_score === null ? 'Unscored' : signals.avg_health_score.toFixed(2)}
				</dd>
			</div>
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">With compaction</dt>
				<dd class="text-md weight-600 m-0">{signals.context_health.sessions_with_compaction}</dd>
			</div>
		</dl>

		<section class="box gap-2xs">
			<h3 class="text-sm weight-600 m-0">Outcome distribution</h3>
			<ul class="reset-list box gap-3xs">
				{#each Object.entries(signals.outcome_distribution) as [name, count] (name)}
					<li class="row ycenter xbetween gap-2xs pad-x-2xs pad-y-3xs border-bottom text-sm">
						<span>{name}</span>
						<strong class="tabular-nums">{count}</strong>
					</li>
				{/each}
			</ul>
		</section>

		<section class="box gap-2xs">
			<h3 class="text-sm weight-600 m-0">Quality signals</h3>
			<ul class="reset-list box gap-3xs">
				{#each Object.entries(signals.quality_health.totals) as [name, count] (name)}
					<li class="row ycenter xbetween gap-2xs pad-x-2xs pad-y-3xs border-bottom text-sm">
						<span>{name}</span>
						<strong class="tabular-nums">{count}</strong>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<p class="muted text-sm">Quality signals are unavailable.</p>
	{/if}
</section>
