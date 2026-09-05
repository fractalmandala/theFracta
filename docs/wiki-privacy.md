---
title: Wiki privacy boundary
description: Contract separating private wiki articles and transcripts from anything committed.
tags:
  - privacy
  - wiki
---

# Wiki Privacy Boundary

This document defines the boundary between what lives in the public
`theFracta` repo and what lives only on your machine. It is the
**source-of-truth contract** for the wiki ingester, the registry, and
every future agent that touches the wiki.

## The rule

> **A wiki entry's *content* is public. Its *citations* are
> machine-local. Its *raw transcripts* never leave your disk.**

The boundary is enforced at three layers — git, build, runtime — so
that even a careless commit, a sloppy script, or a misconfigured agent
cannot leak transcript bytes into the public repo.

## Amendment 2026-09-05 (decision D010): private by default

Phase 1 of the wiki implementation changed the default boundary. Wiki
articles are **private user data** and are never committed:

- The article store lives in the app folder's Git-ignored `wiki/`
  directory. The desktop shell resolves it as the `FRACTA_WIKI_ROOT`
  override, then the in-app `wiki/` directory, then `~/.fracta/wiki`.
- The fabricated in-source registry seed was removed. There is no
  committed `registry.json` and no committed `entries/` directory.
- The machine-local chat corpus is the Fractorches service archive,
  read through its recall HTTP API, not a locally built JSONL store.
- The "published to the repo" flow below is retired. The chat-ref and
  snippet-budget rules remain the contract for any future, explicitly
  user-initiated publication flow; nothing is published automatically.

Draft compilation (decision D011) sends the selected recall entries'
distilled bodies to the generation path configured in the Fractorches
service — the same boundary the service's recall extraction and insights
already operate under. The compile handler is read-only over the archive and
persists nothing; the reviewed draft lands only in the Git-ignored article
store. No article content, transcript, or corpus data is committed or
published by compiling.

The remaining sections keep their original text where they describe the
chat-reference structure, snippet budgets, guard lists, and the
shareable article form; they apply from the moment an explicit publish
step exists.

## What lives where

### Committed app source

The wiki module UI and its state code live here. Under the 2026-09-05
amendment, the registry and article entries are **not** committed; they
belong to the machine-local store below.

| Asset | Lives in | Format |
| --- | --- | --- |
| Wiki module UI | `src/lib/modules/wiki/` | Svelte |
| Wiki state + types | `src/lib/wiki/` | TypeScript |

### Machine-local (only on your machine, never committed)

| Asset | Lives in | Format |
| --- | --- | --- |
| Wiki article store (entries as markdown) | `<app>/wiki/entries/<id>.md` (Git-ignored) | Markdown with frontmatter |
| Chat corpus (normalized, queryable) | Fractorches service archive | Recall HTTP API `/api/v1/recall/entries` |
| Source transcripts (read-only) | Fractorches-managed provider directories | JSONL/SQLite (untouched) |
| Per-chat extracted snippets for cited entries | `~/.fracta/wiki/snippets/<entry-id>/<chat-ref>.txt` | Text files, ≤ 2 KiB each |
| Local chat-ref resolver index | `~/.fracta/wiki/index.sqlite` | SQLite |
| Ingest cache (rebuilt on demand) | `~/.fracta/wiki/cache/` | JSON |

The chat corpus is never under a path that git can reach; the wiki
module reads it only through the Fractorches service API. The article
store sits inside the app folder but is excluded by `.gitignore`, so
article files are never tracked (decision D010).

## The chat reference model

Every wiki entry carries a list of `chat_refs`. Each chat_ref is an
**opaque, stable identifier** the ingester assigns at ingest time, *not*
the source system's session id. The mapping from chat_ref → source session
lives only in the local index.

A chat_ref has three components:

```
chat_ref := "<agent>:<ingest-time-uuid>"  // stable, opaque
```

- `<agent>` — one of `claude`, `codex`, `gemini`, `qoder`,
  `commandcode`, `antigravity`, `opencode`, `cursor`, etc.
  (the canonical `AgentType` from `fractalstyler2/parser/types.go`)
- `<ingest-time-uuid>` — a v4 UUID assigned when the source session
  was first ingested. The same source session always yields the same
  chat_ref across re-ingest runs (the index stores the mapping).

