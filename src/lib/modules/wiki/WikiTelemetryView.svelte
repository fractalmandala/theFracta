<script lang="ts">
	import { wikiState } from '$lib/wiki/state';
	import { REGISTRY } from '$lib/wiki/registry-seed';
	import type { WikiEntry } from '$lib/wiki/types';
	import { Icon } from 'fractalicons';
	import {
		luActivity,
		luCpu,
		luDatabase,
		luLayers,
		luShield,
		luTerminal
	} from 'fractalicons/lucide';

	const entries = REGISTRY.entries;
	const totalEntries = entries.length;
	const stableCount = entries.filter((e) => e.status === 'stable').length;
	const draftCount = entries.filter((e) => e.status === 'draft' || e.status === 'proposed').length;
	const totalChatRefs = entries.reduce((acc, e) => acc + e.chatRefs.length, 0);

	// Category distribution
	const catStats = [
		{ type: 'system', label: 'SYSTEM ARCH', count: entries.filter((e) => e.type === 'system').length },
		{ type: 'pattern', label: 'PATTERNS', count: entries.filter((e) => e.type === 'pattern').length },
		{ type: 'decision', label: 'DECISIONS', count: entries.filter((e) => e.type === 'decision').length },
		{ type: 'concept', label: 'CONCEPTS', count: entries.filter((e) => e.type === 'concept').length },
		{ type: 'recipe', label: 'RECIPES', count: entries.filter((e) => e.type === 'recipe').length }
	];

	// Simulated matrix grid blocks
	const matrixBlocks = Array.from({ length: 64 }, (_, i) => ({
		id: i,
		active: i < totalEntries * 10
	}));
</script>

