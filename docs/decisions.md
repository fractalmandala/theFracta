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
