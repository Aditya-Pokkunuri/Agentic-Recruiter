# Implementation Plan v3: Agentic Recruiter — Static Client Demo

> **Date**: 2026-04-16  
> **Type**: Static Frontend (HTML/CSS/JS — zero dependencies)  
> **Purpose**: Clickable prototype for client presentation  
> **Predecessor**: v1 (too vague), v2 (massively over-scoped for a demo)

---

## What This Is

A **visual, clickable demo** — not production code. Every page uses **hardcoded mock data** to walk a client through the three-agent recruiting pipeline. No backend. No database. No API calls. Just a polished story you can open in a browser.

## What This Is NOT

- ❌ Not a backend
- ❌ Not a production system
- ❌ Not an MVP
- ❌ Not code that ships to users

The v2 backend plan is preserved for when the client says "build it."

---

## Pages — Only What the Client Needs to See

### Stripped to 9 essential pages (down from 17 in v1, 27 endpoints in v2):

```
Agentic-Recruiter/
├── index.html                         # Login / Landing
├── pages/
│   ├── dashboard.html                 # Agent Command Center
│   ├── qrecruiter.html                # QRecruiter: Voice screening demo
│   ├── qinterviewer.html              # Qinterviewer: Interview + code assessment demo
│   ├── engage.html                    # Qalana Engage: Outreach & ghosting demo
│   ├── candidate-pipeline.html        # Cross-agent candidate pipeline
│   ├── candidate-dossier.html         # Single candidate deep-dive
│   ├── consent-portal.html            # Candidate consent experience (light theme)
│   └── escalation.html               # HITL escalation queue demo
├── css/
│   ├── design-system.css              # Design tokens, fonts, colors
│   └── styles.css                     # All component + page styles (single file is fine for 9 pages)
├── js/
│   ├── app.js                         # Simple router + nav
│   ├── data.js                        # ALL mock data in one file
│   └── charts.js                      # Chart.js visualizations
└── assets/
    └── icons/                         # Minimal SVG icons
```

### Why These 9 and Not Others

| Page | Why it's in | Client question it answers |
|------|-------------|---------------------------|
| **Login** | First impression | "What does it look like?" |
| **Dashboard** | Shows the 3-agent system at a glance | "How does the whole thing work?" |
| **QRecruiter** | Demonstrates voice AI screening | "How does AI phone screening work?" |
| **Qinterviewer** | Demonstrates technical assessment | "How do you assess candidates technically?" |
| **Engage** | Demonstrates engagement automation | "How do you keep candidates warm?" |
| **Pipeline** | Shows candidates moving through stages | "Where are my candidates right now?" |
| **Dossier** | Shows evaluation quality + evidence | "Can I trust the AI's judgment?" |
| **Consent Portal** | Shows compliance story | "Is this legally defensible?" |
| **Escalation** | Shows human control | "What happens when AI gets it wrong?" |

| Page from v1/v2 | Why it's CUT | 
|-----------------|-------------|
| Jobs listing | Client doesn't need to see CRUD |
| Master Case Builder | Too detailed for a demo — explain verbally |
| Telemetry dashboard | Internal ops — not a client concern |
| Purge/Audit log | Compliance detail — mention, don't demo |
| Settings | Boring config — skip entirely |
| Separate call/session detail | Fold into the agent pages |

---

## Page-by-Page Spec

### 1. `index.html` — Login

- Qalana branding, animated gradient background
- Glassmorphism login card
- "Login as Recruiter" button (auto-enters demo)
- Tagline: "Your Expert-Grade Recruiting AI"
- No actual auth — just routes to dashboard

---

### 2. `dashboard.html` — Agent Command Center

This is the **money shot**. Client sees this and immediately understands the product.

**Layout:**
- **Top row**: 3 agent cards side-by-side
  - 🔵 **QRecruiter**: "12 calls today · 83% pass rate · 2 live now"
  - 🟣 **Qinterviewer**: "5 interviews completed · Avg score 78% · 1 in progress"
  - 🟢 **Qalana Engage**: "34 candidates engaged · 2 ghosting alerts · 91% reply rate"
