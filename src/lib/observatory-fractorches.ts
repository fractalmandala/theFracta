/** Typed Fractorches HTTP boundary. No local snapshot or parser is used. */

export type Money = { microdollars: number };
export type Filter = {
	from: string;
	to: string;
	timezone: string;
	project?: string;
	agent?: string;
	model?: string;
	starred?: boolean;
	min_messages?: number;
	include_one_shot: boolean;
	include_automated: boolean;
	include_children: boolean;
};
export type Session = {
	id: string;
	project: string;
	agent: string;
	first_message: string | null;
	display_name?: string;
	message_count: number;
	user_message_count: number;
	created_at: string;
	started_at: string | null;
	ended_at: string | null;
	health_score?: number;
	health_grade?: string;
	outcome: string;
	total_output_tokens: number;
	peak_context_tokens: number;
	compaction_count: number;
	is_automated: boolean;
	termination_status?: string;
};
export type Activity = { date: string; sessions: number; messages: number; user_messages: number; assistant_messages: number; tool_calls: number; thinking_messages: number; by_agent: Record<string, number> };
export type HourCell = { day_of_week: number; hour: number; messages: number };
export type ProjectAnalytics = { name: string; sessions: number; messages: number; avg_messages: number; first_session: string; last_session: string };
export type Summary = { active_days: number; active_projects: number; total_messages: number; total_sessions: number; avg_messages: number; median_messages: number; p90_messages: number; concentration: number; total_output_tokens: number };
/** One day of the calendar heatmap. `level` is the service's own banding. */
export type HeatmapDay = { date: string; value: number; level: number };
export type Heatmap = { metric: string; entries: HeatmapDay[] };
/** Session shape: how long sessions run, by three different measures. */
export type Bucket = { label: string; count: number };
export type SessionShape = { count: number; length: Bucket[]; duration: Bucket[]; autonomy: Bucket[] };
export type Percentiles = { p50: number; p90: number };
export type VelocityMetrics = { turn_cycle_sec: Percentiles; first_response_sec: Percentiles; msgs_per_active_min: number; chars_per_active_min: number; tool_calls_per_active_min: number };
export type VelocityGroup = { label: string; sessions: number; overview: VelocityMetrics };
export type Velocity = { overall: VelocityMetrics; by_agent: VelocityGroup[]; by_complexity: VelocityGroup[] };
/** The four token counters every usage row carries. */
export type UsageTokens = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number };
export type UsageBreakdown = UsageTokens & { id: string; label: string; cost: Money; project?: string; project_key?: string; model?: string; agent?: string; machine?: string };
export type UsageDay = UsageTokens & { date: string; totalCost: Money; projectBreakdowns: UsageBreakdown[]; modelBreakdowns: UsageBreakdown[]; agentBreakdowns: UsageBreakdown[]; machineBreakdowns: UsageBreakdown[] };
export type CacheStats = { cacheReadTokens: number; cacheCreationTokens: number; uncachedInputTokens: number; outputTokens: number; hitRate: number; savingsVsUncached: Money };
/** The prior period the service picked, and how this one compares to it. */
export type UsageComparison = { priorFrom: string; priorTo: string; priorTotalCost: Money; deltaPct: number };
/**
 * Where the costs came from.
 *
 * `fallbackModels` are models the pricing table had no row for, priced from a
 * default instead. That is a caveat on every cost figure below, so it is
 * carried through rather than dropped at the boundary.
 */
export type UsagePricing = { costSource: string; fallbackUsed: boolean; fallbackModels: string[] };
export type Usage = { totals: UsageTokens & { cacheSavings: Money; totalCost: Money; copilotAICredits: number }; daily: UsageDay[]; projectTotals: UsageBreakdown[]; modelTotals: UsageBreakdown[]; agentTotals: UsageBreakdown[]; sessionCounts: { total: number; byProject: Record<string, number>; byAgent: Record<string, number> }; cacheStats: CacheStats; pricing: UsagePricing; comparison: UsageComparison | null };
export type TopUsageSession = UsageTokens & { sessionId: string; displayName: string; agent: string; project: string; startedAt: string; totalTokens: number; cost: Money };
export type PairwiseDimension = 'model' | 'project';
export type PairwiseSide = UsageTokens & { totalCost: Money; totalTokens: number; sessionCount: number; costPerSession: Money; tokensPerSession: number };
export type PairwiseDeltas = { totalCostDelta: Money; totalCostDeltaRatio: number; inputTokensDelta: number; inputTokensDeltaRatio: number; outputTokensDelta: number; outputTokensDeltaRatio: number; cacheCreationDelta: number; cacheCreationDeltaRatio: number; cacheReadDelta: number; cacheReadDeltaRatio: number; totalTokensDelta: number; totalTokensDeltaRatio: number; sessionCountDelta: number; sessionCountDeltaRatio: number; costPerSessionDelta: Money; costPerSessionRatio: number; tokensPerSessionDelta: number; tokensPerSessionRatio: number };
export type Pairwise = { left: PairwiseSide; right: PairwiseSide; deltas: PairwiseDeltas };
export type Tool = { tool_name: string; category: string; call_count: number; session_count: number; pct: number };
export type Share = { name: string; count: number };
export type Skill = { skill_name: string; call_count: number; session_count: number; last_used_at: string; pct: number; agents: Share[]; projects: Share[] };
/** Skill calls per day, keyed by skill name. */
export type SkillTrendDay = { date: string; by_skill: Record<string, number> };
export type SignalAgent = { agent: string; avg_failure_signals: number; avg_health_score: number | null; completed_rate: number; session_count: number };
export type SignalProject = { avg_failure_signals: number; avg_health_score: number | null; completed_rate: number; project: string; session_count: number };
export type SignalTrend = { abandoned: number; avg_failure_signals: number; avg_health_score: number | null; completed: number; date: string; errored: number; session_count: number };
export type Signal = { avg_health_score: number | null; scored_sessions: number; unscored_sessions: number; grade_distribution: Record<string, number>; outcome_distribution: Record<string, number>; trend: SignalTrend[]; by_agent: SignalAgent[]; by_project: SignalProject[]; context_health: { avg_compaction_count: number; avg_context_pressure: number | null; high_pressure_sessions: number; mid_task_compaction_count: number; sessions_with_compaction: number; sessions_with_context_data: number; sessions_with_mid_task_compaction: number }; quality_health: { computed_sessions: number; totals: Record<string, number>; sessions_with_signal: Record<string, number> } };
export type TopSession = { active_duration_min: number; display_name?: string; duration_min: number; ended_at?: string; first_message: string | null; id: string; message_count: number; output_tokens: number; project: string; started_at?: string; termination_status?: string };
export type TranscriptMessage = { ordinal: number; role: string; content: string; timestamp: string; has_tool_use: boolean; is_compact_boundary?: boolean; tool_calls?: Array<{ tool_name: string; category: string; input_json: string }> };
export type RecentEdit = { project: string; file_path: string; edit_count: number; last_edited_at?: string; last_session_id: string; edits: Array<{ session_id: string; ordinal: number; tool_use_id?: string; call_index: number; tool_name: string; category: string; timestamp?: string }>; edits_truncated: boolean };
export type Pin = { id: number; message_id: number; ordinal: number; session_id: string; content?: string; created_at: string; session_project?: string; session_display_name?: string; session_first_message?: string; session_agent?: string; role?: string; note?: string };
export type RecallEntry = { id: string; type: string; scope: string; status: string; review_state: string; title: string; body: string; trigger?: string; uncertainty?: string; confidence?: number; project?: string; agent?: string; source_session_id: string; transferable: boolean; provenance_ok: boolean; created_at: string; updated_at: string };
export type Resources = { projects: Array<{ name: string; session_count: number }>; agents: Array<{ name: string; session_count: number }>; sessions: { sessions: Session[]; total: number }; summary: Summary; activity: Activity[]; hours: HourCell[]; projectStats: ProjectAnalytics[]; usage: Usage; topUsageSessions: TopUsageSession[]; tools: Tool[]; skills: Skill[]; skillTrend: SkillTrendDay[]; signals: Signal; topSessions: TopSession[]; heatmap: Heatmap; shape: SessionShape; velocity: Velocity; recentEdits: RecentEdit[]; pins: Pin[]; recall: RecallEntry[]; recallNext: string | null; refreshedAt: string };

