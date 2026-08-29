<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	let agentCounts = $derived(observatory.agentCounts);
	let availableAgents = $derived(observatory.availableAgents.filter(a => a !== 'all'));
</script>

{#if observatory.filterPanelOpen}
	<div class="filter-panel">
		<div class="panel-header">
			<span class="panel-title">Filters</span>
			<button class="close-btn" onclick={() => observatory.filterPanelOpen = false}>×</button>
		</div>

		<div class="filter-section">
			<h4 class="filter-label">Display</h4>
			<div class="filter-options">
				<label class="filter-option">
					<input
						type="radio"
						name="groupBy"
						value=""
						bind:group={observatory.groupBy}
					/>
					<span>No grouping</span>
				</label>
				<label class="filter-option">
					<input
						type="radio"
						name="groupBy"
						value="agent"
						bind:group={observatory.groupBy}
					/>
					<span>Group by agent</span>
				</label>
				<label class="filter-option">
					<input
						type="radio"
						name="groupBy"
						value="project"
						bind:group={observatory.groupBy}
					/>
					<span>Group by project</span>
				</label>
			</div>
		</div>

		<div class="filter-section">
			<h4 class="filter-label">Starred</h4>
			<label class="filter-toggle">
				<input type="checkbox" bind:checked={observatory.starredOnly} />
				<span>Starred only</span>
			</label>
		</div>

		<div class="filter-section">
			<h4 class="filter-label">Activity</h4>
			<label class="filter-toggle">
				<input type="checkbox" bind:checked={observatory.recentlyActive} />
				<span>Recently active</span>
			</label>
		</div>

		<div class="filter-section">
			<h4 class="filter-label">Session Type</h4>
			<label class="filter-toggle">
				<input type="checkbox" bind:checked={observatory.hideSingleTurn} />
				<span>Hide single-turn</span>
			</label>
			<label class="filter-toggle">
				<input type="checkbox" bind:checked={observatory.includeAutomated} />
				<span>Include automated</span>
			</label>
		</div>

		<div class="filter-section">
			<h4 class="filter-label">Project</h4>
			<label class="filter-toggle">
				<input type="checkbox" bind:checked={observatory.hideUnknown} />
				<span>Hide unknown</span>
			</label>
		</div>

		{#if availableAgents.length > 0}
			<div class="filter-section">
				<h4 class="filter-label">Agent</h4>
				<div class="agent-list">
					{#each availableAgents as agent}
						<label class="filter-toggle">
							<input
								type="checkbox"
								value={agent}
								onchange={(e) => {
									const checked = (e.target as HTMLInputElement).checked;
									if (checked) {
										observatory.selectedAgents = [...observatory.selectedAgents, agent];
									} else {
										observatory.selectedAgents = observatory.selectedAgents.filter(a => a !== agent);
									}
								}}
								checked={observatory.selectedAgents.includes(agent)}
							/>
							<span>{agent.toUpperCase()}</span>
							<span class="count">({agentCounts.get(agent) || 0})</span>
						</label>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
