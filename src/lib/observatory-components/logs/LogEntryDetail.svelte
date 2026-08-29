<script lang="ts">
	import { logsState } from '$lib/observatory-state/logs.svelte';

	const entry = $derived(logsState.selectedEntry);
	const raw = $derived(entry?.raw);
</script>

{#if entry}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label={entry.title}
		onclick={(e) => e.target === e.currentTarget && logsState.closeModal()}
		onkeydown={(e) => e.key === 'Escape' && logsState.closeModal()}
		tabindex="-1"
	>
		<div class="modal-card" role="document">
			<div class="modal-header">
				<div class="header-left">
					<span class="badge {entry.type === 'commit' ? 'green' : entry.type === 'session' ? 'purple' : 'accent'}">
						{entry.type}
					</span>
					<h3>{entry.title}</h3>
				</div>
				<button class="btn-close" onclick={() => logsState.closeModal()}>✕</button>
			</div>

			<div class="modal-body">
				{#if entry.time}
					<div class="field-item">
						<span class="lbl">Timestamp:</span>
						<span class="val">{new Date(entry.time).toLocaleString()}</span>
					</div>
				{/if}

				{#if entry.url}
					<div class="field-item">
						<span class="lbl">URL:</span>
						<a href={entry.url} target="_blank" rel="noreferrer" class="val link">{entry.url} ↗</a>
					</div>
				{/if}

				{#if raw?.hash}
					<div class="field-item">
						<span class="lbl">Commit Hash:</span>
						<code class="val code">{raw.hash}</code>
					</div>
				{/if}

				{#if raw?.author}
					<div class="field-item">
						<span class="lbl">Author:</span>
						<span class="val">{raw.author}</span>
					</div>
				{/if}

				{#if raw?.summary}
					<div class="field-card">
						<span class="card-lbl">Summary</span>
						<p class="summary-text">{raw.summary}</p>
					</div>
				{/if}

				{#if raw?.content || raw?.text}
					<div class="field-card">
						<span class="card-lbl">Content</span>
						<pre class="content-pre">{raw.content || raw.text}</pre>
					</div>
				{/if}

				{#if raw?.tags && raw.tags.length > 0}
					<div class="field-item">
						<span class="lbl">Tags:</span>
						<div class="tags-wrap">
							{#each raw.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if raw?.tool_calls}
					<div class="field-card">
						<span class="card-lbl">Tool Calls ({raw.tool_calls.length})</span>
						<ul class="tool-list">
							{#each raw.tool_calls as tc}
								<li><code>{tc.name || tc.tool}</code></li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 50;
		display: grid;
		place-items: center;
		padding: 24px;
	}
	.modal-card {
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-float);
		width: 580px;
		max-width: 100%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.modal-header {
		padding: 16px 20px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
		overflow: hidden;
	}
	.header-left h3 {
		font-size: 13px;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.btn-close {
		all: unset;
		cursor: pointer;
		font-size: 13px;
		color: var(--text-muted);
		padding: 4px 8px;
		border-radius: 4px;
		&:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
		}
	}
	.modal-body {
		padding: 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.field-item {
		display: flex;
		gap: 10px;
		font-size: 12px;
	}
	.lbl {
		color: var(--text-muted);
		width: 100px;
		flex: none;
	}
	.val {
		color: var(--text-primary);
		word-break: break-all;
	}
	.val.link {
		color: var(--accent);
	}
	.val.code {
		color: var(--pink);
		font-size: 11px;
	}
	.field-card {
		background: var(--bg-surface);
		padding: 12px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.card-lbl {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		font-weight: 600;
	}
	.summary-text {
		font-size: 12px;
		color: var(--text-primary);
		line-height: 1.4;
	}
	.content-pre {
		font-size: 11px;
		color: var(--text-primary);
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 200px;
		overflow-y: auto;
	}
	.tags-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.tag {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 3px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		color: var(--text-muted);
	}
	.tool-list {
		list-style: disc;
		padding-left: 18px;
		font-size: 11px;
		color: var(--accent);
	}
</style>
