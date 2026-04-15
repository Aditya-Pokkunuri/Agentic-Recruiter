# Implementation Plan v4: Agentic Recruiter — Interactive Hosted Demo

> **Date**: 2026-04-16  
> **Type**: Interactive SPA (HTML/CSS/JS — hosted, demo credentials)  
> **Purpose**: Self-guided client demo — client logs in, explores solo, understands the entire product  
> **Key Shift from v3**: Not "painted screens." Every click works. Data flows between pages. Feels like a real app.

---

## What Changed From v3

| v3 (Static Screens) | v4 (Interactive Demo) |
|---------------------|----------------------|
| Hardcoded HTML per page | JS renders pages from structured data store |
| No connection between pages | Click a candidate in QRecruiter → see them in Qinterviewer → see their dossier |
| Fake login button | Demo credentials: `demo@qalana.ai` / `QalanaDemo2026!` |
| Static text | Filters, sorting, modals, accordions all work |
| Charts with hardcoded numbers | Chart.js reads from the same data store |
| Client needs someone to walk them through | **Client explores alone and understands** |

---

## Architecture: The "Fake Backend" Pattern

No server. No API. But data flows as if there is one.

```
┌────────────────────────────────────────────────┐
│                    Browser                      │
│                                                 │
│  ┌──────────┐   ┌───────────┐   ┌───────────┐  │
│  │  Router   │──▶│  Pages    │──▶│ Components│  │
│  │ (hash)    │   │ (render)  │   │ (reusable)│  │
│  └──────────┘   └───────────┘   └───────────┘  │
│        │              │               │          │
│        ▼              ▼               ▼          │
│  ┌──────────────────────────────────────────┐   │
│  │           DataStore (data.js)             │   │
│  │    In-memory "database" with relations    │   │
│  │    Candidates ←→ Calls ←→ Interviews      │   │
│  │    ←→ Engagements ←→ Dossiers             │   │
│  │    ←→ Escalations ←→ Consent Records      │   │
│  └──────────────────────────────────────────┘   │
│        │                                         │
│        ▼                                         │
│  ┌──────────────────────────────────────────┐   │
│  │        StateManager (state.js)            │   │
│  │    Tracks pipeline stage per candidate    │   │
│  │    Tracks agent actions & transitions     │   │
│  │    Persists to sessionStorage (survives   │   │
│  │    page refresh during demo)              │   │
│  └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **DataStore (`data.js`)**: Not a flat list of hardcoded strings. A structured, relational in-memory database where candidates link to calls, calls link to dossiers, dossiers link to escalations. When you click a candidate anywhere, the same data renders regardless of which page you're on.

2. **StateManager (`state.js`)**: Tracks user actions during the demo session. If the client clicks "Route to Qinterviewer" on a QRecruiter call, that candidate's `pipeline_stage` updates and they appear in the Qinterviewer queue. Uses `sessionStorage` so a page refresh doesn't reset the demo.

3. **Component System (`components.js`)**: Reusable render functions. The same `CandidateCard` component renders in Pipeline, QRecruiter, and Engage pages — just with different context. This ensures consistency and makes the demo feel cohesive.

---

## File Structure

```
Agentic-Recruiter/
├── index.html                         # Login page (entry point)
├── app.html                           # SPA shell (sidebar + content area)
├── css/
│   ├── design-system.css              # Tokens, fonts, colors, animations
│   ├── components.css                 # All reusable component styles
│   ├── pages.css                      # Page-specific layouts
│   └── consent-theme.css              # Light theme override for consent portal
├── js/
│   ├── data.js                        # Structured mock data (relational)
│   ├── state.js                       # Session state manager
│   ├── router.js                      # Hash-based SPA router
│   ├── components.js                  # Reusable UI component renderers
│   ├── charts.js                      # Chart.js wrapper functions
│   │
│   ├── pages/                         # Page-specific render logic
│   │   ├── dashboard.js
│   │   ├── qrecruiter.js
│   │   ├── qinterviewer.js
│   │   ├── engage.js
│   │   ├── pipeline.js
│   │   ├── dossier.js
│   │   ├── consent.js
│   │   └── escalation.js
│   │
│   └── app.js                         # App initialization + sidebar
│
└── assets/
    └── icons/                         # SVG icon sprites
