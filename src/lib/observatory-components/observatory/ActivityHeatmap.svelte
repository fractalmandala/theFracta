<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let summary = $derived(observatory.overview);
</script>
<section class="resource-view"><h2>Sessions</h2>{#if summary}<dl><div><dt>Sessions</dt><dd>{summary.total_sessions}</dd></div><div><dt>Messages</dt><dd>{summary.total_messages}</dd></div><div><dt>Projects</dt><dd>{summary.active_projects}</dd></div><div><dt>Active days</dt><dd>{summary.active_days}</dd></div></dl>{:else}<p>Summary is unavailable.</p>{/if}<h3>Top sessions by messages</h3><ol>{#each observatory.topSessions as item (item.id)}<li><button onclick={() => observatory.selectSession(item.id)}>{item.display_name || item.first_message || item.id}</button> — {item.message_count} messages</li>{:else}<li>No top sessions were reported.</li>{/each}</ol></section>
