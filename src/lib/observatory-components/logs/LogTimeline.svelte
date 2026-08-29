<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';

	const log = $derived(logsState.activeLog);

	const commits = $derived(log?.development?.commits ?? []);
	const browsing = $derived(log?.browsing ?? []);
	const agentSessions = $derived(log?.agent_sessions ?? []);
	const handoffs = $derived(log?.handoffs ?? []);
	const themes = $derived(log?.themes ?? []);

	let searchFilter = $state('');

	// Merge all activity into a single chronological timeline
	const timelineItems = $derived.by(() => {
		const items: any[] = [];

		if (logsState.filterType === 'all' || logsState.filterType === 'commits') {
			for (const c of commits) {
				items.push({
					type: 'commit',
					time: c.timestamp,
					title: c.message,
					sub: `${c.short_hash ?? c.hash?.slice(0, 7)} · ${c.author ?? 'Git'}`,
					badge: c.type || 'commit',
					raw: c
				});
			}
		}

		if (logsState.filterType === 'all' || logsState.filterType === 'sessions') {
			for (const s of agentSessions) {
				items.push({
					type: 'session',
					time: s.timestamp || s.started_at,
					title: s.title || s.summary || s.goal || `Agent Session (${s.agent || 'AI'})`,
					sub: `${s.agent || 'Agent'} · ${s.tool_calls_count ?? 0} tool calls`,
					badge: 'agent',
					raw: s
				});
			}
		}

		if (logsState.filterType === 'all' || logsState.filterType === 'handoffs') {
			for (const h of handoffs) {
				items.push({
					type: 'handoff',
					time: h.timestamp || h.date,
					title: h.title || h.summary || 'Handoff Note',
					sub: h.project || 'Project Note',
					badge: 'handoff',
					raw: h
				});
			}
		}

		if (logsState.filterType === 'all' || logsState.filterType === 'browsing') {
			for (const b of browsing.slice(0, 300)) {
				items.push({
					type: 'browsing',
					time: b.timestamp,
					title: b.title || b.url,
					sub: `${b.domain} · ${b.category || 'web'}`,
					url: b.url,
					badge: b.domain,
					raw: b
				});
			}
		}

		// Sort descending by timestamp
		items.sort((a, b) => {
			const ta = a.time ? new Date(a.time).getTime() : 0;
			const tb = b.time ? new Date(b.time).getTime() : 0;
			return tb - ta;
		});

		if (!searchFilter.trim()) return items;
		const q = searchFilter.toLowerCase();
		return items.filter(
			(i) =>
				(i.title && i.title.toLowerCase().includes(q)) ||
				(i.sub && i.sub.toLowerCase().includes(q)) ||
				(i.badge && i.badge.toLowerCase().includes(q))
		);
	});
</script>

