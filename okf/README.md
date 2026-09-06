# OKF Local: Multi-Agent Session Miner & Knowledge Base Utility

A zero-cloud, zero-git, zero-MCP local-first utility for **Open Knowledge Format (OKF v0.2)**. 

Designed to index and distill over **100,000+ chat sessions across 19 local AI coding tools** (Claude Code, Gemini Antigravity, OpenCode, Grok, Codex, and others) into a structured, searchable, and maintainable engineering knowledge base on your own laptop.

---

## Why This Exists

Over the past year of working with AI coding assistants, massive amounts of hard-won engineering knowledge get trapped inside ephemeral chat transcripts:
* Component recipes (e.g. touch-friendly responsive drawers in SvelteKit 5).
* Desktop setups (e.g. Tauri v2 scaffolding and macOS permission gotchas).
* Project milestones and architectural decision records.
* Personal coding conventions and styling preferences (e.g. single-tab indented Sass, zero in-component styles).

**OKF Local** provides a **deterministic local CLI** to ingest, index, and cluster this raw data in seconds without LLM costs, and pairs with an AI orchestrator (**`okf-head`**) via declarative **Agent Skills** to synthesize concepts into standard [Open Knowledge Format v0.2](okf/SPEC.md) markdown documents.

---

## Key Features

- **100% Local & Self-Contained**: Runs directly on your machine. No Dataplex, GCP API keys, Vertex AI, or cloud credentials.
- **Zero External Dependencies**: Built for Node.js 24+ using native TypeScript stripping (`node --experimental-strip-types`) and native SQLite (`node:sqlite`). No `npm install` or compilation needed.
- **No Git Dependency**: Operates directly on standard filesystem directories without requiring Git repositories, remotes, or commit histories.
- **No MCP Daemon Overhead**: Works through direct local CLI commands or standard file-reading agent tools.
- **19 Pre-Configured Local Agent Adapters**: Out-of-the-box parsers for SQLite databases, JSONL streams, session directory trees, and artifact vaults.
- **Progressive Disclosure & Interactive Graph**: Auto-generates hierarchical `index.md` files and self-contained offline `viz.html` graph visualizations powered by Cytoscape.js.

---

## Supported Local Agent Sources

Run `./bin/okf sources` to inspect all supported sources on your machine:

| Source Name | Tool | Format | Default Location |
| :--- | :--- | :--- | :--- |
| **`cowork`** | Claude Cowork | Session Tree | `~/Library/Application Support/Claude/local-agent-mode-sessions` |
| **`opencode`** | OpenCode | SQLite | `~/.local/share/opencode/opencode.db` |
| **`grok`** | Grok CLI | Session Tree | `~/.grok/sessions` |
| **`claude`** | Claude Code | JSONL Stream | `~/.claude/projects` |
| **`antigravity`** | Gemini Antigravity | SQLite | `~/.gemini/antigravity/conversations` |
| **`antigravity-brain`** | Antigravity Brain | Artifacts | `~/.gemini/antigravity/brain` |
| **`codex`** | Codex CLI | JSONL Stream | `~/.codex/sessions` |
| **`qoder`** | Qoder | Session Tree | `~/.qoder/projects` |
| **`gemini`** | Gemini CLI | Session Tree | `~/.gemini` |
| **`kimi-work`** | Kimi Work / Desktop | Session Tree | `~/Library/Application Support/kimi-desktop/.../sessions` |
| **`antigravity-cli`** | Antigravity CLI | SQLite | `~/.gemini/antigravity-cli` |
| **`deepseek-harness`**| DeepSeek Harness | JSONL Stream | `~/.dsh/sessions` |
| **`kilo`** | Kilo Code | Session Tree | `~/.local/share/kilo` |
| **`commandcode`** | Command Code | Session Tree | `~/.commandcode/projects` |
| **`goose`** | Goose | Session Tree | `~/.local/share/goose/sessions` |
| **`vscode-copilot`** | VS Code Copilot | Session Tree | `~/Library/Application Support/Code/User/workspaceStorage` |
| **`cursor`** | Cursor | Session Tree | `~/.cursor/projects` |
| **`devin`** | Devin | Session Tree | `~/Library/Application Support/devin` |
| **`pi`** | Pi Agent | Session Tree | `~/.pi/agent/sessions` |
| **`warp`** | Warp Terminal | Session Tree | `~/Library/Group Containers/2BBY89MBSN.dev.warp/...` |

