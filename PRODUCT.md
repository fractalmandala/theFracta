# Fracta v0 Product Specification

## Summary

Fracta begins a longer journey toward integrated AI work surfaces, knowledge
spreads, and workflows. The v0 product is one desktop application in one
window with two toggled modes: an Observatory built from RepoGraph's visual
surfaces and Fractorches' canonical agent data, and a Knowledge interface
that preserves Fractapad's viable local Markdown workflow. Each mode keeps
its upstream interface identity and owns its styles only while mounted;
the hosting shell itself stays unstyled.

## Problem

The current tools divide related work across separate surfaces. RepoGraph has
valuable code graph and daily-log views but its direct session extractor has
incomplete provider coverage, inconsistent parsing, estimated metrics, and
incorrect aggregation. Fractorches has the mature multi-provider archive and
analytics backend but not RepoGraph's graph or daily-log interfaces. Fractapad
provides a useful local knowledge surface but carries upstream branding and
update tethers that do not belong in Fracta.

## Goals

- Deliver a trustworthy Observatory without rebuilding Fractorches' provider
  parsers.
- Preserve RepoGraph's code graph and daily-log workflows as first-class
  surfaces.
- Deliver Fractapad's useful local knowledge workflows as a frictionless Fracta
  desktop application.
- Establish strict data provenance and no-placeholder delivery standards.
- Leave an explicit integration boundary for the later OpenCoVibe-based v0.1.

## Behavior

1. **B1 — One application, two modes.** Fracta v0 ships a single desktop
   window with a bare Knowledge/Observatory toggle; both modes are fully
   usable inside it, and the desktop app owns its Fractorches sidecar.
2. **B2 — Interface continuity.** Each mode preserves the information
   architecture and interaction model of its upstream for v0, styling
   included. A restyle of either mode is not required.
3. **B3 — Independent failure.** A failure or unavailable data source in one
   interface does not prevent the other interface from launching and operating.
4. **B4 — Canonical session source.** Observatory obtains agent sessions,
   messages, transcripts, provider identity, projects, usage, cost, search,
   activity, quality, recall, pins, and recent-edit data from Fractorches.
5. **B5 — No competing parser.** The shipped product does not use RepoGraph's
   direct multi-provider session extractor or its generated
   `observatory.json` as a source for canonical agent data.
6. **B6 — Complete provider visibility.** Every provider and session accepted
   into the active Fractorches archive is eligible to appear in Observatory
   under the same archive, deletion, lineage, and automation rules.
7. **B7 — Consistent filtering.** Date, project, agent, model, search mode, and
   other visible filters affect all scoped cards, charts, tables, exports, and
   counts consistently.
8. **B8 — Truthful freshness.** Observatory reports its actual sync state and
   last successful refresh. It never labels a static snapshot as live.
9. **B9 — Truthful metrics.** Values presented as totals, usage, cost, savings,
   quality, velocity, outcomes, or activity come from real canonical data and
   documented calculations. Estimated or unavailable values are labeled as
   such or omitted.
10. **B10 — Complete interaction states.** Every data surface has distinct
    loading, populated, true-empty, stale, unavailable, and error behavior as
    applicable. A parse or transport error is not shown as an empty dataset.
11. **B11 — Search fidelity.** A visible full-text, semantic, or hybrid search
    mode executes the corresponding Fractorches search and opens real matching
    sessions or messages. Unimplemented modes are absent.
12. **B12 — Transcript fidelity.** Opening a session shows its canonical
    transcript, tool events, usage context, and source-supported metadata rather
    than an empty or provider-limited transcript.
13. **B13 — RepoGraph graph surfaces.** Observatory preserves Layout Map,
    System & Flows, Boundary Rules, and Health Treemap for scan types backed by
    valid RepoGraph scan JSON.
14. **B14 — Scan truthfulness.** A graph view is visible only when the selected
    project's registry and validated scan payload support it. Missing scan types
    are reported as unavailable, not rendered from mock data.
15. **B15 — Daily activity surface.** Observatory preserves the calendar and
    daily timeline over dated daily-log JSON, including browsing, commits, agent
    sessions, and handoffs when present.
16. **B16 — Separate data domains.** Code graph scans and daily logs retain
    their JSON-backed provenance and are not silently substituted with
    Fractorches session aggregates.