<div class="timeline-shell">
	{#if log}
		<div class="summary-hero">
			<div class="hero-left">
				<h2>Daily Activity — {log.date}</h2>
				<span class="hero-sub">{log.day_of_week} · {timelineItems.length} activity entries</span>
			</div>

			<div class="stats-ribbon">
				<div class="stat-tile">
					<span class="num">{commits.length}</span>
					<span class="lbl">Commits</span>
				</div>
				<div class="stat-tile">
					<span class="num">{agentSessions.length}</span>
					<span class="lbl">Agent Sessions</span>
				</div>
				<div class="stat-tile">
					<span class="num">{browsing.length}</span>
					<span class="lbl">Web Visits</span>
				</div>
				<div class="stat-tile">
					<span class="num">{handoffs.length}</span>
					<span class="lbl">Handoffs</span>
				</div>
			</div>
		</div>

		{#if themes.length > 0}
			<div class="themes-strip">
				<span class="themes-lbl">Topics:</span>
				{#each themes as t}
					<span class="theme-tag" title={t.evidence?.join('\n')}>{t.label}</span>
				{/each}
			</div>
		{/if}

		<!-- Filter Bar -->
		<div class="filter-bar">
			<div class="filter-tabs">
				<button
					class="f-tab"
					class:active={logsState.filterType === 'all'}
					onclick={() => logsState.setFilter('all')}>All ({commits.length + browsing.length + agentSessions.length})</button
				>
				<button
					class="f-tab"
					class:active={logsState.filterType === 'commits'}
					onclick={() => logsState.setFilter('commits')}>Commits ({commits.length})</button
				>
				<button
					class="f-tab"
					class:active={logsState.filterType === 'sessions'}
					onclick={() => logsState.setFilter('sessions')}>Sessions ({agentSessions.length})</button
				>
				<button
					class="f-tab"
					class:active={logsState.filterType === 'browsing'}
					onclick={() => logsState.setFilter('browsing')}>Browsing ({browsing.length})</button
				>
				{#if handoffs.length > 0}
					<button
						class="f-tab"
						class:active={logsState.filterType === 'handoffs'}
						onclick={() => logsState.setFilter('handoffs')}>Handoffs ({handoffs.length})</button
					>
				{/if}
			</div>

			<input
				type="text"
				placeholder="Search entries..."
				bind:value={searchFilter}
				class="filter-search"
			/>
		</div>

		<!-- Activity Stream -->
		<div class="stream-scroll">
			{#if timelineItems.length === 0}
				<div class="empty-state">No entries match the selected filter.</div>
			{:else}
				<div class="stream-list">
					{#each timelineItems as item}
						<div
							class="item-card type-{item.type}"
							role="button"
							tabindex="0"
							onclick={() => logsState.selectEntry(item)}
							onkeydown={(e) => e.key === 'Enter' && logsState.selectEntry(item)}
						>
							<div class="item-icon">
								{#if item.type === 'commit'}
									<span class="ico">⌥</span>
								{:else if item.type === 'session'}
									<span class="ico">◉</span>
								{:else if item.type === 'handoff'}
									<span class="ico">📝</span>
								{:else}
									<span class="ico">↗</span>
								{/if}
							</div>

							<div class="item-content">
								<div class="item-top">
									<strong class="item-title">{item.title}</strong>
									{#if item.time}
										<span class="item-time">
											{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
									{/if}
								</div>

								<div class="item-sub-row">
									<span class="item-sub">{item.sub}</span>
									{#if item.badge}
										<span class="badge {item.type === 'commit' ? 'green' : item.type === 'session' ? 'purple' : 'accent'}">
											{item.badge}
										</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if logsState.isLoading}
		<div class="loading-box">Loading daily log...</div>
	{:else}
		<div class="empty-state">Select a date from the calendar to view its log.</div>
	{/if}
</div>

<style>
	.timeline-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 12px;
		padding: 16px;
		background: var(--bg);
		overflow: hidden;
	}
	.summary-hero {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}
	.hero-left h2 {
		font-size: 15px;
		color: var(--text-primary);
	}
	.hero-sub {
		font-size: 11px;
		color: var(--text-muted);
	}
	.stats-ribbon {
		display: flex;
		gap: 16px;
	}
	.stat-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.stat-tile .num {
		font-size: 16px;
		font-weight: 700;
		color: var(--accent);
	}
	.stat-tile .lbl {
		font-size: 10px;
		color: var(--text-muted);
	}
	.themes-strip {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 11px;
	}
	.themes-lbl {
		color: var(--text-muted);
		font-weight: 600;
	}
	.theme-tag {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 2px 8px;
		border-radius: 12px;
		color: var(--text-primary);
		font-size: 10px;
	}
	.filter-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.filter-tabs {
		display: flex;
		gap: 4px;
	}
	.f-tab {
		all: unset;
		cursor: pointer;
		font-size: 11px;
		padding: 5px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-subtle);
		background: var(--bg-panel);
		color: var(--text-muted);
		transition: all 0.15s;
		&:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
		}
		&.active {
			background: var(--accent-glow);
			border-color: var(--accent);
			color: var(--accent);
			font-weight: 600;
		}
	}
	.filter-search {
		padding: 5px 10px;
		font-size: 11px;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		outline: none;
		width: 180px;
		&:focus {
			border-color: var(--theme-color);
		}
	}
	.stream-scroll {
		flex: 1;
		overflow-y: auto;
	}
	.stream-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.item-card {
		display: flex;
		gap: 12px;
		padding: 10px 14px;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s;
		&:hover {
			background: var(--bg-hover);
			border-color: var(--text-muted);
		}
	}
	.item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		flex: none;
	}
	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
		overflow: hidden;
	}
	.item-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.item-title {
		font-size: 12px;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.item-time {
		font-size: 10px;
		color: var(--text-secondary);
		flex: none;
		margin-left: 8px;
	}
	.item-sub-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.item-sub {
		font-size: 11px;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.empty-state,
	.loading-box {
		padding: 32px;
		text-align: center;
		color: var(--text-muted);
		font-size: 12px;
	}
</style>
