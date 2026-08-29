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
		{ id: 'health', label: 'Health Treemap', icon: '♨' },
	];
</script>

<aside class="observatory-sidebar border-right box gap-sm pad-sm overflow-y-auto">
	<!-- Project meta -->
	<header class="box gap-3xs border-bottom pad-bottom-2xs">
		<h2 class="text-md weight-700 m-0">{scan?.project?.name ?? projectsState.activeProject?.name ?? 'Project'}</h2>
		{#if scan?.project?.tagline || projectsState.activeProject?.tagline}
			<p class="text-xs text-muted m-0">{scan?.project?.tagline ?? projectsState.activeProject?.tagline}</p>
		{/if}
		{#if scan?.project?.date}
			<span class="text-3xs text-muted">Scanned: {scan.project.date}</span>
		{/if}
	</header>

	<!-- Scan views -->
	<section class="box gap-3xs">
		<h3 class="text-xs weight-600 tt-u text-muted m-0">Views</h3>
		<nav class="box gap-3xs">
			{#each SCAN_TABS as tab}
				{@const isAvail = projectsState.activeProject?.scansAvailable?.includes(tab.id) ?? true}
				<a
					href="/observatory/{projectsState.activeProjectSlug}/{tab.id}"
					class="sidebar-tab row ycenter gap-2xs pad-x-2xs pad-y-3xs radius-sm text-sm text-secondary"
					class:sidebar-tab-active={projectsState.activeScanType === tab.id}
					class:opacity-half={!isAvail}
					aria-disabled={!isAvail}
				>
					<span class="text-muted shrink-0">{tab.icon}</span>
					<span class="grow min0 truncate">{tab.label}</span>
				</a>
			{/each}
		</nav>
	</section>

	<!-- Search (graph views only) -->
	{#if scan?.scan !== 'health'}
		<section class="box gap-2xs">
			<h3 class="text-xs weight-600 tt-u text-muted m-0">Search</h3>
			<input
				type="text"
				placeholder="Search nodes & files..."
				bind:value={graphState.searchQuery}
				class="input text-sm wfull"
			/>
		</section>
	{/if}

	<!-- Metrics -->
	{#if stats}
		<section class="box gap-3xs">
			<h3 class="text-xs weight-600 tt-u text-muted m-0">Metrics</h3>
			<div class="grid-2 gap-2xs">
				{#if stats.loc !== undefined}
					<div class="metric-tile card border pad-2xs">
						<span class="metric-tile-num">{(stats.loc || 0).toLocaleString()}</span>
						<span class="metric-tile-lbl">LOC</span>
					</div>
				{/if}
				{#if stats.files !== undefined}
					<div class="metric-tile card border pad-2xs">
						<span class="metric-tile-num">{stats.files}</span>
						<span class="metric-tile-lbl">Files</span>
					</div>
				{/if}
				{#if stats.authoredClasses !== undefined}
					<div class="metric-tile card border pad-2xs">
						<span class="metric-tile-num">{stats.authoredClasses}</span>
						<span class="metric-tile-lbl">CSS Classes</span>
					</div>
				{/if}
				{#if stats.designTokens !== undefined}
					<div class="metric-tile card border pad-2xs">
						<span class="metric-tile-num">{stats.designTokens}</span>
						<span class="metric-tile-lbl">Tokens</span>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- Flows list -->
	{#if flows.length > 0}
		<section class="box gap-3xs">
			<h3 class="text-xs weight-600 tt-u text-muted m-0">User Flows ({flows.length})</h3>
			<div class="box gap-3xs">
				{#each flows as flow}
					<button
						class="sidebar-tab row ycenter gap-2xs pad-x-2xs pad-y-3xs radius-sm text-sm text-secondary wfull text-left cursor-pointer"
						class:sidebar-tab-active={graphState.activeFlowId === flow.id}
						onclick={() => graphState.pickFlow(graphState.activeFlowId === flow.id ? null : flow)}
					>
						<span class="text-muted shrink-0">▶</span>
						<span class="grow min0 truncate">{flow.name}</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Notes -->
	{#if notes.length > 0}
		<section class="box gap-3xs">
			<button class="row ycenter xbetween gap-2xs pad-x-2xs pad-y-3xs wfull cursor-pointer bg-transparent border-0" onclick={() => graphState.toggleNotes()}>
				<span class="row ycenter gap-2xs text-xs weight-600 tt-u text-muted">
					<span>📝 Structural Notes</span>
					<span class="badge text-3xs" class:badge-danger={notes.some((n: any) => n.severity === 'alert')}>
						{notes.length}
					</span>
				</span>
				<span class="text-xs text-muted">{graphState.isNotesOpen ? '▾' : '▸'}</span>
			</button>

			{#if graphState.isNotesOpen}
				<div class="box gap-2xs">
					{#each notes as note}
						<div class="card border pad-2xs box gap-3xs">
							<header class="row ycenter gap-2xs">
								<span class="badge text-3xs" class:badge-danger={note.severity === 'alert'} class:badge-warn={note.severity === 'warn'}>
									{note.severity}
								</span>
								<strong class="text-xs weight-600">{note.title}</strong>
							</header>
							<p class="text-xs text-secondary m-0">{note.body}</p>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</aside>
