<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';

	const entry = $derived(logsState.selectedEntry);
	const raw = $derived(entry?.raw);

	/**
	 * A native <dialog>, opened with showModal(). The browser owns the top layer,
	 * the focus trap, the inert background and Escape; ::backdrop replaces the
	 * scrim. Visibility follows the selected entry rather than a local flag.
	 */
	let el = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!el) return;
		if (entry && !el.open) el.showModal();
		else if (!entry && el.open) el.close();
	});
</script>

{#if entry}
<dialog
	bind:this={el}
	class="dialog dialog-xl dialog-h-screen"
	aria-label={entry.title}
	onclose={() => logsState.closeModal()}
	onclick={(e) => e.target === el && logsState.closeModal()}
>
	<div class="box hfull min0">
			<header class="row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
				<div class="row ycenter gap-2xs grow min0">
					<span class="badge" class:border-success={entry.type === 'commit'} class:border-theme={entry.type === 'session'}>{entry.type}</span>
					<h3 class="text-md weight-600 truncate">{entry.title}</h3>
				</div>
				<button class="button is-icon text-muted" onclick={() => logsState.closeModal()} aria-label="Close entry details">✕</button>
			</header>

			<div class="pad-sm min0 box gap-sm pad-x-sm pad-y-sm scroll-y">
				{#if entry.time}
					<div class="row ycenter gap-2xs text-sm">
						<span class="text-muted tt-u weight-600 text-xs">Timestamp</span>
						<span>{new Date(entry.time).toLocaleString()}</span>
					</div>
				{/if}

				{#if entry.url}
					<div class="row ycenter gap-2xs text-sm">
						<span class="text-muted tt-u weight-600 text-xs">URL</span>
						<a href={entry.url} target="_blank" rel="noreferrer" class="link truncate">{entry.url} ↗</a>
					</div>
				{/if}

				{#if raw?.hash}
					<div class="row ycenter gap-2xs text-sm">
						<span class="text-muted tt-u weight-600 text-xs">Commit Hash</span>
						<code class="text-xs">{raw.hash}</code>
					</div>
				{/if}

				{#if raw?.author}
					<div class="row ycenter gap-2xs text-sm">
						<span class="text-muted tt-u weight-600 text-xs">Author</span>
						<span>{raw.author}</span>
					</div>
				{/if}

				{#if raw?.summary}
					<div class="box gap-2xs">
						<span class="text-muted tt-u weight-600 text-xs">Summary</span>
						<p class="text-sm">{raw.summary}</p>
					</div>
				{/if}

				{#if raw?.content || raw?.text}
					<div class="box gap-2xs">
						<span class="text-muted tt-u weight-600 text-xs">Content</span>
						<pre class="text-sm grow min0 bg terminal pad-2xs radius-sm border">{raw.content || raw.text}</pre>
					</div>
				{/if}

				{#if raw?.tags && raw.tags.length > 0}
					<div class="box gap-2xs">
						<span class="text-muted tt-u weight-600 text-xs">Tags</span>
						<div class="row gap-2xs wrap">
							{#each raw.tags as tag}
								<span class="badge text-xs">{tag}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if raw?.tool_calls}
					<div class="box gap-2xs">
						<span class="text-muted tt-u weight-600 text-xs">Tool Calls ({raw.tool_calls.length})</span>
						<ul class="box gap-3xs unstyled">
							{#each raw.tool_calls as tc}
								<li class="text-xs"><code>{tc.name || tc.tool}</code></li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
	</div>
</dialog>
{/if}
