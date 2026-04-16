# Implementation Plan v4: Agentic Recruiter — Interactive Hosted Demo

> **Date**: 2026-04-16
> **Type**: Interactive SPA (React 19 + Vite 6 — hosted, demo credentials)
> **Purpose**: Self-guided client demo — client logs in, explores solo, understands the entire product
> **Key Shift from v3**: Not "painted screens." Every click works. Data flows between pages. Feels like a real app.
> **Stack**: React 19, Vite 6, React Router v7, ApexCharts, Prism.js, Lucide React, Vanilla CSS Modules

---

## What Changed From v3

| v3 (Static Screens) | v4 (Interactive Demo) |
|---------------------|----------------------|
| Hardcoded HTML per page | React components render from structured data store |
| No connection between pages | Click a candidate in QRecruiter → see them in Qinterviewer → see their dossier |
| Fake login button | Demo credentials: `demo@qalana.ai` / `QalanaDemo2026!` |
| Static text | Filters, sorting, modals, accordions all work |
| Charts with hardcoded numbers | ApexCharts reads from the same data store |
| Client needs someone to walk them through | **Client explores alone and understands** |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Build Tool** | Vite 6 | Instant HMR, zero-config, outputs static files for deployment |
| **Framework** | React 19 | Declarative rendering — state changes automatically update the UI everywhere |
| **Routing** | React Router v7 | Battle-tested SPA routing with parameterized routes (`/dossier/:id`) |
| **Charts** | ApexCharts + react-apexcharts | Native funnel charts, radial gauges, bar charts with smooth animations |
| **Code Display** | Prism.js (via prism-react-renderer) | HackerRank-style syntax highlighting for code assessment panels |
| **Icons** | Lucide React | 1000+ modern SVG icons, tree-shakeable (only bundles what's used) |
| **Fonts** | Inter + JetBrains Mono | Industry standard SaaS typography |
| **Styling** | Vanilla CSS with CSS Modules | Full design control, component-scoped styles, no utility class bloat |
| **Hosting** | Vercel | Free tier, instant deploys, custom domain, HTTPS automatic |

### What We're NOT Using (And Why)

| Technology | Why Not |
|------------|---------|
| Tailwind CSS | Fights against the custom glassmorphism design system. We need full CSS control |
| TypeScript | Adds compile complexity for a demo that won't be maintained long-term |
| Redux / Zustand | Overkill for demo state. React Context + useReducer is sufficient |
| Next.js | SSR/SSG features are wasted — this is a pure client-side SPA |
| D3.js | ApexCharts gives 90% of D3's visual quality with 10% of the code |
| Monaco Editor | Full VS Code engine — overkill for read-only code display |

---

## Architecture: The "Fake Backend" Pattern (React Edition)

No server. No API. But data flows as if there is one.

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                            │
│                                                          │
│  ┌──────────────┐   ┌────────────┐   ┌──────────────┐   │
│  │ React Router  │──▶│   Pages    │──▶│  Components  │   │
│  │ (v7, URL-    │   │ (React     │   │  (reusable   │   │
│  │  based)      │   │  components│   │   React      │   │
│  └──────────────┘   │  that      │   │   components)│   │
│                     │  consume   │   └──────────────┘   │
│                     │  context)  │          │            │
│                     └────────────┘          │            │
│                           │                 │            │
│                           ▼                 ▼            │
│  ┌──────────────────────────────────────────────────┐   │
│  │         DataContext (React Context)               │   │
│  │    Wraps DataStore — provides relational data    │   │
│  │    to any component via useData() hook           │   │
│  │                                                   │   │
│  │    Candidates ←→ Calls ←→ Interviews             │   │
│  │    ←→ Engagements ←→ Dossiers                    │   │
│  │    ←→ Escalations ←→ Consent Records             │   │
│  └──────────────────────────────────────────────────┘   │
│                           │                              │
│                           ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │       DemoContext (React Context + useReducer)    │   │
│  │    Tracks pipeline stage overrides per candidate  │   │
│  │    Tracks escalation status changes              │   │
│  │    Tracks notifications queue                    │   │
│  │    Auto-persists to sessionStorage on every      │   │
│  │    dispatch (survives page refresh)              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **DataStore (`data/store.js`)**: Not a flat list of hardcoded strings. A structured, relational in-memory database where candidates link to calls, calls link to dossiers, dossiers link to escalations. Exposed via `DataContext` so any component can call `useData()` to query candidates, calls, interviews, etc. When you click a candidate anywhere, the same data renders regardless of which page you're on.

2. **DemoContext (`context/DemoContext.jsx`)**: Replaces the old imperative `StateManager`. Uses React's `useReducer` for predictable state transitions. When the client clicks "Route to Qinterviewer" on a QRecruiter call, a `dispatch({ type: 'ADVANCE_CANDIDATE', candidateId, newStage })` fires → React automatically re-renders every component that displays that candidate → the card moves columns in Pipeline, the agent pages update, notification toast appears. Persists to `sessionStorage` on every dispatch via a `useEffect` — page refresh doesn't reset the demo.

3. **React Components**: Each component is a self-contained `.jsx` file with its own CSS Module. The same `<CandidateCard />` component renders in Pipeline, QRecruiter, and Engage pages — just with different props. Click handlers, tooltips, badges, and animations are all baked into the component. No DOM querying, no manual event delegation.

---

## File Structure

```
Agentic-Recruiter/
├── index.html                              # Vite entry point
├── vite.config.js                          # Multi-page config (login + app)
├── package.json                            # Dependencies
│
├── public/
│   └── favicon.svg                         # App icon
│
├── src/
│   ├── main.jsx                            # React root mount + router setup
│   │
│   ├── data/
│   │   └── store.js                        # Relational mock data + query helpers
│   │
│   ├── context/
│   │   ├── DataContext.jsx                  # Provides DataStore to all components
│   │   ├── DemoContext.jsx                  # Session state (useReducer + sessionStorage)
│   │   └── ThemeContext.jsx                 # Dark/light theme switching
│   │
│   ├── hooks/
│   │   ├── useData.js                      # Shortcut: useContext(DataContext)
│   │   ├── useDemo.js                      # Shortcut: useContext(DemoContext)
│   │   └── useTheme.js                     # Shortcut: useContext(ThemeContext)
│   │
│   ├── components/                         # Reusable UI components
│   │   ├── CandidateCard/
│   │   │   ├── CandidateCard.jsx
│   │   │   └── CandidateCard.module.css
│   │   ├── ConfidenceBadge/
│   │   │   ├── ConfidenceBadge.jsx
│   │   │   └── ConfidenceBadge.module.css
│   │   ├── ConsentChip/
│   │   │   ├── ConsentChip.jsx
│   │   │   └── ConsentChip.module.css
│   │   ├── DestroyedPanel/
│   │   │   ├── DestroyedPanel.jsx
│   │   │   └── DestroyedPanel.module.css
│   │   ├── PersistedPanel/
│   │   │   ├── PersistedPanel.jsx
│   │   │   └── PersistedPanel.module.css
│   │   ├── RubricGauge/
│   │   │   ├── RubricGauge.jsx
│   │   │   └── RubricGauge.module.css
│   │   ├── Timeline/
│   │   │   ├── Timeline.jsx
│   │   │   └── Timeline.module.css
│   │   ├── EscalationCard/
│   │   │   ├── EscalationCard.jsx
│   │   │   └── EscalationCard.module.css
│   │   ├── MatchScoreGauge/
│   │   │   ├── MatchScoreGauge.jsx
│   │   │   └── MatchScoreGauge.module.css
│   │   ├── TripleValidation/
│   │   │   ├── TripleValidation.jsx
│   │   │   └── TripleValidation.module.css
│   │   ├── CodeViewer/
│   │   │   ├── CodeViewer.jsx
│   │   │   └── CodeViewer.module.css
│   │   ├── NotificationToast/
│   │   │   ├── NotificationToast.jsx
│   │   │   └── NotificationToast.module.css
│   │   ├── Modal/
│   │   │   ├── Modal.jsx
│   │   │   └── Modal.module.css
│   │   ├── FilterBar/
│   │   │   ├── FilterBar.jsx
│   │   │   └── FilterBar.module.css
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.module.css
│   │   └── Layout/
│   │       ├── AppLayout.jsx
│   │       └── AppLayout.module.css
│   │
│   ├── pages/                              # Page-level components
│   │   ├── Login/
│   │   │   ├── Login.jsx
│   │   │   └── Login.module.css
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Dashboard.module.css
│   │   ├── QRecruiter/
│   │   │   ├── QRecruiter.jsx
│   │   │   └── QRecruiter.module.css
│   │   ├── QInterviewer/
│   │   │   ├── QInterviewer.jsx
│   │   │   └── QInterviewer.module.css
│   │   ├── Engage/
│   │   │   ├── Engage.jsx
│   │   │   └── Engage.module.css
│   │   ├── Pipeline/
│   │   │   ├── Pipeline.jsx
│   │   │   └── Pipeline.module.css
│   │   ├── Dossier/
│   │   │   ├── Dossier.jsx
│   │   │   └── Dossier.module.css
│   │   ├── Consent/
│   │   │   ├── Consent.jsx
│   │   │   └── Consent.module.css
│   │   └── Escalation/
│   │       ├── Escalation.jsx
│   │       └── Escalation.module.css
│   │
│   ├── utils/
│   │   ├── charts.js                       # ApexCharts option builders
│   │   └── helpers.js                      # Date formatting, etc.
│   │
│   └── styles/
│       ├── design-system.css               # Global tokens, fonts, colors, layers
│       ├── global.css                       # Reset, base styles, scrollbar
│       └── consent-theme.css               # Light theme variables (auto-applied)
│
└── dist/                                   # Build output (deploy this folder)
```

---

## DataStore Design (`data/store.js`)

This is the "fake backend." Every entity is related, and every page reads from the same source. Identical structure to v3 — the data doesn't change, only how it's consumed (via React Context instead of global variable).

```javascript
// data/store.js — Relational in-memory database

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
};

// ──────────────────────────────────────────────
// QUERY HELPERS (exported as standalone functions)
// ──────────────────────────────────────────────

export const getCandidateById = (id) => DataStore.candidates.find(c => c.id === id);
export const getCallsForCandidate = (candidateId) => DataStore.calls.filter(c => c.candidate_id === candidateId);
export const getInterviewForCandidate = (candidateId) => DataStore.interviews.find(i => i.candidate_id === candidateId);
export const getEngagementForCandidate = (candidateId) => DataStore.engagements.find(e => e.candidate_id === candidateId);
export const getDossierForCandidate = (candidateId) => DataStore.dossiers.find(d => d.candidate_id === candidateId);
export const getConsentForCandidate = (candidateId) => DataStore.consents.find(c => c.candidate_id === candidateId);
export const getCandidatesByStage = (stage) => DataStore.candidates.filter(c => c.pipeline_stage === stage);
export const getCandidatesByTier = (tier) => DataStore.candidates.filter(c => c.confidence_tier === tier);
export const getEscalationsByStatus = (status) => DataStore.escalations.filter(e => e.status === status);

export default DataStore;
```

### Why This Structure Matters (unchanged)

When the client clicks **"Arjun Mehta"** anywhere in the app:
- Pipeline page → shows his kanban card at "interviewed" stage
- QRecruiter page → shows his call with full summary
- Qinterviewer page → shows his interview session with rubric + code
- Engage page → shows his full engagement timeline
- Dossier page → shows his match score + reasoning chain
- Consent portal → shows exactly what data Qalana holds on him

**Same person, same data, every page.** This is what makes it feel real.

---

## State Management: DemoContext (`context/DemoContext.jsx`)

Replaces the old imperative `StateManager` object with React's declarative state system. The key advantage: **when state changes, every component that reads that state automatically re-renders**.

```jsx
// context/DemoContext.jsx — React Context + useReducer + sessionStorage persistence

import { createContext, useReducer, useEffect } from 'react';

// ─── Action Types ───
const ACTIONS = {
  LOGIN:              'LOGIN',
  LOGOUT:             'LOGOUT',
  ADVANCE_CANDIDATE:  'ADVANCE_CANDIDATE',
  RESOLVE_ESCALATION: 'RESOLVE_ESCALATION',
  ACK_ESCALATION:     'ACK_ESCALATION',
  ADD_NOTIFICATION:   'ADD_NOTIFICATION',
  MARK_NOTIF_READ:    'MARK_NOTIF_READ',
  UPDATE_CONSENT:     'UPDATE_CONSENT',
  REVOKE_CONSENT:     'REVOKE_CONSENT',
  REVOKE_ALL_CONSENT: 'REVOKE_ALL_CONSENT',
};

// ─── Initial State ───
const getInitialState = () => {
  const saved = sessionStorage.getItem('qalana_demo_state');
  return saved ? JSON.parse(saved) : {
    authenticated: false,
    user: null,
    candidate_overrides: {},     // { candidateId: { pipeline_stage: 'interviewed' } }
    escalation_overrides: {},    // { escalationId: { status: 'resolved' } }
    consent_overrides: {},       // { consentId: { revoked_fields: [...], scope_changes: {...} } }
    notifications: [],           // [{ message, time, read }]
  };
};

// ─── Reducer ───
function demoReducer(state, action) {
  switch (action.type) {

    case ACTIONS.LOGIN:
      if (action.email === 'demo@qalana.ai' && action.password === 'QalanaDemo2026!') {
        return { ...state, authenticated: true, user: { name: 'Sarah Chen', role: 'Senior Recruiter' } };
      }
      return state; // Invalid credentials — no state change

    case ACTIONS.LOGOUT:
      return { ...getInitialState(), authenticated: false };

    case ACTIONS.ADVANCE_CANDIDATE:
      return {
        ...state,
        candidate_overrides: {
          ...state.candidate_overrides,
          [action.candidateId]: { pipeline_stage: action.newStage },
        },
        notifications: [
          { message: `${action.candidateName} moved to ${action.newStage}`, time: new Date().toISOString(), read: false },
          ...state.notifications,
        ],
      };

    case ACTIONS.RESOLVE_ESCALATION:
      return {
        ...state,
        escalation_overrides: {
          ...state.escalation_overrides,
          [action.escalationId]: { status: 'resolved', response: action.response },
        },
        notifications: [
          { message: 'Escalation resolved', time: new Date().toISOString(), read: false },
          ...state.notifications,
        ],
      };

    case ACTIONS.ACK_ESCALATION:
      return {
        ...state,
        escalation_overrides: {
          ...state.escalation_overrides,
          [action.escalationId]: { status: 'acknowledged' },
        },
        notifications: [
          { message: 'Escalation acknowledged', time: new Date().toISOString(), read: false },
          ...state.notifications,
        ],
      };

    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          { message: action.message, time: new Date().toISOString(), read: false },
          ...state.notifications,
        ],
      };

    case ACTIONS.MARK_NOTIF_READ:
      return {
        ...state,
        notifications: state.notifications.map((n, i) =>
          i === action.index ? { ...n, read: true } : n
        ),
      };

    case ACTIONS.UPDATE_CONSENT:
      return {
        ...state,
        consent_overrides: {
          ...state.consent_overrides,
          [action.consentId]: {
            ...state.consent_overrides[action.consentId],
            field_updates: {
              ...(state.consent_overrides[action.consentId]?.field_updates || {}),
              [action.field]: action.value,
            },
          },
        },
      };

    case ACTIONS.REVOKE_CONSENT:
      return {
        ...state,
        consent_overrides: {
          ...state.consent_overrides,
          [action.consentId]: {
            ...state.consent_overrides[action.consentId],
            revoked_fields: [
              ...(state.consent_overrides[action.consentId]?.revoked_fields || []),
              action.field,
            ],
          },
        },
      };

    case ACTIONS.REVOKE_ALL_CONSENT:
      return {
        ...state,
        consent_overrides: {
          ...state.consent_overrides,
          [action.consentId]: { all_revoked: true },
        },
        notifications: [
          { message: 'All consent revoked', time: new Date().toISOString(), read: false },
          ...state.notifications,
        ],
      };

    default:
      return state;
  }
}

// ─── Context Provider ───
export const DemoContext = createContext();

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(demoReducer, null, getInitialState);

  // Auto-persist to sessionStorage on every state change
  useEffect(() => {
    sessionStorage.setItem('qalana_demo_state', JSON.stringify(state));
  }, [state]);

  // ─── Helper: Get candidate with overrides merged ───
  const getEffectiveCandidate = (candidate) => {
    const overrides = state.candidate_overrides[candidate.id] || {};
    return { ...candidate, ...overrides };
  };

  // ─── Helper: Get escalation with overrides merged ───
  const getEffectiveEscalation = (escalation) => {
    const overrides = state.escalation_overrides[escalation.id] || {};
    return { ...escalation, ...overrides };
  };

  return (
    <DemoContext.Provider value={{ state, dispatch, ACTIONS, getEffectiveCandidate, getEffectiveEscalation }}>
      {children}
    </DemoContext.Provider>
  );
}
```

### Why This Is Better Than The Old StateManager

| Old (Vanilla JS) | New (React Context + useReducer) |
|---|---|
| Manually call `render()` after every state change | React auto re-renders all affected components |
| Global mutable object — any code can mutate it | Immutable state — changes only via `dispatch()` |
| No undo/history — mutations are permanent | Reducer pattern enables time-travel debugging |
| Manual `sessionStorage.setItem()` calls | Single `useEffect` auto-persists on every change |
| Components must query DOM to show updated state | Components just read from context — always fresh |

---

## Router Design (`main.jsx`)

React Router v7 replaces the custom hash router. Routes are declarative and parameterized routes work out of the box.

```jsx
// main.jsx — App entry point with routing

import { createHashRouter, RouterProvider } from 'react-router-dom';

import AppLayout   from './components/Layout/AppLayout';
import Login       from './pages/Login/Login';
import Dashboard   from './pages/Dashboard/Dashboard';
import QRecruiter  from './pages/QRecruiter/QRecruiter';
import QInterviewer from './pages/QInterviewer/QInterviewer';
import Engage      from './pages/Engage/Engage';
import Pipeline    from './pages/Pipeline/Pipeline';
import Dossier     from './pages/Dossier/Dossier';
import Consent     from './pages/Consent/Consent';
import Escalation  from './pages/Escalation/Escalation';

const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppLayout />,    // Sidebar + content area (authenticated shell)
    children: [
      { index: true,            element: <Dashboard /> },
      { path: 'dashboard',      element: <Dashboard /> },
      { path: 'qrecruiter',     element: <QRecruiter /> },
      { path: 'qinterviewer',   element: <QInterviewer /> },
      { path: 'engage',         element: <Engage /> },
      { path: 'pipeline',       element: <Pipeline /> },
      { path: 'dossier/:id',    element: <Dossier /> },       // ← parameterized!
      { path: 'consent',        element: <Consent /> },
      { path: 'escalation',     element: <Escalation /> },
    ],
  },
]);

// In the render:
<DemoProvider>
  <DataProvider>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </DataProvider>
</DemoProvider>
```

### Why React Router v7 Over Custom Hash Router

| Custom Hash Router | React Router v7 |
|---|---|
| You build `window.onhashchange` listener manually | Built-in hash router with `createHashRouter` |
| Parameter extraction: manual regex parsing | `useParams()` → `{ id: "c1" }` instantly |
| Active link highlighting: manual DOM class toggling | `<NavLink>` component auto-adds `active` class |
| Page transitions: you manage mount/unmount | Works with React's `<Suspense>` + lazy loading |
| Guard routes (auth check): manual redirect logic | `loader` functions validate auth before rendering |

---

## Interactive Flows (What The Client Can DO)

These are the actions that make the demo feel real, not static. **All flows are identical to v4 — React just makes them work better.**

### Flow 1: Full Pipeline Walkthrough
```
Login → Dashboard (see 3 agents)
  → Click QRecruiter card → See call list → Click a call → Read summary
    → Click "View in Qinterviewer" → See interview rubric + code
      → Click "View Dossier" → See full evaluation + reasoning chain
        → Click "View Pipeline" → See this candidate in the kanban
```
**React advantage**: `<Link to="/dossier/c1">` handles navigation. `useParams()` extracts the ID. Component auto-renders the right candidate.

### Flow 2: Escalation Handling
```
Dashboard → Click "2 Escalations Pending" badge
  → See escalation queue → Click one → Read 3-bullet summary
    → Click "Acknowledge" → Status changes to "Acknowledged"
      → Click "Resolve" → Type a response → Status changes to "Resolved"
        → Notification toast: "Escalation resolved"
```
**React advantage**: `dispatch({ type: 'RESOLVE_ESCALATION', escalationId })` → badge count updates on Dashboard AND Escalation page simultaneously. Toast auto-renders from notification state.

### Flow 3: Candidate Progression
```
Pipeline page → Click candidate in "Screened" column
  → View their QRecruiter call summary
    → Click "Route to Qinterviewer" button
      → Candidate card moves to "Interviewed" column in Pipeline
        → Notification: "Arjun Mehta routed to Qinterviewer"
```
**React advantage**: `dispatch({ type: 'ADVANCE_CANDIDATE', candidateId: 'c1', newStage: 'interviewed' })` → card instantly re-renders in the correct kanban column. No manual DOM manipulation.

### Flow 4: Consent Exploration
```
Sidebar → Click "Consent Portal" (theme switches to light mode)
  → See list of data Qalana holds about a candidate
    → Toggle scope checkboxes on/off
      → Click "Revoke" on a field → Field gets struck through
        → Click "Revoke All" → Confirmation modal → All data marked as revoked
```
**React advantage**: `ThemeContext` toggles a CSS class on `<body>`. Checkbox state is React `useState`. Revoke dispatches to `DemoContext` → field immediately gets strikethrough styling via conditional className.

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
**React advantage**: `<DestroyedPanel items={call.destroyed} />` and `<PersistedPanel items={call.persisted} />` — self-contained components with their own CSS, tooltips, and animations. Used identically across QRecruiter, Qinterviewer, and Engage pages.

---

## Page Specs (React Components)

### Same 9 pages, every element interactive. Each page is a React component with its own CSS Module.

### 1. `Login.jsx` — Login
- Email + password fields (React controlled inputs with `useState`)
- Demo credentials: `demo@qalana.ai` / `QalanaDemo2026!`
- Wrong password → shake animation via CSS class toggle + error message state
- Successful login → `dispatch({ type: 'LOGIN' })` → `useNavigate()` redirects to dashboard
- Session persists via `sessionStorage` (DemoContext auto-restores on mount)

### 2. `Dashboard.jsx` — Agent Command Center
- **3 agent cards**: `<Link to="/qrecruiter">` etc. — clickable, routes to that agent's page
- **Pipeline funnel chart** (ApexCharts funnel): Animated on load, numbers come from `DataStore.pipeline`
- **Live activity feed**: Scrollable list, each item is a `<Link>` to relevant page
- **KPI strip**: Numbers pulled from `DataStore.agentStatus` via `useData()` hook
- **Escalation badge**: `useMemo()` computes pending count from escalations + overrides, clickable → routes to escalation page
- **Notification bell**: Badge count from `state.notifications.filter(n => !n.read).length`

### 3. `QRecruiter.jsx` — QRecruiter Page 🔵
- **Call list**: All calls from DataStore, rendered via `.map()`, sortable via `useState` sort key
- **Click any call** → toggles `expandedCallId` state → conditionally renders detail view showing:
  - Full structured summary (Q&A mapped with `.map()`)
  - `<ConsentChip status={call.consent_obtained} />`
  - `<MatchScoreGauge score={call.confidence} />` (ApexCharts radialBar)
  - `<DestroyedPanel items={call.destroyed} />` + `<PersistedPanel items={call.persisted} />`
  - `<Link to="/qinterviewer">View in Qinterviewer →</Link>` (if outcome = passed)
  - `<Link to={`/dossier/${call.candidate_id}`}>View Dossier →</Link>`
- **Stats bar**: Numbers from `DataStore.agentStatus.qrecruiter`
- **Filter**: `useState` filter value → `.filter()` on call list before rendering

### 4. `QInterviewer.jsx` — Qinterviewer Page 🟣
- **Session list**: From DataStore interviews, rendered via `.map()`, sortable
- **Click any session** → expands showing:
  - **Rubric gauges**: 4 `<RubricGauge category="communication" score={7} max={10} />` (ApexCharts radialBar)
  - **Code viewer**: `<CodeViewer code={session.code_assessment.code_snippet} language="python" />` (prism-react-renderer)
  - Test case results: Dynamic green/red indicators via conditional styling
  - `<ConfidenceBadge tier="Strong Hire" />` recommendation badge
  - `<DestroyedPanel />` + `<PersistedPanel />`
  - `<Link to={`/dossier/${session.candidate_id}`}>View Dossier →</Link>`
- **Filter**: By recommendation via `useState`

### 5. `Engage.jsx` — Engage Page 🟢
- **Campaign overview**: ApexCharts bar chart for engagement stats
- **Ghosting alerts banner**: Conditionally rendered based on `engagements.filter(e => e.ghosting_flag)`, with "Escalate" button that dispatches `ADD_NOTIFICATION`
- **Candidate engagement timelines**: `<Timeline events={engagement.events} />` component
  - Each event is clickable — `<Link>` to QRecruiter call or Qinterviewer session
- **`<DestroyedPanel />`** + **`<PersistedPanel />`** footer

### 6. `Pipeline.jsx` — Cross-Agent Kanban
- **6 columns**: Sourced → Screened → Interviewed → Engaged → Offered → Hired
- Each column renders `getCandidatesByStage(stage).map(c => getEffectiveCandidate(c))` → `<CandidateCard />`
- **Candidate cards**: Show name, `<MatchScoreGauge />`, `<ConfidenceBadge />`, `<ConsentChip />`
- **Click any card**: `<Link to={`/dossier/${candidate.id}`}>`
- **Action buttons on cards**:
  - "Route to Qinterviewer" → `dispatch({ type: 'ADVANCE_CANDIDATE', candidateId, newStage: 'interviewed' })`
  - "Start Engagement" → `dispatch({ type: 'ADVANCE_CANDIDATE', candidateId, newStage: 'engaged' })`
  - "Escalate" → dispatches notification
  - **Card moves to new column instantly** because React re-renders from updated state
- **`<FilterBar />`**: Filters by tier, agent, data status via `useState` filter object

### 7. `Dossier.jsx` — Candidate Deep Dive
- **Route**: `/dossier/:id` — `useParams()` extracts candidate ID, loads all related data
- **Match score hero**: Large `<MatchScoreGauge score={0.87} tier="GREEN" />` (ApexCharts)
- **`<TripleValidation result={{ rule: true, semantic: true, llm_judge: true }} />`**: 3 animated checkmarks
- **Reasoning chain**: `dossier.reasoning.map()` → each claim is a card with evidence link + `<ConfidenceBadge />`
  - Verified = green, Inferred = amber, Ungrounded = red + strikethrough
- **Agent accordion**: Expandable sections (React `useState` for open/closed) for QRecruiter / Qinterviewer / Engage
  - Each section includes `<Link>` back to that agent's page
- **Consent panel**: Shows current consent status + scopes from `getConsentForCandidate()`

### 8. `Consent.jsx` — Consent Portal (Light Theme)
- **On mount**: `useTheme().setTheme('light')` → `ThemeContext` applies light theme CSS variables
- **On unmount**: `useEffect` cleanup resets to dark theme
- **"What Qalana knows about you"**: Table rendered from consent `data_held.map()`
  - Each row has "Edit" (inline `useState` editing) and "Remove" (`dispatch({ type: 'REVOKE_CONSENT' })`)
- **Scope toggles**: React `<input type="checkbox" checked={...} onChange={...} />` — real controlled inputs
- **"Revoke All"**: Opens `<Modal>` → on confirm → `dispatch({ type: 'REVOKE_ALL_CONSENT' })` → all fields strikethrough
- **Compliance badges**: GDPR, DPDP Act, EU AI Act with hover tooltips
- **"Back to recruiter view"**: `<Link to="/dashboard">` + theme resets via cleanup

### 9. `Escalation.jsx` — HITL Queue
- **Escalation list**: Rendered from `DataStore.escalations.map(e => getEffectiveEscalation(e))`
- **Click any escalation** → toggles `expandedId` state → conditionally renders:
  - `<ConfidenceBadge tier={escalation.source_agent} />` (color-coded by agent)
  - Risk level badge (HIGH = red, MEDIUM = amber, LOW = green)
  - 3-bullet summary from data
  - Respond `<textarea>` with `useState` for input
  - "Acknowledge" → `dispatch({ type: 'ACK_ESCALATION', escalationId })`
  - "Resolve" → `dispatch({ type: 'RESOLVE_ESCALATION', escalationId, response })`
  - **Status badge updates live** — React re-renders on dispatch
- **`<FilterBar />`**: By status, risk level, source agent

---

## Reusable React Components

```
Component                   Props                              Used In
─────────────────────────── ────────────────────────────────── ───────────────────────────
<CandidateCard />           candidateId, showActions           Pipeline, QRecruiter, Engage
<ConfidenceBadge />         tier ("GREEN"|"AMBER"|"RED")       Pipeline, Dossier, Dashboard
<ConsentChip />             status ("consented"|"revoked")     Pipeline, Dossier, Consent
<DestroyedPanel />          items (string[])                   QRecruiter, QInterviewer, Engage
<PersistedPanel />          items (string[])                   QRecruiter, QInterviewer, Engage
<RubricGauge />             category, score, max               QInterviewer, Dossier
<Timeline />                events (object[])                  Engage, Dossier
<EscalationCard />          escalationId                       Escalation, Dashboard
<MatchScoreGauge />         score, tier                        Dossier, Pipeline
<TripleValidation />        result ({rule, semantic, llm})     Dossier
<CodeViewer />              code, language                     QInterviewer
<NotificationToast />       (reads from DemoContext)           Global (in AppLayout)
<Modal />                   isOpen, onClose, title, children   Consent, Escalation
<FilterBar />               filters, onChange                  Pipeline, QRecruiter, Escalation
<Sidebar />                 (reads from router for active)     AppLayout
```

Every component is a **pure React component**: props in → JSX out. No component knows which page it's on. Each has its own CSS Module for scoped styling.

---

## Design System (`styles/design-system.css`)

Same visual identity as v3. The design tokens don't change — only the consumption method (CSS Modules import these variables).

```css
/* design-system.css — Global CSS custom properties */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* Agent signature colors */
  --qrecruiter:    #3b82f6;   /* Blue */
  --qinterviewer:  #8b5cf6;   /* Purple */
  --engage:        #10b981;   /* Green */

  /* Confidence tiers */
  --tier-green:    #22c55e;
  --tier-amber:    #f59e0b;
  --tier-red:      #ef4444;

  /* Dark theme (recruiter — default) */
  --bg-primary:    #0a0e27;
  --bg-secondary:  #0f1435;
  --bg-card:       rgba(255, 255, 255, 0.05);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --text-primary:  #f1f5f9;
  --text-secondary:#94a3b8;
  --text-muted:    #64748b;

  /* Typography */
  --font-sans:     'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:     'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing scale */
  --space-xs:  0.25rem;
  --space-sm:  0.5rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2rem;
  --space-2xl: 3rem;

  /* Border radius */
  --radius-sm:  0.375rem;
  --radius-md:  0.75rem;
  --radius-lg:  1rem;
  --radius-xl:  1.5rem;

  /* Shadows */
  --shadow-card:  0 4px 24px rgba(0, 0, 0, 0.3);
  --shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.4);

  /* Transitions */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;
}

/* Light theme (consent portal) — applied via ThemeContext */
[data-theme="light"] {
  --bg-primary:    #f8fafc;
  --bg-secondary:  #f1f5f9;
  --bg-card:       #ffffff;
  --bg-card-hover: #f8fafc;
  --border-subtle: #e2e8f0;
  --text-primary:  #1e293b;
  --text-secondary:#475569;
  --text-muted:    #94a3b8;
  --shadow-card:   0 4px 24px rgba(0, 0, 0, 0.08);
  --shadow-hover:  0 8px 32px rgba(0, 0, 0, 0.12);
}
```

### Visual Effects

- **Glassmorphism cards**: `backdrop-filter: blur(12px)` + semi-transparent backgrounds
- **Micro-animations**: CSS `@keyframes` for gauge fill, card entrance, badge pulse
- **Page transitions**: React Router + CSS transitions on mount/unmount
- **Hover effects**: `transform: translateY(-2px)` + `box-shadow` elevation change
- **Notification toasts**: CSS `@keyframes slideIn` from top-right corner
- **ApexCharts**: Configured with matching color palette via chart option builders

---

## Build Phases (4 phases)

| Phase | What | Components Built | Key Deliverable |
|-------|------|-----------------|-----------------|
| **1** | Foundation | Login, Dashboard, AppLayout, Sidebar, NotificationToast | Vite project setup, React Router, DataContext, DemoContext, ThemeContext, design system CSS. Dashboard proves all 3 agent cards + ApexCharts pipeline funnel work. Login with demo credentials + sessionStorage persistence. |
| **2** | Agent Pages | QRecruiter, QInterviewer, Engage, CandidateCard, DestroyedPanel, PersistedPanel, Timeline, RubricGauge, CodeViewer, FilterBar | The three agent stories with clickable call/session/engagement details. "Destroyed" vs "Persisted" panels working. Cross-navigation links between agents + dossiers. |
| **3** | Evaluation | Pipeline, Dossier, Escalation, ConfidenceBadge, ConsentChip, MatchScoreGauge, TripleValidation, EscalationCard, Modal | Kanban with working drag actions (dispatch stage changes), dossier with parameterized routing via `useParams()`, escalation with acknowledge/resolve workflow updating live. |
| **4** | Compliance | Consent | Light theme switch via ThemeContext, editable consent data with controlled inputs, revoke flow with confirmation Modal, compliance badges with tooltips. |

---

## How To Run (For You)

```bash
# First time setup (once)
cd Agentic-Recruiter
npm install

# Development (every time you want to work on it)
npm run dev
# → Opens at http://localhost:5173

# Build for deployment
npm run build
# → Outputs static files to /dist folder

# Deploy to Vercel
npx vercel --prod
# → Gives you https://demo.qalana.ai (or similar URL)
```

---

## Hosting

Build output is static files. Deploy `/dist` folder to any of:
- **Vercel** (recommended — free, instant, custom domain support): `npx vercel --prod`
- **Netlify** (free, drag-and-drop the `/dist` folder)
- **GitHub Pages** (free, tied to repo)
- **AWS S3 + CloudFront** (if you want to stay on-brand with the AWS architecture)

Client gets: `https://demo.qalana.ai` + credentials `demo@qalana.ai` / `QalanaDemo2026!`

---

## Dependencies (`package.json`)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "apexcharts": "^4.0.0",
    "react-apexcharts": "^2.0.0",
    "prism-react-renderer": "^2.0.0",
    "lucide-react": "^0.500.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0"
  }
}
```

**Total production dependencies: 6** (React, ReactDOM, React Router, ApexCharts, Prism renderer, Lucide)

---

## Verification

### Self-guided Test
1. Open the URL
2. Login with demo credentials (wrong password should fail with shake animation)
3. Dashboard loads with 3 agent cards, ApexCharts funnel chart, activity feed
4. Click through QRecruiter → pick a call → see the summary → click "View in Qinterviewer"
5. See the same candidate's interview → rubric gauges + code viewer → click "View Dossier"
6. See the full dossier with reasoning chain → every claim has evidence
7. Go to Pipeline → see this candidate in the correct column
8. Click "Route to Qinterviewer" on a screened candidate → card moves instantly
9. Go to Escalation → acknowledge one → resolve one → statuses update live
10. Go to Consent Portal → theme switches to light → edit data → revoke → visual feedback
11. Refresh browser → session is preserved (sessionStorage restored by DemoContext)

### Client Experience Test
- Can a person who has **never seen this product** log in and understand what it does within 5 minutes?
- Does every click lead somewhere meaningful?
- Is the data destruction story visible on every agent page?
- Does the consent portal feel trustworthy and transparent?
