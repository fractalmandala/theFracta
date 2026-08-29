<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let files = $derived(observatory.recentEdits);
</script>

<section class="box gap-md pad-md" aria-labelledby="edits-title">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Canonical recent edits</p>
		<h2 id="edits-title" class="text-lg weight-600 m-0">Files changed</h2>
		<p class="muted text-sm m-0">File and edit rows are returned by the recent-edits endpoint.</p>
	</header>

	<div class="box gap-2xs">
		{#each files as file (file.file_path)}
			<article class="card border pad-sm box gap-3xs">
				<header class="row ycenter xbetween gap-2xs">
					<strong class="text-sm truncate grow min0">{file.file_path}</strong>
					<span class="badge text-3xs shrink-0">{file.project}</span>
				</header>
				<p class="text-xs text-muted m-0">
					{file.edit_count} edits · last session {file.last_session_id} · {file.last_edited_at || 'time unavailable'}
				</p>
				<ul class="reset-list box gap-3xs">
					{#each file.edits as edit (edit.timestamp + edit.tool_name)}
						<li class="text-xs text-muted pad-x-2xs pad-y-3xs border-top">
							{edit.tool_name} · {edit.category} · {edit.session_id} · {edit.timestamp || 'time unavailable'}
						</li>
					{/each}
				</ul>
			</article>
		{:else}
			<p class="muted text-sm">No recent edits reported.</p>
		{/each}
	</div>
</section>
