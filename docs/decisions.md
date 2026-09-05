---
title: Decisions
description: Durable product and architecture decisions for Fracta Era 1.
tags:
  - decisions
  - architecture
---

# Decisions

## D001 — Keep the Go backend

**Status:** accepted

Fractorches' Go backend remains the canonical archive and query service. The
SvelteKit goal applies to the frontend, not to rewriting mature parsers,
storage, search, or analytics.

## D002 — Preserve two v0 interfaces

**Status:** accepted

Observatory and Knowledge remain separate launchable interfaces in v0. Visual
and workflow convergence is phased after both ports are complete.

## D003 — Replace RepoGraph Observatory ingestion

**Status:** accepted

RepoGraph's generated session snapshot is replaced by Fractorches APIs because
the extractor has missing providers, duplicate or misclassified sessions,
incompatible message semantics, estimated metrics, and filter/freshness bugs.

## D004 — Preserve RepoGraph's JSON-native views

**Status:** accepted

Code graph scan JSON and daily-log JSON remain authoritative for their distinct
views. They gain configuration, validation, and path safety but are not replaced
with Fractorches aggregates.

## D005 — No placeholder delivery

**Status:** accepted

Incomplete functionality is absent from shipped UI. There are no coming-soon
tabs, mock dashboards, inert controls, or fabricated observed metrics.

## D006 — Styling migration is touched-surface based

**Status:** accepted

Legacy upstream styling may remain during compatibility work. Every new or
changed rule uses indented Sass and Fractalstyler2. Retained theme behavior uses
Fractalthemer; new icon needs use Fractalicons.

## D007 — Defer moving RepoGraph import

**Status:** superseded by D008

Do not capture RepoGraph while another agent is changing it. Import begins only
after a stable handoff is identified and pinned.

## D008 — Accept the stable non-Git RepoGraph handoff

**Status:** accepted

The local RepoGraph tree has no Git metadata and remained unchanged after the
supplied Claude repair report. Import it with a deterministic source manifest,
record the repair provenance, and replace its session extractor only after the
snapshot boundary is pinned.

## D009 — One window with toggled modes

**Status:** accepted (2026-08-29, supersedes the v0 two-interface decision
in D001-era scoping and the earlier B1/B2)

Fracta is a single desktop application in a single window. A bare, unstyled
shell provides a Knowledge/Observatory toggle; each mode mounts under its
own routes and injects its own stylesheet cascade only while mounted, so
the two upstream style systems never collide and neither mode's look is
compromised. The desktop app owns its Fractorches sidecar: it spawns the
configured binary on a private loopback port, trusts the webview origin,
and stops only what it owns on exit. Separate windows and a shared styled
shell are both rejected: the former fragments the product, the latter
reopens the upstream style collision this structure exists to avoid.

## D010 — Wiki articles are private local data; the service is the corpus

**Status:** accepted (2026-09-05)

The Wiki surface stores articles as private user data: one Markdown file per
article under the app folder's Git-ignored `wiki/` directory (override with
`FRACTA_WIKI_ROOT`, machine-local fallback `~/.fracta/wiki`). Articles are
never committed. Raw material comes exclusively from the Fractorches service —
recall entries over its HTTP API, with server-side filters and pagination; no
transcript parsing exists in the UI. Citations stay opaque, and every telemetry
value the surface shows is measured from the article store or the corpus.
LLM compilation of articles (later phase) will run through the Fractorches
service's existing insight and extraction machinery, not a client-side LLM
client. The fabricated registry seed is removed; an empty wiki is a real empty
state.

## D011 — Wiki compilation runs in the service; drafts are review-gated

**Status:** accepted (2026-09-05)

Draft compilation reuses the Fractorches service's generation machinery (the
same generate abstraction insights uses) via two new endpoints:
`GET /api/v1/wiki/compile/status` reports only availability it has probed
(configured OpenAI-compatible endpoint or insight agent CLIs found on PATH),
and `POST /api/v1/wiki/compile` compiles a caller-selected cluster of recall
entries read-only. No model client, key handling, or prompt logic exists in
the Svelte client. The compile handler rejects unknown and archived/superseded
entry ids and prompts for per-claim `[recall:<id>]` citations with explicit
"(unverified)" markers, so grounding survives into the draft text. The
handler persists nothing: a draft becomes a private local article only after
the user reviews its markdown, provenance, and type and saves it. Saved
drafts record `compiledFrom` and `compiledAt`, and the freshness check
reports fresh, stale (naming the changed entries), or untestable — it never
claims fresh from partial visibility.


## D012 — The notes vault index is a local Rust/SQLite derived cache

**Status:** accepted

A vault is a user-chosen folder of markdown. Its index — what files exist, and
later what they say and link to — is SQLite with FTS5, opened by the Tauri Rust
core and stored in the app data directory.

