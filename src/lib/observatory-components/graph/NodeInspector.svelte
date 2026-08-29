<script lang="ts">
	import { graphState } from '$lib/observatory-state/graph.svelte';
	import { projectsState } from '$lib/observatory-state/projects.svelte';
	import { ipcOpenInEditor } from '$lib/observatory-ipc';

	let isOpening = $state(false);

	const node = $derived(graphState.selectedNode);

	async function openInEditor(sourceRef?: string) {
		if (!sourceRef) return;
		isOpening = true;
		const [file, line] = sourceRef.split(':');
		try {
			await ipcOpenInEditor(
				file,
				parseInt(line || '1', 10),
				projectsState.activeProject?.path
			);
		} catch (e) {
			console.error(e);
		} finally {
			isOpening = false;
		}
	}
</script>

{#if node}
	<aside class="inspector-drawer">
		<div class="drawer-header">
			<div class="title-box">
				<span class="badge accent">{node.kind ?? 'node'}</span>
				<h3>{node.label ?? node.id}</h3>
			</div>
			<button class="btn-close" onclick={() => graphState.clearSelection()}>✕</button>
		</div>

		<div class="drawer-body">
			{#if node.sourceRef}
				<div class="field-card">
					<span class="field-label">Source Reference</span>
					<div class="source-row">
						<code class="source-code">{node.sourceRef}</code>
						<button
							class="btn primary open-btn"
							disabled={isOpening}
							onclick={() => openInEditor(node.sourceRef)}
						>
							{isOpening ? 'Opening...' : 'Open in Editor ↗'}
						</button>
					</div>
				</div>
			{/if}

			{#if node.detail}
				<div class="field-card">
					<span class="field-label">Description</span>
					<p class="field-val">{node.detail}</p>
				</div>
			{/if}

			{#if node.data}
				<div class="field-card">
					<span class="field-label">Metrics</span>
					<div class="metrics-grid">
						{#if node.data.loc !== undefined}
							<div class="metric-item">
								<span class="m-val">{(node.data.loc || 0).toLocaleString()}</span>
								<span class="m-lbl">LOC</span>
							</div>
						{/if}
						{#if node.data.files !== undefined}
							<div class="metric-item">
								<span class="m-val">{node.data.files}</span>
								<span class="m-lbl">Files</span>
							</div>
						{/if}
						{#if node.data.commits !== undefined}
							<div class="metric-item">
								<span class="m-val">{node.data.commits}</span>
								<span class="m-lbl">Commits</span>
							</div>
						{/if}
						{#if node.data.linesChanged !== undefined}
							<div class="metric-item">
								<span class="m-val">{(node.data.linesChanged || 0).toLocaleString()}</span>
								<span class="m-lbl">Churn</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if node.data?.defines}
				<div class="field-card">
					<span class="field-label">Style Definitions</span>
					<div class="style-stats">
						<span class="badge">{node.data.defines.classes ?? 0} classes</span>
						<span class="badge">{node.data.defines.tokens ?? 0} tokens</span>
					</div>

					{#if node.data.defines.consumedBy && node.data.defines.consumedBy.length > 0}
						<span class="field-sublabel">Consumed by (Blast Radius):</span>
						<ul class="consumed-list">
							{#each node.data.defines.consumedBy as consumer}
								<li><code>{consumer}</code></li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			{#if node.data?.styles}
				<div class="field-card">
					<span class="field-label">Styles Applied</span>
					{#if node.data.styles.authored && node.data.styles.authored.length > 0}
						<span class="field-sublabel">Authored Classes:</span>
						<div class="tags-wrap">
							{#each node.data.styles.authored as c}
								<span class="tag">.{c.name} <small>({c.count})</small></span>
							{/each}
						</div>
					{/if}

					{#if node.data.styles.tokens && node.data.styles.tokens.length > 0}
						<span class="field-sublabel">Tokens:</span>
						<div class="tags-wrap">
							{#each node.data.styles.tokens as t}
								<span class="tag token">{t.name} <small>({t.count})</small></span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</aside>
{/if}

<style>
	.inspector-drawer {
		position: absolute;
		top: 16px;
		right: 16px;
		bottom: 16px;
		width: 340px;
		max-width: calc(100vw - 32px);
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		z-index: 25;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.drawer-header {
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.title-box {
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow: hidden;
	}
	.title-box h3 {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.btn-close {
		all: unset;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 12px;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		&:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
		}
	}
	.drawer-body {
		padding: 16px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
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
	.field-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		font-weight: 600;
	}
	.field-sublabel {
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 4px;
	}
	.field-val {
		font-size: 12px;
		color: var(--text-primary);
		line-height: 1.4;
	}
	.source-row {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.source-code {
		font-size: 11px;
		color: var(--accent);
		word-break: break-all;
	}
	.open-btn {
		width: 100%;
		font-size: 11px;
		padding: 5px 8px;
	}
	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-top: 4px;
	}
	.metric-item {
		display: flex;
		flex-direction: column;
		background: var(--bg-panel);
		padding: 6px 8px;
		border-radius: 4px;
	}
	.m-val {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
	}
	.m-lbl {
		font-size: 10px;
		color: var(--text-muted);
	}
	.style-stats {
		display: flex;
		gap: 6px;
	}
	.consumed-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-size: 11px;
	}
	.consumed-list code {
		color: var(--pink);
	}
	.tags-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.tag {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--bg-panel);
		color: var(--purple);
		border: 1px solid var(--border);
	}
	.tag.token {
		color: var(--cyan);
	}
</style>
