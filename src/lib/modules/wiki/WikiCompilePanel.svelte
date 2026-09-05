<script lang="ts">
	import { wikiState } from '$lib/wiki/state.svelte';
	import { wikiStore } from '$lib/wiki/store.svelte';
	import { wikiCorpus } from '$lib/wiki/corpus.svelte';
	import { wikiCompile } from '$lib/wiki/compile.svelte';
	import type { WikiEntryType } from '$lib/wiki/types';
	import { renderFull } from '$lib/renderer/pipeline';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { activeView } from '$lib/states/windowState.svelte';
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import { Icon } from 'fractalicons';
	import {
		luSparkles,
		luSave,
		luX,
		luSquare,
		luCheck,
		luRefreshCw,
		luExternalLink
	} from 'fractalicons/lucide';
	import { onMount } from 'svelte';

	const status = $derived(wikiCompile.status);
	const selectedEntries = $derived(
		wikiCorpus.entries.filter((entry) => wikiCorpus.isSelected(entry.id))
	);
	const result = $derived(wikiCompile.result);

	let showRaw = $state(false);
	let draftType = $state<WikiEntryType>('pattern');
	let saving = $state(false);
	let saveError = $state<string | null>(null);

	const draftTypes: { label: string; value: WikiEntryType }[] = [
		{ label: 'Pattern', value: 'pattern' },
		{ label: 'Decision', value: 'decision' },
		{ label: 'Concept', value: 'concept' },
		{ label: 'System', value: 'system' },
		{ label: 'Broken', value: 'broken' },
		{ label: 'Recipe', value: 'recipe' }
	];

	let renderedHtml = $derived.by(() => {
		if (!result) return '';
		return renderFull(result.markdown).html;
	});

	onMount(() => {
		void wikiCompile.loadStatus();
		void wikiStore.load();
	});

	function openInBench(sessionId: string) {
		activeView.set('bench');
		void observatory.selectSession(sessionId);
	}

	async function compile() {
		saveError = null;
		await wikiCompile.compile(selectedEntries.map((entry) => entry.id));
	}

	async function saveDraft() {
		if (!result || saving) return;
		saving = true;
		saveError = null;
		try {
			const saved = await wikiStore.saveCompiledDraft(result, draftType);
			wikiCompile.closePanel();
			wikiState.pick(saved.id);
		} catch (error) {
			saveError = error instanceof Error ? error.message : String(error);
		} finally {
			saving = false;
		}
	}
</script>

<!--
  Compile panel: turns a user-selected cluster of recall entries into a draft
  article through the Fractorches service's generation machinery. The service
  generates; this surface reviews the draft and saves it to the private
  article store. Nothing is written before the user saves.