---

## Directory Layout

```
knowledge-catalog-main/
├── bin/
│   └── okf                           # Executable CLI launcher
├── src/
│   ├── types.ts                      # OKF v0.2 & session schema contracts
│   ├── core/
│   │   └── document.ts               # Zero-dep YAML frontmatter parser & serializer
│   ├── adapters/                     # High-performance parsers for 19 local tools
│   │   ├── base.ts                   # Abstract adapter interface
│   │   ├── sqlite.ts                 # Opencode & Antigravity SQLite extractors
│   │   ├── jsonl.ts                  # Claude, Codex, DeepSeek streaming readers
│   │   ├── session-tree.ts           # Cowork, Grok, Qoder directory parsers
│   │   └── artifacts.ts              # Antigravity brain/ markdown plan extractors
│   ├── indexer/                      # Local catalog & scanner engine
│   │   ├── sources-config.ts         # Registry of all 19 local tool sources
│   │   ├── scanner.ts                # Fast filesystem traverser (headers/prompts only)
│   │   └── catalog-db.ts             # Embedded SQLite metadata cache (.okf-cache/catalog.db)
│   ├── clustering/                   # Statistical signal discovery & taxonomy planner
│   │   ├── tech-detect.ts            # SvelteKit, Tauri, Sass, Cytoscape, Rust matchers
│   │   └── cluster.ts                # Aggregation by project, tech stack, and intent
│   ├── generator/                    # Bundle generation & offline visualization
│   │   ├── scaffold.ts               # Inits knowledge/ directory & concepts
│   │   ├── index-builder.ts          # Auto-generates progressive disclosure index.md
│   │   └── visualizer.ts             # Cytoscape-based offline interactive viz.html
│   ├── linter/                       # OKF v0.2 compliance & link checker
│   │   └── validator.ts              # Checks required keys, broken links, staleness
│   └── cli.ts                        # Central CLI command dispatcher
├── skills/
│   ├── okf-taxonomist/
│   │   └── SKILL.md                  # Skill for okf-head: cluster map -> concept taxonomy
│   └── okf-enrich/
│       └── SKILL.md                  # Skill for okf-head: targeted concept enrichment
└── knowledge/                        # The local OKF Knowledge Base bundle
    ├── index.md                      # Bundle root navigation
    ├── log.md                        # Audit log of changes
    ├── core-concepts/                # Reusable recipes, patterns, and component guides
    ├── projects/                     # Dossiers for active and past codebases
    ├── conventions/                  # Design rules, coding styles, and constraints
    ├── case-histories/               # Postmortems, debugging breakthroughs, migrations
    └── glossary/                     # Shared vocabulary and mental models
```

---

## CLI Command Reference

Make sure the launcher is executable:
```bash
chmod +x bin/okf
```

### 1. Check Detected Sources
```bash
./bin/okf sources
```
Lists all 19 sources and displays `[FOUND]` for directories currently present on your Mac.

### 2. Scan & Index Local Sessions
```bash
# Scan a single source:
./bin/okf scan --source claude

# Scan all detected local sources:
./bin/okf scan

# Use a custom SQLite cache path:
./bin/okf scan --db /path/to/my-catalog.db
```
*Note: Fast and token-free. Only reads session headers, initial prompts, and tool calls into `.okf-cache/catalog.db`.*

