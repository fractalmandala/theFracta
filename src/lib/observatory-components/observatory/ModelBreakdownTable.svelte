<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	const dollars = (microdollars: number) => (microdollars / 1_000_000).toFixed(2);
	let models = $derived(observatory.modelBreakdown);
</script>

<section class="box gap-md pad-md" aria-labelledby="models-title">
	<header class="box gap-3xs">
		<h3 id="models-title" class="text-sm weight-600 m-0">Model breakdown</h3>
		<p class="muted text-xs m-0">Only model totals reported by the canonical usage endpoint are shown.</p>
	</header>
	<div class="card border overflow-hidden">
		<table class="table-clean">
			<thead><tr><th>Model</th><th>Input</th><th>Output</th><th>Cache read</th><th>Cost</th></tr></thead>
			<tbody>
				{#each models as row (row.model)}
					<tr>
						<td>{row.model}</td>
						<td class="tabular-nums">{row.inputTokens.toLocaleString()}</td>
						<td class="tabular-nums">{row.outputTokens.toLocaleString()}</td>
						<td class="tabular-nums">{row.cacheReadTokens.toLocaleString()}</td>
						<td class="tabular-nums">${dollars(row.cost.microdollars)}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="text-muted text-sm">No model usage reported for this filter.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
