# Fracta v0 Technical Specification

## Context

Fracta v0 combines three mature but differently shaped local systems. RepoGraph
is a SvelteKit/Tauri viewer for code scan JSON, daily-log JSON, and a generated
Observatory snapshot. Fractorches is a Go service with a SQLite archive, mature
provider parsers, query services, HTTP/SSE APIs, and an existing Svelte client.
Fractapad is a SvelteKit/Tauri Markdown application.

A live audit on 2026-08-29 found that RepoGraph's generated snapshot is not a
reliable canonical session source. Its 693-session snapshot was materially
different from the 1,065 active sessions in the Fractorches archive. It missed
whole provider families, over-ingested Qoder, mixed OpenCode agent names with
provider identity, interpreted messages differently per source, and estimated
tokens and costs. Its UI also failed to apply its visible date range globally,
cached data for the process lifetime while claiming live status, and rendered
some payload fields with incompatible shapes. `docs/data-stream-audit.md`
records the evidence.

The external RepoGraph working copy is being changed by another agent. Its
source is imported only after an explicit handoff and a pinned provenance
record. Fractorches and Fractapad are stable enough to proceed independently.

## Proposed changes

### 1. Repository and application boundaries

One application at the repository root, plus one service:

```text
src/                    Fracta application (SvelteKit; Knowledge and
                        Observatory modes under one window)
src-tauri/              Desktop shell; owns the Fractorches sidecar
static/                 Static assets
tests/                  Frontend unit tests
services/
	fractorches/        Go archive, query service, and sidecar source
docs/
	upstream/           pinned provenance and compatibility notes
```

Root commands: `pnpm sidecar` builds the sidecar binary into
`src-tauri/binaries/`, `pnpm dev` runs the web dev server, and
`pnpm tauri dev` runs the desktop application with its owned sidecar.

The two applications do not share a new navigation shell in v0, satisfying B1,
B2, and B3. Shared packages are introduced only after real duplication exists;
the repository does not begin with empty abstraction packages.

### 2. Upstream capture and provenance

Import each upstream through a reproducible manifest containing its upstream
name, license, source revision when available, content hash, import date, and
local modifications. Where a local source has no Git metadata, create a
deterministic file manifest before import rather than claiming a commit pin.

RepoGraph import waits for the external handoff. The integrator compares the
handoff against the audited snapshot and records changes affecting data routes,
scan schemas, daily-log schemas, navigation, or styling before implementation.

### 3. Fractorches service integration

Retain the Go backend and its SQLite archive. Do not port it to JavaScript or
Rust. Observatory consumes the service's versioned HTTP/SSE API and generated
TypeScript client for behavior B4 through B12.

The Observatory Tauri wrapper starts the Fractorches sidecar on loopback using
an isolated port and waits for its health endpoint before loading data. The UI
must expose sidecar startup, sync, stale, and request failures. Desktop shutdown
must stop only the sidecar process it owns.

Use existing Fractorches endpoints for sessions, transcript messages, usage,
activity, trends, quality, recall, pins, recent edits, settings, search, and live
sync. If a required endpoint is absent, add it to Fractorches with storage and
API tests; do not reconstruct the result from raw provider files in the UI.

All visible filters are sent to the query service. Aggregate requests and list
requests share the same normalized filter object so B7 cannot drift between
cards and tables. Semantic and hybrid modes remain absent until their real
Fractorches queries are wired, satisfying B11 and B25.

### 4. RepoGraph scan JSON

Preserve the Registry, Layout Map, System & Flows, Boundary Rules, and Health
Treemap pipeline for B13 and B14. Replace direct arbitrary filesystem joins with
a small sidecar API that:

- reads a configured RepoGraph scan root;
- validates project slugs against `registry.json`;
- allows only the declared scan types;
- rejects traversal and symlink escapes;
- validates required version, project, scan, node, edge, group, file, statistic,
  flow, and note shapes for the requested view;
- returns explicit unavailable and invalid-payload errors.

The project switcher for graph views is deliberately separate from the session
project filter because their domains are different.

### 5. Daily-log JSON

Preserve RepoGraph's calendar and daily timeline for B15 and B16. Replace the
hardcoded local directory with a user-configurable daily-log root stored in
Fracta settings. The sidecar validates the index schema and selected ISO date,
then reads only the file named by the validated index entry.

Daily-log browsing, commits, agent sessions, and handoffs remain source fields.
Fractorches may provide links to canonical sessions when an entry has a stable
session identity, but it does not overwrite the daily-log record.

### 6. Observatory UI adapter

Import the handed-off RepoGraph UI into the Observatory mode and replace its
`observatory.json` state with typed Fractorches resource stores. Remove the
extractor and all fallback arrays, fixed metric values, heuristic cost maps,
fabricated quality scores, and fake live indicators from production paths.

Each route owns a real resource state with request identity, data, generation or
sync timestamp, loading state, stale state, and typed error. Refresh bypasses
the client cache and updates all resources sharing the active filter. Exports
are generated from the same canonical filtered query as the visible result.

### 7. Knowledge port

Import Fractapad as the Knowledge mode and preserve B17 through B20 before
renaming or restyling. Remove upstream version endpoints, repository release
links, updater configuration, update menu items, and upstream product branding.
No update control ships until a Fracta-owned updater completes end to end.