### 3. Cluster & Mine Signals
```bash
./bin/okf cluster
```
Analyzes the indexed sessions and generates:
- `.okf-cache/cluster-summary.md`: Human- and agent-readable report of top projects, tech stacks, and intent signatures.
- `.okf-cache/cluster-summary.json`: Structured data for automated taxonomists.

### 4. Initialize OKF Bundle & Concept Scaffolds
```bash
./bin/okf init-concepts --bundle knowledge
```
Creates the 5-bucket directory structure (`core-concepts/`, `projects/`, `conventions/`, `case-histories/`, `glossary/`) and scaffolds initial concept drafts with OKF v0.2 YAML frontmatter.

### 5. Rebuild Progressive Disclosure Indexes
```bash
./bin/okf index --bundle knowledge
```
Recursively crawls all subdirectories and updates every `index.md` with structured tables derived from concept frontmatter descriptions.

### 6. Generate Offline Interactive Visualizer
```bash
./bin/okf viz --bundle knowledge
```
Generates `knowledge/viz.html`. Open it directly in your browser (`file:///.../knowledge/viz.html`) to explore concepts, tags, and cross-links on an interactive Cytoscape.js graph.

### 7. Lint Bundle for Compliance & Broken Links
```bash
./bin/okf lint --bundle knowledge
```
Checks for:
- Required OKF v0.2 frontmatter keys (`type`).
- Broken relative markdown cross-links (`[target](concept.md)`).
- Expired concepts marked with `stale_after`.

### 8. System Status
```bash
./bin/okf status
```

---

## The 5-Stage Mining & Maintenance Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 1: LOCAL DETERMINISTIC SCAN                      │
│   Run: ./bin/okf scan                                                       │
│   Fast, free, zero token cost. Indexes 100k sessions into .okf-cache/       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 2: CLUSTER & FREQUENCY MINING                    │
│   Run: ./bin/okf cluster                                                    │
│   Detects project workspaces, recurring frameworks, and intent signatures   │
│   Emits: .okf-cache/cluster-summary.md                                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 3: okf-head TAXONOMIST PASS                      │
│   Instruct your AI agent using skills/okf-taxonomist/SKILL.md               │
│   The agent inspects cluster-summary.md and decides:                        │
│   "Create core-concepts/responsive-drawer.md and projects/mandala-ui.md"    │
│   Run: ./bin/okf init-concepts                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 4: TARGETED CONCEPT ENRICHMENT                   │
│   Instruct your AI agent using skills/okf-enrich/SKILL.md                   │
│   The agent opens a draft concept, reads ONLY the 2–3 cited local session   │
│   files, extracts working code snippets and gotchas, and updates the doc.   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 5: CONTINUOUS MAINTENANCE                        │
│   Run: ./bin/okf index && ./bin/okf viz                                     │
│   Keeps navigation trees and interactive graph visualization in sync        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Skills Integration

Two specialized skills are included in `skills/`:

1. **[`skills/okf-taxonomist/SKILL.md`](skills/okf-taxonomist/SKILL.md)**:
   Instructs `okf-head` on how to read `.okf-cache/cluster-summary.md` and formulate the initial concept taxonomy across the five OKF knowledge buckets.

2. **[`skills/okf-enrich/SKILL.md`](skills/okf-enrich/SKILL.md)**:
   Instructs `okf-head` on how to enrich a specific concept file (e.g. `knowledge/core-concepts/responsive-drawer-layout.md`) by reading only the local files listed in its `sources` frontmatter, ensuring synthesis is fact-grounded and free of hallucinations.

---

## Testing

Run the included smoke test suite:
```bash
npm test
# or
node --experimental-strip-types test/test-smoke.ts
```

Verifies frontmatter parsing, technology detection, embedded SQLite operation, and OKF v0.2 bundle linter on synthetic samples.

---

## License

Apache-2.0. Free of vendor lock-in, proprietary cloud dependencies, and service APIs.