```

---

## DataStore Design (`data.js`)

This is the "fake backend." Every entity is related, and every page reads from the same source.

```javascript
// data.js — Relational in-memory database

const DataStore = {

  // ─── Candidates (the core entity everything links to) ───
  candidates: [
    {
      id: "c1",
      name: "Arjun Mehta",
      role: "Senior Backend Engineer",
      email_status: "consented",          // consented | ephemeral | revoked
      pipeline_stage: "interviewed",       // sourced | screened | interviewed | engaged | offered | hired
      match_score: 0.87,
      confidence_tier: "GREEN",            // GREEN | AMBER | RED
      last_agent: "qinterviewer",
      consent_id: "con1",
      dossier_id: "d1",
      qrecruiter_call_id: "call1",
      qinterviewer_session_id: "int1",
      engage_timeline_id: "eng1",
    },
    // ... 7 more candidates across different pipeline stages
  ],

  // ─── QRecruiter Calls ───
  calls: [
    {
      id: "call1",
      candidate_id: "c1",
      date: "2026-04-15T10:30:00",
      duration_minutes: 12,
      channel: "WhatsApp",
      outcome: "passed",                   // passed | failed | escalated
      consent_obtained: true,
      confidence: 0.84,
      summary: {
        questions: [
          { q: "Walk me through your experience with distributed systems", 
            a: "Led migration of monolith to microservices at Flipkart, handling 50k TPS..." },
          { q: "How do you approach data consistency in event-driven architectures?",
            a: "I use the Saga pattern with compensating transactions..." }
        ],
        key_signals: ["Strong systems thinking", "Production-scale experience"],
        concerns: ["Hasn't worked with AWS KMS specifically"]
      },
      destroyed: ["Full conversation transcript", "Raw audio recording", "LLM reasoning trace"],
      persisted: ["Structured summary above", "Consent record", "Outcome verdict"],
      next_action: "routed_to_qinterviewer"
    },
    // ... 4 more calls
  ],

  // ─── Qinterviewer Sessions ───
  interviews: [
    {
      id: "int1",
      candidate_id: "c1",
      date: "2026-04-15T14:00:00",
      duration_minutes: 45,
      rubric: {
        communication:    { score: 7, max: 10, notes: "Clear explanations, good structure" },
        technical_depth:  { score: 9, max: 10, notes: "Deep knowledge of distributed systems" },
        problem_solving:  { score: 8, max: 10, notes: "Optimal solution on first approach" },
        culture_fit:      { score: 6, max: 10, notes: "Prefers autonomy, may need team alignment" },
      },
      code_assessment: {
        language: "Python",
        problem: "Design a rate limiter using sliding window algorithm",
        test_cases_passed: 4,
        test_cases_total: 5,
        quality_score: 87,
        code_snippet: `class SlidingWindowRateLimiter:\n    def __init__(self, max_requests, window_seconds):\n        self.max_requests = max_requests\n        self.window = window_seconds\n        self.requests = defaultdict(list)\n\n    def is_allowed(self, client_id):\n        now = time.time()\n        window_start = now - self.window\n        self.requests[client_id] = [\n            t for t in self.requests[client_id] if t > window_start\n        ]\n        if len(self.requests[client_id]) < self.max_requests:\n            self.requests[client_id].append(now)\n            return True\n        return False`
      },
      recommendation: "Strong Hire",
      destroyed: ["Video stream", "Raw transcript", "LLM reasoning trace"],
      persisted: ["Rubric scores", "Recommendation", "Code submission"]
    },
    // ... 2 more interviews
  ],

  // ─── Qalana Engage Timelines ───
  engagements: [
    {
      id: "eng1",
      candidate_id: "c1",
      events: [
        { type: "email_sent", date: "2026-04-14T09:00:00", detail: "Personalized senior-level outreach" },
        { type: "email_opened", date: "2026-04-14T11:23:00" },
        { type: "reply_received", date: "2026-04-14T14:15:00", detail: "Interested, asked about team size" },
        { type: "call_scheduled", date: "2026-04-14T14:30:00", detail: "QRecruiter call booked for Apr 15" },
        { type: "screened", date: "2026-04-15T10:30:00", detail: "QRecruiter: Passed" },
        { type: "interviewed", date: "2026-04-15T14:00:00", detail: "Qinterviewer: Strong Hire" },
      ],
      ghosting_flag: false,
      engagement_health: 0.92,
      destroyed: ["Draft email content", "LLM generation context"],
      persisted: ["Engagement events above", "Ghosting flags"]
    },
    // ... 4 more engagement timelines (including 2 with ghosting flags)
  ],

  // ─── Dossiers ───
  dossiers: [
    {
      id: "d1",
      candidate_id: "c1",
      job_id: "j1",
      match_score: 0.87,
      confidence_tier: "GREEN",
      triple_validation: { rule: true, semantic: true, llm_judge: true },
      reasoning: [
        { claim: "Expert in distributed systems", evidence: "github.com/arjun/microservice-framework", status: "verified" },
        { claim: "Led team of 12 engineers", evidence: "LinkedIn: Engineering Lead at Flipkart", status: "inferred" },
        { claim: "AWS Solutions Architect certified", evidence: null, status: "ungrounded" },
      ],
      hard_line_violations: [],
    },
    // ... 2 more dossiers (1 AMBER with violations, 1 RED)
  ],

  // ─── Escalations ───
  escalations: [
    {
      id: "esc1",
      candidate_id: "c3",
      source_agent: "qrecruiter",
      risk_level: "HIGH",
      reason: "Candidate salary expectation exceeds budget by 40%",
      summary_bullets: [
        "Candidate is a strong technical fit (82% match) for Senior Backend role",
        "Salary expectation: ₹45L vs budget ₹32L — 40% gap, non-negotiable for candidate",
        "Candidate has competing offer from Amazon with 2-week deadline"
      ],
      status: "pending",     // pending | acknowledged | resolved
      channel: "whatsapp",
      created_at: "2026-04-15T16:45:00"
    },
    // ... 3 more escalations
  ],

  // ─── Consent Records ───
  consents: [
    {
      id: "con1",
      candidate_id: "c1",
      scopes: ["pii_read", "experience_verify", "github_analysis"],
      granted_at: "2026-04-14T14:20:00",
      status: "active",
      data_held: [
        { field: "Full Name", value: "Arjun Mehta", source: "Verbal consent (QRecruiter call)", editable: true },
        { field: "Email", value: "arjun.m@gmail.com", source: "PDL enrichment", editable: true },
        { field: "GitHub", value: "github.com/arjunmehta", source: "Bright Data", editable: true },
        { field: "Current Company", value: "Flipkart", source: "PDL enrichment", editable: true },
        { field: "Years of Experience", value: "8", source: "Resume parse", editable: true },
      ]
    },
  ],

  // ─── Jobs ───
  jobs: [
    { id: "j1", title: "Senior Backend Engineer", employer: "Acme Corp", status: "active", candidate_count: 42 },
    { id: "j2", title: "Staff Frontend Engineer", employer: "Acme Corp", status: "active", candidate_count: 28 },
  ],

  // ─── Agent Status (for dashboard) ───
  agentStatus: {
    qrecruiter:   { active_calls: 2, completed_today: 12, pass_rate: 0.83, status: "active" },
    qinterviewer: { in_progress: 1, completed_today: 5, avg_score: 0.78, status: "active" },
    engage:       { candidates_engaged: 34, ghosting_alerts: 2, reply_rate: 0.91, status: "active" },
  },

  // ─── Pipeline Numbers (for funnel chart) ───
  pipeline: { sourced: 42, screened: 28, interviewed: 18, engaged: 12, offered: 6, hired: 4 },

  // ──────────────────────────────────────────────
  // QUERY HELPERS (makes pages feel dynamic)
  // ──────────────────────────────────────────────

  getCandidateById(id) { return this.candidates.find(c => c.id === id); },
  getCallsForCandidate(candidateId) { return this.calls.filter(c => c.candidate_id === candidateId); },
  getInterviewForCandidate(candidateId) { return this.interviews.find(i => i.candidate_id === candidateId); },
  getEngagementForCandidate(candidateId) { return this.engagements.find(e => e.candidate_id === candidateId); },
  getDossierForCandidate(candidateId) { return this.dossiers.find(d => d.candidate_id === candidateId); },
  getConsentForCandidate(candidateId) { return this.consents.find(c => c.candidate_id === candidateId); },
  getCandidatesByStage(stage) { return this.candidates.filter(c => c.pipeline_stage === stage); },
  getCandidatesByTier(tier) { return this.candidates.filter(c => c.confidence_tier === tier); },
  getEscalationsByStatus(status) { return this.escalations.filter(e => e.status === status); },
};
```

### Why This Structure Matters

When the client clicks **"Arjun Mehta"** anywhere in the app:
- Pipeline page → shows his kanban card at "interviewed" stage
- QRecruiter page → shows his call with full summary
- Qinterviewer page → shows his interview session with rubric + code
- Engage page → shows his full engagement timeline  
- Dossier page → shows his match score + reasoning chain
- Consent portal → shows exactly what data Qalana holds on him

**Same person, same data, every page.** This is what makes it feel real.

---

## StateManager Design (`state.js`)

Tracks demo interactions so the app feels alive:

```javascript
// state.js — Persist demo session state

