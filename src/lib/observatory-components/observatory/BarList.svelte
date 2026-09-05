<script lang="ts">
	/**
	 * A ranked list as horizontal bars.
	 *
	 * Shared by projects, tools, skills and the shape distributions, which are
	 * the same picture with different labels. Bar widths are set as a percentage
	 * custom property from an effect rather than a style attribute, which the
	 * styling contract does not permit in markup.
	 */
	import type { Snippet } from 'svelte';

	export type Row = { label: string; value: number; note?: string; extra?: string };

	let {
		rows,
		max = undefined,
		formatValue = (n: number) => n.toLocaleString(),
		onSelect = undefined,
		detail = undefined
	}: {
		rows: Row[];
		/** Scale ceiling. Defaults to the largest row, so the top bar is full. */
		max?: number;
		formatValue?: (value: number) => string;
		onSelect?: (row: Row) => void;
		detail?: Snippet<[Row]>;
	} = $props();

	const ceiling = $derived(max ?? Math.max(1, ...rows.map((r) => r.value)));

	let host = $state<HTMLElement | undefined>();
	$effect(() => {
		if (!host) return;
		// Read `rows` and `ceiling` so this re-runs when either changes.
		const widths = rows.map((r) => Math.max(0, Math.min(100, (r.value / ceiling) * 100)));
		host.querySelectorAll<HTMLElement>('.barlist-fill').forEach((el, index) => {
			el.style.setProperty('--bar-width', `${widths[index] ?? 0}%`);
		});
	});
</script>

<ul class="box gap-3xs unstyled" bind:this={host}>
	{#each rows as row (row.label)}
		<li class="barlist-row">
			{#if onSelect}
				<button class="barlist-label truncate ta-l" onclick={() => onSelect(row)}>{row.label}</button>
			{:else}
				<span class="barlist-label truncate">{row.label}</span>
			{/if}
			<span class="barlist-track"><i class="barlist-fill"></i></span>
			<span class="text-2xs text-muted tabular-nums shrink-0">{formatValue(row.value)}</span>
			{#if row.note}<span class="text-2xs text-muted shrink-0">{row.note}</span>{/if}
		</li>
		{#if detail}{@render detail(row)}{/if}
	{:else}
		<li class="text-xs text-muted">Nothing reported for this range.</li>
	{/each}
</ul>
