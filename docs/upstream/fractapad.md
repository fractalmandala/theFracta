# Fractapad provenance

- Upstream: Fractapad
- License: MIT (preserved in `LICENSE`)
- Source revision: unavailable; the supplied source checkout has no Git
  metadata
- Import date: 2026-08-29
- Deterministic source content hash: `sha256:5a82156e97ba09da55992ceae05b71d14b13ee8517c3e2aa49fd80151c44dbd9`
- Provenance hash input: 165 regular source files from the supplied checkout
- Import excludes source-control metadata, dependency caches, build output, and
  CI-only repository files

## Local modifications

- Renamed the application, package, Tauri crate, window title, storage keys,
  and Markdown deep-link scheme to Fracta Knowledge identifiers.
- Removed upstream update/version checks, updater dependencies and permissions,
  release-artifact configuration, update menu controls, update UI, and release
  links. No replacement updater is shipped.
- Replaced upstream-branded toolbar/about artwork with Fractalicons.
- Retained the local Markdown workflows and rich rendering pipeline, including
  file associations, dialogs, drag/drop, pasted and explicitly opened URLs,
  tabs, editing, saving, conflict watching, search, TOC, pins, recents,
  progress, frontmatter, KaTeX, Mermaid, Marp, and PDF printing.
- Added Fractalstyler2's full Sass token stylesheet and Fractalthemer's theme
  stylesheet while leaving inherited app.css compatibility rules untouched.
- Added local module declarations for the two Markdown plugins that publish no
  TypeScript declarations.
