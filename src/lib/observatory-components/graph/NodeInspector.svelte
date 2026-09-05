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
	<aside class="surface shrink-0 pad-xs border-left box gap-3xs pad-sm scroll-y" aria-label="Selected node details">
		<header class="row ycenter xbetween gap-2xs border-bottom pad-bottom-2xs">
			<div class="box gap-3xs grow min0">
				<span class="badge">{node.kind ?? 'node'}</span>
				<h3 class="text-sm weight-600 truncate">{node.label ?? node.id}</h3>
			</div>
			<button class="button is-icon text-muted" onclick={() => graphState.clearSelection()} aria-label="Close node inspector">✕</button>
		</header>

		<div class="box gap-3xs pad-y-2xs">
			{#if node.sourceRef}
				<div class="mono text-xs card border pad-2xs box gap-3xs">
					<span class="text-xs weight-600 tt-u text-muted">Source Reference</span>
					<div class="row ycenter gap-2xs">
						<code class="grow min0 text-xs">{node.sourceRef}</code>
						<button
							class="button primary text-xs shrink-0"
							disabled={isOpening}
							onclick={() => openInEditor(node.sourceRef)}
						>{isOpening ? 'Opening…' : 'Open in Editor ↗'}</button>
					</div>
				</div>
			{/if}

			{#if node.detail}
				<div class="mono text-xs card border pad-2xs box gap-3xs">
					<span class="text-xs weight-600 tt-u text-muted">Description</span>
					<p class="text-sm text-secondary">{node.detail}</p>
				</div>
			{/if}

			{#if node.data}
				<div class="mono text-xs card border pad-2xs box gap-3xs">
					<span class="text-xs weight-600 tt-u text-muted">Metrics</span>
					<div class="card-grid">
						{#if node.data.loc !== undefined}
							<div class="mono tabular-nums text-primary box gap-3xs">
								<span class="text-md weight-600">{(node.data.loc || 0).toLocaleString()}</span>
								<span class="text-xs text-muted">LOC</span>
							</div>
						{/if}
						{#if node.data.files !== undefined}
							<div class="mono tabular-nums text-primary box gap-3xs">
								<span class="text-md weight-600">{node.data.files}</span>
								<span class="text-xs text-muted">Files</span>
							</div>
						{/if}
						{#if node.data.commits !== undefined}
							<div class="mono tabular-nums text-primary box gap-3xs">
								<span class="text-md weight-600">{node.data.commits}</span>
								<span class="text-xs text-muted">Commits</span>
							</div>
						{/if}
						{#if node.data.linesChanged !== undefined}
							<div class="mono tabular-nums text-primary box gap-3xs">
								<span class="text-md weight-600">{(node.data.linesChanged || 0).toLocaleString()}</span>
								<span class="text-xs text-muted">Churn</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if node.data?.defines}
				<div class="mono text-xs card border pad-2xs box gap-3xs">
					<span class="text-xs weight-600 tt-u text-muted">Style Definitions</span>
					<div class="row gap-2xs wrap">
						<span class="badge text-xs">{node.data.defines.classes ?? 0} classes</span>
						<span class="badge text-xs">{node.data.defines.tokens ?? 0} tokens</span>
					</div>
					{#if node.data.defines.consumedBy && node.data.defines.consumedBy.length > 0}
						<span class="text-xs text-muted">Consumed by (Blast Radius)</span>
						<ul class="box gap-3xs unstyled">
							{#each node.data.defines.consumedBy as consumer}
								<li class="text-xs pad-x-2xs"><code>{consumer}</code></li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			{#if node.data?.styles}
				<div class="mono text-xs card border pad-2xs box gap-3xs">
					<span class="text-xs weight-600 tt-u text-muted">Styles Applied</span>
					{#if node.data.styles.authored && node.data.styles.authored.length > 0}
						<span class="text-xs text-muted">Authored Classes</span>
						<div class="row gap-2xs wrap">
							{#each node.data.styles.authored as c}
								<span class="badge">.{c.name} <small>({c.count})</small></span>
							{/each}
						</div>
					{/if}
					{#if node.data.styles.tokens && node.data.styles.tokens.length > 0}
						<span class="text-xs text-muted">Tokens</span>
						<div class="row gap-2xs wrap">
							{#each node.data.styles.tokens as t}
								<span class="badge">.{t.name} <small>({t.count})</small></span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</aside>
{/if}