Retain its Tauri filesystem workflows but narrow permissions to the files and
folders the user selects. Replace an unrestricted content security policy with
the minimum policy required by the verified Markdown, Mermaid, KaTeX, Marp, and
PDF workflows.

### 7.1 Knowledge workspace completion

Treat the FractalNotes checkout as the feature benchmark for a mature local
notes workspace, and the retained Fractapad renderer and document workflow as
the compatibility baseline. Complete B18 by restoring the routed Knowledge page
as a page (not a route layout), mounting its style cascade only while Knowledge
is active, and keeping all existing document lifecycle behavior intact.

The persistent Library owns no competing document state. It reads the existing
pinned-folder and recent-file stores, uses the existing validated native folder
listing command, and opens a selected path through the same `openFile` flow as
the file picker, links, native menu, and OS open events. Folder selection uses
the native dialog; it persists only an explicit user choice. A folder listing
reports loading, no Markdown files, or unavailable data truthfully and skips
hidden and non-content directories through the native command's established
rules.

The workspace composition keeps the Library and document canvas in the same
mode-scoped page. The Library is omitted only for the already-working zen state;
no responsive or visual simplification may remove an available file action.
New layout rules are authored in the root indented Sass contract and use
Fractalstyler2 tokens, while imported Fractapad component styles remain the
compatibility baseline until individually migrated.

Verification for B18 includes: type checking; existing renderer, text-search,
watcher, slide, syntax-highlight, and RTL tests; a production build; native
launch; and manual desktop acceptance that pins a real folder, expands its
listing, opens a pinned and a recent file, removes shortcuts without touching
data, opens two tabs with independent edits, saves an unsaved note, and confirms
the read/raw/edit/split and rich Markdown flows remain functional.

### 8. Styling, theming, and icons

Install Sass in each application with `pnpm add -D sass`. Record the imported
legacy style baseline. Imported styling may remain to preserve behavior, but no
new CSS, SCSS, Tailwind utility, inline style, or component style block may be
added. A touched visual rule moves to an indented `.sass` module and uses the
Fractalstyler2 semantic token/fractal contract.

Because Knowledge already exposes theme behavior, its retained light/dark mode
must be implemented through Fractalthemer's complete token mapping rather than
an independent variable set. Newly needed icons come from Fractalicons. Existing
icon migration is performed when necessary for a touched feature and must not
leave two competing new icon systems.

### 9. No-placeholder release gate

Production sources and built navigation are checked for:

- placeholder, demo, sample, mock, TODO-only, and coming-soon feature paths;
- inert buttons, tabs, keyboard hints, selectors, and exports;
- hardcoded metric arrays, token multipliers, pricing fallbacks presented as
  observed totals, and fixed quality or velocity values;
- the removed RepoGraph session extractor and Fractapad upstream endpoints;
- newly authored `.css` or `.scss`, inline style attributes, component style
  blocks, foreign tokens, or unauthorized icon dependencies.

A scanner finding is reviewed rather than blindly ignored. Legitimate fixture
and test uses must be explicitly scoped outside production bundles. This gate
enforces B8, B9, B10, B21, B24, and B25.

## Testing and validation

- **Service:** run existing Go tests plus endpoint, filter parity, provenance,
  scan-path, schema-validation, daily-log, SSE, and sidecar lifecycle tests.
  Run `go fmt ./...` and `go vet ./...` after Go changes.
- **Observatory:** run unit tests for typed adapters and filters, component tests
  for every data state, `svelte-check`, production build, and browser tests
  against an isolated Fractorches archive plus real scan and daily-log fixtures.
- **Knowledge:** run existing Fractapad tests, `svelte-check`, production build,
  Rust formatting/lint/tests, and desktop workflows for file entry, editing,
  conflicts, rich Markdown, presentations, and PDF output.
- **Cross-source parity:** on a frozen archive, compare Observatory session,
  message, project, model, usage, cost, and active-day totals with the same
  Fractorches API responses for identical filters.
- **Desktop:** verify clean launch, sidecar readiness, shutdown ownership,
  offline operation, file associations, permissions, and packaging for both
  interfaces.
- **Release gate:** run the no-placeholder and styling scans against source and
  production bundles. No waiver permits a visible pseudo-feature.
- **Human acceptance:** present both functioning desktop interfaces and their
  core real-data workflows for user review. Automated checks are evidence, not
  a substitute for acceptance.

## Parallelization

After this specification baseline is committed, implementation uses isolated
worktrees with non-overlapping ownership:

1. **Fractorches service lane:** import the service, preserve its tests, and add
   only the scan/daily-log or Observatory API gaps. It does not edit either app.
2. **Knowledge lane:** imported and ported Fractapad, removed tethers, and
   preserved its workflows (complete).
3. **Observatory lane:** imported the RepoGraph UI as the Observatory mode and
   replaced the generated Observatory pipeline with the Fractorches client
   (complete). It does not edit the Go service.
4. **Integrator lane:** owns root configuration, specifications, records,
   dependency policy, cross-app verification, and integration order.

Each lane commits coherent changes. The integrator reviews diffs, resolves
contract questions, integrates one lane at a time, and runs full gates after
every integration. Parallel work stops where a schema or root configuration
change would create overlapping ownership.
