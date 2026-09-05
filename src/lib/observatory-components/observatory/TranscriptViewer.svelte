<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';

	let session = $derived(
		observatory.selectedSessionId
			? observatory.sessions.find((item) => item.id === observatory.selectedSessionId) ?? null
			: null,
	);
	function titleOf() {
		return session?.display_name || session?.first_message || session?.id || '';
	}
</script>

<section class="box gap-md pad-md grow min0" aria-label="Canonical session transcript">
	{#if !session}
		<p class="text-muted text-sm">Select a session to read its canonical transcript.</p>
	{:else}
		<header class="shrink-0 pad-x-sm raised row ycenter xbetween gap-2xs pad-y-2xs border-bottom">
			<div class="box gap-3xs grow min0">
				<button class="button ghost text-xs" onclick={() => observatory.clearSelectedSession()}>← Back to sessions</button>
				<h2 class="text-md weight-600 truncate">{titleOf()}</h2>
				<p class="text-xs text-muted">{session.project} · {session.agent} · {session.message_count} messages</p>
			</div>
			<div class="row ycenter gap-2xs text-xs text-muted shrink-0">
				<span>Outcome: <strong class="text-primary">{session.outcome}</strong></span>
				{#if session.health_score !== undefined}
					<span aria-hidden="true">·</span>
					<span>Health: <strong class="text-primary">{session.health_score}</strong></span>
				{/if}
			</div>
		</header>

		{#if observatory.transcriptLoading}
			<p class="text-muted text-sm">Loading every transcript page from Fractorches…</p>
		{:else if observatory.transcriptError}
			<p class="text-danger text-sm">{observatory.transcriptError}</p>
		{:else if observatory.selectedTranscript.length === 0}
			<p class="text-muted text-sm">Fractorches returned no transcript messages for this session.</p>
		{:else}
			<div class="grow min0 scroll-y gap-xs pad-sm box gap-3xs">
				{#each observatory.selectedTranscript as message (message.ordinal)}
					<article class="radius-4 raised pad-xs text-sm card border pad-sm box gap-3xs" class:transcript-compact={message.is_compact_boundary}>
						<header class="row ycenter gap-2xs text-xs text-muted border-bottom pad-y-3xs">
							<strong class="text-primary weight-600">{message.role}</strong>
							<span aria-hidden="true">·</span>
							<time>{new Date(message.timestamp).toLocaleString()}</time>
							<span aria-hidden="true">·</span>
							<span class="tabular-nums">#{message.ordinal}</span>
						</header>
						{#if message.is_compact_boundary}
							<p class="text-xs text-muted italic">Context compaction boundary</p>
						{/if}
						{#if message.content}
							<pre class="text-sm grow min0">{message.content}</pre>
						{/if}
						{#each message.tool_calls ?? [] as tool, index (`${tool.tool_name}-${index}`)}
							<details class="box gap-2xs">
								<summary class="text-xs weight-500 cursor-pointer">
									{tool.tool_name} · {tool.category}
								</summary>
								<pre class="text-xs mono terminal pad-2xs grow min0">{tool.input_json}</pre>
							</details>
						{/each}
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</section>
