# Implementation Plan v1: Agentic Recruiter — Static Frontend

> **Status**: Superseded by v2 (Backend)  
> **Date**: 2026-04-16  
> **Decisions Made**:
> - Agent handoff: Sequential (QRecruiter → Qinterviewer → Qalana Engage)
> - Code editor: HackerRank style
> - Charts: Chart.js
> - Consent portal: Different visual theme (light, consumer-friendly)

## Overview

Build a **static frontend prototype** (HTML/CSS/JS) for the **Agentic Recruiter (Qalana)** platform — an **agent-centric recruiting system** powered by three autonomous AI agents that handle the entire candidate pipeline end-to-end.

The documentation in `Docs/` provides **background architecture and ideation** (data sovereignty, compliance, inference knowledge). The static build should showcase the **three agents as the primary experience**, with the architectural concepts (ephemeral enrichment, consent gate, Master Cases) surfacing naturally within the UI.

---

## The Three Agents (Product Core)

| Agent | Function | Key UI Surface |
|-------|----------|----------------|
| **QRecruiter** | Voice AI phone/WhatsApp screening | Call dashboard, live call view, call summaries |
| **Qinterviewer** | Video interview + code proctoring | Interview room, rubric scoring, code editor |
| **Qalana Engage** | Candidate engagement & outreach | Campaign manager, ghosting alerts, engagement timeline |

### Sequential Agent Handoff Flow

```
QRecruiter (Voice Screening)
    ↓ Pass
Qinterviewer (Technical Assessment)
    ↓ Pass
Qalana Engage (Candidate Communication)
    ↓ Offer
Hired
```

At any stage, a failure or grey-zone confidence score triggers HITL escalation.

### The Binding Architecture (From Docs)

| Concept | Where It Shows in UI |
|---------|---------------------|
| **Ephemeral Enrichment** | Candidate profile cards showing "In Memory" vs "Persisted" status |
| **Consent Gate** | Candidate-facing portal + consent status badges throughout |
| **Master Cases** | Job config wizard (defines what the agents evaluate against) |
| **HITL Escalation** | Escalation queue when agent confidence drops |
| **Triple-Layer Validation** | Dossier view showing Rule ✓ / Semantic ✓ / LLM Judge ✓ |
| **Data Sovereignty** | Purge/anonymization audit log |

---

## Proposed Architecture

```
Agentic-Recruiter/
├── Docs/                              # (existing) background docs
├── index.html                         # Landing / Login
├── pages/
│   ├── dashboard.html                 # Command center — all 3 agents at a glance
│   ├── qrecruiter.html                # QRecruiter: Voice screening dashboard
│   ├── qrecruiter-call.html           # QRecruiter: Individual call view
│   ├── qinterviewer.html              # Qinterviewer: Interview sessions list
│   ├── qinterviewer-session.html      # Qinterviewer: Live interview room (HackerRank-style)
│   ├── engage.html                    # Qalana Engage: Campaign & outreach hub
│   ├── engage-candidate.html          # Qalana Engage: Individual engagement timeline
│   ├── candidates.html                # Unified candidate pipeline (cross-agent)
│   ├── candidate-dossier.html         # Individual candidate dossier
│   ├── jobs.html                      # Job listings
│   ├── master-case-builder.html       # Master Case creation wizard
│   ├── escalations.html               # HITL escalation queue
│   ├── telemetry.html                 # Agent telemetry & observability (Chart.js)
│   ├── consent-portal.html            # Candidate-facing consent gate (light theme)
│   ├── purge-audit.html               # Anonymization & data purge log
│   └── settings.html                  # Employer config, ATS integrations
├── css/
│   ├── design-system.css
│   ├── components.css
│   └── pages.css
├── js/
│   ├── app.js
│   ├── mock-data.js
│   ├── components.js
│   └── charts.js
└── assets/
    ├── icons/
    └── images/
```

**17 pages total.**

---

## Design Decisions

- **Agent Colors**: 🔵 QRecruiter (blue), 🟣 Qinterviewer (purple), 🟢 Engage (green)
- **Dark mode** for recruiter-facing pages
- **Light mode** for candidate consent portal
- **Chart.js** for all data visualizations
- **HackerRank-style** code editor in Qinterviewer sessions
- **Ephemeral/Persisted badges** throughout to show data lifecycle

---

*This document is preserved for reference. Active development follows v2 (Backend).*