No path, no project name, no cwd, no machine id, no timestamp appears
in a chat_ref. A chat_ref is a pointer — not a key.

## The snippet budget

A wiki entry may include quoted snippets from cited chats. The
budget per entry:

| Limit | Value |
| --- | --- |
| Total quoted bytes per entry | ≤ 16 KiB |
| Maximum snippet length per chat_ref | ≤ 2 KiB |
| Maximum snippets per chat_ref | ≤ 3 |

These caps are enforced at *ingest time*. If an entry builder would
overflow them, the ingester down-samples snippets to the most
representative ones, never silently exceeds the cap.

Snippets live in `~/.fracta/wiki/snippets/<entry-id>/`. Snippets are
git-ignored *by file location* (they are not in the working tree),
and the wiki module reads them through an explicit OS path the user
configures.

The wiki entry's body in the repo refers to a snippet by `<agent>:<uuid>:<offset>`. The module joins that with the local snippet file
*only when rendering for the local user*. **The repo file contains
the citation pointer, never the quoted bytes.**

## What committed files must never contain

A single guard list, kept short on purpose:

1. Any path under `~/` (i.e. anything beginning with `/Users/<name>/`)
2. Any session id, transcript uuid, or other opaque-source-system id
3. Any token, cost, model id, or usage figure
4. Any host name, ip, machine name, or path outside the working tree
5. Any content that resembles a chat turn verbatim (`Human:`, `Assistant:`,
   `<ide_selection>`, `tool_use_result`, tool names with argument JSON,
   `"content": "` followed by more than 200 characters)

The `scripts/check-privacy.sh` script enforces this list on every
pre-commit and on every CI push. Items 1-4 are checked by grepping
the diff. Item 5 is checked by an entropy heuristic on any blob over
4 KiB.

## What the agent sees (operating contract)

When an agent (Claude, Codex, Gemini, Qoder, …) enters the wiki
module, the contract is:

1. The agent sees the **registry** (entry titles, types, statuses, tags).
2. The agent sees the **entry body** for any entry the user opens.
3. The agent sees **chat_ref lists** in each entry's frontmatter.
4. The agent sees **the snippet file paths**, but **not the snippet
   contents** unless the user explicitly clicks a "load snippets"
   action — and even then, only the snippets cited by the entry the
   user opened.
5. The agent **never** sees the source session id, the path to the
   source file on disk, or any byte of the source transcript that is
   not in an explicitly-cited snippet.

This is enforced at the wiki module's UI layer: the snippet loader
is a per-entry button, not a global "load all snippets" toggle.

## What gets published vs what stays local — concrete examples

### Published (in repo)

```yaml
---
id: fractalstyler2-shell-canon
type: pattern
status: stable
title: Use canonical shells per page type
summary: Pick .page-split, .page-shell, .docs, or .app-shell
        before composing any layout.
chat_refs:
  - claude:8f4a2e91-1c3d-4e8a-9a2b-1c4d5e6f7a8b
  - codex:b2c3d4e5-f6a7-8901-2345-6789abcdef01
tags: [layout, fractalstyler2, patterns]
created_at: 2026-08-15T10:23:00Z
updated_at: 2026-08-30T14:11:00Z
---

# Use canonical shells per page type

The four canonical shells from fractalstyler2 cover most page types:

- `.app-shell` — fixed app chrome with header, main, footer
- `.page-split` — sidebar + main with `.page-sidebar` /
  `.page-main` canonical children
- `.page-shell` — clean open page, single padded column
- `.docs` — three-pane docs layout with retractable rails

[sources at git refs /chat-refs/claude:8f4a2e91-...]
```

### Machine-local (not in repo)

```
# ~/.fracta/wiki/snippets/fractalstyler2-shell-canon/claude-8f4a2e91.txt
#
# Excerpt from claude:8f4a2e91 (session 3rd turn)
#
# Quoted text:
#
#   "The four shells — app-shell, page-split, page-shell, docs — map to
#   most layouts we actually need. Once you pick the shell, the rest is
#   composing inside it."
#
# Snippet bytes: 187
# Snippet hash (sha256): 4e7c...c2
# Source session: local-only (chat_ref, never the system id)
# Snippet is read by the wiki module at render time only.
```

## The ingest pipeline (what runs on your machine only)

