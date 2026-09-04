<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	function titleOf(session: typeof observatory.sessions[number]) {
		return session.display_name || session.first_message || session.id;
	}

	function localDate(value: string | null) {
		return value ? new Date(value).toLocaleString() : 'No end time recorded';
	}
</script>

<div class="observatory-sidebar box gap-3xs pad-y-2xs">
	<!-- Search row -->
	<div class="row ycenter gap-2xs pad-x-2xs pad-y-3xs border-bottom">
		<input
			class="input text-sm grow min0"
			bind:value={observatory.searchQuery}
			onkeydown={(event) => event.key === 'Enter' && observatory.search()}
			placeholder="Search transcripts"
			aria-label="Search canonical transcripts"
		/>
		<button class="button primary small text-xs" onclick={() => observatory.search()} disabled={observatory.searching}>
			{observatory.searching ? '…' : 'Search'}
		</button>
		<span class="badge text-xs shrink-0">{observatory.filteredSessions.length}/{observatory.totalSessions}</span>
	</div>

	{#if observatory.searchQuery.trim() && observatory.searchHits === null && !observatory.searching}
		<p class="text-xs text-muted pad-x-2xs m-0">Press Search to query Fractorches. This list does not run a title-only substitute.</p>
	{/if}

	<!-- Sessions list -->
	<div class="sessions-list box gap-3xs pad-x-2xs pad-y-3xs">
		{#each observatory.filteredSessions as session (session.id)}
			<button
				class="session-item box gap-3xs pad-x-2xs pad-y-3xs text-left cursor-pointer"
				class:session-selected={session.id === observatory.selectedSessionId}
				onclick={() => observatory.selectSession(session.id)}
			>
				<span class="row ycenter xbetween gap-2xs">
					<span class="text-sm weight-500 truncate grow min0">{titleOf(session)}</span>
					<span class="session-agent text-3xs tt-u text-muted shrink-0">{session.agent}</span>
				</span>
				<span class="row ycenter gap-2xs text-3xs text-muted">
					<span class="session-project truncate">{session.project || 'unknown'}</span>
					<span aria-hidden="true">·</span>
					<span>{session.message_count} msgs</span>
					<span aria-hidden="true">·</span>
					<span class="truncate">{localDate(session.ended_at || session.started_at || session.created_at)}</span>
				</span>
				{#if observatory.searchSnippets.get(session.id)}
					<small class="text-xs text-muted m-0 italic">{observatory.searchSnippets.get(session.id)}</small>
				{/if}
			</button>
		{:else}
			<p class="text-sm text-muted pad-x-2xs m-0">No sessions match the current Fractorches query and filters.</p>
		{/each}
	</div>
</div>
