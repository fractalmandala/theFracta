<script lang="ts">
	/**
	 * The Usage dashboard.
	 *
	 * Ordered the way the question is usually asked: what the range cost, how
	 * that moved over time, where it went, which sessions dominated, how much
	 * the cache absorbed, what each model contributed, and finally an explicit
	 * comparison of two slices.
	 *
	 * The Cost / Tokens switch and the token-type picker live in the app header
	 * with the rest of the surface's chrome, because they govern every panel
	 * here rather than any one of them.
	 */
	import UsageSummaryPanel from './UsageSummaryPanel.svelte';
	import UsageOverTimePanel from './UsageOverTimePanel.svelte';
	import UsageAttributionPanel from './UsageAttributionPanel.svelte';
	import TopUsageSessionsPanel from './TopUsageSessionsPanel.svelte';
	import CacheEfficiencyPanel from './CacheEfficiencyPanel.svelte';
	import PairwiseComparisonPanel from './PairwiseComparisonPanel.svelte';
	import ModelBreakdownTable from './ModelBreakdownTable.svelte';
	import { observatory } from '$lib/observatory-state/observatory.svelte';
</script>

<section class="box gap-md pad-md">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Usage</p>
		<h2 class="text-lg weight-600">
			{observatory.usageMode === 'token' ? 'Tokens' : 'Cost'}
		</h2>
		<p class="text-muted text-sm">
			Costs are reported by Fractorches in microdollars; no session cost is inferred.
		</p>
	</header>

	<UsageSummaryPanel />
	<UsageOverTimePanel />
	<UsageAttributionPanel />
	<TopUsageSessionsPanel />
	<CacheEfficiencyPanel />
	<ModelBreakdownTable />
	<PairwiseComparisonPanel />
</section>
