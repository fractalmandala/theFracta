<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import type { Money } from '$lib/observatory-fractorches';
	import ContributionHeatmap from './ContributionHeatmap.svelte';
	import HourOfWeekPanel from './HourOfWeekPanel.svelte';
	import TopSessionsPanel from './TopSessionsPanel.svelte';
	import ProjectsPanel from './ProjectsPanel.svelte';
	import SessionShapePanel from './SessionShapePanel.svelte';
	import ToolUsagePanel from './ToolUsagePanel.svelte';
	import TopSkillsPanel from './TopSkillsPanel.svelte';
	import VelocityPanel from './VelocityPanel.svelte';
	import AgentComparisonCard from './AgentComparisonCard.svelte';
	import SkillTrendPanel from './SkillTrendPanel.svelte';
	import SessionHealthPanel from './SessionHealthPanel.svelte';

	let summary = $derived(observatory.overview);
	// Spend is reported by the usage endpoint rather than the overview one, so
	// it is read separately and may be absent while the rest is present.
	let totals = $derived(observatory.resources?.usage?.totals ?? null);

	// Every figure here is read from the Fractorches response. An absent value
	// renders as an em dash, never as a zero, so an unloaded panel is never
	// mistaken for an empty one.
	const plain = (n: number | undefined) =>
		n === undefined ? '—' : new Intl.NumberFormat().format(n);
	const compact = (n: number | undefined) =>
		n === undefined
			? '—'
			: new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
	// Fractorches reports cost in microdollars. No cost is inferred: an absent
	// total is an em dash, never $0.00.
	const money = (m: Money | undefined) =>
		m === undefined ? '—' : `$${(m.microdollars / 1_000_000).toFixed(2)}`;
</script>

<section class="box gap-md pad-md">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Sessions</p>
		<h2 class="text-lg weight-600">Overview</h2>
	</header>

	{#if summary}
		<dl class="card-grid">
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Sessions</dt>
				<dd class="text-md weight-600">{plain(summary.total_sessions)}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Messages</dt>
				<dd class="text-md weight-600">{plain(summary.total_messages)}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Output tokens</dt>
				<dd class="text-md weight-600">{compact(summary.total_output_tokens)}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Spend</dt>
				<dd class="text-md weight-600">{money(totals?.totalCost)}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Projects</dt>
				<dd class="text-md weight-600">{plain(summary.active_projects)}</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Messages / session</dt>
				<dd class="text-md weight-600">
					{plain(summary.median_messages)}
					<span class="text-2xs text-muted">med · p90 {plain(summary.p90_messages)}</span>
				</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Concentration</dt>
				<dd class="text-md weight-600">{(summary.concentration * 100).toFixed(1)}%</dd>
			</div>
			<div class="row xbetween gap-sm text-sm card border pad-sm box gap-3xs">
				<dt class="text-xs weight-600 text-muted tt-u">Active days</dt>
				<dd class="text-md weight-600">{summary.active_days}</dd>
			</div>
		</dl>
	{:else}
		<p class="text-muted text-sm">Summary is unavailable.</p>
	{/if}

	<!--
	  The rest of the dashboard. Ordered the way the questions get asked: when
	  the work happened, which sessions and projects it was, what shape those
	  sessions had, what they reached for, and how well they went.
	-->
	<ContributionHeatmap />
	<HourOfWeekPanel />
	<TopSessionsPanel />
	<ProjectsPanel />
	<SessionShapePanel />
	<ToolUsagePanel />
	<TopSkillsPanel />
	<SkillTrendPanel />
	<VelocityPanel />
	<AgentComparisonCard />
	<SessionHealthPanel />
</section>