type Obj = Record<string, unknown>;
const obj = (value: unknown, label: string): Obj => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid Fractorches ${label}`); return value as Obj; };
const arr = (value: unknown, label: string): Obj[] => { if (!Array.isArray(value)) throw new Error(`Invalid Fractorches ${label}`); return value.map((item) => obj(item, label)); };
const text = (value: unknown, label: string): string => { if (typeof value !== 'string') throw new Error(`Invalid Fractorches ${label}`); return value; };
const num = (value: unknown, label: string): number => { if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid Fractorches ${label}`); return value; };
const optionalText = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined;
const optionalNum = (value: unknown, label: string): number | undefined => value === undefined ? undefined : num(value, label);
const nullableNum = (value: unknown, label: string): number | null => value === null ? null : num(value, label);
const bool = (value: unknown, label: string): boolean => { if (typeof value !== 'boolean') throw new Error(`Invalid Fractorches ${label}`); return value; };
const strs = (value: unknown, label: string): string[] => { if (!Array.isArray(value)) throw new Error(`Invalid Fractorches ${label}`); return value.map((item) => text(item, label)); };
const money = (value: unknown): Money => ({ microdollars: num(obj(value, 'money').microdollars, 'money.microdollars') });
const numberMap = (value: unknown, label: string) => Object.fromEntries(Object.entries(obj(value, label)).map(([key, item]) => [key, num(item, `${label}.${key}`)]));
const base = (filter: Filter) => new URLSearchParams({ from: filter.from, to: filter.to, timezone: filter.timezone, include_one_shot: String(filter.include_one_shot), include_automated: String(filter.include_automated), include_children: String(filter.include_children), ...(filter.project ? { project: filter.project } : {}), ...(filter.agent ? { agent: filter.agent } : {}), ...(filter.model ? { model: filter.model } : {}) });
let resolvedBase: string | null = null;
let resolving: Promise<string> | null = null;

