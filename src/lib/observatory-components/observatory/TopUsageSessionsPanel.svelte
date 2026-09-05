<script lang="ts">
	/**
	 * The most expensive sessions in range — or the heaviest, in token mode.
	 *
	 * The ranking is the service's: a session's rank by cost and by tokens are
	 * different orders over different numbers, and re-sorting the cost ranking
	 * by tokens would show the top ten by cost sorted by tokens, which is not
	 * the top ten by tokens.
	 */
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import { formatMoney, formatTokens } from './usageFormat';

	const rows = $derived(observatory.topUsageSessions);
	const isTokenMode = $derived(observatory.usageMode === 'token');
</script>

<section class="box gap-2xs pad-md border-bottom" aria-labelledby="usage-top-title">
	<h3 id="usage-top-title" class="text-sm weight-600">
		{isTokenMode ? 'Top sessions by tokens' : 'Top sessions by cost'}
	</h3>

	{#if rows.length === 0}
		<p class="text-xs text-muted">No sessions with usage in this range.</p>
	{:else}
		<ul class="box gap-3xs unstyled">
			{#each rows as row, index (row.sessionId)}
				<li>
					<button
						class="usage-row"
						onclick={() => observatory.selectSession(row.sessionId)}
						title="Open this session's transcript"
					>
						<span class="text-2xs text-muted tabular-nums">{index + 1}</span>
						<span></span>
						<span class="box gap-3xs min0">
							<span class="truncate text-xs">
								<span class="text-2xs text-muted mono">{row.agent || 'unknown'}</span>
								{row.displayName || row.sessionId.slice(0, 12)}
							</span>
							<span class="truncate text-2xs text-muted">
								{row.project || 'Unattributed'} · {row.startedAt.slice(0, 10)}
							</span>
						</span>
						<span class="text-2xs text-muted tabular-nums">
							{formatTokens(isTokenMode ? observatory.sumTokens(row) : row.totalTokens)}
						</span>
						{#if !isTokenMode}
							<span class="text-xs tabular-nums">{formatMoney(row.cost)}</span>
						{:else}
							<span></span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
