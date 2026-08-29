---
title: Project log
description: Chronological record of Fracta Era 1 work and evidence.
tags:
  - project-memory
  - delivery
---

# Project log

## 2026-08-29 — Repository foundation and data boundary

- Initialized the Fracta Era 1 repository.
- Defined the v0 product as two independent interfaces: Observatory and
  Knowledge.
- Dropped Helix from v0 and reserved a reduced OpenCoVibe port for v0.1.
- Audited RepoGraph's Observatory extractor, generated payload, Svelte state,
  Tauri IPC, Fractorches archive, and live Fractorches usage API.
- Confirmed that RepoGraph has both incomplete ingestion and incorrect parsing
  or aggregation. Chose Fractorches as the canonical Observatory data source.
- Confirmed that RepoGraph's scan JSON and daily-log JSON are separate valuable
  surfaces and remain in scope.
- Reviewed the external RepoGraph repair update. It fixed real-turn counting,
  deduplication, and two Usage render bugs, but did not close provider coverage
  or canonical metric gaps; the Fractorches boundary remains unchanged.
- Deferred RepoGraph import until the external agent supplies a stable handoff.

### Verification evidence

- Read-only SQLite comparison of active session, message, project, provider, and
  usage records.
- Read-only calls to the running Fractorches usage summary for last-year and
  30-day windows.
- Static trace from RepoGraph source inputs through generated JSON, IPC/API,
  client state, and views.

### Open dependencies

- Stable RepoGraph handoff with reproducible provenance.
- Fractapad import into its isolated implementation worktree.

## 2026-08-29 — Fractorches service import

- Imported the complete Fractorches service source, tests, build configuration,
  embedded frontend, and operational documentation under
  `services/fractorches`.
- Preserved the upstream MIT license and recorded a deterministic source
  manifest plus the import boundary in `services/fractorches/UPSTREAM.md`.
- Removed internal process residue and replaced contributor-specific test paths
  with synthetic paths without changing production behavior.
- Retained the Go archive, parsers, provider coverage, storage, query, sync,
  search, analytics, and HTTP/SSE service as the canonical Observatory backend.

### Verification evidence

- Deterministic import manifest recomputed successfully for 2,372 files.
- Private-path and omitted-process-directory scans passed.
- Whitespace and patch-integrity checks passed.
- Go and bundled-frontend execution checks remain unverified on the import lane
  because their toolchains or installed dependencies were unavailable there.

## 2026-08-29 — Fracta Knowledge implementation

- Imported Fractapad under `apps/knowledge` with its MIT license and a
  deterministic provenance record.
- Renamed the package, application, native crate, window, storage keys, and
  Markdown deep-link scheme to Fracta Knowledge.
- Removed the upstream updater dependencies, update permissions, release
  configuration, version checks, update UI and menus, upstream release links,
  and upstream product branding.
- Preserved real local Markdown workflows for opening, drag and drop, paste,
  URLs, tabs, reading, editing, saving, external-change conflicts, search,
  table of contents, pins, recents, reading progress, frontmatter, KaTeX,
  Mermaid, Marp, and PDF printing.
- Installed Sass, integrated Fractalstyler2 and Fractalthemer, and used
  Fractalicons for touched branding and icon surfaces.
- Fixed inherited modal, lightbox, and tab accessibility warnings without
  changing visible behavior.

### Verification evidence

- `svelte-check` passed on the integrated checkout with zero errors and zero
  warnings.
- All 37 frontend unit tests passed.
- The production SvelteKit build passed; its remaining messages are bundling
  advisories rather than failures.
- Rust formatting passed, and all seven Rust unit tests plus the native menu
  integration test passed.
- Updater, release-tether, private-path, placeholder-feature, and source-diff
  reviews passed for production code.

### Acceptance boundary

- Browser, packaged desktop, file-association, rich-rendering, presentation,
  PDF, and permission acceptance remain open and are not represented as passed.
- The inherited broad asset scope and null content-security policy remain a
  hardening item until those workflows can be exercised end to end; narrowing
  them without that evidence could silently break local images or explicit URL
  rendering.

## 2026-08-29 — RepoGraph handoff activation

- Accepted the unchanged local RepoGraph tree and Claude's supplied repair
  report as the stable, non-Git handoff for import.
- Started the Observatory implementation lane with deterministic provenance as
  its first gate.

## 2026-08-29 — Lane integration and repository gates

- Resumed the interrupted filter-parity lane, verified its uncommitted work,
  and committed it on `feat/fracta-filter-parity` after installing the Go
  toolchain that had blocked the lane.
- Verified the lane against the pristine base commit: all failing tests in
  untouched packages reproduce identically without the diff (system SQLite
  without FTS5, fixture-path tests), so the lane introduced no regressions.
