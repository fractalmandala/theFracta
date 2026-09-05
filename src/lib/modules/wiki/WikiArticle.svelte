<script lang="ts">
	import { wikiState } from '$lib/wiki/state.svelte';
	import { wikiCorpus } from '$lib/wiki/corpus.svelte';
	import { isRenderableDate } from '$lib/wiki/entry-file';
	import { compileFreshness } from '$lib/wiki/freshness';
	import { renderFull } from '$lib/renderer/pipeline';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { Icon } from 'fractalicons';
	import {
		luCopy,
		luCheck,
		luFileText,
		luCode,
		luBookOpen,
		luExternalLink,
		luTag,
		luClock,
		luLayers,
		luSparkles
	} from 'fractalicons/lucide';

	const current = $derived(wikiState.current);

	let copied = $state(false);
	let showRaw = $state(false);

	let renderedHtml = $derived.by(() => {
		if (!current) return '';
		const res = renderFull(current.body);
		return res.html;
	});

	let wordCount = $derived.by(() => {
		if (!current) return 0;
		return current.body.trim().split(/\s+/).filter(Boolean).length;
	});

	let readTimeMin = $derived(Math.max(1, Math.ceil(wordCount / 200)));
	let estTokens = $derived(Math.round(wordCount * 1.3));

	async function copyContent() {
		if (!current) return;
		await navigator.clipboard.writeText(current.body);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<article class="min0 pad-y-md pad-x-lg box grow hfull scroll-y">
	{#if !current}
		<div class="box ycenter xcenter grow pad-xl gap-sm">
			<Icon icon={luBookOpen} size={32} />
			<div class="text-md weight-500">No Wiki Entry Selected</div>
			<div class="text-xs text-secondary">
				Select an entry from the sidebar registry or create a new topic.
			</div>
		</div>
	{:else}
		<!-- Action Header Bar -->
		<div class="gap-2xs pad-bottom-xs row ycenter xbetween pad-x-md pad-y-xs border-bottom">
			<div class="row ycenter gap-xs text-xs mono text-secondary">
				<span>WIKI</span>
				<span>/</span>
				<span class="text-primary tt-u weight-500">{current.type}</span>
				<span>/</span>
				<span class="text-secondary">{current.id}</span>
			</div>

			<div class="row ycenter gap-xs">
				<button
					class="button small ghost text-xs"
					class:active={showRaw}
					onclick={() => (showRaw = !showRaw)}
					title="Toggle Raw Markdown"
				>
					<Icon icon={showRaw ? luBookOpen : luCode} size={14} />
					<span>{showRaw ? 'Rendered' : 'Raw'}</span>
				</button>

				<button class="button small ghost text-xs" onclick={copyContent} title="Copy Markdown">
					<Icon icon={copied ? luCheck : luCopy} size={14} />
					<span>{copied ? 'Copied' : 'Copy'}</span>
				</button>
			</div>
		</div>

		<!-- Article Body Container -->
		<div class="content-shell box pad-md pad-x-lg gap-md grow">
			<!-- Header Block -->
			<header class="box gap-xs pad-bottom-sm border-bottom">
				<div class="row ycenter gap-xs">
					<span class="badge text-2xs tt-u mono" data-type={current.type}>
						{current.type}
					</span>
					<span class="badge text-2xs tt-u mono" data-status={current.status}>
						{current.status}
					</span>
					{#if isRenderableDate(current.updatedAt)}
						<span class="text-xs text-secondary mono pad-left-xs">
							Updated {new Date(current.updatedAt).toLocaleDateString()}
						</span>
					{/if}
				</div>

				<h1 class="text-2xl title-tight weight-600 tracking-tight">
					{current.title}
				</h1>

				<p class="content-shell text-sm text-secondary">
					{current.summary}
				</p>

				<!-- Telemetry Reading Stats -->
				<div class="row ycenter gap-md text-xs mono text-secondary pad-top-2xs">
					<span>{wordCount} words</span>
					<span>•</span>
					<span>~{estTokens} tokens</span>
					<span>•</span>
					<span>{readTimeMin} min read</span>
				</div>
			</header>

			<!-- Content Area -->
			{#if showRaw}
				<pre class="terminal pad-xs radius-4 scroll-x mono text-xs pad-sm border">{ current.body }</pre>
			{:else}
				<div class="wiki-markdown-body">
					<MarkdownRenderer html={renderedHtml} />
				</div>
			{/if}

			<!-- Compiled-draft provenance & freshness -->
			{#if current.compiledFrom && current.compiledFrom.length > 0}
				{@const freshness = compileFreshness(current, wikiCorpus.entries)}
				<div class="box gap-xs border pad-sm">
					<div class="row ycenter gap-xs">
						<Icon icon={luSparkles} size={14} />
						<span class="text-2xs tt-u weight-600 text-secondary mono">
							Compiled draft — {current.compiledFrom.length} grounding {current.compiledFrom.length === 1 ? 'entry' : 'entries'}
						</span>
					</div>
					{#if isRenderableDate(current.compiledAt ?? '')}
						<span class="text-xs mono text-secondary">
							Compiled {new Date(current.compiledAt ?? '').toLocaleString()}
						</span>
					{/if}
					{#if freshness.state === 'fresh'}
						<span class="text-xs">Grounding entries unchanged since compile.</span>
					{:else if freshness.state === 'stale'}
						<span class="text-xs">
							Grounding {freshness.changedIds.length === 1 ? 'entry' : 'entries'} changed since compile ({freshness.changedIds.join(', ')}) — recompile suggested.
						</span>
					{:else}
						<span class="text-xs text-secondary">
							Freshness unknown: {freshness.unseenIds.length} grounding {freshness.unseenIds.length === 1 ? 'entry is' : 'entries are'} not in the loaded corpus view.
						</span>
					{/if}
					<div class="row wrap gap-3xs">
						{#each current.compiledFrom as id (id)}
							<span class="badge radius-32 gap-3xs border pad-x-xs pad-y-2xs text-2xs mono">
								{id}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Provenance & References Footer -->
			<footer class="pad-top-xs text-muted box gap-sm pad-top-md border-top text-xs mono">
				<div class="row ycenter gap-xs text-secondary">
					<Icon icon={luLayers} size={14} />
					<span class="tt-u weight-600">Referenced Project Files</span>
				</div>
				<div class="row wrap gap-xs">
					{#each current.files as file}
						<span class="badge radius-32 gap-3xs border pad-x-xs pad-y-2xs text-2xs">
							{file}
						</span>
					{/each}
				</div>
			</footer>
		</div>
	{/if}
</article>
