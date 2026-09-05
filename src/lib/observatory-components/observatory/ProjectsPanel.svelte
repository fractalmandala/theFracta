<script lang="ts">
	/**
	 * Where the work happened.
	 *
	 * The long tail is rolled into one row rather than truncated silently: a
	 * list that stops at twelve without saying so misrepresents how spread out
	 * the work is, which is the question this chart exists to answer.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import BarList, { type Row } from './BarList.svelte';

	const SHOWN = 12;
	const stats = $derived(observatory.resources?.projectStats ?? []);

	const rows = $derived.by<Row[]>(() => {
		const sorted = stats.slice().sort((a, b) => b.messages - a.messages);
		const head = sorted.slice(0, SHOWN).map((p) => ({
			label: p.name,
			value: p.messages,
			note: `${p.sessions.toLocaleString()} sessions`
		}));
		const rest = sorted.slice(SHOWN);
		if (rest.length === 0) return head;
		return [
			...head,
			{
				label: `Other (${rest.length})`,
				value: rest.reduce((sum, p) => sum + p.messages, 0),
				note: `${rest.reduce((sum, p) => sum + p.sessions, 0).toLocaleString()} sessions`
			}
		];
	});
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Projects</h3>
		<span class="text-2xs text-muted tabular-nums">{stats.length.toLocaleString()} total</span>
	</header>
	<!--
	  Clicking a project filters the whole surface to it. The rolled-up "Other"
	  row is not a project, so it is not selectable.
	-->
	<BarList
		{rows}
		onSelect={(row) => {
			if (row.label.startsWith('Other (')) return;
			observatory.selectedProject = row.label;
			void observatory.applyFilters();
		}}
	/>
</section>
