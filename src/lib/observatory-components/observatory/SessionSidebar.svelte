<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	function titleOf(session: typeof observatory.sessions[number]) {
		return session.display_name || session.first_message || session.id;
	}

	function localDate(value: string | null) {
		return value ? new Date(value).toLocaleString() : 'No end time recorded';
	}
</script>

<aside class="session-sidebar" aria-label="Filtered sessions">
	<div class="search-wrap">
		<input
			class="search-input"
			bind:value={observatory.searchQuery}
			onkeydown={(event) => event.key === 'Enter' && observatory.search()}
			placeholder="Search transcripts"
			aria-label="Search canonical transcripts"
		/>
		<button class="search-btn" onclick={() => observatory.search()} disabled={observatory.searching}>Search</button>
		<span class="count-badge">{observatory.filteredSessions.length} / {observatory.totalSessions}</span>
	</div>
	{#if observatory.searchQuery.trim() && observatory.searchHits === null && !observatory.searching}
		<p class="resource-note">Press Search to query Fractorches. This list does not run a title-only substitute.</p>
	{/if}
	<div class="sessions-list">
		{#each observatory.filteredSessions as session (session.id)}
			<button class="session-item" class:selected={session.id === observatory.selectedSessionId} onclick={() => observatory.selectSession(session.id)}>
				<span class="item-top">
					<span class="session-title">{titleOf(session)}</span>
					<span class="agent-pill">{session.agent}</span>
				</span>
				<span class="item-bottom">
					<span class="project-tag">{session.project}</span>
					<span class="meta-dot" aria-hidden="true">·</span>
					<span class="turns-text">{session.message_count} messages</span>
					<span class="meta-dot" aria-hidden="true">·</span>
					<span class="time-text">{localDate(session.ended_at || session.started_at || session.created_at)}</span>
				</span>
				{#if observatory.searchSnippets.get(session.id)}<small class="session-snippet">{observatory.searchSnippets.get(session.id)}</small>{/if}
			</button>
		{:else}
			<p class="empty-state">No sessions match the current Fractorches query and filters.</p>
		{/each}
	</div>
</aside>
