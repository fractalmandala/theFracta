<script lang="ts">
	import { wikiState } from '$lib/wiki/state.svelte';
	import { wikiStore } from '$lib/wiki/store.svelte';
	import { isRenderableDate } from '$lib/wiki/entry-file';
	import { activeView } from '$lib/states/windowState.svelte';
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	import { Icon } from 'fractalicons';
	import {
		luSlidersHorizontal,
		luShield,
		luExternalLink,
		luClock
	} from 'fractalicons/lucide';

	const current = $derived(wikiState.current);
	const corpusEntry = $derived(wikiState.viewMode === 'corpus' ? wikiState.currentCorpus : null);

	function parseChatRef(ref: string): { agent: string; id: string } {
		const parts = ref.split(':');
		if (parts.length >= 2) {
			return { agent: parts[0], id: parts.slice(1).join(':') };
		}
		return { agent: 'agent', id: ref };
	}

	function openInBench(sessionId: string) {
		activeView.set('bench');
		void observatory.selectSession(sessionId);
	}
</script>

<div class="wfull min0 box hfull">
	<div class="box gap-md pad-sm">
		<!-- Inspector Header -->
		<div class="row ycenter xbetween border-bottom pad-bottom-xs">
			<span class="text-xs tt-u weight-600 tracking-wider text-secondary">
				Inspector & Provenance
			</span>
			<Icon icon={luSlidersHorizontal} size={14} />
		</div>

		{#if corpusEntry}
			<!-- Corpus provenance: where this distilled entry came from -->
			<div class="box gap-xs">
				<span class="text-2xs tt-u weight-600 text-secondary mono">
					Corpus Entry Metadata
				</span>
				<dl class="wiki-meta-grid border pad-xs text-xs mono">
					<dt>Identifier</dt>
					<dd><span>{corpusEntry.id}</span></dd>
					<dt>Type</dt>
					<dd><span class="badge mono text-2xs tt-u" data-type={corpusEntry.type}>
							{corpusEntry.type}
						</span></dd>
					<dt>Review state</dt>
					<dd><span class="badge mono text-2xs tt-u" data-status={corpusEntry.review_state}>
							{corpusEntry.review_state}
						</span></dd>
					<dt>Provenance</dt>
					<dd>
						<span class="text-secondary">
							{corpusEntry.provenance_ok ? 'evidence verified' : 'evidence revoked'}
						</span>
					</dd>
					<dt>Agent</dt>
					<dd><span>{corpusEntry.agent || '—'}</span></dd>
					<dt>Project</dt>
					<dd><span>{corpusEntry.project || '—'}</span></dd>
					<dt>Created</dt>
					<dd>
						<span class="text-secondary">
							{isRenderableDate(corpusEntry.created_at)
								? new Date(corpusEntry.created_at).toLocaleDateString()
								: '—'}
						</span>
					</dd>
					<dt>Updated</dt>
					<dd>
						<span class="text-secondary">
							{isRenderableDate(corpusEntry.updated_at)
								? new Date(corpusEntry.updated_at).toLocaleDateString()
								: '—'}
						</span>
					</dd>
				</dl>
			</div>

			<!-- Source session citation -->
			<div class="box gap-xs">
				<div class="row ycenter xbetween">
					<span class="text-2xs tt-u weight-600 text-secondary mono">
						Source Session
					</span>
					<Icon icon={luShield} size={12} />
				</div>
				<div class="radius-4 pad-sm box gap-2xs border pad-xs">
					<div class="row ycenter xbetween">
						<span class="badge text-2xs mono tt-u">
							{corpusEntry.agent || 'session'}
						</span>
						<span class="badge radius-32 gap-3xs text-2xs mono text-secondary">
							machine-local
						</span>
					</div>
					<div class="text-xs mono text-secondary truncate">
						{corpusEntry.source_session_id}
					</div>
					<button
						class="button small ghost text-xs"
						onclick={() => openInBench(corpusEntry.source_session_id)}
					>
						<Icon icon={luExternalLink} size={12} />
						<span>Open in Bench</span>
					</button>
				</div>
			</div>
		{:else if current}
			<!-- Section 1: Entry Metadata -->
			<div class="box gap-xs">
				<span class="text-2xs tt-u weight-600 text-secondary mono">
					Entry Metadata
				</span>
				<dl class="wiki-meta-grid border pad-xs text-xs mono">
					<dt>Identifier</dt>
					<dd><span>{current.id}</span></dd>
					<dt>Category</dt>
					<dd><span class="badge mono text-2xs tt-u" data-type={current.type}>
							{current.type}
						</span></dd>
					<dt>Status</dt>
					<dd><span class="badge mono text-2xs tt-u" data-status={current.status}>
							{current.status}
						</span></dd>
					<dt>Created</dt>
					<dd>
						<span class="text-secondary">
							{isRenderableDate(current.createdAt)
								? new Date(current.createdAt).toLocaleDateString()
								: '—'}
						</span>
					</dd>
					<dt>Updated</dt>
					<dd>
						<span class="text-secondary">
							{isRenderableDate(current.updatedAt)
								? new Date(current.updatedAt).toLocaleDateString()
								: '—'}
						</span>
					</dd>
					{#if current.compiledFrom && current.compiledFrom.length > 0}
						<dt>Grounding</dt>
						<dd>
							<span class="text-secondary">
								{current.compiledFrom.length} recall {current.compiledFrom.length === 1 ? 'entry' : 'entries'}
							</span>
						</dd>
						<dt>Compiled</dt>
						<dd>
							<span class="text-secondary">
								{isRenderableDate(current.compiledAt ?? '')
									? new Date(current.compiledAt ?? '').toLocaleDateString()
									: '—'}
							</span>
						</dd>
					{/if}
				</dl>
			</div>

			<!-- Section 2: Agent Chat Citations -->
			<div class="box gap-xs">
				<div class="row ycenter xbetween">
					<span class="text-2xs tt-u weight-600 text-secondary mono">
						Agent Chat Traces ({current.chatRefs.length})
					</span>
					<Icon icon={luShield} size={12} />
				</div>

				<div class="box gap-xs">
					{#each current.chatRefs as ref}
						{@const parsed = parseChatRef(ref)}
						<div class="radius-4 pad-sm box gap-2xs border pad-xs">
							<div class="row ycenter xbetween">
								<span class="badge text-2xs mono tt-u">
									{parsed.agent}
								</span>
								<span class="badge radius-32 gap-3xs text-2xs mono text-secondary">
									opaque
								</span>
							</div>
							<div class="text-xs mono text-secondary truncate">
								{parsed.id}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Section 3: Taxonomy & Tags -->
			<div class="box gap-xs">
				<span class="text-2xs tt-u weight-600 text-secondary mono">
					Tags & Taxonomy
				</span>
				<div class="row wrap gap-2xs">
					{#each current.tags as tag}
						<span class="badge radius-32 gap-3xs text-2xs mono border pad-x-xs pad-y-2xs">
							#{tag}
						</span>
					{/each}
				</div>
			</div>
		{:else}
			<div class="text-xs text-secondary pad-y-md tt-c">
				No entry selected to inspect.
			</div>
		{/if}

		<!-- Storage fact: what this surface keeps, and where -->
		<div class="border-left border-success pad-left-xs text-secondary text-sm box gap-2xs border pad-xs">
			<div class="row ycenter gap-xs">
				<Icon icon={luShield} size={14} />
				<span class="text-xs weight-500">Private local store</span>
			</div>
			<p class="text-2xs text-secondary">
				Articles live in the Git-ignored wiki store
				{#if wikiStore.dirSource}
					({wikiStore.dirSource})
				{/if}
				and are never committed. Citations stay opaque; transcripts remain in the
				Fractorches service archive.
			</p>
			{#if wikiStore.loadedAt}
				<div class="row ycenter gap-xs text-2xs mono text-secondary">
					<Icon icon={luClock} size={10} />
					<span>Articles read {new Date(wikiStore.loadedAt).toLocaleTimeString()}</span>
				</div>
			{/if}
		</div>
	</div>
</div>
