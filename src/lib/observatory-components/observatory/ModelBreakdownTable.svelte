<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	const dollars = (microdollars: number) => (microdollars / 1_000_000).toFixed(2);
	let models = $derived(observatory.modelBreakdown);
</script>
<section class="model-breakdown" aria-labelledby="models-title"><header><h3 id="models-title">Model breakdown</h3><p>Only model totals reported by the canonical usage endpoint are shown.</p></header><table><thead><tr><th>Model</th><th>Input</th><th>Output</th><th>Cache read</th><th>Cost</th></tr></thead><tbody>{#each models as row}<tr><td>{row.model}</td><td>{row.inputTokens.toLocaleString()}</td><td>{row.outputTokens.toLocaleString()}</td><td>{row.cacheReadTokens.toLocaleString()}</td><td>${dollars(row.cost.microdollars)}</td></tr>{:else}<tr><td colspan="5">No model usage reported for this filter.</td></tr>{/each}</tbody></table></section>
