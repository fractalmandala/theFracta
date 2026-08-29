import {
	createObservatoryFilter,
	getObservatoryResources,
	getSessionMessages,
	searchSessions,
	type Filter,
	type Pin,
	type Resources,
	type TranscriptMessage
} from '$lib/observatory-fractorches';

export type ObservatoryTab = 'sessions' | 'usage' | 'activity' | 'trends' | 'quality' | 'recalls' | 'pinned' | 'recent_edits' | 'data';
export type SearchMode = 'full_text';

class ObservatoryState {
	resources = $state<Resources | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	lastRefresh = $state<string | null>(null);
	activeTab = $state<ObservatoryTab>('sessions');
	selectedSessionId = $state<string | null>(null);
	selectedTranscript = $state<TranscriptMessage[]>([]);
	transcriptLoading = $state(false);
	transcriptError = $state<string | null>(null);
	searchQuery = $state('');
	searchHits = $state<Set<string> | null>(null);
	searchSnippets = $state<Map<string, string>>(new Map());
	searching = $state(false);
	selectedAgent = $state('all');
	selectedProject = $state('all');
	selectedModel = $state('all');
	timeRange = $state('year');
	searchMode = $state<SearchMode>('full_text');
	filterPanelOpen = $state(false);
	groupBy = $state('');
	recentlyActive = $state(false);
	selectedAgents = $state<string[]>([]);
	dataActiveSubTab = $state('inventory');
	dataSelectedProject = $state<unknown>(null);
	recallActiveSubTab = $state('corpus');
	recallSelectedGeneration = $state('all');
	starredOnly = $state(false);
	hideSingleTurn = $state(false);
	includeAutomated = $state(false);
	includeOneShot = $state(false);
	hideUnknown = $state(false);
	dataProjectFilter = $state('');
	recallSearchQuery = $state('');
	recallSelectedProject = $state('all');
	recallSelectedType = $state('all');
	recallSelectedReviewState = $state('all');

	sessions = $derived(this.resources?.sessions.sessions ?? []);
	totalSessions = $derived(this.resources?.sessions.total ?? 0);
	overview = $derived(this.resources?.summary ?? null);
	availableAgents = $derived(this.resources?.agents.map((agent) => agent.name) ?? []);
	availableProjects = $derived(this.resources?.projects.map((project) => project.name) ?? []);
	availableModels = $derived(this.resources?.usage.modelTotals.flatMap((row) => row.model ? [row.model] : []) ?? []);
	activityCalendar = $derived(this.resources?.activity ?? []);
	hourlyMatrix = $derived(this.resources?.hours ?? []);
	costAttribution = $derived(this.resources?.usage.projectTotals ?? []);
	costOverTime = $derived(this.resources?.usage.daily ?? []);
	topSkills = $derived(this.resources?.skills ?? []);
	quality = $derived(this.resources?.signals ?? null);
	projectsTable = $derived(this.resources?.projectStats ?? []);
	toolUsage = $derived(this.resources?.tools ?? []);
	healthTrend = $derived(this.resources?.signals.trend ?? []);
	healthByAgent = $derived(this.resources?.signals.by_agent ?? []);
	healthByProject = $derived(this.resources?.signals.by_project ?? []);
	modelBreakdown = $derived(this.resources?.usage.modelTotals ?? []);
	topSessions = $derived(this.resources?.topSessions ?? []);
	recentEdits = $derived(this.resources?.recentEdits ?? []);
	pinnedMessages = $derived(this.resources?.pins ?? []);
	recallEntries = $derived(this.resources?.recall ?? []);
	recallStatus = $derived(this.resources ? { configured: true, corpus_count: this.resources.recall.length, insight_count: 0, insights_total: 0 } : null);
	recallAvailableTypes = $derived(['all', ...new Set(this.recallEntries.map((entry) => entry.type))]);
	recallAvailableGenerations = $derived(['all']);
	recallAvailableReviewStates = $derived(['all', ...new Set(this.recallEntries.map((entry) => entry.review_state))]);
	agentCounts = $derived(new Map((this.resources?.agents ?? []).map((agent) => [agent.name, agent.session_count])));
	filteredSessions = $derived.by(() => this.sessions.filter((item) => {
		if (this.searchQuery.trim() && !(this.searchHits?.has(item.id) ?? false)) return false;
		return !(this.hideUnknown && !item.project);
	}));
	filteredRecallEntries = $derived(this.recallEntries.filter((entry) => {
		const query = this.recallSearchQuery.trim().toLowerCase();
		return (!query || `${entry.title} ${entry.body}`.toLowerCase().includes(query)) &&
			(this.recallSelectedProject === 'all' || entry.project === this.recallSelectedProject) &&
			(this.recallSelectedType === 'all' || entry.type === this.recallSelectedType) &&
			(this.recallSelectedReviewState === 'all' || entry.review_state === this.recallSelectedReviewState);
	}));

