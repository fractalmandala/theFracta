<script lang="ts">
	/**
	 * The heaviest sessions, ranked three ways.
	 *
	 * The ranking is the service's — switching re-queries rather than re-sorting
	 * the rows already held, because the top ten by duration are not a
	 * rearrangement of the top ten by messages.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	const sessions = $derived(observatory.resources?.topSessions ?? []);
	const metric = $derived(observatory.topSessionsMetric);

	const measure = (s: (typeof sessions)[number]) =>
		metric === 'duration'
			? `${Math.round(s.duration_min).toLocaleString()} min`
			: metric === 'output_tokens'
				? `${s.output_tokens.toLocaleString()} tokens`
				: `${s.message_count.toLocaleString()} messages`;

	const metrics = [
		['messages', 'By messages'],
		['duration', 'By duration'],
		['output_tokens', 'By output tokens']
	] as const;
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Top sessions</h3>
		<div class="segmented shrink-0" role="group" aria-label="Top sessions ranking">
			{#each metrics as [id, label] (id)}
				<button
					class="segmented-item"
					class:active={metric === id}
					onclick={() => observatory.setTopSessionsMetric(id)}
				>{label}</button>
			{/each}
		</div>
	</header>
	<ol class="box gap-3xs unstyled">
		{#each sessions as item (item.id)}
			<li class="row ycenter gap-2xs pad-x-2xs pad-y-3xs border-bottom text-sm">
				<button class="link ta-l grow min0 truncate" onclick={() => observatory.selectSession(item.id)}>
					{item.display_name || item.first_message || item.id}
				</button>
				<span class="text-muted shrink-0 tabular-nums">{measure(item)}</span>
			</li>
		{:else}
			<li class="text-xs text-muted">No sessions in this range.</li>
		{/each}
	</ol>
</section>
