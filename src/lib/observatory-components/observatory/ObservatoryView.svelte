<script lang="ts">
	import { onMount } from 'svelte';
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import { tabStore, HOME_TAB_ID, type Tab } from "$lib/stores/tabs";
	import Rail from '$lib/components/Rail.svelte';
	import ObservatoryHeader from './ObservatoryHeader.svelte';
	import SessionSidebar from './SessionSidebar.svelte';
	import SessionFilterPanel from './SessionFilterPanel.svelte';
	import TranscriptViewer from './TranscriptViewer.svelte';
	import ActivityHeatmap from './ActivityHeatmap.svelte';
	import ActivityView from './ActivityView.svelte';
	import UsageView from './UsageView.svelte';
	import TopSkillsCard from './TopSkillsCard.svelte';
	import QualityDashboard from './QualityDashboard.svelte';
	import RecentEditsFeed from './RecentEditsFeed.svelte';
	import ProjectsDataTable from './ProjectsDataTable.svelte';
	import RecallView from './RecallView.svelte';
	import PinnedView from './PinnedView.svelte';
	import StatusFooter from './StatusFooter.svelte';
	import AgentComparisonCard from './AgentComparisonCard.svelte';

	onMount(() => observatory.load());

	// A session is read alongside its list; every other tab is a dashboard and
	// gets the full width.
	const showSessionList = $derived(
		observatory.activeTab === 'sessions' || Boolean(observatory.selectedSessionId)
	);
</script>

<!--
  Page type: observatory — a dashboard surface.
  Shell canon: NOT .page-split. There is no permanent sidebar to split to; the
  filters are toolbar buttons and the session list only appears on the tabs
  that read one. The layout is header / canvas / footer in a full-bleed column.
-->
<div class="box grow min0 hfull">
	<ObservatoryHeader />
	{#if observatory.loading}
		<!--
		  Only a cold read blanks the canvas. A reconcile keeps the dashboard up
		  and reports itself in the status footer instead. The old copy said
		  "Ingesting" — Fractorches does the ingesting; this is a read.
		-->
		<div class="box grow ycenter xcenter gap-sm pad-2xl">
			<div class="spinner" aria-hidden="true"></div>
			<span class="text-muted">Reading agent sessions…</span>
		</div>
	{:else}
		<div class="row grow min0">
			{#if showSessionList}
				<Rail id="obs-sessions" side="left" label="Filtered sessions" initial={260} min={200} max={480}>
					<SessionSidebar />
				</Rail>
			{/if}

			<main class="grow min0 box gap-sm pad-sm scroll-y">
				{#if observatory.error}
					<!--
					  A failing endpoint is a notice inside the canvas, not a
					  replacement for the whole screen: whatever else loaded stays
					  readable underneath it.
					-->
					<div class="card border error-card row ycenter gap-sm pad-sm" role="alert">
						<div class="box gap-3xs grow min0">
							<span class="text-sm weight-600">Session index unavailable</span>
							<span class="text-xs mono text-muted">{observatory.error}</span>
						</div>
						<button class="button small ghost" onclick={() => observatory.load()}>Retry</button>
					</div>
				{/if}

				{#if observatory.selectedSessionId}
					<TranscriptViewer />
				{:else if observatory.activeTab === 'sessions'}
					<ActivityHeatmap />
				{:else if observatory.activeTab === 'usage'}
					<UsageView />
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

			<Rail
				id="obs-filters"
				side="right"
				label="Filters"
				initial={260}
				min={200}
				max={420}
				defaultCollapsed
			>
				<SessionFilterPanel />
			</Rail>
		</div>
		<StatusFooter />
	{/if}
</div>
