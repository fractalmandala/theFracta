import {
	createObservatoryFilter,
	getObservatoryResources,
	getSessionMessages,
	getSessionsSince,
	getUsagePairwise,
	searchSessions,
	type Filter,
	type Pairwise,
	type PairwiseDimension,
	type Pin,
	type Resources,
	type TranscriptMessage
} from '$lib/observatory-fractorches';

export type ObservatoryTab = 'sessions' | 'usage' | 'activity' | 'trends' | 'quality' | 'recalls' | 'pinned' | 'recent_edits' | 'data';
export type SearchMode = 'full_text';

type HeatmapMetric = 'messages' | 'sessions' | 'output_tokens';
type TopSessionsMetric = 'messages' | 'duration' | 'output_tokens';

/** Usage reads the same data as either spend or volume. */
export type UsageMode = 'cost' | 'token';
export type UsageTokenType = 'input' | 'cache_write' | 'cache_read' | 'output';
export const ALL_TOKEN_TYPES: UsageTokenType[] = ['input', 'cache_write', 'cache_read', 'output'];
/** Which dimension a Usage chart groups by. */
export type UsageGroupBy = 'project' | 'model' | 'agent';
export type PairwiseSelection = { dimension: PairwiseDimension; value: string };

class ObservatoryState {
	/** Which measure the calendar heatmap bands. The service bands each one
	 *  independently, so switching re-reads rather than re-scaling. */
	heatmapMetric = $state<HeatmapMetric>('messages');

	/** Which measure ranks Top Sessions. Ranked by the service, not re-sorted
	 *  here: duration and output tokens are not derivable from the messages
	 *  ranking's rows. */
	topSessionsMetric = $state<TopSessionsMetric>('messages');

	private viewOptions() {
		return {
			heatmapMetric: this.heatmapMetric,
			topSessionsMetric: this.topSessionsMetric,
			usageSort: this.usageMode === 'token' ? 'tokens' : 'cost',
			// Only sent when it narrows the ranking; all four types is the
			// service's own default and passing it back adds nothing.
			usageTokenTypes:
				this.usageMode === 'token' && this.usageTokenTypes.length < ALL_TOKEN_TYPES.length
					? this.usageTokenTypes.join(',')
					: undefined
		};
	}

	setHeatmapMetric(metric: HeatmapMetric): void {
		if (this.heatmapMetric === metric) return;
		this.heatmapMetric = metric;
		void this.refresh();
	}

	setTopSessionsMetric(metric: TopSessionsMetric): void {
		if (this.topSessionsMetric === metric) return;
		this.topSessionsMetric = metric;
		void this.refresh();
	}

	// --- Usage --------------------------------------------------------------
	//
	// Cost and tokens are the same rows read two ways, so the mode is a view
	// setting rather than a filter. It reaches the server only for the ranked
	// top-sessions list, which the service orders by whichever measure is asked
	// for; every other panel re-derives from data already in hand.

	usageMode = $state<UsageMode>('cost');
	usageTokenTypes = $state<UsageTokenType[]>([...ALL_TOKEN_TYPES]);
	usageTimeSeriesGroupBy = $state<UsageGroupBy>('project');
	usageAttributionGroupBy = $state<UsageGroupBy>('project');
	usageAttributionView = $state<'treemap' | 'list'>('treemap');
	/** Series the reader has clicked away, per dimension. */
	usageHidden = $state<Record<UsageGroupBy, string[]>>({ project: [], model: [], agent: [] });

	setUsageMode(mode: UsageMode): void {
		if (this.usageMode === mode) return;
		this.usageMode = mode;
		void this.refresh();
	}

	setUsageTokenTypes(types: UsageTokenType[]): void {
		// Never all-off: an empty selection would show zeroes everywhere and read
		// as "no data" rather than as "nothing selected".
		const next = ALL_TOKEN_TYPES.filter((type) => types.includes(type));
		if (next.length === 0) return;
		if (next.join(',') === this.usageTokenTypes.join(',')) return;
		this.usageTokenTypes = next;
		void this.refresh();
	}

	toggleUsageHidden(dimension: UsageGroupBy, id: string): void {
		const hidden = this.usageHidden[dimension];
		this.usageHidden = {
			...this.usageHidden,
			[dimension]: hidden.includes(id) ? hidden.filter((row) => row !== id) : [...hidden, id]
		};
	}

	clearUsageHidden(dimension: UsageGroupBy): void {
		this.usageHidden = { ...this.usageHidden, [dimension]: [] };
	}

