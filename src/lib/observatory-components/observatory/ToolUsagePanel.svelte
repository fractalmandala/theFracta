<script lang="ts">
	/**
	 * Which tools the agents actually reach for.
	 *
	 * Two readings of one dataset: the individual tools, and the categories they
	 * roll up into. Category totals are summed here rather than fetched, because
	 * the service reports the category on each tool row and summing is exact.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import BarList, { type Row } from './BarList.svelte';

	const tools = $derived(observatory.resources?.tools ?? []);
	let grouping = $state<'tool' | 'category'>('tool');

	const totalCalls = $derived(tools.reduce((sum, t) => sum + t.call_count, 0));

	const rows = $derived<Row[]>(
		grouping === 'tool'
			? tools
					.slice()
					.sort((a, b) => b.call_count - a.call_count)
					.slice(0, 12)
					.map((t) => ({
						label: t.tool_name,
						value: t.call_count,
						note: `${t.session_count.toLocaleString()} sessions`
					}))
			: Object.entries(
					tools.reduce<Record<string, number>>((acc, t) => {
						acc[t.category] = (acc[t.category] ?? 0) + t.call_count;
						return acc;
					}, {})
				)
					.sort((a, b) => b[1] - a[1])
					.map(([label, value]) => ({
						label,
						value,
						note: totalCalls > 0 ? `${((value / totalCalls) * 100).toFixed(1)}%` : ''
					}))
	);
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Tool usage</h3>
		<div class="segmented shrink-0" role="group" aria-label="Tool grouping">
			<button class="segmented-item" class:active={grouping === 'tool'} onclick={() => (grouping = 'tool')}>Top tools</button>
			<button class="segmented-item" class:active={grouping === 'category'} onclick={() => (grouping = 'category')}>By category</button>
		</div>
	</header>
	<BarList {rows} />
	<p class="text-2xs text-muted tabular-nums">
		{totalCalls.toLocaleString()} calls across {tools.length.toLocaleString()} tools
	</p>
</section>