<div class="wiki-telemetry box grow hfull scroll-y pad-md gap-md">
	<!-- Top Bar -->
	<div class="row ycenter xbetween pad-bottom-xs border-bottom">
		<div class="row ycenter gap-xs mono text-xs text-secondary">
			<Icon icon={luActivity} size={14} />
			<span class="tt-u weight-600 text-primary">KNOWLEDGE TELEMETRY & SYSTEM STATE</span>
		</div>
		<div class="row ycenter gap-xs mono text-xs text-secondary">
			<span>ENGINE: v{REGISTRY.version}</span>
			<span>•</span>
			<span class="text-primary">LIVE LOCAL</span>
		</div>
	</div>

	<!-- 4-Card Telemetry Grid (matching Screenshot 1) -->
	<div class="wiki-telemetry-grid grid-4 gap-md">
		<!-- Card 1: Knowledge Density & Matrix -->
		<div class="wiki-telemetry-card box gap-sm border pad-sm">
			<div class="wiki-telemetry-header row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>REGISTRY CAPACITY ▸</span>
			</div>

			<div class="row gap-sm ycenter">
				<!-- Matrix Visual -->
				<div class="wiki-matrix-grid">
					{#each matrixBlocks as block}
						<div class="wiki-matrix-cell" class:active={block.active}></div>
					{/each}
				</div>

				<!-- Stats column -->
				<div class="box gap-2xs mono text-xs grow">
					<div class="text-2xs text-secondary tt-u">Entries</div>
					<div class="wiki-metric-val text-primary weight-600">{totalEntries} items</div>
					<div class="wiki-badge-metric pad-x-2xs pad-y-2xs text-2xs border">
						{stableCount} stable
					</div>
					<div class="wiki-badge-metric pad-x-2xs pad-y-2xs text-2xs border">
						{draftCount} proposed
					</div>
				</div>
			</div>

			<div class="wiki-card-footer mono text-2xs text-secondary border-top pad-top-xs">
				Autonomous Ingestion Pipeline
			</div>
		</div>

		<!-- Card 2: Agent Sources & Multi-Agent Network -->
		<div class="wiki-telemetry-card box gap-sm border pad-sm">
			<div class="wiki-telemetry-header row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>AGENT CITATIONS ▸</span>
			</div>

			<div class="wiki-table-strip box gap-2xs mono text-xs">
				<div class="row ycenter xbetween pad-y-2xs border-bottom">
					<span class="wiki-agent-tag text-2xs tt-u">Claude Code</span>
					<span class="text-secondary text-2xs">Verified</span>
				</div>
				<div class="row ycenter xbetween pad-y-2xs border-bottom">
					<span class="wiki-agent-tag text-2xs tt-u">CommandCode</span>
					<span class="text-secondary text-2xs">Verified</span>
				</div>
				<div class="row ycenter xbetween pad-y-2xs border-bottom">
					<span class="wiki-agent-tag text-2xs tt-u">Antigravity</span>
					<span class="text-secondary text-2xs">Verified</span>
				</div>
				<div class="row ycenter xbetween pad-y-2xs">
					<span class="wiki-agent-tag text-2xs tt-u">Codex</span>
					<span class="text-secondary text-2xs">Verified</span>
				</div>
			</div>

			<div class="wiki-card-footer mono text-2xs text-secondary border-top pad-top-xs">
				Total Causal Traces: {totalChatRefs}
			</div>
		</div>

		<!-- Card 3: Category Architecture Distribution -->
		<div class="wiki-telemetry-card box gap-sm border pad-sm">
			<div class="wiki-telemetry-header row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>TAXONOMY MAP ▸</span>
			</div>

			<!-- Sparkline Wave / Stepper -->
			<div class="wiki-step-chart">
				<svg viewBox="0 0 100 24" class="wiki-sparkline" preserveAspectRatio="none">
					<path
						d="M0,20 L15,20 L15,10 L30,10 L30,20 L50,20 L50,6 L70,6 L70,20 L85,20 L85,14 L100,14"
						fill="none"
						stroke="var(--theme-color, #10b981)"
						stroke-width="1.5"
					/>
				</svg>
			</div>

			<div class="box gap-2xs mono text-xs">
				{#each catStats as stat}
					<div class="row ycenter xbetween text-2xs">
						<span class="text-secondary">{stat.label}</span>
						<span class="weight-500">{stat.count}</span>
					</div>
				{/each}
			</div>

			<div class="wiki-card-footer mono text-2xs text-secondary border-top pad-top-xs">
				Fractalstyler2 Token Hierarchy
			</div>
		</div>

		<!-- Card 4: Local Memory & Token Allocation -->
		<div class="wiki-telemetry-card box gap-sm border pad-sm">
			<div class="wiki-telemetry-header row ycenter xbetween mono text-2xs tt-u tracking-wider text-secondary">
				<span>MEMORY PROVISIONED ▸</span>
			</div>

			<!-- Progress Bar -->
			<div class="wiki-progress-track border">
				<div class="wiki-progress-fill" style="width: 62%;"></div>
			</div>

			<div class="box gap-xs mono text-xs">
				<div class="row ycenter xbetween">
					<span class="text-secondary tt-u text-2xs">PROVISIONED</span>
					<span class="text-secondary tt-u text-2xs">QUOTA</span>
				</div>
				<div class="row ycenter xbetween weight-600">
					<span class="text-primary">12.4K TOKENS</span>
					<span class="text-secondary">2.0M TOKENS</span>
				</div>
				<div class="row ycenter xbetween text-2xs text-secondary pad-top-2xs">
					<span>PRIVACY GATE</span>
					<span class="text-primary weight-500">ENFORCED (0 LEAKS)</span>
				</div>
			</div>

			<div class="wiki-card-footer mono text-2xs text-secondary border-top pad-top-xs">
				Airgapped Local Storage
			</div>
		</div>
	</div>

	<!-- Recent Topics Table -->
	<div class="wiki-telemetry-table-card box gap-xs border pad-sm">
		<div class="row ycenter xbetween mono text-xs border-bottom pad-bottom-xs">
			<span class="tt-u weight-600">INDEXED KNOWLEDGE REGISTER</span>
			<span class="text-secondary">{entries.length} TOPICS</span>
		</div>

		<div class="box gap-2xs mono text-xs">
			{#each entries as entry}
				<button
					class="wiki-table-row row ycenter xbetween pad-xs border-bottom text-left"
					onclick={() => wikiState.pick(entry.id)}
				>
					<div class="row ycenter gap-sm">
						<span class="wiki-type-badge text-2xs tt-u" data-type={entry.type}>
							{entry.type}
						</span>
						<span class="weight-500 text-primary">{entry.title}</span>
					</div>
					<div class="row ycenter gap-md text-secondary text-2xs">
						<span>{entry.tags.join(', ')}</span>
						<span class="wiki-status-badge text-2xs tt-u" data-status={entry.status}>
							{entry.status}
						</span>
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>
