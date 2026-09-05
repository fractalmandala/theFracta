<script lang="ts">
	/**
	 * How fast the work actually moves.
	 *
	 * Percentiles rather than averages, because a handful of very slow turns
	 * drags a mean somewhere no session ever was. p50 is the typical turn; p90
	 * is the one worth investigating.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import type { VelocityMetrics } from '$lib/observatory-fractorches';

	const velocity = $derived(observatory.resources?.velocity ?? null);
	let view = $state<'overview' | 'agent' | 'complexity'>('overview');

	const groups = $derived(
		view === 'agent'
			? (velocity?.by_agent ?? [])
			: view === 'complexity'
				? (velocity?.by_complexity ?? [])
				: []
	);

	const secs = (n: number) => (n >= 60 ? `${(n / 60).toFixed(1)}m` : `${n.toFixed(1)}s`);
	const tiles = (m: VelocityMetrics) => [
		['Turn cycle p50', secs(m.turn_cycle_sec.p50)],
		['Turn cycle p90', secs(m.turn_cycle_sec.p90)],
		['First response p50', secs(m.first_response_sec.p50)],
		['First response p90', secs(m.first_response_sec.p90)],
		['Msgs / active min', m.msgs_per_active_min.toFixed(1)],
		['Tools / active min', m.tool_calls_per_active_min.toFixed(1)]
	];
</script>

<section class="box gap-2xs pad-md border-bottom">
	<header class="row ycenter xbetween gap-sm">
		<h3 class="text-sm weight-600">Velocity</h3>
		<div class="segmented shrink-0" role="group" aria-label="Velocity grouping">
			<button class="segmented-item" class:active={view === 'overview'} onclick={() => (view = 'overview')}>Overview</button>
			<button class="segmented-item" class:active={view === 'agent'} onclick={() => (view = 'agent')}>By agent</button>
			<button class="segmented-item" class:active={view === 'complexity'} onclick={() => (view = 'complexity')}>By size</button>
		</div>
	</header>

	{#if !velocity}
		<p class="text-xs text-muted">Not reported for this range.</p>
	{:else if view === 'overview'}
		<dl class="card-grid">
			{#each tiles(velocity.overall) as [label, value] (label)}
				<div class="card border pad-sm box gap-3xs">
					<dt class="text-2xs weight-500 text-muted tt-u">{label}</dt>
					<dd class="text-md weight-600 tabular-nums">{value}</dd>
				</div>
			{/each}
		</dl>
	{:else}
		<div class="scroll-x">
			<table class="table-clean text-xs">
				<thead>
					<tr>
						<th class="ta-l">{view === 'agent' ? 'Agent' : 'Session size'}</th>
						<th class="ta-r">Sessions</th>
						<th class="ta-r">Cycle p50</th>
						<th class="ta-r">Cycle p90</th>
						<th class="ta-r">Msgs/min</th>
						<th class="ta-r">Tools/min</th>
					</tr>
				</thead>
				<tbody>
					{#each groups as group (group.label)}
						<tr>
							<td class="truncate">{group.label}</td>
							<td class="ta-r tabular-nums">{group.sessions.toLocaleString()}</td>
							<td class="ta-r tabular-nums">{secs(group.overview.turn_cycle_sec.p50)}</td>
							<td class="ta-r tabular-nums">{secs(group.overview.turn_cycle_sec.p90)}</td>
							<td class="ta-r tabular-nums">{group.overview.msgs_per_active_min.toFixed(1)}</td>
							<td class="ta-r tabular-nums">{group.overview.tool_calls_per_active_min.toFixed(1)}</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="text-muted">Nothing reported for this range.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
