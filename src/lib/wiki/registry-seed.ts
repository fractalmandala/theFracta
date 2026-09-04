import type { WikiRegistry } from './types';

export const REGISTRY: WikiRegistry = {
	version: '1.0.0',
	generatedBy: 'fracta-wiki-engine',
	entries: [
		{
			id: 'fractalstyler2-canon',
			title: 'Fractalstyler2 Design Contract & Tokens',
			type: 'system',
			status: 'stable',
			summary: 'The semantic token contract, zero-radius discipline, fluid typography, and space ladder.',
			tags: ['styling', 'tokens', 'sass', 'fractalstyler2'],
			chatRefs: ['cmdcode:ses-a5af-turn-1', 'cmdcode:ses-a5af-turn-3'],
			files: [
				'src/lib/styles/_00_tokens.sass',
				'src/lib/styles/_05_shells.sass',
				'src/lib/styles/_08_own.sass'
			],
			createdAt: '2026-08-29T20:00:00Z',
			updatedAt: '2026-08-30T02:00:00Z',
			body: `# Fractalstyler2 Design Contract & Tokens

## Core Philosophy

Fractalstyler2 enforces a mathematical, token-routed design system built upon four non-negotiable principles:

1. **Sharp Geometry (Zero Radius)**: All visual containers, modals, buttons, and popovers maintain \`border-radius: 0\`. Corners are sharp and crisp.
2. **Hairline Faint Borders**: Division of visual surfaces relies on \`1px solid var(--border)\` (or alpha-mixed borders), avoiding heavy dropshadows or filled faux-borders.
3. **Single Breathing Surface**: Elements share a unified background tone (\`var(--bg)\`, \`var(--bg-surface)\`, \`var(--bg-raised)\`), eliminating jarring tint changes between sidebars and headers.
4. **Fluid Space & Typography Scales**: Dimensions, margins, and gaps route through semantic tokens (\`var(--space-*)\`, \`var(--text-*)\`, \`min(92vw, Nrem)\`) rather than arbitrary pixel sizes.

## Structural Mixins & Shells

The layout vocabulary is strictly composed from registered primitives:
- \`.box\`: Vertical flex column stack.
- \`.row\`: Horizontal flex layout with alignment modifiers (\`.ycenter\`, \`.xbetween\`, \`.gap-*\`).
- \`.grid-*\`: CSS grid definitions that reflow smoothly across viewport breakpoints.
- \`.page-split\`: Canonical 2-pane / 3-pane responsive desktop shell.
`
		},
		{
			id: 'shell-canon-3col',
			title: 'Three-Column Desktop Workspace Shell',
			type: 'pattern',
			status: 'stable',
			summary: 'Responsive 3-column architecture (Sidebar | Viewport / Content | Inspector) for pro-tier tooling.',
			tags: ['layout', 'shell', 'architecture', 'responsive'],
			chatRefs: ['cmdcode:ses-a5af-turn-10', 'cmdcode:ses-a5af-turn-15'],
			files: [
				'src/lib/styles/_05_shells.sass',
				'src/lib/modules/wiki/WikiModule.svelte'
			],
			createdAt: '2026-08-29T20:45:00Z',
			updatedAt: '2026-08-30T02:15:00Z',
			body: `# Three-Column Desktop Workspace Shell

## Overview

High-density developer tools (IDE editors, Observatory, Wiki) require a persistent three-column layout pattern:

\`\`\`
+------------------+----------------------------------+--------------------+
|  Left Sidebar    |       Center Main Area           |  Right Inspector   |
|                  |                                  |                    |
|  - Search & ToC  |  - Full Markdown Document        |  - Metadata Bar    |
|  - Category tree |  - Live Telemetry & Editor       |  - Chat References |
|  - Filter pills  |  - Action Toolbar                |  - Project Files   |
+------------------+----------------------------------+--------------------+
|  Status Bar: word count | token count | read time | connection status    |
+--------------------------------------------------------------------------+
\`\`\`

## Breakpoint Behavior

- **Desktop (>= lg)**: Full 3-column grid (\`var(--sidebar-width) minmax(0, 1fr) var(--inspector-width, 280px)\`).
- **Tablet (md to lg)**: 2-column split (Left Sidebar + Center Viewport), right inspector collapses into an overlay drawer or tab.
- **Mobile (< md)**: Single column with off-canvas slide-out drawers.
`
		},
		{
			id: 'privacy-boundary-contract',
			title: '3-Layer Multi-Agent Chat Privacy Boundary',
			type: 'decision',
			status: 'stable',
			summary: 'Architectural separation ensuring public repo purity while referencing local agent chat traces.',
			tags: ['privacy', 'security', 'git', 'transcripts'],
			chatRefs: ['cmdcode:ses-a5af-turn-13', 'cmdcode:ses-a5af-turn-14'],
			files: [
				'docs/wiki-privacy.md',
				'scripts/check-privacy.sh',
				'.gitignore'
			],
			createdAt: '2026-08-29T21:10:00Z',
			updatedAt: '2026-08-30T02:10:00Z',
			body: `# 3-Layer Multi-Agent Chat Privacy Boundary

## The Golden Rule

> *A wiki entry's content is public. Its citations are machine-local. Its raw transcripts never leave your disk.*

## Three Protection Layers

| Layer | Mechanism | Protection Scope |
|---|---|---|
| **Layer 1: Git Exclusions** | \`.gitignore\` | Restricts local app data, local SQLite caches (\`*.sqlite*\`), and transcript dumps from tracking. |
| **Layer 2: Static Privacy Linter** | \`scripts/check-privacy.sh\` | Scans committed files for home paths, raw session UUIDs, and transcript tags. |
| **Layer 3: Pre-Commit Gate** | \`.githooks/pre-commit\` | Rejects any commit containing sensitive personal identifiers or transcript payload markers. |

## Opaque Citations

References in public markdown use opaque pointers:
- Format: \`agent_type:session_hash_turn\` (e.g. \`claude:ses-8f2a-turn-4\`).
- Resolution occurs strictly at client runtime via local OS IPC.
`
		},
		{
			id: 'agent-memory-wiki',
			title: 'Cross-Agent Memory & Generative Wiki System',
			type: 'concept',
			status: 'proposed',
			summary: 'Distilling multi-agent reasoning traces into a living fractal knowledge base.',
			tags: ['agents', 'memory', 'wiki', 'fractorches'],
			chatRefs: ['cmdcode:ses-a5af-turn-8', 'cmdcode:ses-a5af-turn-9'],
			files: [
				'src/lib/wiki/state.ts',
				'src/lib/wiki/types.ts'
			],
			createdAt: '2026-08-29T20:30:00Z',
			updatedAt: '2026-08-30T01:50:00Z',
			body: `# Cross-Agent Memory & Generative Wiki System

## The Memory Thesis

Across multiple coding agents (Claude Code, Gemini Antigravity, Codex, Grok, Qoder), hundreds of hours of debugging traces, architectural decisions, and error recoveries are recorded into local sessions.

By treating these session transcripts as raw input corpus, Fracta can synthesize:
1. **Durable Knowledge Registry**: Auto-extracted concepts, solutions, and patterns.
2. **Generative Synthesis**: Continuous updates as new sessions land in local storage.
3. **Causal Attribution**: Every wiki page traces directly back to the exact turn and prompt where the insight was developed.
`
		},
		{
			id: 'svelte5-runes-architecture',
			title: 'Svelte 5 Runes & Reactive Stores in Fracta',
			type: 'recipe',
			status: 'stable',
			summary: 'Clean integration of Svelte 5 runes ($state, $derived, $props) with shared singleton stores.',
			tags: ['svelte', 'runes', 'typescript', 'architecture'],
			chatRefs: ['cmdcode:ses-a5af-turn-10'],
			files: [
				'src/lib/states/windowState.svelte.ts',
				'src/lib/wiki/state.ts'
			],
			createdAt: '2026-08-29T21:30:00Z',
			updatedAt: '2026-08-30T02:20:00Z',
			body: `# Svelte 5 Runes & Reactive Stores in Fracta

## Pattern Overview

Fracta employs a unified state management pattern combining Svelte 5 runes with typed store managers:

\`\`\`typescript
// Global View State using Svelte 5 $state
class ActiveViewState {
    current = $state<AppView>('wiki');

    set(view: AppView) {
        this.current = view;
        localStorage.setItem(STORAGE_KEY, view);
    }

    is(view: AppView) {
        return this.current === view;
    }
}
\`\`\`

## Best Practices

- **Zero Inline Styles**: Always leverage Fractalstyler2 atomic classes.
- **Explicit Prop Contracts**: Use \`let { ... } = $props()\` with TypeScript interfaces.
- **Pure Indented Sass**: All style definitions reside in \`src/lib/styles/_08_own.sass\`.
`
		}
	]
};
