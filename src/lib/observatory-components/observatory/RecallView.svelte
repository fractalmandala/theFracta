<script lang="ts">
	import { observatory } from "$lib/observatory-state/observatory.svelte";
</script>

<section class="resource-view">
	<h2>Recall</h2>
	<label>Search <input bind:value={observatory.recallSearchQuery} /></label
	><label
		>Type <select bind:value={observatory.recallSelectedType}
			><option value="all">All</option
			>{#each [...new Set(observatory.recallEntries.map((entry) => entry.type))] as type}<option
					value={type}>{type}</option
				>{/each}</select
		></label
	>{#each observatory.filteredRecallEntries as entry (entry.id)}<article>
			<h3>{entry.title}</h3>
			<p>{entry.body}</p>
			<small
				>{entry.type} · {entry.status} · {entry.review_state} · {entry.project ||
					"unscoped"} · {entry.created_at}</small
			>
		</article>{:else}<p>
			No Recall entries match the current filter.
		</p>{/each}
</section>
