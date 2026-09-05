---
name: wiki-ingestion
description: Use when updating the Fracta wiki, distilling session history into wiki articles, "update the wiki", "ingest since last ingestion", or continuing the wiki backfill. Encodes the agent-driven distillation loop over the Fractorches session archive into the private wiki store, under the scope rulings locked 2026-09-05.
---

# Fracta Wiki Ingestion

The wiki is agent-curated: an agent browses session history, decides what is
a wiki item, and populates it. There is no HTTP extraction endpoint dependency —
the agent IS the extractor. The session archive (Fractorches) is the immutable
raw layer; the store (`wiki/entries/*.md`, git-ignored) is the compiled layer.
Human review is on-demand, not a gate. Status is `draft` when uncertain;
`stable` when the user verifies the article in conversation (the user is the
sole authority for that) or when the agent has grounded every claim on both
sides of the transcript — anything less stays `draft`.

## Scope rulings (user, 2026-09-05 — binding)

1. **Everything is in scope.** The wiki covers ALL agent-work ever: every
   project, every session with a real exchange — including worker/dispatch
   sessions (cowork and friends), which are mined for their lessons.
2. **Backfill included** down to the archive start (2025-11-11).
3. **No editorial filtering.** No "thin", "low-priority", or recency-based
   drops. If a session contains real work, it gets represented. The only
   exclusions are factual empties: sessions with no exchange (connection
   tests, 0-message husks) carry nothing to distill.
4. **One article per concept.** Iterative sessions on the same thing merge
   into a single article; `chatRefs` accumulate across all source sessions.
5. **No priority ordering.** Themes/clusters are navigation aids for finding
   articles, never build order. Build order is the chronological sweep.
6. **Order: chronological, newest → oldest**, one global stream by
   `ended_at` across all projects (user directive).

## Store contract

- Root resolution (`wiki_data_dir`): `FRACTA_WIKI_ROOT` override → repo
  `wiki/` dir (the dev location; `/wiki/` is git-ignored) → `~/.fracta/wiki`.
  The repo `wiki/` is authoritative in this workspace.
- One Markdown file per article: `entries/<id>.md`. Schema authority is
  `src/lib/wiki/entry-file.ts`. Frontmatter keys: `id` (kebab-case, ≤80
  chars), `title`, `type` (pattern|decision|concept|system|broken|recipe),
  `status` (proposed|draft|stable|stale), `summary` (single line, ≤160
  chars), `tags`, `chatRefs` (source session ids), `files`,
  `compiledFrom` (recall ids; empty for agent-curated), `compiledAt`,
  `createdAt`, `updatedAt`. Inline arrays must not contain commas inside
  items. Body is Markdown below the block.
- Task-specific one-off work lands as an article too — as a `system` article
  about what was built and decided, or `broken`/`recipe`/`concept` when the
  lesson generalizes.
- Never delete, truncate, or rewrite another article wholesale. Updates merge
  and refresh `updatedAt`; superseded claims stay, marked Outdated/Disputed
  with a date and explanation.
- `log.md` at the store root is append-only. It carries the ingestion
  watermark (the `ended_at` boundary of the contiguous processed range) and,
  when the frontier is not yet contiguous, an explicit pending-newer list.

## Ingestion loop

1. **Read access.** Prefer direct read-only SQLite on
   `~/.agentsview/sessions.db` (`sqlite3 "file:$HOME/.agentsview/sessions.db?mode=ro"`)
   for discovery and counts — the daemon is useful but flaky (it can die
   silently during session-file syncs and its port is ephemeral:
   `lsof -nP -iTCP -sTCP:LISTEN | grep fractorch`). Message content comes
   from the API (`GET /api/v1/sessions/{id}/messages?limit=…`) when the
   daemon is up, else from the provider transcript files (`file_path`).
   Transcript sources by agent: claude/cowork JSONL under ~/.claude/projects/
   (cowork runs nest deep under local-agent-mode-sessions); opencode sessions
   in ~/.local/share/opencode/opencode.db (message/part tables, role and text
   inside data JSON); antigravity conversations in per-conversation SQLite
   under ~/.gemini/antigravity/conversations/ (user turns sit in gen_metadata
   blobs as USER_REQUEST blocks — only some blobs carry them; outputs may
   also exist as .md files under ~/.gemini/antigravity/brain/<id>/).
2. **Watermark**: read the log's watermark. Only sessions newer than it are
   eligible, processed newest-first. If a pass leaves newer sessions
   unprocessed, the watermark must not move — record the pending-newer list.
3. **Per session**: read enough of the transcript to judge (user messages
   first; bounded reads, first 1000 messages cap per fetch). Extract
   candidates: decisions, patterns, recipes, concepts, system facts, failures
   + fixes, and what one-off tasks produced.
4. **Triage against the existing wiki** (grep the store, check the log):
   - *New* → create the article.
   - *Update* → merge into the existing article, refresh `updatedAt`,
     append the session id to `chatRefs`.
   - *Disputed* → keep the old claim, add a dated Disputed/Outdated note,
     cross-link.
   - *No material* → skip and log (a session with no exchange produces
     nothing; never force it).
5. **Write** with the grounding invariant: every load-bearing fact (numbers,
   dates, quotes, names) must appear verbatim in the cited session's
   transcript. If you cannot locate it, do not state its exact form —
   paraphrase and cite the ordinal, or drop the precision.
6. **Cascade**: grep the store for affected articles and update them too.
7. **Log**: append `## [date] ingest | <topic>` with sessions processed,
   articles created/updated/skipped, and the new watermark (or pending-newer
   list). Bounded passes (≤10 sessions) keep a pass reviewable.

## Article body conventions

- Cite grounding as `(user, ordinal NNNN)` / `(assistant, ordinal NNNN)`.
- An explicit `## Open` section lists what the article does not yet know.
- Never claim verified/complete — the user is the sole authority for that.

## Triggers

- "update the wiki" / "ingest" → run the loop from the watermark.
- "wiki backfill" → run repeated bounded passes newest-first until the
  watermark reaches 2025-11-11.
- Never reprocess sessions already under the watermark unless the transcript
  has grown.
