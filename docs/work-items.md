---
title: Work items
description: Current Fracta v0 implementation ownership and status.
tags:
  - work-items
  - orchestration
---

# Work items

| Item | Owner | Status | Dependency |
| --- | --- | --- | --- |
| Repository rules and specifications | Integrator | Complete | None |
| Fractorches service import | Service lane | Complete | Specification baseline |
| Fractapad Knowledge port and Notes workspace | Integrator | In progress; Library implemented, full acceptance pending | B18 workspace completion |
| RepoGraph provenance capture | Observatory lane | Complete | Stable local handoff |
| Observatory UI port and API adapter | Observatory lane | Integrated; gates pass | RepoGraph handoff and service import |
| Cross-source parity suite | Integrator | In progress | Observatory adapter and session filter parity |
| Full desktop acceptance (single window) | Integrator and user | In progress | View rebuilds, search fix |

No waiting item is represented by a placeholder in a delivered interface.
| Remaining Observatory view rebuilds (transcript, activity, recall, pinned, recent, heatmap) | Observatory lane | In progress | Authored stylesheets present | Search 501 fix (B11) | Observatory lane | In progress | Sidecar search worker |
