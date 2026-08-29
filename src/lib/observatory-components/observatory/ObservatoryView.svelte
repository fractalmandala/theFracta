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

	onMount(() => {
		observatory.load();
	});
</script>

<div class="observatory-root">
	<!-- Header with tabs, search, export, filters -->
	<ObservatoryHeader />

	{#if observatory.loading}
		<div class="center-state">
			<div class="spinner"></div>
			<span>Ingesting agent sessions...</span>
		</div>
	{:else if observatory.error}
		<div class="center-state error">
			<span>⚠️ {observatory.error}</span>
			<button class="retry-btn" onclick={() => observatory.load()}>Retry</button>
		</div>
	{:else}
		<div class="observatory-body">
			<!-- Show Session Sidebar in Sessions tab or when a session is selected -->
			{#if observatory.activeTab === 'sessions' || observatory.selectedSessionId}
				<SessionSidebar />
			{/if}

			<main class="observatory-main">
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

			<!-- Filter Panel (slides in from right) -->
			<SessionFilterPanel />
		</div>

		<!-- Status Footer -->
		<StatusFooter />
	{/if}
</div>

