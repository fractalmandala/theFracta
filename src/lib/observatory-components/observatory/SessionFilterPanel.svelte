<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	let agentCounts = $derived(observatory.agentCounts);
	let availableAgents = $derived(observatory.availableAgents.filter((a) => a !== 'all'));
</script>

{#if observatory.filterPanelOpen}
	<aside class="filter-panel border-left box gap-sm pad-sm" aria-label="Filters">
		<header class="row ycenter xbetween pad-y-2xs border-bottom">
			<span class="text-sm weight-600">Filters</span>
			<button class="button is-icon text-muted" onclick={() => observatory.filterPanelOpen = false} aria-label="Close filters">×</button>
		</header>

		<section class="box gap-3xs pad-y-2xs">
			<h4 class="filter-label text-xs weight-600 tt-u text-muted m-0">Display</h4>
			<div class="box gap-3xs">
				<label class="row ycenter gap-2xs text-sm cursor-pointer">
					<input type="radio" name="groupBy" value="" bind:group={observatory.groupBy} />
					<span>No grouping</span>
				</label>
				<label class="row ycenter gap-2xs text-sm cursor-pointer">
					<input type="radio" name="groupBy" value="agent" bind:group={observatory.groupBy} />
					<span>Group by agent</span>
				</label>
				<label class="row ycenter gap-2xs text-sm cursor-pointer">
					<input type="radio" name="groupBy" value="project" bind:group={observatory.groupBy} />
					<span>Group by project</span>
				</label>
			</div>
		</section>

		<section class="box gap-3xs pad-y-2xs">
			<h4 class="filter-label text-xs weight-600 tt-u text-muted m-0">Starred</h4>
			<label class="row ycenter gap-2xs text-sm cursor-pointer">
				<input type="checkbox" bind:checked={observatory.starredOnly} />
				<span>Starred only</span>
			</label>
		</section>

		<section class="box gap-3xs pad-y-2xs">
			<h4 class="filter-label text-xs weight-600 tt-u text-muted m-0">Activity</h4>
			<label class="row ycenter gap-2xs text-sm cursor-pointer">
				<input type="checkbox" bind:checked={observatory.recentlyActive} />
				<span>Recently active</span>
			</label>
		</section>

		<section class="box gap-3xs pad-y-2xs">
			<h4 class="filter-label text-xs weight-600 tt-u text-muted m-0">Session type</h4>
			<label class="row ycenter gap-2xs text-sm cursor-pointer">
				<input type="checkbox" bind:checked={observatory.hideSingleTurn} />
				<span>Hide single-turn</span>
			</label>
			<label class="row ycenter gap-2xs text-sm cursor-pointer">
				<input type="checkbox" bind:checked={observatory.includeAutomated} />
				<span>Include automated</span>
			</label>
		</section>

		<section class="box gap-3xs pad-y-2xs">
			<h4 class="filter-label text-xs weight-600 tt-u text-muted m-0">Project</h4>
			<label class="row ycenter gap-2xs text-sm cursor-pointer">
				<input type="checkbox" bind:checked={observatory.hideUnknown} />
				<span>Hide unknown</span>
			</label>
		</section>

		{#if availableAgents.length > 0}
			<section class="box gap-3xs pad-y-2xs">
				<h4 class="filter-label text-xs weight-600 tt-u text-muted m-0">Agent</h4>
				<div class="box gap-3xs">
					{#each availableAgents as agent}
						<label class="row ycenter gap-2xs text-sm cursor-pointer">
							<input
								type="checkbox"
								value={agent}
								checked={observatory.selectedAgents.includes(agent)}
								onchange={(e) => {
									const checked = (e.target as HTMLInputElement).checked;
									if (checked) {
										observatory.selectedAgents = [...observatory.selectedAgents, agent];
									} else {
										observatory.selectedAgents = observatory.selectedAgents.filter((a) => a !== agent);
									}
								}}
							/>
							<span class="tt-u">{agent}</span>
							<span class="text-3xs text-muted">({agentCounts.get(agent) || 0})</span>
						</label>
					{/each}
				</div>
			</section>
		{/if}
	</aside>
{/if}