- **Middle**: Sequential pipeline visualization
  ```
  Source → [QRecruiter Screen] → [Qinterviewer Assess] → [Engage] → Hired
     42        28 passed             18 passed              12 engaged    4 hired
  ```
- **Bottom**: Live activity feed (mock real-time events from all 3 agents)
- **Sidebar**: Navigation to all pages

---

### 3. `qrecruiter.html` — Voice Screening Demo 🔵

**What the client needs to see:**
- A list of completed screening calls with outcomes
- One "expanded" call showing:
  - Candidate name, role, duration, channel (Phone/WhatsApp)
  - Structured summary: Q&A format of key screening answers
  - Consent status: "Verbal consent obtained ✓"
  - AI confidence: 82% (Green tier)
  - **"What was destroyed"** section: Greyed out items — "Full transcript 🗑️", "Raw audio 🗑️", "LLM reasoning 🗑️"
  - Next step: "→ Routed to Qinterviewer"
- Screening stats: calls today, avg duration, pass rate

**Story it tells**: "The AI calls candidates, screens them, saves only a structured summary with consent, and destroys everything else."

---

### 4. `qinterviewer.html` — Technical Assessment Demo 🟣

**What the client needs to see:**
- List of completed interview sessions
- One "expanded" session showing:
  - **Split view**: Left = simulated interview area (candidate avatar + transcript excerpt), Right = code editor (HackerRank style, dark theme, syntax-highlighted mock code)
  - **Rubric scores**: 4 category gauges (Communication: 7/10, Technical Depth: 9/10, Problem Solving: 8/10, Culture Fit: 6/10)
  - **Recommendation**: "Strong Hire" badge
  - **Code assessment**: Language (Python), 4/5 test cases passed, quality score 87%
  - **"What was destroyed"**: "Video stream 🗑️", "Raw transcript 🗑️", "LLM reasoning 🗑️"
  - **What persisted**: Rubric scores ✓, Recommendation ✓, Code submission ✓

**Story it tells**: "AI conducts technical interviews with live coding, gives structured rubric evaluations, and destroys the video/transcript."

---

### 5. `engage.html` — Candidate Engagement Demo 🟢

**What the client needs to see:**
- Active outreach campaigns with charts (Chart.js):
  - Emails sent/opened/replied by seniority
  - Engagement conversion funnel
- **Ghosting alerts** ⚠️: 2 candidates flagged (silent 3+ days), with action buttons
- **Engagement timeline** for one candidate: chronological feed of touchpoints
  - 📧 Personalized email sent (senior-level tone)
  - 👀 Email opened (2 hours later)
  - 💬 Reply received
  - 📞 QRecruiter call scheduled
  - ⚠️ No response for 4 days → Alert to recruiter
- **"What was destroyed"**: "Draft email content 🗑️", "LLM generation context 🗑️"

**Story it tells**: "AI manages all candidate communication, detects ghosting, and never stores the drafts."

---

### 6. `candidate-pipeline.html` — Cross-Agent Pipeline

- **Kanban board**: Columns = Sourced → Screened → Interviewed → Engaged → Offered → Hired
- Each card: Name, match score bar, confidence tier badge (Green/Amber/Red), which agent touched them last, data status chip ("Ephemeral" shimmer / "Consented" solid)
- Clicking a card → navigates to dossier
- **Key callout banner**: "Candidates in 'Sourced' are enriched in volatile memory only. Data persists only after consent."

**Story it tells**: "You can see every candidate's journey through all 3 agents in one view."

---

### 7. `candidate-dossier.html` — Evaluation Deep-Dive

- **Match score**: Large radial gauge (e.g., 87%, Green tier)
- **Triple-Layer Validation**: Three checkmarks — Rule ✓ | Semantic ✓ | LLM Judge ✓
- **Reasoning chain**: 
  - "Expert in React" → evidence: github.com/user/repo → Status: ✅ Verified
  - "Led team of 8" → evidence: LinkedIn reference → Status: 🔶 Inferred
  - "AWS certified" → evidence: none → Status: ❌ Ungrounded (stripped)
- **Agent Summary Accordion**:
  - QRecruiter: Call outcome, key answers
  - Qinterviewer: Rubric scores, code result
  - Engage: Engagement timeline, health score
