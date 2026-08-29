<script lang="ts">
	import { onMount } from 'svelte';
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import ObservatoryHeader from './ObservatoryHeader.svelte';
	import SessionSidebar from './SessionSidebar.svelte';
	import SessionFilterPanel from './SessionFilterPanel.svelte';
	import TranscriptViewer from './TranscriptViewer.svelte';
	import ActivityHeatmap from './ActivityHeatmap.svelte';
	import ActivityView from './ActivityView.svelte';
	import CostTreemap from './CostTreemap.svelte';
	import TopSkillsCard from './TopSkillsCard.svelte';
	import QualityDashboard from './QualityDashboard.svelte';
	import RecentEditsFeed from './RecentEditsFeed.svelte';
	import ProjectsDataTable from './ProjectsDataTable.svelte';
	import RecallView from './RecallView.svelte';
	import PinnedView from './PinnedView.svelte';
	import StatusFooter from './StatusFooter.svelte';
	import AgentComparisonCard from './AgentComparisonCard.svelte';
	import ModelBreakdownTable from './ModelBreakdownTable.svelte';

	onMount(() => observatory.load());
</script>

<!--
  Page type: observatory with optional session sidebar.
  Shell canon: .page-split when sidebar visible, otherwise a padded .page-shell main.
  All primitives from fractalstyler2 (.box, .row, .card, .field, .input, .select,
  .button, .badge, .text-*, .pad-*, .gap-*, .surface, .panel, .border, .shadow-*).
-->
<div class="page-shell wfull box">
	<ObservatoryHeader />

	{#if observatory.loading}
		<div class="box ycenter xcenter gap-sm pad-2xl">
			<div class="spinner" aria-hidden="true"></div>
			<span class="text-muted">Ingesting agent sessions…</span>
		</div>
	{:else if observatory.error}
		<div class="box ycenter xcenter gap-sm pad-2xl">
			<span class="text-danger">⚠ {observatory.error}</span>
			<button class="button primary" onclick={() => observatory.load()}>Retry</button>
		</div>
	{:else}
		<div class="observatory-body row grow min0">
			{#if observatory.activeTab === 'sessions' || observatory.selectedSessionId}
				<SessionSidebar />
			{/if}

			<main class="observatory-main grow min0">
				{#if observatory.selectedSessionId}
					<TranscriptViewer />
				{:else if observatory.activeTab === 'sessions'}
					<ActivityHeatmap />
				{:else if observatory.activeTab === 'usage'}
					<CostTreemap />
					<ModelBreakdownTable />
				{:else if observatory.activeTab === 'activity'}
					<ActivityView />
				{:else if observatory.activeTab === 'trends'}
					<TopSkillsCard />
				{:else if observatory.activeTab === 'quality'}
					<QualityDashboard />
					<AgentComparisonCard />
				{:else if observatory.activeTab === 'recent_edits'}
					<RecentEditsFeed />
				{:else if observatory.activeTab === 'data'}
					<ProjectsDataTable />
				{:else if observatory.activeTab === 'recalls'}
					<RecallView />
				{:else if observatory.activeTab === 'pinned'}
					<PinnedView />
				{/if}
			</main>

			<SessionFilterPanel />
		</div>

		<StatusFooter />
	{/if}
</div>