	private filter(): Filter {
		return {
			...createObservatoryFilter(this.timeRange, this.selectedProject, this.selectedAgent, this.selectedModel),
			include_automated: this.includeAutomated,
			include_one_shot: this.includeOneShot,
			starred: this.starredOnly || undefined,
			min_messages: this.hideSingleTurn ? 2 : undefined
		};
	}

	async load(force = false) {
		if (this.resources && !force) return;
		this.loading = true;
		this.error = null;
		try {
			this.resources = await getObservatoryResources(this.filter());
			this.lastRefresh = this.resources.refreshedAt;
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Fractorches is unavailable';
		} finally {
			this.loading = false;
		}
	}

	async applyFilters() {
		this.clearSelectedSession();
		this.searchHits = null;
		this.searchSnippets = new Map();
		await this.load(true);
		if (this.searchQuery.trim()) await this.search();
	}

	async refresh() { await this.applyFilters(); }

	async search() {
		const query = this.searchQuery.trim();
		if (!query) {
			this.searchHits = null;
			this.searchSnippets = new Map();
			return;
		}
		this.searching = true;
		this.error = null;
		try {
			const results = await searchSessions(query, this.filter());
			this.searchHits = new Set(results.map((result) => result.session_id));
			this.searchSnippets = new Map(results.flatMap((result) => result.snippet ? [[result.session_id, result.snippet] as [string, string]] : []));
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Search failed';
		} finally {
			this.searching = false;
		}
	}

	async selectSession(id: string) {
		this.selectedSessionId = id;
		this.transcriptLoading = true;
		this.transcriptError = null;
		try {
			this.selectedTranscript = await getSessionMessages(id);
		} catch (error) {
			this.selectedTranscript = [];
			this.transcriptError = error instanceof Error ? error.message : 'Transcript unavailable';
		} finally {
			this.transcriptLoading = false;
		}
	}

	clearSelectedSession() { this.selectedSessionId = null; this.selectedTranscript = []; this.transcriptError = null; }

	exportSessionsCSV() {
		const headers = ['ID', 'Agent', 'Project', 'Title', 'Messages', 'Outcome', 'Health score', 'Created', 'Ended'];
		const rows = this.filteredSessions.map((item) => [item.id, item.agent, item.project, item.display_name || item.first_message || item.id, String(item.message_count), item.outcome, item.health_score === undefined ? '' : String(item.health_score), item.started_at || item.created_at, item.ended_at || ''].map((value) => `"${value.replaceAll('"', '""')}"`).join(','));
		const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `observatory-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	async togglePinMessage(pin: Pin) {
		const root = ((import.meta.env.VITE_FRACTORCHES_URL as string | undefined)?.trim() || '/api/v1').replace(/\/$/, '');
		const response = await fetch(`${root}/pins/${pin.id}`, { method: 'DELETE' });
		if (!response.ok) throw new Error(`Unable to unpin message (${response.status})`);
		await this.refresh();
	}
}

export const observatory = new ObservatoryState();
