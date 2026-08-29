<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let skills = $derived(observatory.topSkills);
	let tools = $derived(observatory.toolUsage);
</script>

<section class="box gap-md pad-md" aria-labelledby="trends-title">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Canonical trends</p>
		<h2 id="trends-title" class="text-lg weight-600 m-0">Skills and tools</h2>
		<p class="muted text-sm m-0">Counts and shares are returned by Fractorches for the active filter.</p>
	</header>

	<section class="box gap-2xs">
		<h3 class="text-sm weight-600 m-0">Skills</h3>
		<div class="card border overflow-hidden">
			<table class="table-clean">
				<thead><tr><th>Skill</th><th>Calls</th><th>Sessions</th><th>Share</th><th>Last used</th></tr></thead>
				<tbody>
					{#each skills as row (row.skill_name)}
						<tr>
							<td>{row.skill_name}</td>
							<td class="tabular-nums">{row.call_count}</td>
							<td class="tabular-nums">{row.session_count}</td>
							<td class="tabular-nums">{(row.pct * 100).toFixed(1)}%</td>
							<td>{row.last_used_at}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="text-muted text-sm">No skills reported.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="box gap-2xs">
		<h3 class="text-sm weight-600 m-0">Tools</h3>
		<div class="card border overflow-hidden">
			<table class="table-clean">
				<thead><tr><th>Tool</th><th>Category</th><th>Calls</th><th>Sessions</th><th>Share</th></tr></thead>
				<tbody>
					{#each tools as row (row.tool_name)}
						<tr>
							<td>{row.tool_name}</td>
							<td>{row.category}</td>
							<td class="tabular-nums">{row.call_count}</td>
							<td class="tabular-nums">{row.session_count}</td>
							<td class="tabular-nums">{(row.pct * 100).toFixed(1)}%</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="text-muted text-sm">No tools reported.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</section>
