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

## 2026-09-05 — Wiki surface: private article store and recall corpus (Phase 1)

- Removed the fabricated five-entry registry seed and its hardcoded telemetry:
  fake agent "Verified" rows, token quota, sparkline, inline progress bar, and
  the "0 leaks" privacy claim (D005/D010; B9, B25).
- Added a local article store: `wiki_commands.rs` resolves the Git-ignored
  `wiki/` root (`FRACTA_WIKI_ROOT` override → in-repo `wiki/` → `~/.fracta/wiki`
  fallback), creates only the missing `entries/` directory, and lists article
  files. Articles are Markdown with frontmatter, parsed strictly; malformed
  files are skipped and counted, never rendered half-valid.
- Added a corpus browser fed exclusively by the Fractorches recall HTTP API:
  `listRecallEntries` pages `/recall/entries` with server-side text, type, and
  review-state filters, and reports truncation past 1,000 entries. Corpus
  entries render with agent, project, review state, trigger, uncertainty,
  model confidence, and a source-session citation with an "Open in Bench" jump
  into the transcript viewer.
- Converted wiki state to a Svelte 5 runes facade (`state.svelte.ts`) bridging
  the article store and corpus state; every telemetry value is now measured
  from one of those two sources, with distinct loading, empty, unavailable,
  error, and truncated states throughout.
- Markup reuses the current Fractalstyler2 class contract (`ghost`,
  `align-self-start`) following the parallel styling lane's renames; no style
  blocks or stylesheets were edited on this lane.

### Verification evidence

