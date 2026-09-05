<script lang="ts">
	/**
	 * Skill usage over time, stacked by skill.
	 *
	 * The service returns a per-day map of skill → calls. Grouping to week or
	 * month sums those days rather than sampling them, so the totals stay equal
	 * to the daily series however it is bucketed.
	 *
	 * Only the busiest skills get their own band; the rest are summed into one.
	 * Twenty near-identical slivers would be a legend, not a chart — and the
	 * rolled-up band is labelled with its count so nothing is silently dropped.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	const TOP = 6;
	const trend = $derived(observatory.resources?.skillTrend ?? []);
	const skills = $derived(observatory.resources?.skills ?? []);

	let grouping = $state<'day' | 'week' | 'month'>('week');

	const named = $derived(skills.slice(0, TOP).map((s) => s.skill_name));
	const otherCount = $derived(Math.max(0, skills.length - named.length));

	const bucketKey = (date: string) => {
		if (grouping === 'day') return date;
		if (grouping === 'month') return date.slice(0, 7);
		// ISO-ish week: the Sunday that starts it, so buckets are contiguous.
		const d = new Date(date + 'T00:00:00');
		d.setDate(d.getDate() - d.getDay());
		return d.toISOString().slice(0, 10);
	};

	type Column = { key: string; total: number; parts: number[] };

	const columns = $derived.by<Column[]>(() => {
		const acc = new Map<string, number[]>();
		for (const day of trend) {
			const key = bucketKey(day.date);
			// One slot per named skill, plus a final slot for everything else.
			const slots = acc.get(key) ?? new Array(named.length + 1).fill(0);
			for (const [skill, calls] of Object.entries(day.by_skill)) {
				const index = named.indexOf(skill);
				slots[index >= 0 ? index : named.length] += calls;
			}
			acc.set(key, slots);
		}
		return [...acc.entries()]
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([key, parts]) => ({ key, parts, total: parts.reduce((s, v) => s + v, 0) }));
	});

	const peak = $derived(Math.max(1, ...columns.map((c) => c.total)));
	const grandTotal = $derived(columns.reduce((s, c) => s + c.total, 0));

	let host = $state<HTMLElement | undefined>();
	$effect(() => {
		if (!host) return;
		// Heights are data, written as custom properties rather than style
		// attributes, which the styling contract does not allow in markup.
		const cols = columns;
		host.querySelectorAll<HTMLElement>('.skillcol').forEach((col, index) => {
			const column = cols[index];
			if (!column) return;
			col.style.setProperty('--col-height', `${(column.total / peak) * 100}%`);
			col.querySelectorAll<HTMLElement>('.skillseg').forEach((seg, part) => {
				const share = column.total > 0 ? (column.parts[part] / column.total) * 100 : 0;
				seg.style.setProperty('--seg-height', `${share}%`);
			});
		});
	});

	const groupings = [
		['day', 'Day'],
		['week', 'Week'],
		['month', 'Month']
	] as const;
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Skill usage over time</h3>
		<div class="segmented shrink-0" role="group" aria-label="Skill trend grouping">
			{#each groupings as [id, label] (id)}
				<button class="segmented-item" class:active={grouping === id} onclick={() => (grouping = id)}
					>{label}</button
				>
			{/each}
		</div>
	</header>

	{#if grandTotal === 0}
		<p class="text-xs text-muted">No skill calls reported for this range.</p>
	{:else}
		<div class="row ycenter gap-2xs wrap text-2xs text-muted">
			{#each named as skill, index (skill)}
				<span class="row ycenter gap-3xs">
					<i class="skillkey skillseg-{index}"></i>{skill}
				</span>
			{/each}
			{#if otherCount > 0}
				<span class="row ycenter gap-3xs">
					<i class="skillkey skillseg-{named.length}"></i>Other ({otherCount})
				</span>
			{/if}
		</div>

		<div class="scroll-x">
			<div class="skilltrend" bind:this={host}>
				{#each columns as column (column.key)}
					<div class="skillcol" title="{column.key}: {column.total.toLocaleString()} calls">
						{#each column.parts as part, index (index)}
							{#if part > 0}
								<i class="skillseg skillseg-{index}"></i>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<p class="text-2xs text-muted tabular-nums">
			{grandTotal.toLocaleString()} calls over {columns.length.toLocaleString()}
			{grouping === 'day' ? 'days' : grouping === 'week' ? 'weeks' : 'months'}
		</p>
	{/if}
</section>