const StateManager = {
  _state: {},

  init() {
    // Restore from sessionStorage if client refreshes
    const saved = sessionStorage.getItem('qalana_demo_state');
    this._state = saved ? JSON.parse(saved) : {
      authenticated: false,
      user: null,
      candidate_overrides: {},    // pipeline stage changes
      escalation_overrides: {},   // status changes (pending → resolved)
      notifications: [],          // in-app notification queue
    };
  },

  save() {
    sessionStorage.setItem('qalana_demo_state', JSON.stringify(this._state));
  },

  // ─── Auth ───
  login(email, password) {
    if (email === 'demo@qalana.ai' && password === 'QalanaDemo2026!') {
      this._state.authenticated = true;
      this._state.user = { name: 'Sarah Chen', role: 'Senior Recruiter' };
      this.save();
      return true;
    }
    return false;
  },

  // ─── Pipeline Actions ───
  advanceCandidate(candidateId, newStage) {
    this._state.candidate_overrides[candidateId] = { pipeline_stage: newStage };
    this.addNotification(`Candidate moved to ${newStage}`);
    this.save();
  },

  // ─── Escalation Actions ───
  resolveEscalation(escalationId) {
    this._state.escalation_overrides[escalationId] = { status: 'resolved' };
    this.addNotification('Escalation resolved');
    this.save();
  },

  // ─── Notifications ───
  addNotification(message) {
    this._state.notifications.unshift({ message, time: new Date().toISOString(), read: false });
    this.save();
  },

  // ─── Get effective data (base data + overrides) ───
  getCandidate(id) {
    const base = DataStore.getCandidateById(id);
    const overrides = this._state.candidate_overrides[id] || {};
    return { ...base, ...overrides };
  },
};
```

---

## Interactive Flows (What The Client Can DO)

These are the actions that make the demo feel real, not static:

### Flow 1: Full Pipeline Walkthrough
```
Login → Dashboard (see 3 agents) 
  → Click QRecruiter card → See call list → Click a call → Read summary
    → Click "View in Qinterviewer" → See interview rubric + code
      → Click "View Dossier" → See full evaluation + reasoning chain
        → Click "View Pipeline" → See this candidate in the kanban
