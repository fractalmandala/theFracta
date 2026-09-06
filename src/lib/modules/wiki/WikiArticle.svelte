<script lang="ts">
	import { wikiState } from "$lib/wiki/state.svelte";
	import { wikiCorpus } from "$lib/wiki/corpus.svelte";
	import { isRenderableDate } from "$lib/wiki/entry-file";
	import { compileFreshness } from "$lib/wiki/freshness";
	import { renderFull } from "$lib/renderer/pipeline";
	import MarkdownRenderer from "$lib/components/MarkdownRenderer.svelte";
	import { Icon } from "fractalicons";
	import {
		luCopy,
		luCheck,
		luFileText,
		luCode,
		luBookOpen,
		luExternalLink,
		luClock,
		luLayers,
		luSparkles,
		luShield,
		luDatabase,
	} from "fractalicons/lucide";

	const current = $derived(wikiState.current);

	let copied = $state(false);
	let showRaw = $state(false);

	let renderedHtml = $derived.by(() => {
		if (!current) return "";
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

{#if current}
	<div class="wiki-shell box wfull">
		<!-- Left Metadata Column -->
		<div class="box gap-lg wiki-left">
			<header class="box gap-xs">
				<div class="row ycenter gap-xs wrap">
					{#if current.sectionTitle}
						<span class="badge radius-4 bg-surface border text-theme text-xs pad-x-xs pad-y-3xs weight-600">
							{current.sectionTitle}
						</span>
					{/if}
					<span class="badge radius-4 text-xs pad-x-xs pad-y-3xs">
						{current.type}
					</span>
					<span
						class="badge radius-4 text-xs pad-x-xs pad-y-3xs"
						class:bg-theme={current.status === 'stable'}
					>
						{current.status}
					</span>
					{#if isRenderableDate(current.updatedAt || current.generated?.at || '')}
						<span class="text-xs text-secondary mono">
							{new Date(current.updatedAt || current.generated?.at || '').toLocaleDateString()}
						</span>
					{/if}
				</div>

				<h1 class="text-3xl lh11 wfull weight-700">
					{current.title}
				</h1>

				{#if current.summary || current.description}
					<p class="text-lg lh12 text-secondary">
						{current.summary || current.description}
					</p>
				{/if}

				{#if current.tags && current.tags.length > 0}
					<div class="row ycenter gap-2xs wrap pad-top-2xs">
						{#each current.tags as tag, i}
							<button
								type="button"
								class="badge radius-4 text-xs pad-x-xs pad-y-3xs cursor-pointer border"
								onclick={() => wikiState.toggleTag(tag)}
								title="Filter by #{tag}"
							>
								#{tag}
							</button>
						{/each}
					</div>
				{/if}
			</header>

			<!-- Grounding Sources & Citations -->
			{#if current.sources && current.sources.length > 0}
				<div class="box gap-xs">
					<div class="row ycenter gap-xs text-secondary">
						<Icon icon={luDatabase} size={14} />
						<span class="text-xs tt-u weight-600 mono">Grounding Sources ({current.sources.length})</span>
					</div>
					<div class="box gap-2xs">
						{#each current.sources as src}
							<div class="wiki-source-item box gap-3xs pad-xs">
								{#if src.title}
									<span class="text-xs weight-500">{src.title}</span>
								{/if}
								{#if src.reference || src.id}
									<span class="text-2xs mono text-theme" title={src.reference || src.id}>
										{src.reference || src.id}
									</span>
								{/if}
								{#if src.timestamp}
									<span class="text-2xs text-secondary mono">{src.timestamp}</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Referenced Project Files -->
			{#if current.files && current.files.length > 0}
				<div class="box gap-xs">
					<div class="row ycenter gap-xs text-secondary">
						<Icon icon={luLayers} size={14} />
						<span class="text-xs tt-u weight-600 mono">Referenced Project Files</span>
					</div>
					<div class="row wrap gap-xs">
						{#each current.files as file}
							<span class="badge radius-32 gap-3xs border pad-x-xs pad-y-2xs text-2xs mono">
								{file}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Article Reading Metrics -->
			<div class="box gap-2xs border-top pad-top-sm mono text-2xs text-secondary">
				<div class="row ycenter xbetween">
					<span>WORDS</span>
					<span class="text-primary">{wordCount}</span>
				</div>
				<div class="row ycenter xbetween">
					<span>READ TIME</span>
					<span class="text-primary">~{readTimeMin} min</span>
				</div>
				<div class="row ycenter xbetween">
					<span>EST. TOKENS</span>
					<span class="text-primary">~{estTokens}</span>
				</div>
				{#if current.generated?.by}
					<div class="row ycenter xbetween">
						<span>GENERATOR</span>
						<span class="text-primary">{current.generated.by}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Content Column -->
		<div class="box wiki-right hfull gap-md">
			<!-- Action Bar -->
			<div class="row ycenter xbetween border-bottom pad-bottom-xs">
				<div class="row ycenter gap-xs">
					<button
						type="button"
						class="button small ghost text-xs row ycenter gap-3xs"
						class:active={!showRaw}
						onclick={() => (showRaw = false)}
					>
						<Icon icon={luBookOpen} size={14} />
						<span>Reading View</span>
					</button>
					<button
						type="button"
						class="button small ghost text-xs row ycenter gap-3xs"
						class:active={showRaw}
						onclick={() => (showRaw = true)}
					>
						<Icon icon={luCode} size={14} />
						<span>Markdown Source</span>
					</button>
				</div>

				<button
					type="button"
					class="button small ghost text-xs row ycenter gap-3xs"
					onclick={copyContent}
					title="Copy Markdown to clipboard"
				>
					<Icon icon={copied ? luCheck : luCopy} size={14} />
					<span>{copied ? "Copied" : "Copy"}</span>
				</button>
			</div>

			<!-- Document Content -->
			{#if showRaw}
				<pre class="terminal pad-xs radius-4 scroll-x mono text-xs pad-sm border wfull">{current.body}</pre>
			{:else}
				<div class="wiki-markdown-body wfull">
					<MarkdownRenderer html={renderedHtml} />
				</div>
			{/if}

			<!-- Compiled-draft provenance & freshness -->
			{#if current.compiledFrom && current.compiledFrom.length > 0}
				{@const freshness = compileFreshness(current, wikiCorpus.entries)}
				<div class="box gap-xs border pad-sm radius-4">
					<div class="row ycenter gap-xs">
						<Icon icon={luSparkles} size={14} />
						<span class="text-2xs tt-u weight-600 text-secondary mono">
							Compiled draft — {current.compiledFrom.length} grounding {current.compiledFrom.length === 1 ? "entry" : "entries"}
						</span>
					</div>
					{#if isRenderableDate(current.compiledAt ?? "")}
						<span class="text-xs mono text-secondary">
							Compiled {new Date(current.compiledAt ?? "").toLocaleString()}
						</span>
					{/if}
					{#if freshness.state === "fresh"}
						<span class="text-xs">Grounding entries unchanged since compile.</span>
					{:else if freshness.state === "stale"}
						<span class="text-xs">
							Grounding {freshness.changedIds.length === 1 ? "entry" : "entries"} changed since compile ({freshness.changedIds.join(", ")}) — recompile suggested.
						</span>
					{:else}
						<span class="text-xs text-secondary">
							Freshness unknown: {freshness.unseenIds.length} grounding {freshness.unseenIds.length === 1 ? "entry is" : "entries are"} not in the loaded corpus view.
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
		</div>
	</div>
{/if}