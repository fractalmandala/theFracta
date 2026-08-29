<script lang="ts">
	import { observatory } from "$lib/observatory-state/observatory.svelte";
	const dollars = (microdollars: number) =>
		(microdollars / 1_000_000).toFixed(2);
	let usage = $derived(observatory.resources?.usage ?? null);
</script>

<section class="usage" aria-labelledby="usage-title">
	<header>
		<p class="eyebrow">Canonical usage summary</p>
		<h2 id="usage-title">Usage and cost</h2>
		<p class="muted">
			Costs are reported by Fractorches in microdollars; no session cost
			is inferred.
		</p>
	</header>
	{#if usage}<div class="metrics">
			<div>
				<strong>${dollars(usage.totals.totalCost.microdollars)}</strong
				><span>Total cost</span>
			</div>
			<div>
				<strong>{usage.totals.inputTokens.toLocaleString()}</strong
				><span>Input tokens</span>
			</div>
			<div>
				<strong>{usage.totals.outputTokens.toLocaleString()}</strong
				><span>Output tokens</span>
			</div>
			<div>
				<strong>{usage.totals.cacheReadTokens.toLocaleString()}</strong
				><span>Cache reads</span>
			</div>
		</div>
		<h3>Cost by project</h3>
		<div class="bars">
			{#each usage.projectTotals as row}<div class="bar">
					<span>{row.project || row.project_key}</span><strong
						>${dollars(row.cost.microdollars)}</strong
					>
				</div>{:else}<p class="muted">
					No project usage reported for this filter.
				</p>{/each}
		</div>
		<h3>Daily cost</h3>
		<div class="daily">
			{#each usage.daily as row}<div>
					<span>{row.date}</span><strong
						>${dollars(row.totalCost.microdollars)}</strong
					>
				</div>{:else}<p class="muted">
					No daily usage reported for this filter.
				</p>{/each}
		</div>{:else}<p class="muted">Usage is unavailable.</p>{/if}
</section>
