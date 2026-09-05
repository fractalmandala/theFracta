---
title: Bench parity with AgentsView
description: Screen-by-screen gap between Fracta's Bench surface and the AgentsView dashboards, and the order to close it in.
tags:
  - observatory
  - bench
  - parity
---

# Bench parity with AgentsView

## How this was measured

AgentsView was examined running locally against its own database (1,129
sessions, 102,085 messages, 152 projects), every tab visited and its structure
recorded. Fracta's Bench was measured by component size and by the endpoints it
actually calls.

Two numbers frame the whole gap:

- **Fracta's entire Bench is 937 lines** across 17 components. The largest
  dashboard component is `CostTreemap` at 64 lines; nine of them are under 45.
  The Sessions tab alone in AgentsView carries 12 distinct sections.
- **Fracta calls 18 endpoints. The service exposes about 95.** The data for
  almost everything below already exists and is already computed by the Go
  service — nothing here needs new backend analytics.

That second point is the important one. This is not a data problem. Parity is
mostly a matter of rendering what Fractorches already returns.

## Screen by screen

### Sessions — **done**

The largest screen by far: **12 sections over ~6,800px of scroll**. Fracta's
Sessions tab now carries all twelve, in AgentsView's order.

Two figures differ from AgentsView by intent rather than by gap: `completed_rate`
is rendered as the 0–100 the service already returns (AgentsView's own
`Math.round(row.completed_rate)`), and a project the service could not attribute
is labelled *Unattributed* rather than rendered as an empty cell.

| # | AgentsView section | Fracta |
|---|---|---|
| 1 | 6 tiles: Sessions, Messages, Projects, Active Days, **Messages/Session (median + p90)**, **Concentration %** | 6 tiles matching AgentsView's set, including median + p90 messages/session and concentration |
| 2 | **Activity** — year calendar heatmap, toggled Messages / Sessions / Output Tokens | `ContributionHeatmap` — year calendar, Messages / Sessions / Output tokens |
| 3 | **Activity by Day and Hour** — bar chart plus hour × weekday heatmap; Messages/Sessions; Day/Week/Month; timezone-labelled | `HourOfWeekPanel` |
| 4 | **Top Sessions** — ranked By Messages / By Duration / By Output Tokens | `TopSessionsPanel` — By messages / duration / output tokens |
| 5 | **Projects** — horizontal bars, every project plus a rolled-up "Other (137)", with totals | `ProjectsPanel` — bars plus rolled-up Other (N) |
| 6 | **Session Shape** — length-bucket histogram (1–5, 6–15, 16–30, 31–60, 61–120, 121+); Messages / Duration / Autonomy | `SessionShapePanel` |
| 7 | **Tool Usage** — top tools with call counts, session counts and share; **By Category** (Read/Bash/Edit/Write/Grep/Glob/Task); **Weekly Trend** sparkline | `ToolUsagePanel` |
| 8 | **Top Skills** — per-skill bars with agent attribution percentages, contributing projects, session counts, last-used date | `TopSkillsPanel`, moved onto Sessions |
| 9 | **Skill Usage Over Time** — stacked series, Day/Week/Month | `SkillTrendPanel` — stacked, Day/Week/Month |
| 10 | **Velocity** — Turn Cycle p50/p95, First Response p50/p95, Msgs/Active Min, Chars/Active Min, Tools/Active Min; Overview / By Agent / By Size | `VelocityPanel` |
| 11 | **Agent Comparison** — table of ~18 agents: Sessions, Messages, Cycle p50, Msgs/min, Tools/min, Tool Calls, Top Categories | `AgentComparisonCard`, moved onto Sessions |
| 12 | **Session Health** — Avg Score + letter grade, Completed %, Errored %, Tool Failures %, Compactions; **Grade Distribution** A–F; **Outcome Distribution** stacked; **Health Trend** daily bars coloured by grade; **By Agent** and **By Project** tables | `SessionHealthPanel` — tiles, grade + outcome distribution, health trend, By agent / By project |

One structural change came with this, not just new widgets: **skills, agent
comparison and health now live on Sessions**, where AgentsView puts them, rather
than being scattered as thin cards across Trends and Quality. The five endpoints
that back sections 6–12 — `/analytics/sessions`, `/analytics/tools`,
`/analytics/skills`, `/analytics/velocity`, `/analytics/signals` — are now all
called.

### Usage — **done**

| AgentsView | Fracta |
|---|---|
| 9 tiles: Total Cost, Input Tokens, Output Tokens, **Daily Burn**, **Peak Day**, **Cache Hit %**, Projects, Models, Active Days | `UsageSummaryPanel` — the same nine, plus a Copilot-credits tile when the provider reports any |
| **Cost / Tokens** mode toggle across the whole tab | In the app header, with the token-type picker beside it in token mode |
| **Cost Over Time**, grouped by Project / Model / Agent | `UsageOverTimePanel` — stacked area, all three dimensions |
| **Cost Attribution**, treemap *or* list, by Project / Model / Agent | `UsageAttributionPanel` + `Treemap` — both views, all three, click-to-hide |
| **Top Sessions by Cost** | `TopUsageSessionsPanel`, ranked by cost or by tokens |
| **Cache Efficiency** | `CacheEfficiencyPanel` |
| **Comparative Cost Analysis** — pick two model or project slices and compare | `PairwiseComparisonPanel` |
| | `ModelBreakdownTable`, kept |

