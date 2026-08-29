<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	let session = $derived(observatory.selectedSessionId ? observatory.sessions.find((item) => item.id === observatory.selectedSessionId) ?? null : null);
	function titleOf() { return session?.display_name || session?.first_message || session?.id || ''; }
</script>

<section class="transcript-viewer" aria-label="Canonical session transcript">
	{#if !session}
		<div class="resource-note">Select a session to read its canonical transcript.</div>
	{:else}
		<header class="transcript-header">
			<div><button onclick={() => observatory.clearSelectedSession()}>Back to sessions</button><h2>{titleOf()}</h2><p>{session.project} · {session.agent} · {session.message_count} messages</p></div>
			<div><span>Outcome: {session.outcome}</span>{#if session.health_score !== undefined}<span>Health: {session.health_score}</span>{/if}</div>
		</header>
		{#if observatory.transcriptLoading}
			<p class="resource-note">Loading every transcript page from Fractorches…</p>
		{:else if observatory.transcriptError}
			<p class="resource-error">{observatory.transcriptError}</p>
		{:else if observatory.selectedTranscript.length === 0}
			<p class="resource-note">Fractorches returned no transcript messages for this session.</p>
		{:else}
			<div class="transcript-messages">
				{#each observatory.selectedTranscript as message (message.ordinal)}
					<article class:compact={message.is_compact_boundary} class="transcript-message">
						<header><strong>{message.role}</strong><time>{new Date(message.timestamp).toLocaleString()}</time><span>#{message.ordinal}</span></header>
						{#if message.is_compact_boundary}<p class="resource-note">Context compaction boundary</p>{/if}
						{#if message.content}<pre>{message.content}</pre>{/if}
						{#each message.tool_calls ?? [] as tool, index (`${tool.tool_name}-${index}`)}
							<details><summary>{tool.tool_name} · {tool.category}</summary><pre>{tool.input_json}</pre></details>
						{/each}
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</section>