- **Consent panel**: Scopes granted, what's ephemeral vs persisted

**Story it tells**: "Every AI decision is grounded in evidence. You can see exactly why the AI rated this candidate."

---

### 8. `consent-portal.html` — Candidate Consent Experience

**Different visual theme**: Light mode, warm colors, consumer-friendly design.

- **"What Qalana knows about you"**: Transparent list of data points with source
- **Edit/Remove**: Candidate can correct or delete items
- **Scope checkboxes**: What they're agreeing to share
- **Plain-language explanation**: "Your data is processed in temporary memory. Nothing is saved until you agree."
- **Compliance badges**: GDPR, DPDP Act, EU AI Act
- **"Revoke All"**: Big red button

**Story it tells**: "Candidates are in full control. This is legally bulletproof."

---

### 9. `escalation.html` — HITL Escalation Queue

- Queue of 3–4 mock escalations
- Each shows:
  - Source agent (QRecruiter / Qinterviewer / Engage)
  - Risk level badge (HIGH / MEDIUM)
  - Reason: "Candidate salary expectation exceeds budget by 25%"
  - **3-bullet AI summary**: Concise context for the recruiter
  - Actions: "Respond" / "Take Over" / "Dismiss"
- One escalation expanded to show the response flow

**Story it tells**: "The AI knows when to stop. Humans stay in control."

---

## Design System (Minimal but Premium)

```css
/* Agent signature colors */
--qrecruiter:    #3b82f6;  /* Blue */
--qinterviewer:  #8b5cf6;  /* Purple */
--engage:        #10b981;  /* Green */

/* Confidence tiers */
--tier-green:    #22c55e;  /* >75% */
--tier-amber:    #f59e0b;  /* 60-75% */
--tier-red:      #ef4444;  /* <60% */

/* Base */
--bg-primary:    #0a0e27;  /* Deep navy */
--bg-card:       rgba(255,255,255,0.05);  /* Glassmorphism */
--text-primary:  #f1f5f9;
--font:          'Inter', sans-serif;
```

- Dark mode for recruiter pages
- Light mode for consent portal
- Glassmorphism cards
- Micro-animations on hover/transition
- Chart.js for all data visualizations

---

## Mock Data (One File: `data.js`)

All hardcoded. Minimal but realistic:

- 3 agent status objects
- 5 QRecruiter calls (1 expanded with full summary)
- 3 Qinterviewer sessions (1 expanded with rubric + code)
- 2 Engage campaigns + 1 candidate timeline
- 8 pipeline candidates across stages
- 2 full dossiers with reasoning chains
- 4 escalations
- 2 consent records
- Pipeline funnel numbers

**~200 lines of JS.** That's it.

---

## Build Order (4 phases, not 14)

| Phase | Pages | Effort |
|-------|-------|--------|
| **1** | Design system + Login + Dashboard | Foundation — proves the visual quality |
| **2** | QRecruiter + Qinterviewer + Engage | The three agent stories |
| **3** | Pipeline + Dossier + Escalation | Evaluation + human control |
| **4** | Consent Portal | Compliance story (different theme) |

---

## What's Intentionally Left Out

| Omitted | Reason |
|---------|--------|
| Jobs CRUD page | Boring — explain verbally |
| Master Case Builder | Complex wizard — save for production; use a static preview |
| Telemetry dashboard | Internal ops; client doesn't care about P99 latency |
| Purge audit log | Mention compliance verbally; show consent portal instead |
| Settings page | Config screen adds zero demo value |
| Auth system | Just a "Login" button that routes to dashboard |
| Backend API | **There is no backend.** Mock data only. |
| SOLID interfaces | **Not applicable.** This is HTML/CSS/JS, not a Python service. |
| Database schema | **Not applicable.** Data is hardcoded in `data.js`. |

---

## Verification

- Open `index.html` in browser → click through all 9 pages
- Each page loads under 1 second (no API calls)
- All Chart.js charts render with mock data
- Consent portal renders in light theme
- Pipeline kanban is scrollable and clickable
- Every confidence tier badge shows correct color
- "What was destroyed" sections are visually distinct (greyed out)
- Works at 1440px and 768px (basic responsiveness)
