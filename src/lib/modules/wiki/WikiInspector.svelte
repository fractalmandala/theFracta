<script lang="ts">
	import { wikiState } from '$lib/wiki/state';
	import type { WikiEntry } from '$lib/wiki/types';
	import { Icon } from 'fractalicons';
	import {
		luSlidersHorizontal,
		luShield,
		luTerminal,
		luTag,
		luFileText,
		luActivity,
		luLayers,
		luClock
	} from 'fractalicons/lucide';

	const current = wikiState.current;

	function parseChatRef(ref: string): { agent: string; id: string } {
		const parts = ref.split(':');
		if (parts.length >= 2) {
			return { agent: parts[0], id: parts.slice(1).join(':') };
		}
		return { agent: 'agent', id: ref };
	}
</script>

<div class="wiki-inspector box hfull">
	<div class="box gap-md pad-sm">
		<!-- Inspector Header -->
		<div class="row ycenter xbetween border-bottom pad-bottom-xs">
			<span class="text-xs tt-u weight-600 tracking-wider text-secondary">
				Inspector & Provenance
			</span>
			<Icon icon={luSlidersHorizontal} size={14} />
		</div>

		{#if !$current}
			<div class="text-xs text-secondary pad-y-md tt-c">
				No entry selected to inspect.
			</div>
		{:else}
			<!-- Section 1: Entry Metadata -->
			<div class="box gap-xs">
				<span class="text-2xs tt-u weight-600 text-secondary mono">
					Entry Metadata
				</span>
				<dl class="wiki-meta-grid border pad-xs text-xs mono">
					<dt>Identifier</dt>
					<dd><span>{$current.id}</span></dd>
					<dt>Category</dt>
					<dd><span class="wiki-type-badge text-2xs tt-u" data-type={$current.type}>
							{$current.type}
						</span></dd>
					<dt>Status</dt>
					<dd><span class="wiki-status-badge text-2xs tt-u" data-status={$current.status}>
							{$current.status}
						</span></dd>
					<dt>Created</dt>
					<dd><span class="text-secondary">{new Date($current.createdAt).toLocaleDateString()}</span></dd>
					<dt>Updated</dt>
					<dd><span class="text-secondary">{new Date($current.updatedAt).toLocaleDateString()}</span></dd>
				</dl>
			</div>

			<!-- Section 2: Agent Chat Citations -->
			<div class="box gap-xs">
				<div class="row ycenter xbetween">
					<span class="text-2xs tt-u weight-600 text-secondary mono">
						Agent Chat Traces ({$current.chatRefs.length})
					</span>
					<Icon icon={luShield} size={12} />
				</div>

				<div class="box gap-xs">
					{#each $current.chatRefs as ref}
						{@const parsed = parseChatRef(ref)}
						<div class="wiki-chat-ref-card box gap-2xs border pad-xs">
							<div class="row ycenter xbetween">
								<span class="wiki-agent-badge text-2xs mono tt-u">
									{parsed.agent}
								</span>
								<span class="wiki-privacy-tag text-2xs mono text-secondary">
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
					{#each $current.tags as tag}
						<span class="wiki-tag-pill text-2xs mono border pad-x-xs pad-y-2xs">
							#{tag}
						</span>
					{/each}
				</div>
			</div>

			<!-- Section 4: Privacy Gate Guarantee -->
			<div class="wiki-privacy-guarantee box gap-2xs border pad-xs">
				<div class="row ycenter gap-xs">
					<Icon icon={luShield} size={14} />
					<span class="text-xs weight-500">Privacy Verified</span>
				</div>
				<p class="text-2xs text-secondary">
					Raw transcripts remain machine-local in airgapped user storage. Git gate enforces 0 leaks.
				</p>
			</div>
		{/if}
	</div>
</div>
