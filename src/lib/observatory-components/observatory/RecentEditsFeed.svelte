<script lang="ts">
	import { observatory } from "$lib/observatory-state/observatory.svelte";
	let files = $derived(observatory.recentEdits);
</script>

<section class="recent">
	<header>
		<p class="eyebrow">Canonical recent edits</p>
		<h2>Files changed</h2>
		<p class="muted">
			File and edit rows are returned by the recent-edits endpoint.
		</p>
	</header>
	<div class="files">
		{#each files as file}<article>
				<div class="file-header">
					<strong>{file.file_path}</strong><span>{file.project}</span>
				</div>
				<p>
					{file.edit_count} edits · last session {file.last_session_id}
					· {file.last_edited_at || "time unavailable"}
				</p>
				<ul>
					{#each file.edits as edit}<li>
							{edit.tool_name} · {edit.category} · {edit.session_id}
							· {edit.timestamp || "time unavailable"}
						</li>{/each}
				</ul>
			</article>{:else}<p class="muted">
				No recent edits reported.
			</p>{/each}
	</div>
</section>
