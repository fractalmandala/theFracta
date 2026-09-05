/**
 * Turning usage breakdowns into chartable series.
 *
 * Three dimensions (project, model, agent) and two measures (cost, tokens) make
 * six combinations that are otherwise the same shape, so both the time series
 * and the attribution panel read them from here rather than each deriving its
 * own — which is how two panels end up disagreeing about what "top 8" means.
 *
 * Past a dozen categories a chart stops being readable, so the tail is summed
 * into one band. It is always labelled with the count it stands for, because a
 * chart that quietly drops 137 projects is not the same picture as one that
 * says so.
 */
import type { Usage, UsageBreakdown, UsageDay, UsageTokens } from '$lib/observatory-fractorches';
import type { UsageGroupBy, UsageMode, UsageTokenType } from '$lib/observatory-state/observatory.svelte';

export const OTHER_ID = '__other__';

export type Series = { id: string; label: string; value: number };

export function sumTokenTypes(row: UsageTokens, types: readonly UsageTokenType[]): number {
	let total = 0;
	for (const type of types) {
		if (type === 'input') total += row.inputTokens;
		else if (type === 'output') total += row.outputTokens;
		else if (type === 'cache_read') total += row.cacheReadTokens;
		else total += row.cacheCreationTokens;
	}
	return total;
}

/** Cost in microdollars, or the selected token types — whichever the view asks for. */
export function measure(row: UsageBreakdown | UsageDay | UsageTokens & { cost?: { microdollars: number }; totalCost?: { microdollars: number } }, mode: UsageMode, types: readonly UsageTokenType[]): number {
	if (mode === 'token') return sumTokenTypes(row, types);
	const money = 'cost' in row && row.cost ? row.cost : 'totalCost' in row && row.totalCost ? row.totalCost : null;
	return money ? money.microdollars : 0;
}

export function totalsFor(usage: Usage, groupBy: UsageGroupBy): UsageBreakdown[] {
	if (groupBy === 'model') return usage.modelTotals;
	if (groupBy === 'agent') return usage.agentTotals;
	return usage.projectTotals;
}

export function dailyBreakdown(day: UsageDay, groupBy: UsageGroupBy): UsageBreakdown[] {
	if (groupBy === 'model') return day.modelBreakdowns;
	if (groupBy === 'agent') return day.agentBreakdowns;
	return day.projectBreakdowns;
}

/**
 * Ranked series for one dimension, hidden ones removed.
 *
 * Hiding is applied before ranking so that clicking a dominant series away
 * actually rescales the chart, which is the point of being able to hide it.
 */
export function rankedSeries(
	usage: Usage,
	groupBy: UsageGroupBy,
	mode: UsageMode,
	types: readonly UsageTokenType[],
	hidden: readonly string[]
): Series[] {
	return totalsFor(usage, groupBy)
		.filter((row) => !hidden.includes(row.id))
		.map((row) => ({ id: row.id, label: row.label || 'Unattributed', value: measure(row, mode, types) }))
		.filter((row) => row.value > 0)
		.sort((a, b) => b.value - a.value);
}

/**
 * The top `limit` series, plus one band standing for everything else.
 *
 * Returns the rolled-up band only when there is a tail to roll up, so a chart
 * of five projects does not grow a permanently empty "Other".
 */
export function withOther(series: Series[], limit: number): { kept: Series[]; other: Series | null } {
	if (series.length <= limit) return { kept: series, other: null };
	const kept = series.slice(0, limit);
	const tail = series.slice(limit);
	return {
		kept,
		other: { id: OTHER_ID, label: `Other (${tail.length})`, value: tail.reduce((sum, row) => sum + row.value, 0) }
	};
}

/** The class carrying a series colour. Twelve distinct bands, then neutral. */
export const seriesClass = (id: string, index: number): string =>
	id === OTHER_ID ? 'series-other' : `series-${index % 12}`;
