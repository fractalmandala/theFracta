/**
 * How Usage renders money, tokens and deltas.
 *
 * Costs arrive as microdollars and are only ever divided here, so no panel
 * carries its own conversion. Two rules come from AgentsView and are kept
 * deliberately: a non-zero amount below one cent renders as `<$0.01` rather
 * than as `$0.00`, because rounding a real cost to nothing reads as "free";
 * and cents are dropped above $100, where they are noise.
 */

export type Money = { microdollars: number };

export const ZERO_MONEY: Money = { microdollars: 0 };

export function formatMoney(value: Money): string {
	const magnitude = Math.abs(value.microdollars);
	if (magnitude > 0 && magnitude < 10_000) return value.microdollars < 0 ? '>-$0.01' : '<$0.01';
	const cents = magnitude < 100_000_000;
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: cents ? 2 : 0,
		maximumFractionDigits: cents ? 2 : 0
	}).format(value.microdollars / 1_000_000);
}

export function formatSignedMoney(value: Money): string {
	if (value.microdollars === 0) return formatMoney(value);
	const formatted = formatMoney(value);
	return value.microdollars > 0 ? `+${formatted}` : formatted;
}

export const divideMoney = (value: Money, divisor: number): Money =>
	divisor === 0 ? ZERO_MONEY : { microdollars: Math.round(value.microdollars / divisor) };

/** Token counts are large enough that full digits stop being readable. */
export function formatTokens(value: number): string {
	const magnitude = Math.abs(value);
	if (magnitude >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
	if (magnitude >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (magnitude >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
	return String(Math.round(value));
}

export function formatSignedTokens(value: number): string {
	if (value === 0) return '0';
	return value > 0 ? `+${formatTokens(value)}` : `-${formatTokens(Math.abs(value))}`;
}

/**
 * A ratio as a percentage, or an em dash.
 *
 * A null ratio means the baseline was zero, so no percentage exists. Printing
 * it as 0% or ∞% would both be claims the data does not make.
 */
export function formatRatio(value: number | null): string {
	if (value === null || !Number.isFinite(value)) return '—';
	const pct = value * 100;
	const sign = pct > 0 ? '+' : '';
	return `${sign}${pct.toFixed(1)}%`;
}

export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