- `pnpm check`: svelte-check 0 errors; class gate 436/436 defined.
- `pnpm test`: 40 passed including 6 new entry-format tests; the 3
  `hljs-dark-coverage` failures pre-exist on a tree without this change (they
  read the styling lane's generated `styles/temp/mdrend.css`).
- Production build passes; `pnpm run check:privacy` holds.
- `cargo test --lib`: 14 passed including 4 new wiki-store tests; `cargo fmt`
  clean; clippy reports only pre-existing warnings in other files.

### Open dependencies

- Phase 2 (article compilation through the Fractorches insights/recall
  machinery, draft review, supersession watch) is not started; no compile or
  edit control appears in the UI.
- Recall corpus is populated only if `[recall.extract]` is enabled and
  extraction has run in the Fractorches service; otherwise the corpus browser
  truthfully reports an empty corpus.

## 2026-09-05 — Wiki surface: draft compilation through the service (Phase 2)

- Added `GET /api/v1/wiki/compile/status` and `POST /api/v1/wiki/compile` to
  the Fractorches service. Status reports only probed availability (the
  configured OpenAI-compatible insights endpoint, or insight agent CLIs found
  on PATH). Compile loads the caller-selected recall entries read-only,
  rejects unknown and archived/superseded ids, and prompts the model for
  per-claim `[recall:<id>]` citations with explicit "(unverified)" markers.
  The handler persists nothing (decision D011).
- Added the frontend compile flow: a typed client for both endpoints that
  surfaces the service's error messages verbatim, a compile panel showing
  probed availability, the selected cluster, the draft review (rendered and
  raw markdown, grounding provenance, draft type), and a save step that
  writes the draft into the private Git-ignored article store only after
  user review.
- Corpus entries are selectable into a compile cluster from the sidebar and
  the corpus entry view; selection is pruned to the loaded corpus view on
  every refresh so it never references hidden entries.
- Saved drafts record `compiledFrom` and `compiledAt` in the article
  frontmatter. The article view shows the grounding ids and a freshness
  verdict computed only from what the loaded corpus view can verify: fresh,
  stale (naming the changed entries), or unknown — never a guessed claim.
- Markup reuses the existing Fractalstyler2 class contract; no stylesheets or
  style blocks were touched on this lane.

### Verification evidence

- `go fmt ./internal/server/` clean; `go vet ./internal/server/` clean;
  `go test ./internal/server/ -run WikiCompile`: 9 passed (unknown,
  archived, empty, over-cap, invalid-agent, generation-failure, success-path,
  and status tests).
- `pnpm check`: svelte-check 0 errors; class gate 282/282 defined.
- `pnpm test`: 46 passed including 6 new freshness tests and the extended
  entry-format fixture; the 3 `hljs-dark-coverage` failures remain the
  styling lane's pre-existing missing generated file.
- Production build passes; `pnpm run check:privacy` holds.

### Open dependencies

- Compilation produces a draft only when the service has a generation path:
  either `[insights]` endpoint+model configured, or an insight agent CLI on
  PATH. Otherwise the panel shows the service's own unavailability reason.
- Article editing, cascade recompile suggestions, and publication flows are
  not implemented and do not appear in the UI.


## 2026-09-05 — Bench Usage parity with AgentsView

The Usage tab was two components against the richest data in the service. It
now carries all seven of AgentsView's panels, and reads the four endpoints it
had credentials for and never called.

### What was built

- **Data boundary.** `Usage` in `src/lib/observatory-fractorches.ts` now parses
  the whole `/usage/summary` response rather than its totals: per-day project,
  model, agent and machine breakdowns; `agentTotals`; `sessionCounts`;
  `cacheStats`; and `pricing` provenance. Added `/usage/top-sessions` (a bare
  JSON array, so a `getList` helper beside `get`), `/usage/comparison` (a second
  round trip, since the service needs this period's total to state a delta), and
  `getUsagePairwise()` for `/usage/pairwise-comparison`.
- **View state.** `usageMode` (cost | token), `usageTokenTypes`, per-dimension
  group-by and hidden-series state, and the pairwise selection, in
  `observatory.svelte.ts`. Only the top-sessions ranking reaches the server —
  the service orders by cost or tokens, and those are different rows, not a
  different sort of the same rows.
- **Panels.** `UsageSummaryPanel`, `UsageOverTimePanel` (stacked-area SVG),
  `UsageAttributionPanel` + `Treemap` (squarified layout in `treemap.ts`),
  `TopUsageSessionsPanel`, `CacheEfficiencyPanel`, `PairwiseComparisonPanel`,
  composed by `UsageView`. Shared derivations live in `usageSeries.ts`, shared
  formatting in `usageFormat.ts`.
- **Chrome.** The Cost / Tokens switch and the token-type picker render into
  the app header on the Usage tab only, beside the existing range and filters.
- **Styling.** A twelve-band categorical series palette in `_08_own.sass`,
  built from the five semantic hues at two lightnesses. Usage groups by
  categories with no natural order, so the lightness ramp the skill chart uses
  would imply one that is not there. Past twelve, every panel rolls the tail
  into one labelled neutral band.

### Defects found and fixed while verifying

- **`each_key_duplicate` aborted the summary render.** With a single token type
  selected, the headline tile and the per-type tile both read "Output tokens";
  the keyed `{#each}` threw and the DOM silently kept its previous contents,
  so the panel showed all-token figures while the store held output-only. Tiles
  are now keyed by position, and the redundant per-type tile is dropped when the
  headline already is that type. A second latent case — two gridline labels
  formatting to `<$0.01` on a small range — was keyed by position too.
- **`completed_rate` was multiplied by 100** in `SessionHealthPanel` and
  `AgentComparisonCard`; the service already returns 0–100
  (`internal/db/analytics.go`, `math.Round(completed/count*1000)/10`). The
  tables had been reading `10000%`.
- **A zero prior period rendered as "+0%".** `/usage/comparison` returns a
  delta of 0 when the prior window has no spend, which reads as "unchanged".
  The tile now names the empty window instead.
- **An empty skill-trend week drew nothing at all**, so a sparse stretch read as
  a broken chart rather than a zero baseline; `.skillcol` keeps a hairline.

### Verification evidence

- `svelte-check`: 0 errors, 0 warnings, 6,426 files.
- Class gate: no failures in `observatory-components`; the outstanding entries
  are the Studio lane's.
- Against the live index (587 sessions, 101 projects, 52 models, 1y range):
  all seven sections render; cost mode reports $4,565 total, $43.89/day burn,
  94.2% cache hit; token mode reports 11.4B total, and narrowing to output only
  correctly re-reads as 37.3M with a 358.8K daily burn; pairwise
  `claude-opus-5` against `gpt-5.6-sol` returns $1,233 vs $309 over 25 and 13
  sessions with the service's own deltas.

### Not done

Activity, Quality, Trash, and Trends-as-term-frequency remain, per
`docs/bench-parity.md`.

## 2026-09-05 — Notes: tab memory

Phase 5 of the vault plan, taken on its own: the memory an open document costs,
and the per-render work that scaled with document size.

### What changed

- **`src/lib/renderer/renderCache.ts` (new).** One bounded LRU for rendered
  HTML, keyed by path and an FNV-1a hash of the content. Twelve entries or four
  million characters, whichever binds first. `dropRenders()` frees a document's
  entries when its last tab closes rather than waiting for eviction. Reasoning
  recorded as D013.
- **`Tab` lost `renderedHtml`** and gained `baseDir`; `editContent` is now
  `string | null`, holding a buffer only while an edit is in progress instead of
  duplicating `content` for every open tab. `renderOf(tab)` and `draftOf(tab)`
  are the read paths.
- **`stores/document` is `derived`** over the tab store plus a small
  `openStatus` writable for the one thing that is not a tab — an open that is
  still in flight or that failed. Nine `document.set(...)` calls that restated
  what `tabStore.addTab` had just been given are gone, across `files.ts`,
  `PasteModal`, `OpenDialog` and `NotesModule`.
- **Delegated listeners in `MarkdownRenderer`.** Link tooltips and clicks were
  two listeners per anchor plus a `data-*Bound` flag on each, rebuilt on every
  render; they are now three listeners on the article. `mouseover`/`mouseout`
  rather than `mouseenter`/`mouseleave`, which do not bubble.
- **`hljs.highlightAuto` dropped for unlabelled fences.** It ran all 27
  registered grammars over every unlabelled block and scored them, per block, on
  every render, to guess a language it frequently got wrong. An unlabelled fence
  now renders as plain text.
- **"Close others"** in the tab context menu, replacing the `MAX_TABS` idea. It
  keeps tabs with unsaved edits and says how many it will actually close.

### A behaviour this preserved deliberately

Leaving edit mode with unsaved changes still shows the *draft*, not the version
on disk. Previously that took an explicit `docStore.set` with a hand-rendered
preview; now `renderOf` renders the draft whenever the tab is not editing, and
renders the saved text while it is — so a keystroke does not re-render a
document nobody is looking at.

### Verification evidence

- `svelte-check`: 0 errors, 0 warnings, 6,428 files. Class gate unchanged.
- `tests/unit/render-cache.test.ts` (new): 7 tests covering LRU order, both
  bounds independently, content keying, and that `dropRenders` does not take a
  path that merely shares a prefix. `vitest`: 53 passed, with the 3
  pre-existing `hljs-dark-coverage` failures unchanged.
- Driven in the running app: a new document typed in Raw renders its unsaved
  draft in Read (including an unlabelled fence as plain text, confirming the
  highlight change); link hover shows the href and leaves no `data-*Bound`
  attributes; switching away from a dirty tab and back preserves the draft;
  "Close 3 others" closed three clean tabs and kept the dirty one; with two
  dirty tabs and one clean it correctly offered "Close 1 other" and kept both.

### Not done

The remaining vault phases: bodies + FTS search, the live watcher, and links and
backlinks. Session restore is still listed under Phase 6.

## 2026-09-05 — Notes: autosave, and honest external-change handling

Edits to a file that already has a location now reach disk without Cmd+S, and
changes made to that file by anything else are taken up rather than silently
overwritten. Reasoning recorded as D014.

### What was built

- **`src/lib/notes/autosave.ts` (new).** Debounced writer: 800 ms after the last
  keystroke, with a 4 s ceiling so unbroken typing still lands. Exposes
  `scheduleAutosave`, `flushAutosave`, `cancelAutosave` and an `autosaveStatus`
  store. Flushed on tab switch, on leaving edit mode, and before quit.
- **`resolveExternalChange` in `stores/tabs.ts`.** The three-case decision —
  ignore / adopt / conflict — as a pure function, replacing the watcher's 1.5 s
  "was that us?" window. `Tab` gained a `conflict` field holding the disk
  version alongside the draft.
- **`writeDraft` in `tauri/files.ts`.** The single write path, now shared by
  Cmd+S and autosave; `handleSave` keeps only what autosave must not do —
  choosing a location for a `new://` document.
- **A conflict notice** in Notes, offering "keep mine and overwrite" or
  "discard mine and load the file", with the two versions' sizes so the choice
  is informed. Autosave is paused for that file until it is answered.
- **Save state on the document title**: unsaved, saving, saved, or the write
  error, attributed only to the document it is about.
- **Reconcile on tab activation.** Nothing watches a file while its tab is in
  the background, so switching to it re-reads once through the same comparison.
- **A setting** (`autosave`, default on); off restores the previous behaviour.

### Verification evidence

- `tests/unit/external-change.test.ts` (7) and `tests/unit/autosave.test.ts`
  (11), the latter mocking the filesystem at `writeDraft`. `vitest`: 71 passed,
  with the 3 pre-existing `hljs-dark-coverage` failures unchanged.
- The guards were mutation-checked: replacing `autosaveEligible` with a bare
  `tab.dirty` fails exactly the five tests that assert a refusal (no location,
  pasted/fetched, conflicted, conflict resolved, setting off), so those tests
  are load-bearing rather than incidental.
- `svelte-check`: 0 errors in everything this touched. Class gate: no new
  entries.
- Driven in the app: typing into a `new://` document for six seconds opens no
  dialog and raises no error, which is the refusal that matters most; the
  Autosave setting renders and toggles.
- `vitest.config.ts` gained a `$lib` alias so a unit test can import a module
  that uses the app's own alias.

### Not verified here

The disk round trip itself — write, watcher event, reload — needs the Tauri
build; this session can drive the browser but not the desktop window. The write
path below `writeDraft` is unchanged from the Cmd+S path that already worked.

### Still open

`ObservatoryHeader.svelte` has a type error at its new `Dropdown` usage
(`items={() => …}` against `MenuItem[]`) from concurrent work in another lane;
untouched here.