```

### Flow 2: Escalation Handling
```
Dashboard → Click "2 Escalations Pending" badge
  → See escalation queue → Click one → Read 3-bullet summary
    → Click "Acknowledge" → Status changes to "Acknowledged"
      → Click "Resolve" → Type a response → Status changes to "Resolved"
        → Notification toast: "Escalation resolved"
```

### Flow 3: Candidate Progression
```
Pipeline page → Click candidate in "Screened" column
  → View their QRecruiter call summary
    → Click "Route to Qinterviewer" button
      → Candidate card moves to "Interviewed" column in Pipeline
        → Notification: "Arjun Mehta routed to Qinterviewer"
```

### Flow 4: Consent Exploration
```
Sidebar → Click "Consent Portal" (theme switches to light mode)
  → See list of data Qalana holds about a candidate
    → Toggle scope checkboxes on/off
      → Click "Revoke" on a field → Field gets struck through
        → Click "Revoke All" → Confirmation modal → All data marked as revoked
```

### Flow 5: Ghosting Detection
```
Engage page → See "⚠️ 2 Ghosting Alerts" banner
  → Click alert → See candidate who's been silent 4 days
    → See full engagement timeline (last contact was email 4 days ago)
      → Click "Escalate to Recruiter" → Creates escalation in queue