17. **B17 — Knowledge file entry.** Knowledge opens supported local Markdown
    content through file association, file dialog, drag and drop, URL, and paste
    where the upstream workflow supports them.
18. **B18 — Mature Notes workspace.** Knowledge is a real local Markdown
    workspace benchmarked against the FractalNotes origin, rather than a
    single-file reader. The following observable behavior is required:
    - A persistent Library is available whenever Knowledge is not in an
      intentional distraction-free reading state. It provides New note, Open,
      Paste, and URL entry actions; each action performs the same real workflow
      as its corresponding menu or keyboard command.
    - Users can pin one or more local folders. A pinned folder survives restart,
      shows a truthful loading, unavailable, empty, or populated state, and
      expands to real Markdown files from that folder. Selecting a file opens
      that exact file in the current window; unpinning affects only the Library
      shortcut and never the folder or its contents.
    - The Library shows recently opened local notes in newest-first order.
      A recent entry reopens its exact file, can be removed from the list, and
      is not represented as a recent if the document was only pasted or fetched
      from a URL. A missing recent file reports an opening error instead of
      silently disappearing or opening another file.
    - A user can work with multiple documents at once. Open documents retain
      their own unsaved state and reading position, can be switched without
      losing edits, and require an explicit discard decision before a dirty tab
      closes. An unsaved new document chooses its file location on first save.
    - Every local note supports reading, raw-source, edit, and split
      edit/preview modes where the source supports them. Switching modes keeps
      the user's document position as closely as the document structure allows;
      it never silently saves or discards changes.
    - The workspace supports file open, file association, drag and drop, paste,
      URL input, save, Save As for new notes, and local Markdown links. It
      distinguishes cancellation, invalid input, unavailable files, and save or
      fetch failures from a genuine empty document.
    - A note's frontmatter, rich Markdown, table of contents, reading
      preferences, in-document search, reading progress, external-change
      detection, conflict handling, KaTeX, Mermaid, Marp presentation, and PDF
      output retain their working local behavior. Frontmatter never appears as
      accidental raw content in reading or rich views.
    - Keyboard access remains complete for document entry, tabs, search, view
      modes, save, close, and visible Library actions. Focus moves to the
      opened document or the relevant dialog after a successful action, and a
      keyboard user can reach every visible control.
    - A control or panel appears only for a workflow that is available end to
      end. In particular, a folder item, recent item, tab, view mode, export,
      progress indicator, or search result is backed by real user data and a
      working action.
19. **B19 — Rich Markdown.** Knowledge preserves frontmatter, KaTeX, Mermaid,
    Marp presentation, and PDF workflows with real input and output.
20. **B20 — Local-first operation.** Both interfaces work against local files
    and local services without an account, cloud dependency, or telemetry.
21. **B21 — Fracta ownership.** Knowledge makes no version, update, release, or
    branding request to its upstream project. Update controls are absent unless
    a functioning Fracta-owned updater exists.
22. **B22 — Data safety.** Opening, syncing, filtering, scanning, and viewing do
    not delete or recreate a user's persistent archive or knowledge files.
23. **B23 — Keyboard and accessibility.** Retained workflows remain operable by
    keyboard, expose meaningful accessible names, preserve focus, and respect
    reduced-motion and contrast needs.
24. **B24 — Styling boundary.** New styling uses indented Sass and the current
    Fractalstyler2 contract. Retained theming uses Fractalthemer integrated with
    that contract; new icons use Fractalicons.
25. **B25 — No pseudo-features.** A route, tab, control, metric, export, or
    preference appears in a delivered interface only when its end-to-end
    behavior is implemented and verified with real data.

## Non-goals for v0

- Porting or integrating Helix.
- Porting OpenCoVibe; that belongs to v0.1 after a separate feature-removal
  scope is approved.
- Replacing Fractorches' Go backend.
- Accounts, cloud synchronization, collaborative editing, or telemetry.
- Inventing graph scan types when no real generator and payload exist.

## v0.1 Direction

Fracta v0.1 adds a deliberately reduced OpenCoVibe port to the completed v0.
Its included and removed feature list requires a separate product specification;
v0 work must not create placeholder OpenCoVibe surfaces.