async function resolveEndpoint(): Promise<string> {
	const env = (import.meta.env.VITE_FRACTORCHES_URL as string | undefined)?.trim();
	if (env) { resolvedBase = env.replace(/\/$/, ''); return resolvedBase; }
	const { invoke } = await import('@tauri-apps/api/core');
	let nativeBridge = false;
	// Do not use a window-global heuristic for native detection. Tauri can
	// intentionally omit those globals while its typed IPC bridge remains
	// available. A successful command call is the capability check instead.
	for (let attempt = 0; attempt < 45; attempt++) {
		let base = '';
		try {
			base = (await invoke<string>('fractorches_base_url')).trim();
			nativeBridge = true;
		} catch {
			if (!nativeBridge) break;
		}
		if (base !== '') {
			resolvedBase = base.replace(/\/$/, '') + '/api/v1';
			return resolvedBase;
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	if (nativeBridge) {
		throw new Error('Fractorches sidecar did not become reachable within 90 seconds.');
	}
	resolvedBase = '/api/v1';
	return resolvedBase;
}

/**
 * Forget the resolved base so the next call asks Rust again.
 *
 * Called when a request fails to reach the server at all. The base was resolved
 * once and then reused for the life of the session, so a sidecar that moved or
 * died left every later request pointed at a dead port — and Retry re-ran the
 * same failing fetch against the same stale URL.
 */
function invalidateEndpoint(): void {
	resolvedBase = null;
	resolving = null;
}

/** A fetch that never reached the server, as opposed to one it answered badly. */
function isTransportFailure(error: unknown): boolean {
	return error instanceof TypeError;
}

function endpoint(): Promise<string> {
	if (resolvedBase !== null) return Promise.resolve(resolvedBase);
	if (!resolving) {
		resolving = resolveEndpoint().catch((error) => {
			resolving = null;
			throw error;
		});
	}
	return resolving;
}
async function get(path: string, params: URLSearchParams): Promise<Obj> {
	const base = await endpoint();
	let response: Response;
	try {
		response = await fetch(`${base}${path}?${params}`);
	} catch (error) {
		// TypeError from fetch means the request never reached a server. The
		// address is the suspect, not the endpoint, so drop it and let the next
		// attempt re-resolve — which is what makes Retry able to recover.
		if (isTransportFailure(error)) invalidateEndpoint();
		throw error;
	}
	if (!response.ok) throw new Error(`Fractorches ${path} failed (${response.status})`);
	return obj(await response.json(), path);
}
/**
 * A GET whose body is a bare JSON array.
 *
 * `/usage/top-sessions` answers with a list rather than an envelope, which
 * `get` rejects — it requires an object so a mis-shaped response fails at the
 * boundary rather than deeper in.
 */
async function getList(path: string, params: URLSearchParams): Promise<Obj[]> {
	const base = await endpoint();
	let response: Response;
	try {
		response = await fetch(`${base}${path}?${params}`);
	} catch (error) {
		if (isTransportFailure(error)) invalidateEndpoint();
		throw error;
	}
	if (!response.ok) throw new Error(`Fractorches ${path} failed (${response.status})`);
	return arr(await response.json(), path);
}
/** POST JSON and surface the service's `{error}` message verbatim — the
 * caller shows it, so compilation failures stay specific. */
async function post(path: string, body: unknown): Promise<Obj> { const base = await endpoint(); const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!response.ok) { let message = `Fractorches ${path} failed (${response.status})`; try { const data = await response.json() as Obj; if (typeof data.error === 'string') message = data.error; } catch { /* keep the status-only message */ } throw new Error(message); } return obj(await response.json(), path); }
function dateRange(name: string) { const end = new Date(); const start = new Date(end); if (name === 'week') start.setDate(start.getDate() - 6); else if (name === 'month') start.setMonth(start.getMonth() - 1); else start.setFullYear(start.getFullYear() - 1); const local = (value: Date) => { const year = value.getFullYear(); const month = String(value.getMonth() + 1).padStart(2, '0'); const day = String(value.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }; return { from: local(start), to: local(end) }; }
export function createObservatoryFilter(range: string, project: string, agent: string, model = 'all'): Filter { return { ...dateRange(range), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', project: project === 'all' ? undefined : project, agent: agent === 'all' ? undefined : agent, model: model === 'all' ? undefined : model, include_one_shot: false, include_automated: false, include_children: true }; }
const session = (value: Obj): Session => ({ id: text(value.id, 'session.id'), project: text(value.project, 'session.project'), agent: text(value.agent, 'session.agent'), first_message: value.first_message === null ? null : text(value.first_message, 'session.first_message'), display_name: optionalText(value.display_name), message_count: num(value.message_count, 'session.message_count'), user_message_count: num(value.user_message_count, 'session.user_message_count'), created_at: text(value.created_at, 'session.created_at'), started_at: value.started_at === null ? null : text(value.started_at, 'session.started_at'), ended_at: value.ended_at === null ? null : text(value.ended_at, 'session.ended_at'), health_score: optionalNum(value.health_score, 'session.health_score'), health_grade: optionalText(value.health_grade), outcome: text(value.outcome, 'session.outcome'), total_output_tokens: num(value.total_output_tokens, 'session.total_output_tokens'), peak_context_tokens: num(value.peak_context_tokens, 'session.peak_context_tokens'), compaction_count: num(value.compaction_count, 'session.compaction_count'), is_automated: bool(value.is_automated, 'session.is_automated'), termination_status: optionalText(value.termination_status) });
/**
 * Usage, parsed whole.
 *
 * The service answers `/usage/summary` with far more than the totals: per-day
 * breakdowns along four dimensions, cache statistics, session counts, and the
 * provenance of the prices it used. All of it is read here, because the
 * alternative is a dashboard that quietly recomputes figures the service has
 * already computed — and would compute differently.
 *
 * A breakdown row names its dimension with a different key on each dimension
 * (`project`/`project_key`, `model` or `modelName`, `agent`, `machineName`).
 * Each is normalised to `id` and `label` so a chart can group by any of them
 * without knowing which one it was handed.
 */
function usageBreakdown(value: Obj, label: string): UsageBreakdown {
	const tokens = { inputTokens: num(value.inputTokens, `${label}.inputTokens`), outputTokens: num(value.outputTokens, `${label}.outputTokens`), cacheReadTokens: num(value.cacheReadTokens, `${label}.cacheReadTokens`), cacheCreationTokens: num(value.cacheCreationTokens, `${label}.cacheCreationTokens`) };
	const cost = money(value.cost ?? value.totalCost);
	const model = optionalText(value.model) ?? optionalText(value.modelName);
	const machine = optionalText(value.machineName);
	const agent = optionalText(value.agent);
	const projectKey = optionalText(value.project_key);
	const project = optionalText(value.project);
	// A project is identified by its key and shown by its label; every other
	// dimension is its own identity. An unattributed row keeps an empty id so
	// the panel can label it rather than silently merging it with a neighbour.
	const id = projectKey ?? model ?? agent ?? machine ?? '';
	const display = project || model || agent || machine || '';
	return { ...tokens, cost, id, label: display, ...(project !== undefined ? { project } : {}), ...(projectKey !== undefined ? { project_key: projectKey } : {}), ...(model !== undefined ? { model } : {}), ...(agent !== undefined ? { agent } : {}), ...(machine !== undefined ? { machine } : {}) };
}

function usageBreakdowns(value: unknown, label: string): UsageBreakdown[] {
	return arr(value ?? [], label).map((row) => usageBreakdown(row, label));
}

function parseUsage(value: Obj, comparison: UsageComparison | null): Usage {
	const totals = obj(value.totals, 'usage.totals');
	const cache = obj(value.cacheStats, 'usage.cacheStats');
	const counts = obj(value.sessionCounts ?? { total: 0, byProject: {}, byAgent: {} }, 'usage.sessionCounts');
	const pricing = obj(value.pricing ?? {}, 'usage.pricing');
	const fallback = obj(pricing.fallback ?? { used: false, models: [] }, 'usage.pricing.fallback');
	return {
		totals: {
			inputTokens: num(totals.inputTokens, 'totals.inputTokens'),
			outputTokens: num(totals.outputTokens, 'totals.outputTokens'),
			cacheReadTokens: num(totals.cacheReadTokens, 'totals.cacheReadTokens'),
			cacheCreationTokens: num(totals.cacheCreationTokens, 'totals.cacheCreationTokens'),
			cacheSavings: money(totals.cacheSavings),
			totalCost: money(totals.totalCost),
			// Copilot is the only provider that reports credits; every other
			// response omits the field entirely rather than sending zero.
			copilotAICredits: optionalNum(totals.copilotAICredits, 'totals.copilotAICredits') ?? 0
		},
		daily: arr(value.daily, 'usage.daily').map((i) => ({
			date: text(i.date, 'daily.date'),
			totalCost: money(i.totalCost),
			inputTokens: num(i.inputTokens, 'daily.inputTokens'),
			outputTokens: num(i.outputTokens, 'daily.outputTokens'),
			cacheReadTokens: num(i.cacheReadTokens, 'daily.cacheReadTokens'),
			cacheCreationTokens: num(i.cacheCreationTokens, 'daily.cacheCreationTokens'),
			projectBreakdowns: usageBreakdowns(i.projectBreakdowns, 'daily.projectBreakdowns'),
			modelBreakdowns: usageBreakdowns(i.modelBreakdowns, 'daily.modelBreakdowns'),
			agentBreakdowns: usageBreakdowns(i.agentBreakdowns, 'daily.agentBreakdowns'),
			machineBreakdowns: usageBreakdowns(i.machineBreakdowns, 'daily.machineBreakdowns')
		})),
		projectTotals: usageBreakdowns(value.projectTotals, 'usage.projectTotals'),
		modelTotals: usageBreakdowns(value.modelTotals, 'usage.modelTotals'),
		agentTotals: usageBreakdowns(value.agentTotals, 'usage.agentTotals'),
		sessionCounts: {
			total: num(counts.total ?? 0, 'sessionCounts.total'),
			byProject: numberMap(counts.byProject ?? {}, 'sessionCounts.byProject'),
			byAgent: numberMap(counts.byAgent ?? {}, 'sessionCounts.byAgent')
		},
		cacheStats: {
			cacheReadTokens: num(cache.cacheReadTokens, 'cacheStats.cacheReadTokens'),
			cacheCreationTokens: num(cache.cacheCreationTokens, 'cacheStats.cacheCreationTokens'),
			uncachedInputTokens: num(cache.uncachedInputTokens, 'cacheStats.uncachedInputTokens'),
			outputTokens: num(cache.outputTokens, 'cacheStats.outputTokens'),
			hitRate: num(cache.hitRate, 'cacheStats.hitRate'),
			savingsVsUncached: money(cache.savingsVsUncached)
		},
		pricing: {
			costSource: optionalText(pricing.cost_source) ?? '',
			fallbackUsed: fallback.used === true,
			fallbackModels: Array.isArray(fallback.models) ? strs(fallback.models, 'pricing.fallback.models') : []
		},
		comparison
	};
}

async function getUsageComparison(filter: Filter, currentMicrodollars: number): Promise<UsageComparison> {
	const params = base(filter);
	params.set('current_microdollars', String(currentMicrodollars));
	const response = await get('/usage/comparison', params);
	return {
		priorFrom: text(response.priorFrom, 'comparison.priorFrom'),
		priorTo: text(response.priorTo, 'comparison.priorTo'),
		priorTotalCost: money(response.priorTotalCost),
		deltaPct: num(response.deltaPct, 'comparison.deltaPct')
	};
}

const topUsageSession = (value: Obj): TopUsageSession => ({
	sessionId: text(value.sessionId, 'topUsage.sessionId'),
	displayName: optionalText(value.displayName) ?? '',
	agent: optionalText(value.agent) ?? '',
	project: optionalText(value.project) ?? '',
	startedAt: optionalText(value.startedAt) ?? '',
	inputTokens: num(value.inputTokens, 'topUsage.inputTokens'),
	outputTokens: num(value.outputTokens, 'topUsage.outputTokens'),
	cacheReadTokens: num(value.cacheReadTokens, 'topUsage.cacheReadTokens'),
	cacheCreationTokens: num(value.cacheCreationTokens, 'topUsage.cacheCreationTokens'),
	totalTokens: num(value.totalTokens, 'topUsage.totalTokens'),
	cost: money(value.cost)
});

const pairwiseSide = (value: Obj, label: string): PairwiseSide => ({
	inputTokens: num(value.inputTokens, `${label}.inputTokens`),
	outputTokens: num(value.outputTokens, `${label}.outputTokens`),
	cacheReadTokens: num(value.cacheReadTokens, `${label}.cacheReadTokens`),
	cacheCreationTokens: num(value.cacheCreationTokens, `${label}.cacheCreationTokens`),
	totalTokens: num(value.totalTokens, `${label}.totalTokens`),
	totalCost: money(value.totalCost),
	sessionCount: num(value.sessionCount, `${label}.sessionCount`),
	costPerSession: money(value.costPerSession),
	tokensPerSession: num(value.tokensPerSession, `${label}.tokensPerSession`)
});

/**
 * Two slices of usage, compared.
 *
 * Driven by two explicit selections rather than by the shared filter, so it is
 * fetched on demand instead of with the rest of the dashboard. Both deltas and
 * ratios come from the service; computing them here would risk a second, subtly
 * different definition of the same number.
 */
export async function getUsagePairwise(
	filter: Filter,
	left: { dimension: PairwiseDimension; value: string },
	right: { dimension: PairwiseDimension; value: string }
): Promise<Pairwise> {
	const params = base(filter);
	params.set('left_dimension', left.dimension);
	params.set('left_value', left.value);
	params.set('right_dimension', right.dimension);
	params.set('right_value', right.value);
	const response = await get('/usage/pairwise-comparison', params);
	return {
		left: pairwiseSide(obj(response.left, 'pairwise.left'), 'pairwise.left'),
		right: pairwiseSide(obj(response.right, 'pairwise.right'), 'pairwise.right'),
		deltas: (() => {
			const d = obj(response.deltas, 'pairwise.deltas');
			return {
				totalCostDelta: money(d.totalCostDelta),
				totalCostDeltaRatio: num(d.totalCostDeltaRatio, 'deltas.totalCostDeltaRatio'),
				inputTokensDelta: num(d.inputTokensDelta, 'deltas.inputTokensDelta'),
				inputTokensDeltaRatio: num(d.inputTokensDeltaRatio, 'deltas.inputTokensDeltaRatio'),
				outputTokensDelta: num(d.outputTokensDelta, 'deltas.outputTokensDelta'),
				outputTokensDeltaRatio: num(d.outputTokensDeltaRatio, 'deltas.outputTokensDeltaRatio'),
				cacheCreationDelta: num(d.cacheCreationDelta, 'deltas.cacheCreationDelta'),
				cacheCreationDeltaRatio: num(d.cacheCreationDeltaRatio, 'deltas.cacheCreationDeltaRatio'),
				cacheReadDelta: num(d.cacheReadDelta, 'deltas.cacheReadDelta'),
				cacheReadDeltaRatio: num(d.cacheReadDeltaRatio, 'deltas.cacheReadDeltaRatio'),
				totalTokensDelta: num(d.totalTokensDelta, 'deltas.totalTokensDelta'),
				totalTokensDeltaRatio: num(d.totalTokensDeltaRatio, 'deltas.totalTokensDeltaRatio'),
				sessionCountDelta: num(d.sessionCountDelta, 'deltas.sessionCountDelta'),
				sessionCountDeltaRatio: num(d.sessionCountDeltaRatio, 'deltas.sessionCountDeltaRatio'),
				costPerSessionDelta: money(d.costPerSessionDelta),
				costPerSessionRatio: num(d.costPerSessionRatio, 'deltas.costPerSessionRatio'),
				tokensPerSessionDelta: num(d.tokensPerSessionDelta, 'deltas.tokensPerSessionDelta'),
				tokensPerSessionRatio: num(d.tokensPerSessionRatio, 'deltas.tokensPerSessionRatio')
			};
		})()
	};
}

/**
 * Sessions active at or after `since`, for incremental refresh.
 *
 * Fractorches filters this as
 *   COALESCE(NULLIF(ended_at,''), NULLIF(started_at,''), created_at) >= ?
 * so it returns sessions whose activity reaches past the cutoff — including
 * ones that started earlier and gained messages since. That is what makes a
 * delta safe: an in-progress session comes back with its new message count
 * rather than being missed.
 *
 * The caveat is that it filters on the session's own clock, not on when
 * Fractorches ingested it. A session finished before the cutoff and re-ingested
 * afterwards (a corrected or re-scanned log) will NOT appear, which is why the
 * caller overlaps the window rather than using lastRefresh exactly.
 */
export async function getSessionsSince(filter: Filter, since: string): Promise<Session[]> {
	const params = base(filter);
	params.set('date_from', filter.from);
	params.set('date_to', filter.to);
	params.set('active_since', since);
	params.set('limit', '100');
	params.set('order_by', 'recent');
	if (filter.starred) params.set('starred', 'true');
	if (filter.min_messages) params.set('min_messages', String(filter.min_messages));
	const out: Session[] = [];
	let cursor: string | undefined;
	do {
		if (cursor) params.set('cursor', cursor);
		const page = await get('/sessions', params);
		out.push(...arr(page.sessions, 'sessions').map(session));
		cursor = optionalText(page.next_cursor);
	} while (cursor);
	return out;
}

/**
 * The full Observatory read.
 *
 * `skipSessions` omits the /sessions walk — the only unbounded part of this,
 * paging 100 at a time through every session in range. An incremental refresh
 * fetches just the changed sessions separately and merges them, but still needs
 * the analytics, which are whole-range aggregates and cannot be merged from a
 * delta. This flag is what lets it ask for the second without paying for the
 * first.
 */
export async function getObservatoryResources(filter: Filter, options: { skipSessions?: boolean; heatmapMetric?: string; topSessionsMetric?: string; usageSort?: string; usageTokenTypes?: string } = {}): Promise<Resources> {
	// Both endpoints band and rank per metric, so the choice is a query
	// parameter rather than something to re-sort client-side.
	const heatmapMetric = options.heatmapMetric ?? 'messages';
	const topMetric = options.topSessionsMetric ?? 'messages';
	// Usage's own top-sessions list ranks by cost or by tokens, and in token
	// mode by whichever token types are selected. Both are server-side, for the
	// same reason the analytics ranking is: the rows differ, not just the order.
	const usageSort = options.usageSort ?? 'cost';
	const sessionParams = base(filter); sessionParams.set('date_from', filter.from); sessionParams.set('date_to', filter.to); sessionParams.set('limit', '100'); sessionParams.set('order_by', 'recent');
	const pages: Session[] = []; let cursor: string | undefined; let total = 0;
	if (filter.starred) sessionParams.set('starred', 'true');
	if (filter.min_messages) sessionParams.set('min_messages', String(filter.min_messages));
	if (!options.skipSessions) {
		do { if (cursor) sessionParams.set('cursor', cursor); const page = await get('/sessions', sessionParams); total = num(page.total, 'sessions.total'); pages.push(...arr(page.sessions, 'sessions').map(session)); cursor = optionalText(page.next_cursor); } while (cursor);
	}
	const [projects, agents, summary, activity, hours, projectStats, usage, topUsage, tools, skills, signals, top, heatmap, shape, velocity, recent, pins, recall] = await Promise.all([get('/projects', new URLSearchParams({ include_one_shot: String(filter.include_one_shot), include_automated: String(filter.include_automated) })), get('/agents', new URLSearchParams({ include_one_shot: String(filter.include_one_shot), include_automated: String(filter.include_automated) })), get('/analytics/summary', base(filter)), get('/analytics/activity', new URLSearchParams(`${base(filter)}&granularity=day`)), get('/analytics/hour-of-week', base(filter)), get('/analytics/projects', base(filter)), get('/usage/summary', new URLSearchParams(`${base(filter)}&breakdowns=true&session_counts=true`)), getList('/usage/top-sessions', new URLSearchParams(`${base(filter)}&limit=10&sort=${usageSort}${options.usageTokenTypes ? `&token_types=${options.usageTokenTypes}` : ''}`)), get('/analytics/tools', base(filter)), get('/analytics/skills', new URLSearchParams(`${base(filter)}&granularity=day`)), get('/analytics/signals', base(filter)), get('/analytics/top-sessions', new URLSearchParams(`${base(filter)}&metric=${topMetric}`)), get('/analytics/heatmap', new URLSearchParams(`${base(filter)}&metric=${heatmapMetric}`)), get('/analytics/sessions', base(filter)), get('/analytics/velocity', base(filter)), get('/recent-edits', new URLSearchParams({ limit: '100', offset: '0', ...(filter.project ? { project: filter.project } : {}) })), get('/pins', new URLSearchParams(filter.project ? { project: filter.project } : {})), get('/recall/entries', new URLSearchParams({ limit: '100', ...(filter.project ? { project: filter.project } : {}), ...(filter.agent ? { agent: filter.agent } : {}) }))]);
	const s = obj(summary, 'summary');
	const activityRows = arr(activity.series, 'activity').map((i) => ({ date: text(i.date, 'activity.date'), sessions: num(i.sessions, 'activity.sessions'), messages: num(i.messages, 'activity.messages'), user_messages: num(i.user_messages, 'activity.user_messages'), assistant_messages: num(i.assistant_messages, 'activity.assistant_messages'), tool_calls: num(i.tool_calls, 'activity.tool_calls'), thinking_messages: num(i.thinking_messages, 'activity.thinking_messages'), by_agent: numberMap(i.by_agent, 'activity.by_agent') }));
	const usageObj = obj(usage, 'usage');
	// The service computes the prior period itself but needs this period's total
	// to state a delta, so this is a second round trip rather than part of the
	// batch above. A failure here costs the "vs prior" sub-label and nothing
	// else, so it degrades to an absent comparison instead of failing the read.
	const comparison = await getUsageComparison(filter, money(obj(usageObj.totals, 'usage.totals').totalCost).microdollars).catch(() => null);
	const parsedUsage = parseUsage(usageObj, comparison);
	return { projects: arr(projects.projects, 'projects').map((i) => ({ name: text(i.name, 'project.name'), session_count: num(i.session_count, 'project.session_count') })), agents: arr(agents.agents, 'agents').map((i) => ({ name: text(i.name, 'agent.name'), session_count: num(i.session_count, 'agent.session_count') })), sessions: { sessions: pages, total: num((await Promise.resolve({ total: pages.length })).total, 'sessions.total') }, summary: { active_days: num(s.active_days, 'summary.active_days'), active_projects: num(s.active_projects, 'summary.active_projects'), total_messages: num(s.total_messages, 'summary.total_messages'), total_sessions: num(s.total_sessions, 'summary.total_sessions'), avg_messages: num(s.avg_messages, 'summary.avg_messages'), median_messages: num(s.median_messages, 'summary.median_messages'), p90_messages: num(s.p90_messages, 'summary.p90_messages'), concentration: num(s.concentration, 'summary.concentration'), total_output_tokens: num(s.total_output_tokens, 'summary.total_output_tokens') }, activity: activityRows, hours: arr(hours.cells, 'hours').map((i) => ({ day_of_week: num(i.day_of_week, 'hour.day'), hour: num(i.hour, 'hour.hour'), messages: num(i.messages, 'hour.messages') })), projectStats: arr(projectStats.projects, 'project stats').map((i) => ({ name: text(i.name, 'project.name'), sessions: num(i.sessions, 'project.sessions'), messages: num(i.messages, 'project.messages'), avg_messages: num(i.avg_messages, 'project.avg_messages'), first_session: text(i.first_session, 'project.first_session'), last_session: text(i.last_session, 'project.last_session') })), usage: parsedUsage, topUsageSessions: topUsage.map(topUsageSession), tools: arr(tools.by_tool, 'tools').map((i) => ({ tool_name: text(i.tool_name, 'tool.name'), category: text(i.category, 'tool.category'), call_count: num(i.call_count, 'tool.calls'), session_count: num(i.session_count, 'tool.sessions'), pct: num(i.pct, 'tool.pct') })), skills: arr(skills.by_skill, 'skills').map((i) => ({ skill_name: text(i.skill_name, 'skill.name'), call_count: num(i.call_count, 'skill.calls'), session_count: num(i.session_count, 'skill.sessions'), last_used_at: text(i.last_used_at, 'skill.last_used_at'), pct: num(i.pct, 'skill.pct'), agents: shares(i.agent_breakdown, 'agent', 'skill.agents'), projects: shares(i.project_breakdown, 'project', 'skill.projects') })), skillTrend: arr(skills.trend, 'skill trend').map((i) => ({ date: text(i.date, 'skillTrend.date'), by_skill: numberMap(i.by_skill, 'skillTrend.by_skill') })), signals: parseSignals(signals), heatmap: parseHeatmap(heatmap), shape: parseShape(shape), velocity: parseVelocity(velocity), topSessions: arr(top.sessions, 'top sessions').map((i) => ({ active_duration_min: num(i.active_duration_min, 'top.active_duration_min'), display_name: optionalText(i.display_name), duration_min: num(i.duration_min, 'top.duration_min'), ended_at: optionalText(i.ended_at), first_message: i.first_message === null ? null : text(i.first_message, 'top.first_message'), id: text(i.id, 'top.id'), message_count: num(i.message_count, 'top.message_count'), output_tokens: num(i.output_tokens, 'top.output_tokens'), project: text(i.project, 'top.project'), started_at: optionalText(i.started_at), termination_status: optionalText(i.termination_status) })), recentEdits: parseRecent(recent), pins: parsePins(pins), recall: parseRecall(recall), recallNext: optionalText(recall.next_cursor) || null, refreshedAt: new Date().toISOString() };
}
/** The service names these fields differently per breakdown; normalise once. */
const shares = (value: unknown, key: string, label: string): Share[] => value === undefined || value === null ? [] : arr(value, label).map((i) => ({ name: text(i[key], `${label}.${key}`), count: num(i.count, `${label}.count`) }));

const buckets = (value: unknown, label: string): Bucket[] => arr(value, label).map((i) => ({ label: text(i.label, `${label}.label`), count: num(i.count, `${label}.count`) }));

function parseHeatmap(value: Obj): Heatmap { return { metric: text(value.metric, 'heatmap.metric'), entries: arr(value.entries, 'heatmap.entries').map((i) => ({ date: text(i.date, 'heatmap.date'), value: num(i.value, 'heatmap.value'), level: num(i.level, 'heatmap.level') })) }; }

function parseShape(value: Obj): SessionShape { return { count: num(value.count, 'shape.count'), length: buckets(value.length_distribution, 'shape.length'), duration: buckets(value.duration_distribution, 'shape.duration'), autonomy: buckets(value.autonomy_distribution, 'shape.autonomy') }; }

const percentiles = (value: unknown, label: string): Percentiles => { const p = obj(value, label); return { p50: num(p.p50, `${label}.p50`), p90: num(p.p90, `${label}.p90`) }; };
const velocityMetrics = (value: unknown, label: string): VelocityMetrics => { const v = obj(value, label); return { turn_cycle_sec: percentiles(v.turn_cycle_sec, `${label}.turn_cycle`), first_response_sec: percentiles(v.first_response_sec, `${label}.first_response`), msgs_per_active_min: num(v.msgs_per_active_min, `${label}.msgs`), chars_per_active_min: num(v.chars_per_active_min, `${label}.chars`), tool_calls_per_active_min: num(v.tool_calls_per_active_min, `${label}.tools`) }; };
const velocityGroups = (value: unknown, label: string): VelocityGroup[] => arr(value, label).map((i) => ({ label: text(i.label, `${label}.label`), sessions: num(i.sessions, `${label}.sessions`), overview: velocityMetrics(i.overview, `${label}.overview`) }));

function parseVelocity(value: Obj): Velocity { return { overall: velocityMetrics(value.overall, 'velocity.overall'), by_agent: velocityGroups(value.by_agent, 'velocity.by_agent'), by_complexity: velocityGroups(value.by_complexity, 'velocity.by_complexity') }; }

function parseSignals(value: Obj): Signal { const context = obj(value.context_health, 'context_health'); const quality = obj(value.quality_health, 'quality_health'); return { avg_health_score: nullableNum(value.avg_health_score, 'signals.avg_health_score'), scored_sessions: num(value.scored_sessions, 'signals.scored_sessions'), unscored_sessions: num(value.unscored_sessions, 'signals.unscored_sessions'), grade_distribution: numberMap(value.grade_distribution, 'signals.grade_distribution'), outcome_distribution: numberMap(value.outcome_distribution, 'signals.outcome_distribution'), trend: arr(value.trend, 'signals.trend').map((i) => ({ abandoned: num(i.abandoned, 'trend.abandoned'), avg_failure_signals: num(i.avg_failure_signals, 'trend.failures'), avg_health_score: nullableNum(i.avg_health_score, 'trend.health'), completed: num(i.completed, 'trend.completed'), date: text(i.date, 'trend.date'), errored: num(i.errored, 'trend.errored'), session_count: num(i.session_count, 'trend.sessions') })), by_agent: arr(value.by_agent, 'signals.by_agent').map((i) => ({ agent: text(i.agent, 'agent.name'), avg_failure_signals: num(i.avg_failure_signals, 'agent.failures'), avg_health_score: nullableNum(i.avg_health_score, 'agent.health'), completed_rate: num(i.completed_rate, 'agent.completed_rate'), session_count: num(i.session_count, 'agent.sessions') })), by_project: arr(value.by_project, 'signals.by_project').map((i) => ({ avg_failure_signals: num(i.avg_failure_signals, 'project.failures'), avg_health_score: nullableNum(i.avg_health_score, 'project.health'), completed_rate: num(i.completed_rate, 'project.completed_rate'), project: text(i.project, 'project.name'), session_count: num(i.session_count, 'project.sessions') })), context_health: { avg_compaction_count: num(context.avg_compaction_count, 'context.compactions'), avg_context_pressure: nullableNum(context.avg_context_pressure, 'context.pressure'), high_pressure_sessions: num(context.high_pressure_sessions, 'context.high'), mid_task_compaction_count: num(context.mid_task_compaction_count, 'context.mid_task'), sessions_with_compaction: num(context.sessions_with_compaction, 'context.sessions_compaction'), sessions_with_context_data: num(context.sessions_with_context_data, 'context.sessions_data'), sessions_with_mid_task_compaction: num(context.sessions_with_mid_task_compaction, 'context.sessions_mid_task') }, quality_health: { computed_sessions: num(quality.computed_sessions, 'quality.computed'), totals: numberMap(quality.totals, 'quality.totals'), sessions_with_signal: numberMap(quality.sessions_with_signal, 'quality.sessions') } }; }
function parseRecent(value: Obj): RecentEdit[] { return arr(value.files, 'recent files').map((i) => ({ project: text(i.project, 'edit.project'), file_path: text(i.file_path, 'edit.file_path'), edit_count: num(i.edit_count, 'edit.count'), last_edited_at: optionalText(i.last_edited_at), last_session_id: text(i.last_session_id, 'edit.session'), edits: arr(i.edits, 'edit.entries').map((e) => ({ session_id: text(e.session_id, 'edit.session_id'), ordinal: num(e.ordinal, 'edit.ordinal'), tool_use_id: optionalText(e.tool_use_id), call_index: num(e.call_index, 'edit.call_index'), tool_name: text(e.tool_name, 'edit.tool_name'), category: text(e.category, 'edit.category'), timestamp: optionalText(e.timestamp) })), edits_truncated: bool(i.edits_truncated, 'edit.truncated') })); }
function parsePins(value: Obj): Pin[] { return arr(value.pins, 'pins').map((i) => ({ id: num(i.id, 'pin.id'), message_id: num(i.message_id, 'pin.message_id'), ordinal: num(i.ordinal, 'pin.ordinal'), session_id: text(i.session_id, 'pin.session_id'), content: optionalText(i.content), created_at: text(i.created_at, 'pin.created_at'), session_project: optionalText(i.session_project), session_display_name: optionalText(i.session_display_name), session_first_message: optionalText(i.session_first_message), session_agent: optionalText(i.session_agent), role: optionalText(i.role), note: optionalText(i.note) })); }
function parseRecallEntry(i: Obj): RecallEntry { return { id: text(i.id, 'recall.id'), type: text(i.type, 'recall.type'), scope: text(i.scope, 'recall.scope'), status: text(i.status, 'recall.status'), review_state: text(i.review_state, 'recall.review_state'), title: text(i.title, 'recall.title'), body: text(i.body, 'recall.body'), trigger: optionalText(i.trigger), uncertainty: optionalText(i.uncertainty), confidence: i.confidence === null || i.confidence === undefined ? undefined : num(i.confidence, 'recall.confidence'), project: optionalText(i.project), agent: optionalText(i.agent), source_session_id: text(i.source_session_id, 'recall.source_session_id'), transferable: bool(i.transferable, 'recall.transferable'), provenance_ok: bool(i.provenance_ok, 'recall.provenance_ok'), created_at: text(i.created_at, 'recall.created_at'), updated_at: text(i.updated_at, 'recall.updated_at') }; }
function parseRecall(value: Obj): RecallEntry[] { return arr(value.entries, 'recall').map(parseRecallEntry); }
export type RecallListFilter = { q?: string; project?: string; agent?: string; type?: string; review_state?: string; source_session_id?: string };
/** Page through the recall corpus. Filters run server-side so counts and the
 * list always agree; `truncated` is true when more results exist beyond the
 * 1000-entry client cap. */
export async function listRecallEntries(filter: RecallListFilter = {}): Promise<{ entries: RecallEntry[]; truncated: boolean }> {
	const params = new URLSearchParams({ limit: '100' });
	for (const [key, value] of [['q', filter.q], ['project', filter.project], ['agent', filter.agent], ['type', filter.type], ['review_state', filter.review_state], ['source_session_id', filter.source_session_id]] as const) {
		const trimmed = value?.trim();
		if (trimmed) params.set(key, trimmed);
	}
	const entries: RecallEntry[] = [];
	let cursor: string | undefined;
	do {
		if (cursor) params.set('cursor', cursor);
		const page = await get('/recall/entries', params);
		entries.push(...parseRecall(page));
		cursor = optionalText(page.next_cursor) || undefined;
	} while (cursor && entries.length < 1000);
	return { entries, truncated: Boolean(cursor) };
}
export type WikiCompileStatus = { available: boolean; reason?: string; endpoint_configured: boolean; agents: string[] };
export type WikiCompileProvenance = { id: string; title: string; type: string; review_state: string; provenance_ok: boolean; project?: string; agent?: string; source_session_id: string; updated_at: string };
export type WikiCompileResult = { markdown: string; topic?: string; generated_by: { agent?: string; model?: string }; entries: WikiCompileProvenance[]; compiled_at: string };
export type RecallEntryDetail = RecallEntry & { superseded_by_entry_id?: string; supersedes_entry_id?: string };
/** Whether the service has a generation path for wiki compilation. Probed,
 * not assumed: endpoint configuration or an agent CLI found on PATH. */
export async function wikiCompileStatus(): Promise<WikiCompileStatus> { const value = await get('/wiki/compile/status', new URLSearchParams()); return { available: bool(value.available, 'wiki.available'), reason: optionalText(value.reason), endpoint_configured: bool(value.endpoint_configured, 'wiki.endpoint_configured'), agents: strs(value.agents, 'wiki.agents') }; }
/** Compile a cluster of recall entries into a draft article through the
 * service's insight machinery. Errors surface the service's own message. */
export async function compileWikiArticle(entryIds: string[], topic?: string): Promise<WikiCompileResult> { const value = await post('/wiki/compile', { entry_ids: entryIds, ...(topic ? { topic } : {}) }); const generated = obj(value.generated_by, 'wiki.generated_by'); return { markdown: text(value.markdown, 'wiki.markdown'), topic: optionalText(value.topic), generated_by: { agent: optionalText(generated.agent), model: optionalText(generated.model) }, entries: arr(value.entries, 'wiki.entries').map((i) => ({ id: text(i.id, 'wiki.entry.id'), title: text(i.title, 'wiki.entry.title'), type: text(i.type, 'wiki.entry.type'), review_state: text(i.review_state, 'wiki.entry.review_state'), provenance_ok: bool(i.provenance_ok, 'wiki.entry.provenance_ok'), project: optionalText(i.project), agent: optionalText(i.agent), source_session_id: text(i.source_session_id, 'wiki.entry.source_session_id'), updated_at: text(i.updated_at, 'wiki.entry.updated_at') })), compiled_at: text(value.compiled_at, 'wiki.compiled_at') }; }
/** Full recall entry including supersession links. Null only for a real 404;
 * transport and parse failures throw so staleness is never silently assumed. */
export async function getRecallEntryDetail(id: string): Promise<RecallEntryDetail | null> { const base = await endpoint(); const response = await fetch(`${base}/recall/entries/${encodeURIComponent(id)}`); if (response.status === 404) return null; if (!response.ok) throw new Error(`Fractorches recall entry failed (${response.status})`); const value = obj(await response.json(), 'recall entry'); return { ...parseRecallEntry(value), superseded_by_entry_id: optionalText(value.superseded_by_entry_id), supersedes_entry_id: optionalText(value.supersedes_entry_id) }; }
export async function getSessionMessages(id: string): Promise<TranscriptMessage[]> { const messages: TranscriptMessage[] = []; let from: number | undefined; do { const params = new URLSearchParams({ limit: '100', direction: 'asc', ...(from === undefined ? {} : { from: String(from) }) }); const page = await get(`/sessions/${encodeURIComponent(id)}/messages`, params); const rows = arr(page.messages, 'messages').map((i) => ({ ordinal: num(i.ordinal, 'message.ordinal'), role: text(i.role, 'message.role'), content: text(i.content, 'message.content'), timestamp: text(i.timestamp, 'message.timestamp'), has_tool_use: bool(i.has_tool_use, 'message.has_tool_use'), is_compact_boundary: i.is_compact_boundary === undefined ? false : bool(i.is_compact_boundary, 'message.compact'), tool_calls: i.tool_calls === null || i.tool_calls === undefined ? undefined : arr(i.tool_calls, 'tool calls').map((t) => ({ tool_name: text(t.tool_name, 'tool.name'), category: text(t.category, 'tool.category'), input_json: text(t.input_json, 'tool.input_json') })) })); messages.push(...rows); const last = page.last_ordinal === undefined ? undefined : num(page.last_ordinal, 'messages.last_ordinal'); from = rows.length === 0 || last === undefined || rows.length < 100 ? undefined : last + 1; } while (from !== undefined); return messages; }
export async function searchSessions(value: string, filter: Filter): Promise<Array<{ session_id: string; snippet?: string }>> { const results: Array<{ session_id: string; snippet?: string }> = []; let cursor: number | undefined; do { const params = new URLSearchParams({ q: value, sort: 'relevance', limit: '100', ...(filter.project ? { project: filter.project } : {}), ...(cursor === undefined ? {} : { cursor: String(cursor) }) }); const page = await get('/search', params); results.push(...arr(page.results, 'search results').map((i) => ({ session_id: text(i.session_id, 'search.session_id'), snippet: optionalText(i.snippet) }))); const next = num(page.next, 'search.next'); cursor = next > 0 ? next : undefined; } while (cursor !== undefined); return results; }

/**
 * Import a ChatGPT or Claude.ai export archive.
 *
 * These are the only sessions that cannot be re-derived by scanning: every
 * other provider is read from logs on disk, so any Fractorches instance sees
 * them. An imported archive exists solely in the database it was imported into,
 * which is why Fracta needs its own way in rather than relying on a different
 * app having done it.
 *
 * The endpoint takes multipart form data and can stream progress; this waits
 * for the final JSON, which is the honest thing to show for an operation whose
 * result is a count.
 */
export type ImportSource = 'chatgpt' | 'claude-ai';

export type ImportOutcome = {
	imported: number;
	updated: number;
	skipped: number;
	errors: number;
};

export async function importArchive(
	source: ImportSource,
	file: File
): Promise<ImportOutcome> {
	const base = await endpoint();
	const body = new FormData();
	body.append('file', file);
	const response = await fetch(`${base}/import/${source}`, { method: 'POST', body });
	if (!response.ok) {
		let message = `Import failed (${response.status})`;
		try {
			const data = (await response.json()) as Obj;
			if (typeof data.error === 'string') message = data.error;
		} catch {
			/* keep the status-only message */
		}
		throw new Error(message);
	}
	const data = obj(await response.json(), 'import');
	// The service reports four counts: imported, updated, skipped and errors.
	// `errors` is the one that matters and the easiest to drop — an archive
	// whose every conversation failed still returns HTTP 200 with
	// {"imported":0,...,"errors":N}, so reading only `imported` would report a
	// total failure as a successful import of nothing.
	const count = (key: string) => (typeof data[key] === 'number' ? (data[key] as number) : 0);
	return {
		imported: count('imported'),
		updated: count('updated'),
		skipped: count('skipped'),
		errors: count('errors')
	};
}
