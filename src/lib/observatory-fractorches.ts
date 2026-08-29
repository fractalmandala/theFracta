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
export type Summary = { active_days: number; active_projects: number; total_messages: number; total_sessions: number; avg_messages: number; concentration: number; total_output_tokens: number };
export type UsageBreakdown = { project?: string; project_key?: string; model?: string; cost: Money; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number };
export type Usage = { totals: { cacheCreationTokens: number; cacheReadTokens: number; cacheSavings: Money; inputTokens: number; outputTokens: number; totalCost: Money }; daily: Array<{ date: string; totalCost: Money; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number }>; projectTotals: UsageBreakdown[]; modelTotals: UsageBreakdown[] };
export type Tool = { tool_name: string; category: string; call_count: number; session_count: number; pct: number };
export type Skill = { skill_name: string; call_count: number; session_count: number; last_used_at: string; pct: number };
export type SignalAgent = { agent: string; avg_failure_signals: number; avg_health_score: number | null; completed_rate: number; session_count: number };
export type SignalProject = { avg_failure_signals: number; avg_health_score: number | null; completed_rate: number; project: string; session_count: number };
export type SignalTrend = { abandoned: number; avg_failure_signals: number; avg_health_score: number | null; completed: number; date: string; errored: number; session_count: number };
export type Signal = { avg_health_score: number | null; scored_sessions: number; unscored_sessions: number; grade_distribution: Record<string, number>; outcome_distribution: Record<string, number>; trend: SignalTrend[]; by_agent: SignalAgent[]; by_project: SignalProject[]; context_health: { avg_compaction_count: number; avg_context_pressure: number | null; high_pressure_sessions: number; mid_task_compaction_count: number; sessions_with_compaction: number; sessions_with_context_data: number; sessions_with_mid_task_compaction: number }; quality_health: { computed_sessions: number; totals: Record<string, number>; sessions_with_signal: Record<string, number> } };
export type TopSession = { active_duration_min: number; display_name?: string; duration_min: number; ended_at?: string; first_message: string | null; id: string; message_count: number; output_tokens: number; project: string; started_at?: string; termination_status?: string };
export type TranscriptMessage = { ordinal: number; role: string; content: string; timestamp: string; has_tool_use: boolean; is_compact_boundary?: boolean; tool_calls?: Array<{ tool_name: string; category: string; input_json: string }> };
export type RecentEdit = { project: string; file_path: string; edit_count: number; last_edited_at?: string; last_session_id: string; edits: Array<{ session_id: string; ordinal: number; tool_use_id?: string; call_index: number; tool_name: string; category: string; timestamp?: string }>; edits_truncated: boolean };
export type Pin = { id: number; message_id: number; ordinal: number; session_id: string; content?: string; created_at: string; session_project?: string; session_display_name?: string; session_first_message?: string; session_agent?: string; role?: string; note?: string };
export type RecallEntry = { id: string; type: string; scope: string; status: string; review_state: string; title: string; body: string; project?: string; agent?: string; source_session_id: string; transferable: boolean; provenance_ok: boolean; created_at: string; updated_at: string };
export type Resources = { projects: Array<{ name: string; session_count: number }>; agents: Array<{ name: string; session_count: number }>; sessions: { sessions: Session[]; total: number }; summary: Summary; activity: Activity[]; hours: HourCell[]; projectStats: ProjectAnalytics[]; usage: Usage; tools: Tool[]; skills: Skill[]; signals: Signal; topSessions: TopSession[]; recentEdits: RecentEdit[]; pins: Pin[]; recall: RecallEntry[]; recallNext: string | null; refreshedAt: string };

