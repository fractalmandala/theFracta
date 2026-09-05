<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';

	const log = $derived(logsState.activeLog);

	const commits = $derived(log?.development?.commits ?? []);
	const browsing = $derived(log?.browsing ?? []);
	const agentSessions = $derived(log?.agent_sessions ?? []);
	const handoffs = $derived(log?.handoffs ?? []);
	const themes = $derived(log?.themes ?? []);

	let searchFilter = $state('');

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
					raw: c,
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
					raw: s,
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
					raw: h,
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
					raw: b,
				});
			}
		}

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

<div class="row box gap-md pad-md grow min0 scroll-y">
	{#if log}
		<!-- Hero -->
		<header class="box gap-3xs border-bottom pad-bottom-3xs">
			<div class="row ycenter xbetween gap-2xs">
				<h2 class="text-lg weight-600">Daily Activity — {log.date}</h2>
				<span class="text-sm text-muted">{log.day_of_week} · {timelineItems.length} entries</span>
			</div>

			<div class="row gap-2xs wrap pad-y-2xs">
				<div class="card border pad-2xs box gap-3xs min-w-120 grow">
					<span class="text-md weight-600">{commits.length}</span>
					<span class="text-xs text-muted">Commits</span>
				</div>
				<div class="card border pad-2xs box gap-3xs min-w-120 grow">
					<span class="text-md weight-600">{agentSessions.length}</span>
					<span class="text-xs text-muted">Agent Sessions</span>
				</div>
				<div class="card border pad-2xs box gap-3xs min-w-120 grow">
					<span class="text-md weight-600">{browsing.length}</span>
					<span class="text-xs text-muted">Web Visits</span>
				</div>
				<div class="card border pad-2xs box gap-3xs min-w-120 grow">
					<span class="text-md weight-600">{handoffs.length}</span>
					<span class="text-xs text-muted">Handoffs</span>
				</div>
			</div>
		</header>

		{#if themes.length > 0}
			<div class="row wrap gap-2xs pad-y-2xs border-bottom">
				<span class="text-xs tt-u weight-600 text-muted shrink-0">Topics</span>
				{#each themes as t}
					<span class="badge" title={t.evidence?.join('\n')}>{t.label}</span>
				{/each}
			</div>
		{/if}

		<!-- Filter bar -->
		<div class="row ycenter xbetween gap-2xs pad-y-2xs">
			<div class="row gap-3xs">
				<button class="button small ghost text-xs" class:primary={logsState.filterType === 'all'} onclick={() => logsState.setFilter('all')}>
					All ({commits.length + browsing.length + agentSessions.length})
				</button>
				<button class="button small ghost text-xs" class:primary={logsState.filterType === 'commits'} onclick={() => logsState.setFilter('commits')}>
					Commits ({commits.length})
				</button>
				<button class="button small ghost text-xs" class:primary={logsState.filterType === 'sessions'} onclick={() => logsState.setFilter('sessions')}>
					Sessions ({agentSessions.length})
				</button>
				<button class="button small ghost text-xs" class:primary={logsState.filterType === 'browsing'} onclick={() => logsState.setFilter('browsing')}>
					Browsing ({browsing.length})
				</button>
				{#if handoffs.length > 0}
					<button class="button small ghost text-xs" class:primary={logsState.filterType === 'handoffs'} onclick={() => logsState.setFilter('handoffs')}>
						Handoffs ({handoffs.length})
					</button>
				{/if}
			</div>
			<input
				type="text"
				placeholder="Search entries…"
				bind:value={searchFilter}
				class="input text-sm shrink-0 grow min0"
			/>
		</div>

		<!-- Stream -->
		<div class="box gap-2xs">
			{#if timelineItems.length === 0}
				<p class="text-sm text-muted pad-md ta-c">No entries match the selected filter.</p>
			{:else}
				{#each timelineItems as item}
					<div
						class="gap-xs pad-y-2xs row ycenter gap-2xs pad-x-2xs pad-y-3xs border-bottom cursor-pointer"
						role="button"
						tabindex="0"
						onclick={() => logsState.selectEntry(item)}
						onkeydown={(e) => e.key === 'Enter' && logsState.selectEntry(item)}
					>
						<span class="w-24 text-muted shrink-0">
							{#if item.type === 'commit'}⌥
							{:else if item.type === 'session'}◉
							{:else if item.type === 'handoff'}📝
							{:else}↗{/if}
						</span>

						<div class="box gap-3xs grow min0">
							<div class="row ycenter gap-2xs">
								<strong class="text-sm weight-500 grow min0 truncate">{item.title}</strong>
								{#if item.time}
									<span class="text-xs text-muted shrink-0 tabular-nums">
										{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</span>
								{/if}
							</div>

							<div class="row ycenter gap-2xs text-xs text-muted">
								<span class="grow min0 truncate">{item.sub}</span>
								{#if item.badge}
									<span class="badge text-2xs" class:border-success={item.type === 'commit'} class:border-theme={item.type === 'session'}>
										{item.badge}
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{:else if logsState.isLoading}
		<div class="box ycenter xcenter pad-2xl text-muted">Loading daily log…</div>
	{:else}
		<div class="box ycenter xcenter pad-2xl text-muted">Select a date from the calendar to view its log.</div>
	{/if}
</div>