- Merged `feat/fracta-v0-observatory` and `feat/fracta-filter-parity` into
  main; the trees are disjoint and both merges were conflict-free.
- Repaired Observatory gate debt left by the interrupted lane: three
  svelte-check type errors, accessibility warnings on the treemap and two
  dialogs, dead landing-page styles, missing bundle icons that broke the Rust
  build, and non-canonical Rust formatting.
- Regenerated the Fractorches API clients to confirm the committed generated
  code matches the generator output.

### Verification evidence

- svelte-check: 0 errors and 0 warnings for both Knowledge and Observatory.
- Knowledge: 37/37 frontend unit tests; production build; Rust formatting;
  7 Rust unit tests plus the native menu integration test.
- Observatory: production build; Rust formatting; 1 Rust unit test.
- Fractorches: `go vet` clean and `gofmt` clean on changed files; the db,
  duckdb, postgres, server, and service test packages pass, including the new
  filter parity suite.

### Open items

- A workspace `pnpm-lock.yaml` exists locally but was never tracked by this
  repository; committing it is a dependency-pinning policy decision.
- Cross-source parity verification and browser plus packaged-desktop
  acceptance for both interfaces remain open for V1 delivery.

## 2026-08-29 — Single-window Fracta

- Applied the product owner's directive that Knowledge and Observatory are
  one application: a bare shell with a two-button toggle, each mode mounting
  its own routes and owning its styles only while mounted.
- Moved Observatory's routes, components, state, and authored styles into the
  Knowledge app under /observatory; merged its Tauri commands into the one
  crate; renamed the product identity to Fracta; removed the standalone
  Observatory app.
- Added sidecar ownership to the desktop app: spawn on launch over a private
  port with the webview origin trusted, resolved URL over IPC, stop only the
  owned process on exit; the frontend never caches an empty sidecar answer so
  Retry succeeds once the sidecar finishes its initial sync.
- Amended PRODUCT.md (B1/B2, non-goals) and AGENTS.md product boundaries;
  recorded D009.

### Verification evidence

- Desktop app verified live: toggle in both directions with correct style
  isolation, Observatory rendering 596 live sessions through the owned
  sidecar, CORS headers confirmed for the app origin.
- svelte-check 0 errors 0 warnings; production build; 37/37 frontend tests;
  cargo fmt clean; 10/10 Rust tests.

## 2026-08-29 — Workspace scaffolding removed

- Collapsed the two-app pnpm workspace into a single root application: `src/`,
  `src-tauri/`, `static/`, and `tests/` live at the repository root; the
  workspace file and per-app packaging are gone.
- Relocated upstream provenance records to `docs/upstream/` (fractapad,
  repograph).
- Root commands are now plain project commands: `pnpm dev`, `pnpm tauri dev`,
  `pnpm sidecar`, `pnpm check`, `pnpm test`, `pnpm build`.
- Fixed a latent Sass defect surfaced by the move: `_05_shells.sass` used
  `map.get` without importing `sass:map`.

### Verification evidence

- svelte-check 0 errors 0 warnings; production build; 37/37 frontend tests;
  cargo fmt clean; 10/10 Rust tests after cache reset; sidecar binary builds
  via `pnpm sidecar`; `pnpm dev` serves the application.

## 2026-08-29 — Knowledge workspace completion

- Corrected the accidental route migration that placed the complete Knowledge
  document surface in a layout and left the page empty.
- Restored mode-scoped Knowledge styles and added a persistent Library with
  real pinned-folder and recent-document actions backed by the existing native
  file-listing and document-opening paths.
- Expanded the product and technical contracts for B18 so the FractalNotes
  workspace capability benchmark is explicit and testable.

## 2026-08-29 — Notes surface structural acceptance repair

- Made the Knowledge route wrapper, page, and document canvas claim the full
  available workspace width rather than shrink-wrapping to the current content.
- Replaced the generic dialog collision that rendered the visible Settings
  backdrop while hiding its dialog, with a Notes-owned, accessible Settings
  dialog and token-based indented Sass styles.
- Moved editor and split-preview layout into the document canvas flow. Editing
  now respects the persistent Library and tab strip instead of positioning
  itself against the whole desktop window.

### Verification evidence

- Browser workflow: created a note, edited it, retained two open tabs, entered
  split edit/preview, opened and closed Settings, and toggled an editor setting.
- `pnpm check`: 0 errors and 0 warnings; existing frontend suite: 37/37 tests;
  production build completed.

### Open acceptance

- Native desktop acceptance still requires real folder pinning, local file open
  and save-as, recent-file reopening, and the full rich Markdown workflow.
