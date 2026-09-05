<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
</script>

<section class="box gap-md pad-md" aria-labelledby="projects-title">
	<header class="box gap-3xs">
		<h2 id="projects-title" class="text-lg weight-600">Project inventory</h2>
	</header>
	<label class="row ycenter gap-2xs text-sm text-secondary pad-y-2xs">
		<span>Find project</span>
		<input class="input text-sm" bind:value={observatory.dataProjectFilter} />
	</label>
	<div class="card border overflow-hidden">
		<table class="table-clean">
			<thead>
				<tr><th>Project</th><th>Sessions</th><th>Messages</th><th>Avg msgs</th><th>First session</th><th>Last session</th></tr>
			</thead>
			<tbody>
				{#each observatory.projectsTable.filter((row) => row.name.toLowerCase().includes(observatory.dataProjectFilter.toLowerCase())) as row (row.name)}
					<tr>
						<td>{row.name}</td>
						<td class="tabular-nums">{row.sessions}</td>
						<td class="tabular-nums">{row.messages}</td>
						<td class="tabular-nums">{row.avg_messages}</td>
						<td>{row.first_session}</td>
						<td>{row.last_session}</td>
					</tr>
				{:else}
					<tr><td colspan="6" class="text-muted text-sm">No canonical project analytics match this filter.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