	/** Sum only the token types currently selected. */
	sumTokens(row: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number }): number {
		let total = 0;
		for (const type of this.usageTokenTypes) {
			if (type === 'input') total += row.inputTokens;
			else if (type === 'output') total += row.outputTokens;
			else if (type === 'cache_read') total += row.cacheReadTokens;
			else total += row.cacheCreationTokens;
		}
		return total;
	}

	// Pairwise comparison is driven by two explicit selections rather than by
	// the shared filter, so it is fetched on demand and kept out of `resources`.
	pairwiseLeft = $state<PairwiseSelection>({ dimension: 'model', value: '' });
	pairwiseRight = $state<PairwiseSelection>({ dimension: 'model', value: '' });
	pairwise = $state<Pairwise | null>(null);
	pairwiseLoading = $state(false);
	pairwiseError = $state<string | null>(null);

	setPairwiseSide(side: 'left' | 'right', next: Partial<PairwiseSelection>): void {
		const current = side === 'left' ? this.pairwiseLeft : this.pairwiseRight;
		// Changing the dimension invalidates the value: a model name is not a
		// project key, and sending the stale one would ask a nonsense question.
		const merged = { ...current, ...next, ...(next.dimension && next.dimension !== current.dimension ? { value: '' } : {}) };
		if (side === 'left') this.pairwiseLeft = merged;
		else this.pairwiseRight = merged;
		void this.loadPairwise();
	}

	async loadPairwise(): Promise<void> {
		const { pairwiseLeft: left, pairwiseRight: right } = this;
		if (!left.value || !right.value) {
			this.pairwise = null;
			this.pairwiseError = null;
			return;
		}
		this.pairwiseLoading = true;
		this.pairwiseError = null;
		try {
			this.pairwise = await getUsagePairwise(this.filter(), left, right);
		} catch (error) {
			this.pairwise = null;
			this.pairwiseError = error instanceof Error ? error.message : String(error);
		} finally {
			this.pairwiseLoading = false;
		}
	}

	resources = $state<Resources | null>(null);
	loading = $state(false);
	syncing = $state(false);
	syncedCount = $state(0);
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
	usage = $derived(this.resources?.usage ?? null);
	topUsageSessions = $derived(this.resources?.topUsageSessions ?? []);
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

	// --- Cache and incremental sync -------------------------------------------
	//
	// A full read walks /sessions to exhaustion — 100 at a time, every session in
	// range — plus fourteen analytics calls. Doing that on every launch is why the
	// Observatory sat on a spinner each time it opened.
	//
	// The cache is keyed by the filter, because a result set built for one range
	// and project says nothing about another. Change a filter and the cache is
	// not stale, it is simply about a different question, so that path still does
	// a full read.
	private static CACHE_KEY = 'fracta.observatory.cache';
	private static CACHE_VERSION = 1;

	// active_since filters on the session's own end time, not on when Fractorches
	// ingested it, so the delta window overlaps the last refresh. Sessions that
	// come back twice are merged by id and cost nothing; a session missed at the
	// boundary would be invisible until the next full read.
	private static OVERLAP_MS = 5 * 60 * 1000;

	/** Identity of the question this data answers. */
	private filterKey(): string {
		const f = this.filter();
		return JSON.stringify([
			f.from, f.to, f.project ?? '', f.agent ?? '', f.model ?? '',
			f.starred ?? false, f.min_messages ?? 0,
			f.include_one_shot, f.include_automated
		]);
	}

	private persist() {
		if (!this.resources) return;
		try {
			localStorage.setItem(ObservatoryState.CACHE_KEY, JSON.stringify({
				v: ObservatoryState.CACHE_VERSION,
				key: this.filterKey(),
				at: this.lastRefresh,
				resources: this.resources
			}));
		} catch {
			// Quota exceeded on a very large corpus, or storage blocked. The app
			// works without a cache — it just pays for a full read next launch.
		}
	}

	private hydrate(): boolean {
		try {
			const raw = localStorage.getItem(ObservatoryState.CACHE_KEY);
			if (!raw) return false;
			const cached = JSON.parse(raw);
			if (cached?.v !== ObservatoryState.CACHE_VERSION) return false;
			if (cached.key !== this.filterKey()) return false;
			if (!cached.resources || !cached.at) return false;
			this.resources = cached.resources as Resources;
			this.lastRefresh = cached.at as string;
			return true;
		} catch {
			return false;
		}
	}

	async load(force = false) {
		if (this.resources && !force) return;
		// A cache for this exact question renders immediately, then reconciles.
		if (!force && this.hydrate()) {
			void this.sync();
			return;
		}
		this.loading = true;
		this.error = null;
		try {
			this.resources = await getObservatoryResources(this.filter(), this.viewOptions());
			this.lastRefresh = this.resources.refreshedAt;
			this.persist();
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Fractorches is unavailable';
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Reconcile cached data against the server without a full read.
	 *
	 * Sessions are fetched with active_since and merged by id. The analytics are
	 * aggregates over the whole range and cannot be merged from a delta, so they
	 * are re-read in full — fourteen parallel server-side aggregations, which is
	 * the cheap half. The expensive half was paging every session, and that is
	 * what this removes.
	 *
	 * `syncing` rather than `loading`: the canvas keeps showing what it has.
	 */
	async sync() {
		if (!this.resources || !this.lastRefresh || this.syncing) return;
		this.syncing = true;
		try {
			const since = new Date(
				new Date(this.lastRefresh).getTime() - ObservatoryState.OVERLAP_MS
			).toISOString();
			const filter = this.filter();
			const [changed, fresh] = await Promise.all([
				getSessionsSince(filter, since),
				getObservatoryResources(filter, { skipSessions: true, ...this.viewOptions() })
			]);
			const byId = new Map(this.resources.sessions.sessions.map((row) => [row.id, row]));
			for (const row of changed) byId.set(row.id, row);
			const merged = [...byId.values()].sort((a, b) =>
				(b.started_at ?? b.created_at).localeCompare(a.started_at ?? a.created_at)
			);
			this.resources = { ...fresh, sessions: { sessions: merged, total: merged.length } };
			this.lastRefresh = fresh.refreshedAt;
			this.error = null;
			this.syncedCount = changed.length;
			this.persist();
		} catch (error) {
			// A failed reconcile leaves the cached view in place; it is stale, not
			// wrong, and the footer says when it was read.
			this.error = error instanceof Error ? error.message : 'Fractorches is unavailable';
		} finally {
			this.syncing = false;
		}
	}

	async applyFilters() {
		this.clearSelectedSession();
		this.searchHits = null;
		this.searchSnippets = new Map();
		// A different filter is a different question: the cache cannot answer it.
		await this.load(true);
		if (this.searchQuery.trim()) await this.search();
	}

	/** Explicit refresh reconciles rather than re-reading everything. */
	async refresh() {
		if (this.resources) await this.sync();
		else await this.load(true);
	}

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