type Obj = Record<string, unknown>;
const obj = (value: unknown, label: string): Obj => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid Fractorches ${label}`); return value as Obj; };
const arr = (value: unknown, label: string): Obj[] => { if (!Array.isArray(value)) throw new Error(`Invalid Fractorches ${label}`); return value.map((item) => obj(item, label)); };
const text = (value: unknown, label: string): string => { if (typeof value !== 'string') throw new Error(`Invalid Fractorches ${label}`); return value; };
const num = (value: unknown, label: string): number => { if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid Fractorches ${label}`); return value; };
const optionalText = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined;
const optionalNum = (value: unknown, label: string): number | undefined => value === undefined ? undefined : num(value, label);
const nullableNum = (value: unknown, label: string): number | null => value === null ? null : num(value, label);
const bool = (value: unknown, label: string): boolean => { if (typeof value !== 'boolean') throw new Error(`Invalid Fractorches ${label}`); return value; };
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
async function get(path: string, params: URLSearchParams): Promise<Obj> { const base = await endpoint(); const response = await fetch(`${base}${path}?${params}`); if (!response.ok) throw new Error(`Fractorches ${path} failed (${response.status})`); return obj(await response.json(), path); }
function dateRange(name: string) { const end = new Date(); const start = new Date(end); if (name === 'week') start.setDate(start.getDate() - 6); else if (name === 'month') start.setMonth(start.getMonth() - 1); else start.setFullYear(start.getFullYear() - 1); const local = (value: Date) => { const year = value.getFullYear(); const month = String(value.getMonth() + 1).padStart(2, '0'); const day = String(value.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }; return { from: local(start), to: local(end) }; }
export function createObservatoryFilter(range: string, project: string, agent: string, model = 'all'): Filter { return { ...dateRange(range), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', project: project === 'all' ? undefined : project, agent: agent === 'all' ? undefined : agent, model: model === 'all' ? undefined : model, include_one_shot: false, include_automated: false, include_children: true }; }
const session = (value: Obj): Session => ({ id: text(value.id, 'session.id'), project: text(value.project, 'session.project'), agent: text(value.agent, 'session.agent'), first_message: value.first_message === null ? null : text(value.first_message, 'session.first_message'), display_name: optionalText(value.display_name), message_count: num(value.message_count, 'session.message_count'), user_message_count: num(value.user_message_count, 'session.user_message_count'), created_at: text(value.created_at, 'session.created_at'), started_at: value.started_at === null ? null : text(value.started_at, 'session.started_at'), ended_at: value.ended_at === null ? null : text(value.ended_at, 'session.ended_at'), health_score: optionalNum(value.health_score, 'session.health_score'), health_grade: optionalText(value.health_grade), outcome: text(value.outcome, 'session.outcome'), total_output_tokens: num(value.total_output_tokens, 'session.total_output_tokens'), peak_context_tokens: num(value.peak_context_tokens, 'session.peak_context_tokens'), compaction_count: num(value.compaction_count, 'session.compaction_count'), is_automated: bool(value.is_automated, 'session.is_automated'), termination_status: optionalText(value.termination_status) });
export async function getObservatoryResources(filter: Filter): Promise<Resources> {
	const sessionParams = base(filter); sessionParams.set('date_from', filter.from); sessionParams.set('date_to', filter.to); sessionParams.set('limit', '100'); sessionParams.set('order_by', 'recent');
	const pages: Session[] = []; let cursor: string | undefined; let total = 0;
	if (filter.starred) sessionParams.set('starred', 'true');
	if (filter.min_messages) sessionParams.set('min_messages', String(filter.min_messages));
	do { if (cursor) sessionParams.set('cursor', cursor); const page = await get('/sessions', sessionParams); total = num(page.total, 'sessions.total'); pages.push(...arr(page.sessions, 'sessions').map(session)); cursor = optionalText(page.next_cursor); } while (cursor);
	const [projects, agents, summary, activity, hours, projectStats, usage, tools, skills, signals, top, recent, pins, recall] = await Promise.all([get('/projects', new URLSearchParams({ include_one_shot: String(filter.include_one_shot), include_automated: String(filter.include_automated) })), get('/agents', new URLSearchParams({ include_one_shot: String(filter.include_one_shot), include_automated: String(filter.include_automated) })), get('/analytics/summary', base(filter)), get('/analytics/activity', new URLSearchParams(`${base(filter)}&granularity=day`)), get('/analytics/hour-of-week', base(filter)), get('/analytics/projects', base(filter)), get('/usage/summary', new URLSearchParams(`${base(filter)}&breakdowns=true&session_counts=true`)), get('/analytics/tools', base(filter)), get('/analytics/skills', new URLSearchParams(`${base(filter)}&granularity=day`)), get('/analytics/signals', base(filter)), get('/analytics/top-sessions', new URLSearchParams(`${base(filter)}&metric=messages`)), get('/recent-edits', new URLSearchParams({ limit: '100', offset: '0', ...(filter.project ? { project: filter.project } : {}) })), get('/pins', new URLSearchParams(filter.project ? { project: filter.project } : {})), get('/recall/entries', new URLSearchParams({ limit: '100', ...(filter.project ? { project: filter.project } : {}), ...(filter.agent ? { agent: filter.agent } : {}) }))]);
	const s = obj(summary, 'summary');
	const activityRows = arr(activity.series, 'activity').map((i) => ({ date: text(i.date, 'activity.date'), sessions: num(i.sessions, 'activity.sessions'), messages: num(i.messages, 'activity.messages'), user_messages: num(i.user_messages, 'activity.user_messages'), assistant_messages: num(i.assistant_messages, 'activity.assistant_messages'), tool_calls: num(i.tool_calls, 'activity.tool_calls'), thinking_messages: num(i.thinking_messages, 'activity.thinking_messages'), by_agent: numberMap(i.by_agent, 'activity.by_agent') }));
	const usageObj = obj(usage, 'usage'); const totals = obj(usageObj.totals, 'usage.totals'); const daily = arr(usageObj.daily, 'usage.daily').map((i) => ({ date: text(i.date, 'daily.date'), totalCost: money(i.totalCost), inputTokens: num(i.inputTokens, 'daily.inputTokens'), outputTokens: num(i.outputTokens, 'daily.outputTokens'), cacheReadTokens: num(i.cacheReadTokens, 'daily.cacheReadTokens'), cacheCreationTokens: num(i.cacheCreationTokens, 'daily.cacheCreationTokens') }));
	const breakdown = (value: unknown, model: boolean): UsageBreakdown[] => arr(value ?? [], 'usage breakdown').map((i) => ({ ...(model ? { model: text(i.model, 'breakdown.model') } : { project: text(i.project, 'breakdown.project'), project_key: text(i.project_key, 'breakdown.project_key') }), cost: money(i.cost), inputTokens: num(i.inputTokens, 'breakdown.inputTokens'), outputTokens: num(i.outputTokens, 'breakdown.outputTokens'), cacheReadTokens: num(i.cacheReadTokens, 'breakdown.cacheReadTokens'), cacheCreationTokens: num(i.cacheCreationTokens, 'breakdown.cacheCreationTokens') }));
	return { projects: arr(projects.projects, 'projects').map((i) => ({ name: text(i.name, 'project.name'), session_count: num(i.session_count, 'project.session_count') })), agents: arr(agents.agents, 'agents').map((i) => ({ name: text(i.name, 'agent.name'), session_count: num(i.session_count, 'agent.session_count') })), sessions: { sessions: pages, total: num((await Promise.resolve({ total: pages.length })).total, 'sessions.total') }, summary: { active_days: num(s.active_days, 'summary.active_days'), active_projects: num(s.active_projects, 'summary.active_projects'), total_messages: num(s.total_messages, 'summary.total_messages'), total_sessions: num(s.total_sessions, 'summary.total_sessions'), avg_messages: num(s.avg_messages, 'summary.avg_messages'), concentration: num(s.concentration, 'summary.concentration'), total_output_tokens: num(s.total_output_tokens, 'summary.total_output_tokens') }, activity: activityRows, hours: arr(hours.cells, 'hours').map((i) => ({ day_of_week: num(i.day_of_week, 'hour.day'), hour: num(i.hour, 'hour.hour'), messages: num(i.messages, 'hour.messages') })), projectStats: arr(projectStats.projects, 'project stats').map((i) => ({ name: text(i.name, 'project.name'), sessions: num(i.sessions, 'project.sessions'), messages: num(i.messages, 'project.messages'), avg_messages: num(i.avg_messages, 'project.avg_messages'), first_session: text(i.first_session, 'project.first_session'), last_session: text(i.last_session, 'project.last_session') })), usage: { totals: { cacheCreationTokens: num(totals.cacheCreationTokens, 'totals.cacheCreationTokens'), cacheReadTokens: num(totals.cacheReadTokens, 'totals.cacheReadTokens'), cacheSavings: money(totals.cacheSavings), inputTokens: num(totals.inputTokens, 'totals.inputTokens'), outputTokens: num(totals.outputTokens, 'totals.outputTokens'), totalCost: money(totals.totalCost) }, daily, projectTotals: breakdown(usageObj.projectTotals, false), modelTotals: breakdown(usageObj.modelTotals, true) }, tools: arr(tools.by_tool, 'tools').map((i) => ({ tool_name: text(i.tool_name, 'tool.name'), category: text(i.category, 'tool.category'), call_count: num(i.call_count, 'tool.calls'), session_count: num(i.session_count, 'tool.sessions'), pct: num(i.pct, 'tool.pct') })), skills: arr(skills.by_skill, 'skills').map((i) => ({ skill_name: text(i.skill_name, 'skill.name'), call_count: num(i.call_count, 'skill.calls'), session_count: num(i.session_count, 'skill.sessions'), last_used_at: text(i.last_used_at, 'skill.last_used_at'), pct: num(i.pct, 'skill.pct') })), signals: parseSignals(signals), topSessions: arr(top.sessions, 'top sessions').map((i) => ({ active_duration_min: num(i.active_duration_min, 'top.active_duration_min'), display_name: optionalText(i.display_name), duration_min: num(i.duration_min, 'top.duration_min'), ended_at: optionalText(i.ended_at), first_message: i.first_message === null ? null : text(i.first_message, 'top.first_message'), id: text(i.id, 'top.id'), message_count: num(i.message_count, 'top.message_count'), output_tokens: num(i.output_tokens, 'top.output_tokens'), project: text(i.project, 'top.project'), started_at: optionalText(i.started_at), termination_status: optionalText(i.termination_status) })), recentEdits: parseRecent(recent), pins: parsePins(pins), recall: parseRecall(recall), recallNext: optionalText(recall.next_cursor) || null, refreshedAt: new Date().toISOString() };
}
function parseSignals(value: Obj): Signal { const context = obj(value.context_health, 'context_health'); const quality = obj(value.quality_health, 'quality_health'); return { avg_health_score: nullableNum(value.avg_health_score, 'signals.avg_health_score'), scored_sessions: num(value.scored_sessions, 'signals.scored_sessions'), unscored_sessions: num(value.unscored_sessions, 'signals.unscored_sessions'), grade_distribution: numberMap(value.grade_distribution, 'signals.grade_distribution'), outcome_distribution: numberMap(value.outcome_distribution, 'signals.outcome_distribution'), trend: arr(value.trend, 'signals.trend').map((i) => ({ abandoned: num(i.abandoned, 'trend.abandoned'), avg_failure_signals: num(i.avg_failure_signals, 'trend.failures'), avg_health_score: nullableNum(i.avg_health_score, 'trend.health'), completed: num(i.completed, 'trend.completed'), date: text(i.date, 'trend.date'), errored: num(i.errored, 'trend.errored'), session_count: num(i.session_count, 'trend.sessions') })), by_agent: arr(value.by_agent, 'signals.by_agent').map((i) => ({ agent: text(i.agent, 'agent.name'), avg_failure_signals: num(i.avg_failure_signals, 'agent.failures'), avg_health_score: nullableNum(i.avg_health_score, 'agent.health'), completed_rate: num(i.completed_rate, 'agent.completed_rate'), session_count: num(i.session_count, 'agent.sessions') })), by_project: arr(value.by_project, 'signals.by_project').map((i) => ({ avg_failure_signals: num(i.avg_failure_signals, 'project.failures'), avg_health_score: nullableNum(i.avg_health_score, 'project.health'), completed_rate: num(i.completed_rate, 'project.completed_rate'), project: text(i.project, 'project.name'), session_count: num(i.session_count, 'project.sessions') })), context_health: { avg_compaction_count: num(context.avg_compaction_count, 'context.compactions'), avg_context_pressure: nullableNum(context.avg_context_pressure, 'context.pressure'), high_pressure_sessions: num(context.high_pressure_sessions, 'context.high'), mid_task_compaction_count: num(context.mid_task_compaction_count, 'context.mid_task'), sessions_with_compaction: num(context.sessions_with_compaction, 'context.sessions_compaction'), sessions_with_context_data: num(context.sessions_with_context_data, 'context.sessions_data'), sessions_with_mid_task_compaction: num(context.sessions_with_mid_task_compaction, 'context.sessions_mid_task') }, quality_health: { computed_sessions: num(quality.computed_sessions, 'quality.computed'), totals: numberMap(quality.totals, 'quality.totals'), sessions_with_signal: numberMap(quality.sessions_with_signal, 'quality.sessions') } }; }
function parseRecent(value: Obj): RecentEdit[] { return arr(value.files, 'recent files').map((i) => ({ project: text(i.project, 'edit.project'), file_path: text(i.file_path, 'edit.file_path'), edit_count: num(i.edit_count, 'edit.count'), last_edited_at: optionalText(i.last_edited_at), last_session_id: text(i.last_session_id, 'edit.session'), edits: arr(i.edits, 'edit.entries').map((e) => ({ session_id: text(e.session_id, 'edit.session_id'), ordinal: num(e.ordinal, 'edit.ordinal'), tool_use_id: optionalText(e.tool_use_id), call_index: num(e.call_index, 'edit.call_index'), tool_name: text(e.tool_name, 'edit.tool_name'), category: text(e.category, 'edit.category'), timestamp: optionalText(e.timestamp) })), edits_truncated: bool(i.edits_truncated, 'edit.truncated') })); }
function parsePins(value: Obj): Pin[] { return arr(value.pins, 'pins').map((i) => ({ id: num(i.id, 'pin.id'), message_id: num(i.message_id, 'pin.message_id'), ordinal: num(i.ordinal, 'pin.ordinal'), session_id: text(i.session_id, 'pin.session_id'), content: optionalText(i.content), created_at: text(i.created_at, 'pin.created_at'), session_project: optionalText(i.session_project), session_display_name: optionalText(i.session_display_name), session_first_message: optionalText(i.session_first_message), session_agent: optionalText(i.session_agent), role: optionalText(i.role), note: optionalText(i.note) })); }
function parseRecall(value: Obj): RecallEntry[] { return arr(value.entries, 'recall').map((i) => ({ id: text(i.id, 'recall.id'), type: text(i.type, 'recall.type'), scope: text(i.scope, 'recall.scope'), status: text(i.status, 'recall.status'), review_state: text(i.review_state, 'recall.review_state'), title: text(i.title, 'recall.title'), body: text(i.body, 'recall.body'), project: optionalText(i.project), agent: optionalText(i.agent), source_session_id: text(i.source_session_id, 'recall.source_session_id'), transferable: bool(i.transferable, 'recall.transferable'), provenance_ok: bool(i.provenance_ok, 'recall.provenance_ok'), created_at: text(i.created_at, 'recall.created_at'), updated_at: text(i.updated_at, 'recall.updated_at') })); }
export async function getSessionMessages(id: string): Promise<TranscriptMessage[]> { const messages: TranscriptMessage[] = []; let from: number | undefined; do { const params = new URLSearchParams({ limit: '100', direction: 'asc', ...(from === undefined ? {} : { from: String(from) }) }); const page = await get(`/sessions/${encodeURIComponent(id)}/messages`, params); const rows = arr(page.messages, 'messages').map((i) => ({ ordinal: num(i.ordinal, 'message.ordinal'), role: text(i.role, 'message.role'), content: text(i.content, 'message.content'), timestamp: text(i.timestamp, 'message.timestamp'), has_tool_use: bool(i.has_tool_use, 'message.has_tool_use'), is_compact_boundary: i.is_compact_boundary === undefined ? false : bool(i.is_compact_boundary, 'message.compact'), tool_calls: i.tool_calls === null || i.tool_calls === undefined ? undefined : arr(i.tool_calls, 'tool calls').map((t) => ({ tool_name: text(t.tool_name, 'tool.name'), category: text(t.category, 'tool.category'), input_json: text(t.input_json, 'tool.input_json') })) })); messages.push(...rows); const last = page.last_ordinal === undefined ? undefined : num(page.last_ordinal, 'messages.last_ordinal'); from = rows.length === 0 || last === undefined || rows.length < 100 ? undefined : last + 1; } while (from !== undefined); return messages; }
export async function searchSessions(value: string, filter: Filter): Promise<Array<{ session_id: string; snippet?: string }>> { const results: Array<{ session_id: string; snippet?: string }> = []; let cursor: number | undefined; do { const params = new URLSearchParams({ q: value, sort: 'relevance', limit: '100', ...(filter.project ? { project: filter.project } : {}), ...(cursor === undefined ? {} : { cursor: String(cursor) }) }); const page = await get('/search', params); results.push(...arr(page.results, 'search results').map((i) => ({ session_id: text(i.session_id, 'search.session_id'), snippet: optionalText(i.snippet) }))); const next = num(page.next, 'search.next'); cursor = next > 0 ? next : undefined; } while (cursor !== undefined); return results; }