All four endpoints are now called: `/usage/summary` (with `breakdowns` and
`session_counts`), `/usage/top-sessions`, `/usage/comparison`,
`/usage/pairwise-comparison`.

Three things this reads that AgentsView's Usage screen does not surface:

- **Pricing provenance.** `/usage/summary` reports which models were priced
  from a fallback rate rather than a published one. Every cost on the screen
  depends on that, so the panel names them.
- **A zero prior period.** When the prior window had no spend, the tile says so
  instead of rendering the service's `deltaPct` of 0 as "+0%", which reads as
  "unchanged" rather than "nothing to compare against".
- **Unattributed rows** are labelled, not left blank — the same treatment the
  Sessions health tables got.

### Activity

AgentsView's Activity is a **day-scoped operational view**, not a summary:

- Date picker, plus Project / Agent / **Machine** / Session filters
- 7 tiles: Peak Concurrency (with the clock time it occurred), Active time,
  Agent-minutes, Sessions, Projects, Models, Total Cost
- **Concurrency timeline** over the day, split Interactive / Automated / Overlap
- **Sessions table**: session, model, project, agent, agent-minutes, cost, and
  the wall-clock window each occupied
- **Breakdown** by Project / Model / Agent, switchable between agent-minutes and
  cost

Fracta's `ActivityView` is 45 lines. Unused: `/activity/report`,
`/activity/report/{id}/sessions`, `/machines`.

### Trends — *not the same feature*

AgentsView's Trends is a **term-frequency tool**: type terms one per line, and
it charts how often they appear over time, grouped by week, optionally
normalised by message count, with a term/count table.

Fracta's Trends tab shows `TopSkillsCard` — a different thing entirely. The
endpoint `/trends/terms` is unused. This is the one tab where parity means
*building the actual feature*, not extending an existing one.

### Quality

The richest screen in AgentsView, and the widest gap:

- **Deterministic Recommendations** — rule-based cards, each naming how many of
  the 973 sessions match ("272 of 973 sessions have this deterministic
  pattern"), with **Next Actions** and **Scored Facts** as sibling views
- **Quality Patterns**: Average Score with letter grade, Scored Sessions (and
  how many are unscored), Low Quality count, Prompt Signals
- **A–F distribution bar** across all scored sessions
- Four dimension panels — **Prompt maturity, Context health, Workflow hygiene,
  Tool reliability** — each with affected counts, four to five sub-metrics with
  per-metric session counts and incompleteness caveats, a score-pressure
  sparkline, and comparison groups

Fracta has `QualityDashboard` (61 lines) and `AgentComparisonCard` (29).
Unused: `/analytics/signals`, `/analytics/signal-sessions`.

### Trash — missing entirely

AgentsView has a Trash tab. Fracta's surface switcher has no such tab and
`/trash` is never called. Sessions can therefore be deleted with no way to see
or restore them.

### Recall, Pinned, Recent Edits, Data

Present on both sides, thin on Fracta's (23–41 lines each). AgentsView adds
**Extraction status** to Recall, and project rules and reclassification
candidates to Data (`/data/project-rules`,
`/data/project-reclassification/candidates`).

## Chrome and per-session actions

Beyond the dashboards, AgentsView's shell carries several things Bench does not:

- **Search across sessions** (⌘K), and `/search/content` for full-text
- **Sync** control with live progress ("Syncing 63% (52/82)") — Bench shows sync
  state in its footer but cannot start one
- **Import** (ChatGPT, Claude.ai) and **Export CSV**
- **Machine** and session-scope filters, and **starred** sessions
- Per-session actions with endpoints already present and entirely unused:
  `open`, `resume`, `rename`, `star`, `export`, `publish`, `children`,
  `tool-calls`, `timing`, `directory`

## Order of work

Sized by what each phase delivers on its own, not by screen order.

| Phase | Work | Why here |
|---|---|---|
| **1** | ~~Usage tiles + Cost Over Time + Top Sessions by Cost~~ **Done**, and carried past its original scope to the whole screen. | Usage was the emptiest screen against the richest data. `/usage/summary` alone fills nine tiles. |
| **2** | ~~Sessions: calendar heatmap, hour-of-week, ranking toggles, projects chart~~ **Done**, and carried past its original scope to all 12 sections. | Highest visible density per unit of work; all four endpoints already returned the shapes. |
| **3** | Activity as a day-scoped view: concurrency timeline, sessions table, breakdown | The largest single behavioural gap, and the only one needing a new filter (machine). |
| **4** | Quality: recommendations, grade distribution, the four dimension panels | Most valuable, most work. Needs care with the "N of M sessions" and incompleteness caveats — those are data-integrity claims, not decoration. |
| **5** | Trash tab, and Recall extraction status | Trash is a correctness gap: deletion with no recovery path. |
| **6** | Trends as term-frequency; per-session actions; search across sessions | Genuinely new features rather than parity of an existing view. |

## Constraints this must respect

- **Every figure is read, never inferred.** AgentsView labels unscored sessions,
  incomplete metrics and empty ranges explicitly. AGENTS.md requires the same:
  an absent value is an em dash, never a zero, and a partial computation says
  what it is missing.
- **Fracta's Fractorches is its own instance** (D012 and the sidecar's own data
  directory), so its numbers will not match AgentsView's — Fracta's database
  ingests separately. Any comparison of the two is a comparison of two datasets.
- The contract's class registry applies to every new chart and table; genuine
  gaps go to `_09_canonical_candidates.sass`.