-->
<article class="min0 pad-y-md pad-x-lg box grow hfull scroll-y">
	<!-- Action Header Bar -->
	<div class="gap-2xs pad-bottom-xs row ycenter xbetween pad-x-md pad-y-xs border-bottom">
		<div class="row ycenter gap-xs text-xs mono text-secondary">
			<span>COMPILE</span>
			<span>/</span>
			<span class="text-primary tt-u weight-500">cluster draft</span>
		</div>
		<button
			class="button small ghost text-xs"
			onclick={() => wikiCompile.closePanel()}
			title="Close without saving"
		>
			<Icon icon={luX} size={14} />
			<span>Close</span>
		</button>
	</div>

	<div class="content-shell box pad-md pad-x-lg gap-md grow">
		<header class="box gap-xs pad-bottom-sm border-bottom">
			<h1 class="text-2xl title-tight weight-600 tracking-tight">Compile a draft article</h1>
			<p class="text-sm text-secondary">
				Selected recall entries are sent to the Fractorches service, which drafts one article
				grounded in them. The draft stays a review candidate until you save it as a private
				article.
			</p>
		</header>

		<!-- Compiler availability: probed, never assumed -->
		<div class="box gap-xs border pad-sm">
			<div class="row ycenter gap-xs">
				<Icon icon={luSparkles} size={14} />
				<span class="text-2xs tt-u weight-600 text-secondary mono">Compiler availability</span>
			</div>
			{#if wikiCompile.statusLoading}
				<span class="text-xs text-secondary">Checking compile availability…</span>
			{:else if wikiCompile.statusError}
				<div class="box gap-2xs">
					<span class="text-xs">Compile status unavailable</span>
					<span class="text-xs text-secondary mono">{wikiCompile.statusError}</span>
					<button class="button small ghost text-xs" onclick={() => void wikiCompile.loadStatus()}>
						<Icon icon={luRefreshCw} size={12} />
						<span>Retry</span>
					</button>
				</div>
			{:else if status}
				{#if status.available}
					<span class="text-xs">
						Compiler available
						{#if status.endpoint_configured}
							— OpenAI-compatible endpoint configured
						{/if}
						{#if status.agents.length > 0}
							{status.endpoint_configured ? 'and' : '—'} agent CLI{status.agents.length === 1 ? '' : 's'} found:
							{status.agents.join(', ')}
						{/if}.
					</span>
				{:else}
					<span class="text-xs text-secondary">
						No compiler available: {status.reason}
					</span>
				{/if}
			{/if}
		</div>

		<!-- Cluster selection -->
		<div class="box gap-xs border pad-sm">
			<div class="row ycenter xbetween">
				<div class="row ycenter gap-xs">
					<Icon icon={wikiCorpus.selectionCount > 0 ? luCheck : luSquare} size={14} />
					<span class="text-2xs tt-u weight-600 text-secondary mono">
						Selected cluster ({wikiCorpus.selectionCount})
					</span>
				</div>
				{#if wikiCorpus.selectionCount > 0}
					<button class="button small ghost text-xs" onclick={() => wikiCorpus.clearSelection()}>
						<Icon icon={luX} size={12} />
						<span>Clear</span>
					</button>
				{/if}
			</div>
			{#if selectedEntries.length === 0}
				<div class="box gap-2xs">
					<span class="text-xs text-secondary">
						No corpus entries selected. Select entries in the Corpus view to ground a draft.
					</span>
					<button class="button small ghost text-xs" onclick={() => wikiState.setView('corpus')}>
						<span>Open Corpus</span>
					</button>
				</div>
			{:else}
				<div class="box gap-2xs">
					{#each selectedEntries as entry (entry.id)}
						<div class="row ycenter xbetween gap-xs">
							<div class="row ycenter gap-2xs min0">
								<span class="text-xs text-primary truncate">{entry.title}</span>
								<span class="text-2xs mono text-secondary">{entry.type}</span>
								<span class="text-2xs mono text-secondary">{entry.review_state}</span>
								{#if !entry.provenance_ok}
									<span class="text-2xs mono text-secondary">not verified</span>
								{/if}
							</div>
							<button
								class="button small ghost text-xs"
								onclick={() => wikiCorpus.toggleSelected(entry.id)}
								title="Remove from cluster"
							>
								<Icon icon={luX} size={12} />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Topic + compile control -->
		<div class="box gap-xs border pad-sm">
			<label class="text-2xs tt-u weight-600 text-secondary mono" for="wiki-compile-topic">
				Topic (optional)
			</label>
			<input
				id="wiki-compile-topic"
				class="input"
				type="text"
				placeholder="What should the article be about?"
				bind:value={wikiCompile.topic}
			/>
			<div class="row ycenter gap-xs">
				<button
					class="button small"
					class:active={wikiCompile.compiling}
					disabled={wikiCompile.compiling || !wikiCompile.available || wikiCorpus.selectionCount === 0}
					onclick={() => void compile()}
					title={
						!wikiCompile.available
							? 'Compiler availability unknown or unavailable'
							: wikiCorpus.selectionCount === 0
								? 'Select corpus entries first'
								: 'Compile the selected cluster into a draft'
					}
				>
					<Icon icon={luSparkles} size={14} />
					<span>{wikiCompile.compiling ? 'Compiling…' : 'Compile draft'}</span>
				</button>
				{#if wikiCompile.compiling}
					<span class="text-xs text-secondary">The service is drafting the article.</span>
				{/if}
			</div>
			{#if wikiCompile.compileError}
				<div class="box gap-2xs">
					<span class="text-xs">Compilation failed</span>
					<span class="text-xs text-secondary mono">{wikiCompile.compileError}</span>
				</div>
			{/if}
		</div>

		<!-- Draft review -->
		{#if result}
			<div class="box gap-md pad-top-xs border-top">
				<div class="box gap-xs">
					<div class="row ycenter gap-xs">
						<span class="text-2xs tt-u weight-600 text-secondary mono">Draft review</span>
					</div>
					<div class="row wrap ycenter gap-md text-xs mono text-secondary">
						<span>
							Compiled
							{#if result.generated_by.agent}
								by {result.generated_by.agent}
							{:else if result.generated_by.model}
								by {result.generated_by.model}
							{:else}
								by the service generator
							{/if}
						</span>
						{#if result.topic}
							<span>topic: {result.topic}</span>
						{/if}
					</div>
					<div class="box gap-2xs">
						<span class="text-2xs tt-u weight-600 text-secondary mono">
							Grounding entries ({result.entries.length})
						</span>
						{#each result.entries as entry (entry.id)}
							<div class="row ycenter xbetween gap-xs">
								<div class="row ycenter gap-2xs min0">
									<span class="text-xs text-primary truncate">{entry.title}</span>
									<span class="text-2xs mono text-secondary">{entry.type}</span>
									<span class="text-2xs mono text-secondary">{entry.review_state}</span>
									{#if !entry.provenance_ok}
										<span class="text-2xs mono text-secondary">not verified</span>
									{/if}
								</div>
								<button
									class="button small ghost text-xs"
									onclick={() => openInBench(entry.source_session_id)}
									title="Open the source session in Bench"
								>
									<Icon icon={luExternalLink} size={12} />
								</button>
							</div>
						{/each}
					</div>
				</div>

				<div class="box gap-xs">
					<div class="row ycenter xbetween">
						<span class="text-2xs tt-u weight-600 text-secondary mono">Draft body</span>
						<button
							class="button small ghost text-xs"
							class:active={showRaw}
							onclick={() => (showRaw = !showRaw)}
						>
							<span>{showRaw ? 'Rendered' : 'Raw'}</span>
						</button>
					</div>
					{#if showRaw}
						<pre class="terminal pad-xs radius-4 scroll-x mono text-xs pad-sm border">{result.markdown}</pre>
					{:else}
						<div class="wiki-markdown-body">
							<MarkdownRenderer html={renderedHtml} />
						</div>
					{/if}
				</div>

				<div class="box gap-xs">
					<span class="text-2xs tt-u weight-600 text-secondary mono">Draft type</span>
					<div class="row wrap gap-3xs">
						{#each draftTypes as type}
							<button
								class="button ghost small"
								class:active={draftType === type.value}
								onclick={() => (draftType = type.value)}
							>
								{type.label}
							</button>
						{/each}
					</div>
				</div>

				{#if saveError}
					<div class="box gap-2xs">
						<span class="text-xs">Saving the draft failed</span>
						<span class="text-xs text-secondary mono">{saveError}</span>
					</div>
				{/if}

				<div class="row ycenter gap-xs">
					<button class="button small" disabled={saving} onclick={() => void saveDraft()}>
						<Icon icon={luSave} size={14} />
						<span>{saving ? 'Saving…' : 'Save as draft article'}</span>
					</button>
					<button
						class="button small ghost text-xs"
						disabled={saving}
						onclick={() => wikiCompile.discard()}
					>
						<Icon icon={luX} size={12} />
						<span>Discard draft</span>
					</button>
				</div>
			</div>
		{/if}
	</div>
</article>
