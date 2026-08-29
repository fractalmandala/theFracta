<script lang="ts">
	import { projectsState } from '$lib/observatory-state/projects.svelte';
	import { graphState } from '$lib/observatory-state/graph.svelte';

	const scan = $derived(projectsState.activeScan);
	const stats = $derived(scan?.stats ?? {});
	const flows = $derived(scan?.flows ?? []);
	const notes = $derived(scan?.notes ?? []);

	const SCAN_TABS: { id: 'layout' | 'system' | 'boundary' | 'health'; label: string; icon: string }[] = [
		{ id: 'layout', label: 'Layout Map', icon: '▤' },
		{ id: 'system', label: 'System & Flows', icon: '◈' },
		{ id: 'boundary', label: 'Boundary Rules', icon: '≡' },
		{ id: 'health', label: 'Health Treemap', icon: '♨' }
	];
</script>

<aside class="sidebar-shell">
	<!-- Project Meta -->
	<div class="proj-meta">
		<h2 class="proj-title">{scan?.project?.name ?? projectsState.activeProject?.name ?? 'Project'}</h2>
		{#if scan?.project?.tagline || projectsState.activeProject?.tagline}
			<p class="proj-tagline">{scan?.project?.tagline ?? projectsState.activeProject?.tagline}</p>
		{/if}
		{#if scan?.project?.date}
			<span class="scan-date">Scanned: {scan.project.date}</span>
		{/if}
	</div>

	<!-- Scan View Switcher -->
	<div class="scans-nav">
		<span class="nav-section-title">Views</span>
		<div class="nav-tabs-col">
			{#each SCAN_TABS as tab}
				{@const isAvail = projectsState.activeProject?.scansAvailable?.includes(tab.id) ?? true}
				<a
					href="/observatory/{projectsState.activeProjectSlug}/{tab.id}"
					class="scan-nav-btn"
					class:active={projectsState.activeScanType === tab.id}
					class:disabled={!isAvail}
				>
					<span class="tab-ic">{tab.icon}</span>
					<span class="tab-lbl">{tab.label}</span>
				</a>
			{/each}
		</div>
	</div>

	<!-- Search & Filters (for graph views) -->
	{#if scan?.scan !== 'health'}
		<div class="search-box">
			<input
				type="text"
				placeholder="Search nodes & files..."
				bind:value={graphState.searchQuery}
				class="search-input"
			/>
		</div>
	{/if}

	<!-- Stats Tiles -->
	{#if stats}
		<div class="stats-section">
			<span class="nav-section-title">Metrics</span>
			<div class="stats-grid">
				{#if stats.loc !== undefined}
					<div class="stat-box">
						<span class="num">{(stats.loc || 0).toLocaleString()}</span>
						<span class="lbl">LOC</span>
					</div>
				{/if}
				{#if stats.files !== undefined}
					<div class="stat-box">
						<span class="num">{stats.files}</span>
						<span class="lbl">Files</span>
					</div>
				{/if}
				{#if stats.authoredClasses !== undefined}
					<div class="stat-box">
						<span class="num">{stats.authoredClasses}</span>
						<span class="lbl">CSS Classes</span>
					</div>
				{/if}
				{#if stats.designTokens !== undefined}
					<div class="stat-box">
						<span class="num">{stats.designTokens}</span>
						<span class="lbl">Tokens</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Flows List (if available in scan) -->
	{#if flows.length > 0}
		<div class="flows-section">
			<div class="section-top">
				<span class="nav-section-title">User Flows ({flows.length})</span>
			</div>
			<div class="flows-list">
				{#each flows as flow}
					<button
						class="flow-btn"
						class:active={graphState.activeFlowId === flow.id}
						onclick={() => graphState.pickFlow(graphState.activeFlowId === flow.id ? null : flow)}
					>
						<span class="flow-dot">▶</span>
						<span class="flow-name">{flow.name}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Notes / Structural Findings -->
	{#if notes.length > 0}
		<div class="notes-section">
			<button class="notes-toggle-btn" onclick={() => graphState.toggleNotes()}>
				<div class="notes-title-row">
					<span>📝 Structural Notes</span>
					<span class="badge {notes.some((n: any) => n.severity === 'alert') ? 'red' : 'accent'}">{notes.length}</span>
				</div>
				<span>{graphState.isNotesOpen ? '▾' : '▸'}</span>
			</button>

			{#if graphState.isNotesOpen}
				<div class="notes-dropdown">
					{#each notes as note}
						<div class="note-card sev-{note.severity}">
							<div class="note-top">
								<span class="badge {note.severity === 'alert' ? 'red' : note.severity === 'warn' ? 'orange' : 'accent'}">
									{note.severity}
								</span>
								<strong>{note.title}</strong>
							</div>
							<p class="note-body">{note.body}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</aside>

<style>
	.sidebar-shell {
		width: 260px;
		background: var(--bg-panel);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 16px;
		overflow-y: auto;
		flex: none;
	}
	.proj-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--border-subtle);
	}
	.proj-title {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
	}
	.proj-tagline {
		font-size: 11px;
		color: var(--text-muted);
		line-height: 1.3;
	}
	.scan-date {
		font-size: 10px;
		color: var(--text-secondary);
		margin-top: 4px;
	}
	.nav-section-title {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		font-weight: 600;
		margin-bottom: 6px;
		display: block;
	}
	.nav-tabs-col {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.scan-nav-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		font-size: 12px;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		border: 1px solid transparent;
		transition: all 0.15s;
		&:hover:not(.disabled) {
			background: var(--bg-hover);
			color: var(--text-primary);
			text-decoration: none;
		}
		&.active {
			background: var(--accent-glow);
			border-color: var(--accent);
			color: var(--accent);
			font-weight: 600;
		}
		&.disabled {
			opacity: 0.4;
			pointer-events: none;
		}
	}
	.tab-ic {
		font-size: 12px;
	}
	.search-input {
		width: 100%;
		padding: 6px 10px;
		font-size: 11px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		outline: none;
		&:focus {
			border-color: var(--accent);
		}
	}
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.stat-box {
		display: flex;
		flex-direction: column;
		background: var(--bg-surface);
		padding: 6px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-subtle);
	}
	.stat-box .num {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-primary);
	}
	.stat-box .lbl {
		font-size: 9px;
		color: var(--text-muted);
	}
	.flows-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.flow-btn {
		all: unset;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-subtle);
		background: var(--bg-surface);
		font-size: 11px;
		color: var(--text-primary);
		transition: all 0.15s;
		&:hover {
			background: var(--bg-hover);
			border-color: var(--border);
		}
		&.active {
			background: rgba(255, 209, 102, 0.15);
			border-color: #ffd166;
			color: #ffd166;
		}
	}
	.flow-dot {
		font-size: 9px;
		color: #ffd166;
	}
	.flow-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.notes-toggle-btn {
		all: unset;
		cursor: pointer;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 11px;
		color: var(--text-primary);
		&:hover {
			background: var(--bg-hover);
		}
	}
	.notes-title-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.notes-dropdown {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 6px;
	}
	.note-card {
		padding: 8px;
		border-radius: 4px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.note-top {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
	}
	.note-body {
		font-size: 11px;
		color: var(--text-muted);
		line-height: 1.3;
	}
</style>
