<script lang="ts">
	/**
	 * How well sessions actually went.
	 *
	 * Every figure is a descriptive aggregate of signals the service computed —
	 * no causal claim is made or implied. The unscored count is shown beside the
	 * scored one for the same reason: an average over 428 of 581 sessions is not
	 * an average over all of them, and hiding the denominator would make it look
	 * like one.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import BarList, { type Row } from './BarList.svelte';

	const signals = $derived(observatory.quality);

	/** The service scores 0–100; these are the bands it grades against. */
	const gradeOf = (score: number) =>
		score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

	const grades = ['A', 'B', 'C', 'D', 'F'];
	const gradeRows = $derived<Row[]>(
		grades.map((g) => ({ label: g, value: signals?.grade_distribution[g] ?? 0 }))
	);

	const outcomeRows = $derived<Row[]>(
		Object.entries(signals?.outcome_distribution ?? {}).map(([label, value]) => ({
			label,
			value
		}))
	);

	/** Daily health, coloured by the grade each day's average falls into. */
	const trend = $derived(
		(signals?.trend ?? []).map((day) => ({
			date: day.date,
			score: day.avg_health_score,
			sessions: day.session_count,
			grade: day.avg_health_score === null ? null : gradeOf(day.avg_health_score)
		}))
	);

	let trendHost = $state<HTMLElement | undefined>();
	$effect(() => {
		if (!trendHost) return;
		// Bar heights are data, so they are written as a custom property rather
		// than a style attribute, which the styling contract does not allow in
		// markup.
		const values = trend.map((d) => d.score ?? 0);
		trendHost.querySelectorAll<HTMLElement>('.healthbar').forEach((el, index) => {
			el.style.setProperty('--health', `${Math.max(2, Math.min(100, values[index] ?? 0))}%`);
		});
	});

	const pct = (part: number, whole: number) =>
		whole > 0 ? `${((part / whole) * 100).toFixed(0)}%` : '—';

	/**
	 * Sessions the service could not attribute to a project come back with an
	 * empty name. Sorted here rather than trusted from the service, since the
	 * list is truncated and the wrong twelve would be a silent error.
	 */
	const projectRows = $derived(
		[...(signals?.by_project ?? [])].sort((a, b) => b.session_count - a.session_count).slice(0, 12)
	);

	const completed = $derived(signals?.outcome_distribution.completed ?? 0);
	const errored = $derived(signals?.outcome_distribution.errored ?? 0);
	const scored = $derived(signals?.scored_sessions ?? 0);
</script>

<section class="box gap-2xs pad-md border-bottom" aria-labelledby="health-title">
	<header class="box gap-3xs">
		<h3 id="health-title" class="text-sm weight-600">Session health</h3>
		{#if signals}
			<p class="text-2xs text-muted tabular-nums">
				{scored.toLocaleString()} scored · {signals.unscored_sessions.toLocaleString()} unscored
			</p>
		{/if}
	</header>

	{#if !signals}
		<p class="text-xs text-muted">Not reported for this range.</p>
	{:else}
		<dl class="card-grid">
			<div class="card border pad-sm box gap-3xs">
				<dt class="text-2xs weight-500 text-muted tt-u">Average score</dt>
				<dd class="text-md weight-600 tabular-nums">
					{#if signals.avg_health_score === null}
						Unscored
					{:else}
						{signals.avg_health_score.toFixed(0)}
						<span class="text-2xs text-muted">grade {gradeOf(signals.avg_health_score)}</span>
					{/if}
				</dd>
			</div>
			<div class="card border pad-sm box gap-3xs">
				<dt class="text-2xs weight-500 text-muted tt-u">Completed</dt>
				<dd class="text-md weight-600 tabular-nums">{pct(completed, scored)}</dd>
			</div>
			<div class="card border pad-sm box gap-3xs">
				<dt class="text-2xs weight-500 text-muted tt-u">Errored</dt>
				<dd class="text-md weight-600 tabular-nums">{pct(errored, scored)}</dd>
			</div>
			<div class="card border pad-sm box gap-3xs">
				<dt class="text-2xs weight-500 text-muted tt-u">With compaction</dt>
				<dd class="text-md weight-600 tabular-nums">
					{signals.context_health.sessions_with_compaction.toLocaleString()}
					<span class="text-2xs text-muted"
						>{signals.context_health.mid_task_compaction_count.toLocaleString()} mid-task</span
					>
				</dd>
			</div>
		</dl>

		<div class="grid grid-2 gap-md">
			<div class="box gap-2xs">
				<h4 class="text-xs weight-600 tt-u text-muted">Grade distribution</h4>
				<BarList rows={gradeRows} />
			</div>
			<div class="box gap-2xs">
				<h4 class="text-xs weight-600 tt-u text-muted">Outcome distribution</h4>
				<BarList rows={outcomeRows} />
			</div>
		</div>

		<div class="box gap-3xs">
			<h4 class="text-xs weight-600 tt-u text-muted">Health trend</h4>
			{#if trend.length === 0}
				<p class="text-2xs text-muted">No scored days in this range.</p>
			{:else}
				<div class="scroll-x">
					<div class="healthtrend" bind:this={trendHost}>
						{#each trend as day (day.date)}
							<i
								class="healthbar {day.grade ? `healthbar-${day.grade}` : 'healthbar-none'}"
								title="{day.date}: {day.score === null
									? 'unscored'
									: day.score.toFixed(0)} · {day.sessions} sessions"
							></i>
						{/each}
					</div>
				</div>
				<p class="text-2xs text-muted">Daily average health score · bar colour is the grade</p>
			{/if}
		</div>

		<div class="grid grid-2 gap-md">
			<div class="box gap-2xs">
				<h4 class="text-xs weight-600 tt-u text-muted">By agent</h4>
				<div class="scroll-x">
					<table class="table-clean text-xs">
						<thead>
							<tr><th class="ta-l">Agent</th><th class="ta-r">Sessions</th><th class="ta-r">Score</th><th class="ta-r">Completed</th></tr>
						</thead>
						<tbody>
							{#each signals.by_agent as row (row.agent)}
								<tr>
									<td class="truncate">{row.agent}</td>
									<td class="ta-r tabular-nums">{row.session_count.toLocaleString()}</td>
									<td class="ta-r tabular-nums">{row.avg_health_score === null ? '—' : row.avg_health_score.toFixed(0)}</td>
									<td class="ta-r tabular-nums">{row.completed_rate.toFixed(0)}%</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="box gap-2xs">
				<h4 class="text-xs weight-600 tt-u text-muted">By project</h4>
				<div class="scroll-x">
					<table class="table-clean text-xs">
						<thead>
							<tr><th class="ta-l">Project</th><th class="ta-r">Sessions</th><th class="ta-r">Score</th><th class="ta-r">Completed</th></tr>
						</thead>
						<tbody>
							{#each projectRows as row (row.project)}
								<tr>
									<td class="truncate" class:text-muted={!row.project}>
										{row.project || 'Unattributed'}
									</td>
									<td class="ta-r tabular-nums">{row.session_count.toLocaleString()}</td>
									<td class="ta-r tabular-nums">{row.avg_health_score === null ? '—' : row.avg_health_score.toFixed(0)}</td>
									<td class="ta-r tabular-nums">{row.completed_rate.toFixed(0)}%</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</section>
