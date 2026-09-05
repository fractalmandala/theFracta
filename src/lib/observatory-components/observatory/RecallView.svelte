<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
</script>

<section class="box gap-md pad-md" aria-labelledby="recall-title">
	<header class="box gap-3xs">
		<h2 id="recall-title" class="text-lg weight-600">Recall</h2>
	</header>

	<!-- Filters row -->
	<div class="row wrap ycenter gap-sm pad-y-2xs border-bottom">
		<label class="row ycenter gap-2xs text-sm text-secondary grow min0 pad-xs border-bottom">
			<span class="shrink-0">Search</span>
			<input class="input text-sm wfull" bind:value={observatory.recallSearchQuery} />
		</label>
		<label class="row ycenter gap-2xs text-sm text-secondary">
			<span class="shrink-0">Type</span>
			<select class="select text-sm" bind:value={observatory.recallSelectedType}>
				<option value="all">All</option>
				{#each [...new Set(observatory.recallEntries.map((entry) => entry.type))] as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</label>
	</div>

	<!-- Entries list -->
	<div class="box gap-2xs pad-y-2xs">
		{#each observatory.filteredRecallEntries as entry (entry.id)}
			<article class="card border pad-sm box gap-3xs">
				<h3 class="text-sm weight-600">{entry.title}</h3>
				<p class="text-sm">{entry.body}</p>
				<small class="text-xs text-muted">
					{entry.type} · {entry.status} · {entry.review_state} · {entry.project || 'unscoped'} · {entry.created_at}
				</small>
			</article>
		{:else}
			<p class="text-sm text-muted">No Recall entries match the current filter.</p>
		{/each}
	</div>
</section>
