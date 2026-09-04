<script lang="ts">
	import { wikiState } from '$lib/wiki/state';
	import type { WikiEntry } from '$lib/wiki/types';
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
		luLayers
	} from 'fractalicons/lucide';

	const current = wikiState.current;

	let copied = $state(false);
	let showRaw = $state(false);

	let renderedHtml = $derived.by(() => {
		if (!$current) return '';
		const res = renderFull($current.body);
		return res.html;
	});

	let wordCount = $derived.by(() => {
		if (!$current) return 0;
		return $current.body.trim().split(/\s+/).filter(Boolean).length;
	});

	let readTimeMin = $derived(Math.max(1, Math.ceil(wordCount / 200)));
	let estTokens = $derived(Math.round(wordCount * 1.3));

	async function copyContent() {
		if (!$current) return;
		await navigator.clipboard.writeText($current.body);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<article class="wiki-article box grow hfull scroll-y">
	{#if !$current}
		<div class="box ycenter xcenter grow pad-xl tt-c gap-sm">
			<Icon icon={luBookOpen} size={32} />
			<div class="text-base weight-500">No Wiki Entry Selected</div>
			<div class="text-xs text-secondary">
				Select an entry from the sidebar registry or create a new topic.
			</div>
		</div>
	{:else}
		<!-- Action Header Bar -->
		<div class="wiki-article-toolbar row ycenter xbetween pad-x-md pad-y-xs border-bottom">
			<div class="row ycenter gap-xs text-xs mono text-secondary">
				<span>WIKI</span>
				<span>/</span>
				<span class="text-primary tt-u weight-500">{$current.type}</span>
				<span>/</span>
				<span class="text-secondary">{$current.id}</span>
			</div>

			<div class="row ycenter gap-xs">
				<button
					class="button small is-ghost text-xs"
					class:active={showRaw}
					onclick={() => (showRaw = !showRaw)}
					title="Toggle Raw Markdown"
				>
					<Icon icon={showRaw ? luBookOpen : luCode} size={14} />
					<span>{showRaw ? 'Rendered' : 'Raw'}</span>
				</button>

				<button class="button small is-ghost text-xs" onclick={copyContent} title="Copy Markdown">
					<Icon icon={copied ? luCheck : luCopy} size={14} />
					<span>{copied ? 'Copied' : 'Copy'}</span>
				</button>
			</div>
		</div>

		<!-- Article Body Container -->
		<div class="wiki-article-content box pad-md pad-x-lg gap-md grow">
			<!-- Header Block -->
			<header class="box gap-xs pad-bottom-sm border-bottom">
				<div class="row ycenter gap-xs">
					<span class="wiki-type-badge text-2xs tt-u mono" data-type={$current.type}>
						{$current.type}
					</span>
					<span class="wiki-status-badge text-2xs tt-u mono" data-status={$current.status}>
						{$current.status}
					</span>
					<span class="text-xs text-secondary mono pad-left-xs">
						Updated {new Date($current.updatedAt).toLocaleDateString()}
					</span>
				</div>

				<h1 class="wiki-title weight-600 tracking-tight">
					{$current.title}
				</h1>

				<p class="wiki-summary text-sm text-secondary">
					{$current.summary}
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
				<pre class="wiki-raw-code mono text-xs pad-sm border">{ $current.body }</pre>
			{:else}
				<div class="wiki-markdown-body">
					<MarkdownRenderer html={renderedHtml} />
				</div>
			{/if}

			<!-- Provenance & References Footer -->
			<footer class="wiki-article-footer box gap-sm pad-top-md border-top text-xs mono">
				<div class="row ycenter gap-xs text-secondary">
					<Icon icon={luLayers} size={14} />
					<span class="tt-u weight-600">Referenced Project Files</span>
				</div>
				<div class="row wrap gap-xs">
					{#each $current.files as file}
						<span class="wiki-file-pill border pad-x-xs pad-y-2xs text-2xs">
							{file}
						</span>
					{/each}
				</div>
			</footer>
		</div>
	{/if}
</article>