```

### Flow 6: Data Destruction Awareness
```
Any agent page → "What was destroyed" section is visually distinct
  → Greyed-out cards with 🗑️ icon and strikethrough text
    → Tooltip: "This data was destroyed immediately after the session ended"
      → Contrasted with "What persisted" section (solid cards with ✓ icons)
```

---

## Page Specs (Updated for Interactivity)

### Same 9 pages as v3, but every element is interactive:

### 1. `index.html` — Login
- Email + password fields
- Demo credentials: `demo@qalana.ai` / `QalanaDemo2026!`
- Wrong password → shake animation + error message
- Successful login → smooth transition to dashboard
- Session persists via `sessionStorage` (refresh doesn't log out)

### 2. Dashboard — Agent Command Center
- **3 agent cards**: Clickable → routes to that agent's page
- **Pipeline funnel chart** (Chart.js): Animated on load, numbers come from `DataStore.pipeline`
- **Live activity feed**: Scrollable, each item clickable → routes to relevant page
- **KPI strip**: Numbers pulled from `DataStore.agentStatus`
- **Escalation badge**: Shows count from `DataStore.escalations.filter(pending)`, clickable → routes to escalation page
- **Notification bell**: Shows count from `StateManager.notifications`

### 3. QRecruiter Page 🔵
- **Call list**: All calls from `DataStore.calls`, sortable by date/outcome
- **Click any call** → expands inline or routes to detail view showing:
  - Full structured summary (Q&A format)
  - Consent status badge
  - Confidence gauge
  - "Destroyed" vs "Persisted" panels
  - **"View in Qinterviewer →"** button (if outcome = passed)
  - **"View Dossier →"** button
- **Stats bar**: Numbers from `DataStore.agentStatus.qrecruiter`
- **Filter**: By outcome (Passed/Failed/Escalated)

### 4. Qinterviewer Page 🟣
- **Session list**: From `DataStore.interviews`, sortable
- **Click any session** → expands showing:
  - **Rubric gauges**: 4 animated radial gauges (Chart.js doughnut charts)
  - **Code editor panel**: HackerRank-style dark editor with syntax-highlighted code from `code_snippet`, read-only
  - Test case results: "4/5 passed" with green/red indicators
  - Recommendation badge: "Strong Hire" / "Hire" / "No Hire"
  - "Destroyed" vs "Persisted" panels
  - **"View Dossier →"** button
- **Filter**: By recommendation

### 5. Engage Page 🟢
- **Campaign overview**: Engagement stats chart (Chart.js bar chart)
- **Ghosting alerts banner**: Clickable, shows flagged candidates with "Escalate" action
- **Candidate engagement timelines**: Click any candidate → see chronological event feed
  - Each event has icon + timestamp + detail
  - Events are linked: "📞 QRecruiter call" is clickable → routes to that call
- **"Destroyed" vs "Persisted"** footer

### 6. Pipeline Page — Cross-Agent Kanban
- **6 columns**: Sourced → Screened → Interviewed → Engaged → Offered → Hired
- **Candidate cards**: Show name, match score bar, confidence tier badge, data status chip
- **Click any card** → routes to that candidate's dossier
- **Action buttons on cards**:
  - "Route to Qinterviewer" (on screened candidates)
  - "Start Engagement" (on interviewed candidates)
  - "Escalate" (any stage)
  - Actions update `StateManager` → card moves to new column
- **Filter bar**: By confidence tier, by agent, by data status

### 7. Dossier Page — Candidate Deep Dive
- **Route**: `#/dossier/:candidateId` — loads data for that specific candidate
- **Match score hero**: Large animated radial gauge (Chart.js)
- **Triple validation**: 3 checkmarks with animation
- **Reasoning chain**: Each claim is a card with evidence link + status badge
  - Verified = green, Inferred = amber, Ungrounded = red + strikethrough
