# Agent Instructions

## Scope

- These rules apply to the entire repository.
- Read `PRODUCT.md`, `PRODUCT-TECH.md`, and `docs/index.md` before changing
  product behavior or architecture.
- More specific `AGENTS.md` files may add constraints but may not weaken the
  delivery, data-integrity, styling, or safety rules below.
- Keep `CLAUDE.md` as a symlink to this file.

## Delivery Contract

- A delivery must not contain stubs, placeholder routes, fake data, inert
  controls, disabled previews of future work, fabricated metrics, or
  surface-only implementations.
- An incomplete feature stays out of the shipped navigation and UI. Do not use
  "coming soon" as a substitute for implementation.
- Loading, empty, unavailable, stale, and error states must be truthful and
  visibly distinct.
- Preserve observable upstream behavior unless `PRODUCT.md` explicitly removes
  it from scope.

## Product Boundaries

- Fracta is one desktop application in one window. A bare shell with a
  Knowledge/Observatory toggle hosts both modes; each mode loads its own
  styles only while mounted. Do not reintroduce separate windows or a
  shared styled shell.
- The Fractorches Go service is the canonical source for agent sessions,
  transcripts, projects, usage, search, analytics, quality, recall, pins, and
  edits. Do not recreate provider parsers in JavaScript or Rust.
- RepoGraph scan JSON remains canonical for codebase graph views. Daily-log JSON
  remains canonical for the daily activity browser.
- RepoGraph is a moving upstream until its external handoff is complete. Do not
  copy or edit a mid-change snapshot. Record a content hash or commit before
  importing it.
- Fractapad is the Knowledge upstream. Remove its upstream update checks and
  branding tethers without removing working local knowledge features.
- Helix is out of scope. OpenCoVibe belongs to the later v0.1 milestone.

## Styling

- Install Sass with `pnpm add -D sass` in every Svelte application that authors
  styles.
- New or changed authored styles use indented `.sass` only: tabs for nesting,
  no braces, no semicolons, no `.css`, no `.scss`, no inline `style` attributes,
  and no component `<style>` blocks.
- New styling must follow Fractalstyler2's current semantic token and fractal
  composition contract. Do not introduce foreign custom properties or
  hardcoded visual values where a contract token exists.
- A retained theme control must use Fractalthemer integrated with
  Fractalstyler2's complete token contract. Otherwise omit theme controls.
- New icon needs use Fractalicons. Do not add another icon package.
- Existing upstream styling may remain during the compatibility phase. A file
  touched for new styling must migrate the touched rules to the contract above.

## Data Integrity

- Never estimate a value that the UI labels as observed, actual, total, saved,
  or live.
- Preserve source provenance, provider identity, canonical session identity,
  timestamp semantics, and usage deduplication.
- Date, project, agent, model, and search filters must be applied by the
  authoritative query layer and must affect every displayed aggregate in their
  scope.
- Do not present cached data as live. Expose generation time, sync state, and
  refresh failures.
- Validate JSON paths and schemas before reading scan or daily-log files. Reject
  path traversal and unsupported scan types.
- Persistent archives are user data. Never delete, truncate, recreate, or
  migrate a live archive as a shortcut.

## Records and Specifications

- `PRODUCT.md` defines product behavior. `PRODUCT-TECH.md` defines its technical
  realization. Keep both synchronized with implementation.
- Record meaningful progress in `docs/project-log.md`, durable decisions in
  `docs/decisions.md`, and current ownership in `docs/work-items.md`.
- Every document added under `docs/` must be linked from `docs/index.md` and
  include YAML frontmatter except `docs/index.md`.
- Do not put personal absolute paths, private hostnames, credentials, or private
  identities in tracked files, fixtures, logs, commits, or release text.

## Agent Orchestration

- Parallel implementation agents use isolated Git worktrees and one bounded
  ownership area each. Do not allow overlapping file ownership.
- The integrating agent reviews every diff, runs repository-wide gates, and is
  solely responsible for integration order.
- Subagents may not weaken specifications, add placeholders, or silently defer
  acceptance criteria.

## Verification

- Run relevant unit, integration, type, build, browser, and Tauri checks for the
  surfaces changed.
- Svelte production builds do not replace `svelte-check`.
- Go changes require `go fmt ./...`, `go vet ./...`, and relevant tests.
- Rust changes require formatting, linting, and relevant tests.
- Delivery gates must scan production sources for mock data, placeholder copy,
  inert controls, forbidden upstream update endpoints, and newly authored
  styling outside the contract.
- Browser and desktop acceptance use real isolated fixtures and local data, not
  mocked production dashboards.

## Git and Safety

- Preserve unrelated work and inspect branch state before editing.
- Commit each coherent tracked change. Do not amend, squash, rebase, merge,
  push, or pull unless the user asks.
- Do not use destructive Git or filesystem commands.