```
[ agent sources ]                [ machine-local ]
                                  ┌─────────────────────┐
 ~/.claude/projects/  ──┐         │  ~/.fracta/wiki/      │
 ~/.codex/sessions/    ──┤         │   ├── corpus/         │
 ~/.gemini/...         ──┼────────▶│   ├── snippets/       │
 ~/.qoder/projects/    ──┤         │   ├── index.sqlite    │
 ~/.commandcode/...    ──┤         │   └── cache/          │
 ~/.cursor/projects/   ──┤         └─────────────────────┘
 ~/.opencode/storage/  ──┘                    │
                                              │  ingest-time caps
                                              │  redaction, dedupe
                                              │  snippet extraction
                                              ▼
                                  ┌─────────────────────┐
                                  │  wiki registry +     │
                                  │  entry markdown      │
                                  │  (PROPOSED state)    │
                                  └─────────────────────┘
                                              │
                                              │  user review/approve
                                              ▼
                                  ┌─────────────────────┐
                                  │  theFracta repo      │  ← git push
                                  │  src/lib/wiki/       │     (PUBLIC)
                                  │  src/lib/modules/    │
                                  │     wiki/            │
                                  └─────────────────────┘
```

The pipeline runs as a Tauri command (so it ships with the app), gated
behind a settings toggle. It never auto-runs. It never runs in CI.

## The git hook contract

A pre-commit hook at `.githooks/pre-commit` runs `scripts/check-privacy.sh`.
It refuses the commit if any staged file matches the guard list above.

A `post-merge` hook on the public `theFracta` repo runs the same
script and alerts (does not block, because the merge already
happened — but the operator sees the alert and can revert).

## The "I want to share a wiki entry with someone" flow

1. The wiki entry is already in the repo. It is shareable as-is — it
   contains no transcript bytes.
2. If the recipient wants to see *why* this entry exists, they need
   the snippets. The repo does not carry them.
3. The recipient runs `fracta wiki ingest --from <chat-pack.tar>`
   against their own chats (or against a shared, *redacted* chat pack
   the sender prepared), and the entry's `chat_refs` list resolves
   against *their* local index.

This means a wiki entry is *portable but contextually anchored*: the
narrative travels with the entry, the evidence stays with the owner.

## What this rule prevents

- Pushing a commit that accidentally includes a 2 MiB `transcript.jsonl`.
- An agent reading `~/.claude/projects/*` and quoting a verbatim
  message into a wiki entry.
- A future contributor copying snippets into the entry body "for
  convenience".
- A scanner finding `~/.claude/projects/` in a debug log and writing
  it to `stdout`.
- A `pnpm run build` pulling a corpus file into the bundle.
- A wiki entry quoting secrets because the source chat contained them.

## What this rule does not prevent

It does not prevent *you* from publishing something intentionally.
The privacy layer is a guard against accidents and tooling bugs, not
a restriction on authorial intent. If you choose to publish a wiki
entry that references a specific chat by topic ("this happened during
the notes module rebuild"), the entry's *body* can say so — the
privacy rule says nothing about topical references, only about
*content* matching transcript bytes and paths matching your machine.

## Verifying the boundary

A single command proves the boundary holds:

```bash
pnpm run check:privacy
```

This runs:

1. `scripts/check-privacy.sh` against the staged diff
2. A grep of every tracked file for the guard list
3. A grep of the build output for the guard list
4. A check that `~/.fracta/` is not in any tracked path

If any of these fails, the script exits non-zero. CI runs the same
script.

## Open questions (left intentionally for later)

- Should snippets be encrypted at rest on the local disk? Yes,
  probably — `~/.fracta/wiki/snippets/` should sit in an
  age-encrypted directory if your disk supports it. Defer until the
  ingester exists.
- Should chat_refs be content-addressed instead of UUID-assigned?
  Yes, if the ingester is stable enough — a sha256 of the source
  session id + a salt would make chat_refs stable across
  re-ingestion even if the source id changes. Defer.
- Should wiki entries be co-authored (multiple chat_refs from
  different agents at different times)? Yes, already supported by the
  design. No additional work needed.
- Should we version wiki entries with chat history (an entry
  v1.0 → v1.1 with new chat_refs is a clean history)? Yes, the
  frontmatter `updated_at` field carries this. No additional work
  needed beyond making the registry diff-aware.
