<script lang="ts">
	/**
	 * How long sessions run, by three different measures.
	 *
	 * Length is message count, duration is wall-clock, autonomy is tool calls
	 * per user message. They answer different questions and the service buckets
	 * each separately, so this switches between them rather than deriving one
	 * from another.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import BarList, { type Row } from './BarList.svelte';

	const shape = $derived(observatory.resources?.shape ?? null);
	let measure = $state<'length' | 'duration' | 'autonomy'>('length');

	const rows = $derived<Row[]>(
		(shape?.[measure] ?? []).map((b) => ({ label: b.label, value: b.count }))
	);
	const measures = [
		['length', 'Messages'],
		['duration', 'Duration'],
		['autonomy', 'Autonomy']
	] as const;
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Session shape</h3>
		<div class="segmented shrink-0" role="group" aria-label="Shape measure">
			{#each measures as [id, label] (id)}
				<button class="segmented-item" class:active={measure === id} onclick={() => (measure = id)}
					>{label}</button
				>
			{/each}
		</div>
	</header>
	{#if !shape}
		<p class="text-xs text-muted">Not reported for this range.</p>
	{:else}
		<BarList {rows} />
		<p class="text-2xs text-muted tabular-nums">{shape.count.toLocaleString()} sessions</p>
	{/if}
</section>