- **Agent accordion**: Expandable sections for QRecruiter / Qinterviewer / Engage
  - Each section links back to that agent's page
- **Consent panel**: Shows current consent status + scopes

### 8. Consent Portal — Candidate View (Light Theme)
- **CSS switches to `consent-theme.css`** — warm, light, consumer-friendly
- **"What Qalana knows about you"**: Table from `DataStore.consents[].data_held`
  - Each row has "Edit" and "Remove" buttons that actually work (updates StateManager)
- **Scope toggles**: Actual checkboxes that toggle on/off
- **"Revoke All"**: Opens confirmation modal → marks all as revoked → visual feedback
- **Compliance badges**: GDPR, DPDP Act, EU AI Act with tooltips
- **Back to recruiter view**: Link that switches theme back to dark mode

### 9. Escalation Page — HITL Queue
- **Sortable table/cards**: From `DataStore.escalations`
- **Click any escalation** → expands inline:
  - Source agent badge (color-coded)
  - Risk level badge
  - 3-bullet summary (from data)
  - "Respond" text area + submit button
  - "Acknowledge" / "Resolve" / "Dismiss" action buttons
  - **Actions update StateManager** → status badge changes live
- **Filter**: By status (Pending/Acknowledged/Resolved), by risk level, by source agent

---

## Reusable Components (`components.js`)

```javascript
// Every component reads from DataStore, not hardcoded HTML

renderCandidateCard(candidateId)      // Used in: Pipeline, QRecruiter, Engage
renderConfidenceBadge(tier)           // Used in: Pipeline, Dossier, Dashboard
renderConsentChip(status)             // Used in: Pipeline, Dossier, Consent
renderEphemeralBadge(status)          // Used in: Pipeline, QRecruiter, Qinterviewer
renderDestroyedPanel(items)           // Used in: QRecruiter, Qinterviewer, Engage
renderPersistedPanel(items)           // Used in: QRecruiter, Qinterviewer, Engage
renderRubricGauge(category, score)    // Used in: Qinterviewer, Dossier
renderTimeline(events)               // Used in: Engage, Dossier
renderEscalationCard(escalationId)    // Used in: Escalation, Dashboard
renderMatchScoreGauge(score, tier)    // Used in: Dossier, Pipeline
renderTripleValidation(result)        // Used in: Dossier
renderCodeEditor(code, language)      // Used in: Qinterviewer
renderNotificationToast(message)      // Used in: Global
```

