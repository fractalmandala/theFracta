---
title: RepoGraph and Fractorches data stream audit
description: Evidence for the Fracta v0 authoritative data boundaries.
tags:
  - observatory
  - data-integrity
  - provenance
---

# RepoGraph and Fractorches data stream audit

## Purpose

This audit determines whether RepoGraph receives complete canonical agent data
and merely aggregates it incorrectly, or whether its ingestion is already
incomplete. The finding is both, with ingestion as the decisive architectural
fault.

## Snapshot

The comparison was made on 2026-08-29 while the RepoGraph upstream was being
changed by a separate agent. Values are evidence for the boundary decision, not
permanent golden totals.

| Measure | RepoGraph snapshot | Fractorches active archive |
| --- | ---: | ---: |
| Sessions | 693 | 1,065 |
| Messages | 64,182 | 88,361 session-count sum |
| Projects | 142 | 141 |
| Active days | 52 | 114 |

The Fractorches message table contained 87,546 normalized message rows for the
same broad last-year boundary. The small difference from its session-level sum
comes from provider-specific archive semantics; Fractorches owns and tests that
normalization.

## Ingestion findings

- RepoGraph's generated snapshot contained only OpenCode, Grok, Antigravity,
  Claude, Qoder, Codex, and one Gemini CLI record.
- The Fractorches archive also contained Cowork, Kimi Work, DeepSeek Harness,
  Kilo, CommandCode, Goose, Copilot, Cursor, Devin, Pi, Warp, and other supported
  sources.
- RepoGraph emitted 63 Qoder sessions while Fractorches had 8 canonical Qoder
  sessions, indicating duplication or incompatible inclusion rules.
- RepoGraph emitted 200 raw OpenCode database rows and relabeled 134 rows whose
  OpenCode agent was `build` as provider `grok`. Provider identity and OpenCode
  agent mode are different dimensions.
- RepoGraph saw 39 Codex sessions versus 90 in Fractorches and 87 Claude
  sessions versus 149 in Fractorches.

## Parsing and aggregation findings

- RepoGraph counted 21,930 Antigravity messages versus Fractorches' 38,170, but
  counted 24,507 Claude messages from fewer sessions versus Fractorches' 15,097.
  Source-specific definitions are not comparable.
- Several providers use fixed tokens-per-message multipliers, fixed tool-call
  ratios, hardcoded model names, or cache-token multipliers.
- Fallback expressions replace legitimate zero token or cost values with
  estimates.
- Cache savings use a single hardcoded price rather than per-model pricing.
- Daily activity assigns an entire session's messages, tokens, and cost to the
  session creation date instead of aggregating timestamped events.
- Velocity is hardcoded. Outcomes and quality grades are title/message-count
  heuristics presented alongside observed metrics.
- `top_sessions` is selected after sorting by update time even where the UI
  labels it as a message or cost ranking.

## UI findings

- The visible time-range selector does not filter the loaded payload or its
  overview aggregates.
- Project and agent selection filters the session list but not every summary
  card and chart.
- The state loader refuses to fetch again once data exists, while the UI claims
  `Live Watching`.
- The Usage view reads `active_days` although the payload emits
  `total_active_days`.
- The payload emits `peak_day` as an object while the Usage view renders it as a
  scalar, producing `[object Object]`.
- A file regenerated during an open app is not reflected until the cached state
  is discarded, explaining why screenshots and the on-disk snapshot can show
  substantially different totals.

## Preserved RepoGraph domains

The faulty Observatory pipeline does not invalidate RepoGraph's other data
surfaces:

- `registry.json` plus per-project layout, system, boundary, and health scan JSON
  remain the source for code graph views.
- the daily-log index and dated JSON files remain the source for calendar and
  browsing, commit, agent-session, and handoff timelines.

These domains are preserved in Fracta v0 with configuration, path safety, schema
validation, and truthful unavailable/error states.

## External repair update

After the audited snapshot, the agent working on RepoGraph changed its extractor
to count real conversation turns for Claude, Codex, OpenCode, and Antigravity;
added global session deduplication; included additional Codex and Qoder records;
and fixed the Peak Day and Active Days rendering mismatches. Its reported result
was 743 unique sessions with message-distribution statistics much closer to the
Fractorches reference.

Those repairs are worth retaining in the eventual UI handoff, but they do not
make the generated snapshot canonical. The direct scan still lacks provider
families retained in the Fractorches archive, cannot preserve source history
after raw files disappear, and still contains estimated or hardcoded usage,
model, cost, quality, outcome, velocity, and freshness semantics. The
authoritative-source decision below is unchanged.

## Decision

Do not repair or extend RepoGraph's direct session extractor for Fracta v0.
Replace that entire data path with Fractorches APIs and retain RepoGraph only as
the interface and JSON consumer for its distinct graph and daily-log domains.
