<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';

	const entry = $derived(logsState.selectedEntry);
	const raw = $derived(entry?.raw);
</script>

{#if entry}
	<div
		class="dialog-backdrop fixed inset-0 box ycenter xcenter pad-top-2xl z-modal"
		role="dialog"
		aria-modal="true"
		aria-label={entry.title}
		onclick={(e) => e.target === e.currentTarget && logsState.closeModal()}
		onkeydown={(e) => e.key === 'Escape' && logsState.closeModal()}
		tabindex="-1"
	>
		<div class="dialog-card card radius-lg bg-dialog border shadow-lg box dialog-md">
			<header class="dialog-header row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
				<div class="row ycenter gap-2xs grow min0">
					<span class="badge" class:badge-success={entry.type === 'commit'} class:badge-accent={entry.type === 'session'}>{entry.type}</span>
					<h3 class="text-md weight-600 m-0 truncate">{entry.title}</h3>
				</div>
				<button class="button is-icon text-muted" onclick={() => logsState.closeModal()} aria-label="Close entry details">✕</button>
			</header>

			<div class="dialog-body box gap-sm pad-x-sm pad-y-sm scroll-y">
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
						<p class="text-sm m-0">{raw.summary}</p>
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
						<ul class="reset-list box gap-3xs">
							{#each raw.tool_calls as tc}
								<li class="text-xs"><code>{tc.name || tc.tool}</code></li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