Every component is a **pure function**: data in → HTML out. No component knows which page it's on.

---

## Router Design (`router.js`)

```javascript
// Hash-based SPA router with parameterized routes

const routes = {
  '':                'pages/dashboard',
  'dashboard':       'pages/dashboard',
  'qrecruiter':      'pages/qrecruiter',
  'qinterviewer':    'pages/qinterviewer',
  'engage':          'pages/engage',
  'pipeline':        'pages/pipeline',
  'dossier/:id':     'pages/dossier',        // ← parameterized!
  'consent':         'pages/consent',
  'escalation':      'pages/escalation',
};

// Example: #/dossier/c1 → loads dossier page with candidate c1's data
```

---

## Design System (Same as v3)

```css
/* Agent signature colors */
--qrecruiter:    #3b82f6;   /* Blue */
--qinterviewer:  #8b5cf6;   /* Purple */ 
--engage:        #10b981;   /* Green */

/* Confidence tiers */
--tier-green:    #22c55e;
--tier-amber:    #f59e0b;
--tier-red:      #ef4444;

/* Dark theme (recruiter) */
--bg-primary:    #0a0e27;
--bg-card:       rgba(255,255,255,0.05);
--text-primary:  #f1f5f9;

/* Light theme (consent portal) */
--bg-light:      #f8fafc;
--card-light:    #ffffff;
--text-dark:     #1e293b;

/* Font */
--font:          'Inter', sans-serif;
```

- Glassmorphism cards with backdrop blur
- Micro-animations: hover effects, gauge animations, page transitions
- Chart.js with matching color palette
- Notification toasts with slide-in animation

---

## Build Phases (4 phases, unchanged)

| Phase | What | Pages | Key Deliverable |
|-------|------|-------|-----------------|
| **1** | Foundation | Login + Dashboard + Nav | Design system, router, data store, state manager. Dashboard proves all 3 agent cards + pipeline funnel work. |
| **2** | Agent Pages | QRecruiter + Qinterviewer + Engage | The three agent stories with clickable call/session/engagement details. "Destroyed" vs "Persisted" panels. |
| **3** | Evaluation | Pipeline + Dossier + Escalation | Kanban with working actions, dossier with parameterized routing, escalation with resolve workflow. |
| **4** | Compliance | Consent Portal | Light theme switch, editable consent data, revoke flow. |

---

## Hosting

Static files only. Deploy to any of:
- **Vercel** (free, instant, custom domain support)
- **Netlify** (free, drag-and-drop deploy)
- **GitHub Pages** (free, tied to repo)
- **AWS S3 + CloudFront** (if you want to stay on-brand with the AWS architecture)

Client gets: `https://demo.qalana.ai` + credentials `demo@qalana.ai` / `QalanaDemo2026!`

---

## Verification

### Self-guided Test
1. Open the URL
2. Login with demo credentials (wrong password should fail)
3. Dashboard loads with 3 agent cards, funnel chart, activity feed
4. Click through QRecruiter → pick a call → see the summary → click "View in Qinterviewer"
5. See the same candidate's interview → rubric + code editor → click "View Dossier"
6. See the full dossier with reasoning chain → every claim has evidence
7. Go to Pipeline → see this candidate in the correct column
8. Click "Route to Qinterviewer" on a screened candidate → card moves
9. Go to Escalation → acknowledge one → resolve one → statuses update
10. Go to Consent Portal → theme switches → edit data → revoke → visual feedback
11. Refresh browser → session is preserved

### Client Experience Test
- Can a person who has **never seen this product** log in and understand what it does within 5 minutes?
- Does every click lead somewhere meaningful?
- Is the data destruction story visible on every agent page?
- Does the consent portal feel trustworthy and transparent?