**Not Fractorches.** D001 makes the Go service canonical for *agent session*
data: sessions, transcripts, usage, recall. A notes vault is none of those. It
is private prose that must stay in the process, it needs the OS-native recursive
watcher that already lives in Rust, and it has to work with the sidecar down.
This is a scope statement, not a reversal of D001.

**Not tantivy, not a JavaScript index.** Tantivy brings its own on-disk format
and no relational side for children-of-directory or backlinks, so SQLite would
end up running beside it. A JavaScript index would sit in the same main thread
that already renders markdown synchronously, and hold the whole vault in the
webview heap.

**The index is disposable; the vault is not.** Every row can be rebuilt by
reading the markdown again, which is what makes it correct to drop and rebuild
on a schema change rather than migrate — visibly, never silently. The vault
itself is opened read-only in every path: `read_dir`, `metadata`, `read`. No
write, rename, create or delete against a vault path exists in the module, and
no dotfolder is created beside the user's notes.

**Consequence for the old path.** `list_folder_md_files` walked a folder, sorted
by modified time and then truncated to 50, while the UI rendered that 50 as the
folder's count. A vault replaces it for indexed folders; pinned folders keep the
old listing.

## D013 — Bound the render cache, not the number of tabs

**Decision.** Rendered HTML for open documents lives in one bounded, app-wide
LRU cache (`src/lib/renderer/renderCache.ts`) rather than on each `Tab`. The
number of tabs a user may keep open stays uncapped.

**Why.** A tab used to own its `renderedHtml` for as long as it stayed open.
Measured, a typical 4 KB note costs roughly 50 KB across `content`,
`editContent` and `renderedHtml`, so forty tabs is about 2 MB — tab *count* was
never the problem. The costs that matter are large notes (a 200 KB note renders
to roughly 600 KB of HTML, per tab), the third copy of every document in
`stores/document`, and render *time*.

A `MAX_TABS` cap would destroy user state — scroll positions and unsaved edit
buffers — to reclaim a few megabytes, which is the wrong trade against a cache
that can simply be bounded. So the cache is bounded twice: twelve entries, and
four million characters, whichever binds first. Twelve entries alone would let a
dozen very large notes hold tens of megabytes; a character budget alone would
let hundreds of small notes accumulate.

Re-rendering on activation costs 5–20 ms for a typical note, which is below
notice on a tab switch, and the twelve most recent entries cover the documents
actually being moved between.

**Consequences.**

- `Tab.renderedHtml` is gone; read a tab's HTML with `renderOf(tab)`.
- `Tab.editContent` is `string | null` and holds a buffer only while an edit is
  in progress, rather than duplicating `content` for every open tab.
- `stores/document` is `derived` over the tab store instead of a writable that
  every caller set alongside `tabStore.addTab` with the same values. That third
  copy is what `notesState.currentMarkdown()` used to work around; the two can
  no longer disagree because there is only one.
- Cache keys are `path + FNV-1a(content)`, so an edited or externally changed
  document misses rather than serving HTML for text that is no longer there.
- "Close others" replaces a tab cap. It keeps tabs with unsaved edits, because
  closing them would discard work without asking.

## D014 — Autosave writes on a byte comparison, never on a timer

**Decision.** Edits to a document that already has a location are written to
disk as they are made (800 ms after the last keystroke, and at least every 4 s
during unbroken typing). Whether a change reported by the watcher was our own
write is decided by comparing the file's contents against the tab — never by a
time window.

**Why the comparison.** The watcher previously ignored any `file-changed` event
that arrived within 1.5 s of a save, on the assumption it was the echo of that
save. That heuristic fails in both directions: a slow event arriving after the
window caused a spurious reload, and a genuine external write landing just after
a save was swallowed. With autosave firing every few seconds, a 1.5 s window
would suppress almost every external change there is. `resolveExternalChange`
replaces it with three cases decided on the bytes — ignore, adopt, conflict —
and is a pure function with its own tests, because it is the whole safety
argument for writing the user's files unprompted.

**What autosave refuses to do.**

- **Write a document with no location.** New, pasted and fetched documents stay
  on Cmd+S. The alternative is a file dialog opening mid-keystroke, which is a
  worse outcome than not saving.
- **Write over a file that changed underneath the edit.** When disk and an
  unsaved draft disagree, the tab is marked conflicted, autosave stops for that
  file, and both versions are held until the user picks one. Nothing is merged
  and nothing is chosen for them. Autosave without this is a way to destroy
  whatever a sync client or a git checkout had just written.
- **Claim success after a failed write.** The tab stays dirty and the error is
  shown against that document. It is not retried on a timer — a read-only file
  would retry forever — but the next edit tries again.

**Consequences.**

- One write path, `writeDraft`, shared by Cmd+S and autosave, so an explicit
  save and a background one cannot write different things.
- Autosave is a setting (default on). Off restores exactly the previous
  behaviour.
- Switching to a tab re-reads its file once, because nothing was watching it
  while it sat in the background. The same byte comparison applies, so an
  unchanged file costs one read.
