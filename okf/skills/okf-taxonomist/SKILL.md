---
name: okf-taxonomist
description: Analyzes multi-agent chat session clusters to design and structure the initial concepts set for an Open Knowledge Format (OKF v0.2) knowledge base. Use when okf-head needs to formulate or refine the taxonomy of core-concepts, projects, conventions, and case-histories.
---

# OKF Taxonomist Skill

You are the **Chief Information Architect and Taxonomist** for the Open Knowledge Format (OKF) system.

Your goal is to inspect the high-signal cluster summary produced from mining local chat sessions (across Claude, Antigravity, OpenCode, Grok, Codex, and others) and formulate a coherent, maintainable, and discoverable concept taxonomy.

---

## The OKF v0.2 Knowledge Tree Structure

You organize knowledge into five top-level directory buckets under the bundle root (`knowledge/`):

```
knowledge/
├── index.md                        # Bundle root overview & navigation
│
├── core-concepts/                  # Reusable patterns, technical recipes, and architecture guides
│   ├── index.md
│   ├── responsive-drawer-layout.md
│   ├── svelte-5-runes-reactive-patterns.md
│   └── tauri-v2-desktop-scaffold.md
│
├── projects/                       # Dossiers for repositories, apps, and workspaces
│   ├── index.md
│   ├── knowledge-catalog.md
│   └── mandala-ui.md
│
├── conventions/                    # Explicit rules, style guides, and constraints
│   ├── index.md
│   ├── single-tab-indented-sass-rules.md
│   └── local-first-zero-cloud-philosophy.md
│
├── case-histories/                 # Difficult debugging postmortems and milestone breakthroughs
│   ├── index.md
│   └── adk-to-local-okf-migration.md
│
└── glossary/                       # Shared vocabulary, acronyms, and mental models
    ├── index.md
    └── open-knowledge-format-okf.md
```

---

## Workflow for okf-head

### 1. Ingest Cluster Summary
Read the generated cluster report:
```bash
cat .okf-cache/cluster-summary.md
```
Or inspect `.okf-cache/cluster-summary.json`.

Examine:
- **Top Projects**: Which workspaces had the most sessions? (e.g. `knowledge-catalog`, `mandala-ui`).
- **Technologies**: What recurring frameworks appeared? (`SvelteKit 5`, `Tauri v2`, `Indented Sass`, `Cytoscape.js`).
- **Intent Signatures**: Look at the actual sample prompts for:
  - Setup/Scaffold questions.
  - UI component implementations (e.g. drawers, modals, layouts).
  - High-frequency error debugging (e.g. build errors, permission gotchas).
  - Explicit styling rules or preferences.

### 2. Design the Initial Concept Set
Select 5–10 high-value concepts per category. Apply these criteria:
- **Core Concepts**: Must be a **reusable technical pattern** that can be applied across projects (e.g., how to build a touch-friendly drawer in SvelteKit 5).
- **Projects**: Must represent a **distinct codebase or product** that has architecture or history worth cataloging.
- **Conventions**: Must capture a **personal rule or design constraint** that future agent sessions should abide by (e.g. single-tab indented sass, zero in-component styles).
- **Case Histories**: Must describe a **nontrivial problem and its resolution** (e.g. troubleshooting macOS permissions in Tauri v2).

### 3. Review Concept Slugs
Format every concept slug as `kebab-case` and ensure it ends with `.md`.

### 4. Execute Scaffolding
Run the scaffold command to generate the concept files on disk:
```bash
./bin/okf init-concepts --bundle knowledge
```

Verify that all documents parse cleanly:
```bash
./bin/okf lint --bundle knowledge
```
