<script lang="ts">
	import { wikiState } from '$lib/wiki/state.svelte';
	import { wikiCorpus } from '$lib/wiki/corpus.svelte';
	import { activeView } from '$lib/states/windowState.svelte';
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import { isRenderableDate } from '$lib/wiki/entry-file';
	import { renderFull } from '$lib/renderer/pipeline';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { Icon } from 'fractalicons';
	import {
		luCopy,
		luCheck,
		luCode,
		luBookOpen,
		luExternalLink,
		luFileSearch,
		luSquare
	} from 'fractalicons/lucide';

	const entry = $derived(wikiState.currentCorpus);

	let copied = $state(false);
	let showRaw = $state(false);

	let renderedHtml = $derived.by(() => {
		if (!entry) return '';
		return renderFull(entry.body).html;
	});

	function openInBench() {
		if (!entry) return;
		activeView.set('bench');
		void observatory.selectSession(entry.source_session_id);
	}

	async function copyBody() {
		if (!entry) return;
		await navigator.clipboard.writeText(entry.body);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<!--
  Corpus entry view: a recall entry as distilled by the Fractorches service.
  The provenance block is the point — every claim here links back to its
  source session, reviewable in Bench.
-->
<article class="min0 pad-y-md pad-x-lg box grow hfull scroll-y">
	{#if !entry}
		<div class="box ycenter xcenter grow pad-xl gap-sm">
			<Icon icon={luFileSearch} size={32} />
			<div class="text-md weight-500">No Corpus Entry Selected</div>
			<div class="text-xs text-secondary">
				{#if wikiCorpus.loading && !wikiCorpus.loaded}
					Loading recall corpus…
				{:else if wikiCorpus.error}
					Corpus unavailable: {wikiCorpus.error}
				{:else if wikiCorpus.entries.length === 0}
					The recall corpus is empty or matches no filter.
				{:else}
					Select a corpus entry from the sidebar.
				{/if}
			</div>
		</div>
	{:else}
		<!-- Action Header Bar -->
		<div class="gap-2xs pad-bottom-xs row ycenter xbetween pad-x-md pad-y-xs border-bottom">
			<div class="row ycenter gap-xs text-xs mono text-secondary">
				<span>CORPUS</span>
				<span>/</span>
				<span class="text-primary tt-u weight-500">{entry.type}</span>
				<span>/</span>
				<span class="text-secondary">{entry.id}</span>
			</div>

			<div class="row ycenter gap-xs">
				<button
					class="button small ghost text-xs"
					class:active={wikiCorpus.isSelected(entry.id)}
					onclick={() => wikiCorpus.toggleSelected(entry.id)}
					title={wikiCorpus.isSelected(entry.id) ? 'Remove from compile cluster' : 'Add to compile cluster'}
				>
					<Icon icon={wikiCorpus.isSelected(entry.id) ? luCheck : luSquare} size={14} />
					<span>{wikiCorpus.isSelected(entry.id) ? 'In cluster' : 'Add to cluster'}</span>
				</button>

				<button
					class="button small ghost text-xs"
					class:active={showRaw}
					onclick={() => (showRaw = !showRaw)}
					title="Toggle Raw Markdown"
				>
					<Icon icon={showRaw ? luBookOpen : luCode} size={14} />
					<span>{showRaw ? 'Rendered' : 'Raw'}</span>
				</button>

				<button class="button small ghost text-xs" onclick={copyBody} title="Copy Markdown">
					<Icon icon={copied ? luCheck : luCopy} size={14} />
					<span>{copied ? 'Copied' : 'Copy'}</span>
				</button>

				<button class="button small ghost text-xs" onclick={openInBench} title="Open the source session in Bench">
					<Icon icon={luExternalLink} size={14} />
					<span>Open in Bench</span>
				</button>
			</div>
		</div>

		<!-- Entry Body Container -->
		<div class="content-shell box pad-md pad-x-lg gap-md grow">
			<!-- Header Block -->
			<header class="box gap-xs pad-bottom-sm border-bottom">
				<div class="row ycenter gap-xs">
					<span class="badge text-2xs tt-u mono" data-type={entry.type}>
						{entry.type}
					</span>
					<span class="badge text-2xs tt-u mono" data-status={entry.review_state}>
						{entry.review_state}
					</span>
					{#if entry.provenance_ok}
						<span class="text-xs mono text-secondary">provenance verified</span>
					{:else}
						<span class="text-xs mono text-secondary">provenance revoked</span>
					{/if}
				</div>

				<h1 class="text-2xl title-tight weight-600 tracking-tight">
					{entry.title}
				</h1>

				<div class="row wrap ycenter gap-md text-xs mono text-secondary pad-top-2xs">
					{#if entry.agent}
						<span>{entry.agent}</span>
					{/if}
					{#if entry.project}
						<span>{entry.project}</span>
					{/if}
					{#if isRenderableDate(entry.updated_at)}
						<span>Updated {new Date(entry.updated_at).toLocaleDateString()}</span>
					{/if}
					{#if entry.confidence !== undefined}
						<span>model confidence {Math.round(entry.confidence * 100)}%</span>
					{/if}
				</div>
			</header>

			<!-- Trigger & Uncertainty -->
			{#if entry.trigger || entry.uncertainty}
				<div class="box gap-xs border pad-sm">
					{#if entry.trigger}
						<div class="box gap-3xs">
							<span class="text-2xs tt-u weight-600 text-secondary mono">Trigger</span>
							<span class="text-xs">{entry.trigger}</span>
						</div>
					{/if}
					{#if entry.uncertainty}
						<div class="box gap-3xs">
							<span class="text-2xs tt-u weight-600 text-secondary mono">Uncertainty</span>
							<span class="text-xs">{entry.uncertainty}</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Content Area -->
			{#if showRaw}
				<pre class="terminal pad-xs radius-4 scroll-x mono text-xs pad-sm border">{entry.body}</pre>
			{:else}
				<div class="wiki-markdown-body">
					<MarkdownRenderer html={renderedHtml} />
				</div>
			{/if}
		</div>
	{/if}
</article>
