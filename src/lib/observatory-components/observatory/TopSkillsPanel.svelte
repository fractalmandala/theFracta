<script lang="ts">
	/**
	 * Which skills are being invoked, and by whom.
	 *
	 * The agent and project attribution comes back on each skill row, so a skill
	 * used by two agents shows the split rather than a single total that hides
	 * it.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import BarList, { type Row } from './BarList.svelte';

	const skills = $derived(observatory.resources?.skills ?? []);
	const rows = $derived<Row[]>(
		skills.slice(0, 12).map((s) => ({
			label: s.skill_name,
			value: s.call_count,
			note: `${s.session_count.toLocaleString()} sessions`,
			extra: s.last_used_at
		}))
	);

	const detailFor = (label: string) => skills.find((s) => s.skill_name === label);
	const share = (parts: Array<{ name: string; count: number }>) => {
		const total = parts.reduce((sum, p) => sum + p.count, 0) || 1;
		return parts
			.slice()
			.sort((a, b) => b.count - a.count)
			.slice(0, 4)
			.map((p) => `${p.name} ${Math.round((p.count / total) * 100)}%`)
			.join(' · ');
	};
	const when = (iso: string) => {
		const date = new Date(iso);
		return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
	};
</script>

<section class="box gap-2xs pad-md border-bottom">
	<h3 class="text-sm weight-600">Top skills</h3>
	<BarList {rows}>
		{#snippet detail(row)}
			{@const skill = detailFor(row.label)}
			{#if skill}
				<li class="row ycenter gap-2xs pad-left-md text-2xs text-muted">
					{#if skill.agents.length > 0}<span class="truncate">{share(skill.agents)}</span>{/if}
					{#if skill.projects.length > 0}
						<span aria-hidden="true">·</span>
						<span class="truncate">{share(skill.projects)}</span>
					{/if}
					{#if row.extra}<span class="mla shrink-0">{when(row.extra)}</span>{/if}
				</li>
			{/if}
		{/snippet}
	</BarList>
</section>
