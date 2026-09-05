<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	const dollars = (microdollars: number) => (microdollars / 1_000_000).toFixed(2);
	let usage = $derived(observatory.resources?.usage ?? null);
</script>

<section class="box gap-md pad-md" aria-labelledby="usage-title">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Canonical usage summary</p>
		<h2 id="usage-title" class="text-lg weight-600">Usage and cost</h2>
		<p class="text-muted text-sm">Costs are reported by Fractorches in microdollars; no session cost is inferred.</p>
	</header>

	{#if usage}
		<dl class="card-grid">
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Total cost</dt>
				<dd class="text-md weight-600">${dollars(usage.totals.totalCost.microdollars)}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Input tokens</dt>
				<dd class="text-md weight-600">{usage.totals.inputTokens.toLocaleString()}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Output tokens</dt>
				<dd class="text-md weight-600">{usage.totals.outputTokens.toLocaleString()}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Cache reads</dt>
				<dd class="text-md weight-600">{usage.totals.cacheReadTokens.toLocaleString()}</dd>
			</div>
		</dl>

		<section class="box gap-2xs">
			<h3 class="text-sm weight-600">Cost by project</h3>
			<div class="card border">
				{#each usage.projectTotals as row (row.project_key)}
					<div class="row ycenter xbetween gap-2xs pad-x-sm pad-y-2xs border-bottom text-sm">
						<span class="truncate">{row.project || row.project_key}</span>
						<strong class="tabular-nums shrink-0">${dollars(row.cost.microdollars)}</strong>
					</div>
				{:else}
					<p class="text-muted text-sm pad-sm">No project usage reported for this filter.</p>
				{/each}
			</div>
		</section>

		<section class="box gap-2xs">
			<h3 class="text-sm weight-600">Daily cost</h3>
			<div class="card border">
				{#each usage.daily as row (row.date)}
					<div class="row ycenter xbetween gap-2xs pad-x-sm pad-y-2xs border-bottom text-sm">
						<span class="truncate">{row.date}</span>
						<strong class="tabular-nums shrink-0">${dollars(row.totalCost.microdollars)}</strong>
					</div>
				{:else}
					<p class="text-muted text-sm pad-sm">No daily usage reported for this filter.</p>
				{/each}
			</div>
		</section>
	{:else}
		<p class="text-muted text-sm">Usage is unavailable.</p>
	{/if}
</section>
