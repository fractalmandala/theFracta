<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let files = $derived(observatory.recentEdits);
</script>

<section class="box gap-md pad-md" aria-labelledby="edits-title">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Canonical recent edits</p>
		<h2 id="edits-title" class="text-lg weight-600">Files changed</h2>
		<p class="text-muted text-sm">File and edit rows are returned by the recent-edits endpoint.</p>
	</header>

	<div class="box gap-2xs">
		{#each files as file (file.file_path)}
			<article class="card border pad-sm box gap-3xs">
				<header class="row ycenter xbetween gap-2xs">
					<strong class="text-sm truncate grow min0">{file.file_path}</strong>
					<span class="badge text-2xs shrink-0">{file.project}</span>
				</header>
				<p class="text-xs text-muted">
					{file.edit_count} edits · last session {file.last_session_id} · {file.last_edited_at || 'time unavailable'}
				</p>
				<ul class="box gap-3xs unstyled">
					{#each file.edits as edit (edit.timestamp + edit.tool_name)}
						<li class="text-xs text-muted pad-x-2xs pad-y-3xs border-top">
							{edit.tool_name} · {edit.category} · {edit.session_id} · {edit.timestamp || 'time unavailable'}
						</li>
					{/each}
				</ul>
			</article>
		{:else}
			<p class="text-muted text-sm">No recent edits reported.</p>
		{/each}
	</div>
</section>
