export const DataStore = {
  candidates: [
    {
      id: "c1",
      name: "Arjun Mehta",
      role: "Senior Backend Engineer",
      email_status: "consented",
      pipeline_stage: "interviewed",
      match_score: 87,
      confidence_tier: "GREEN",
      last_agent: "qinterviewer"
    },
    {
      id: "c2",
      name: "Priya Sharma",
      role: "Product Manager",
      email_status: "consented",
      pipeline_stage: "screened",
      match_score: 92,
      confidence_tier: "GREEN",
      last_agent: "qrecruiter"
    },
    {
      id: "c3",
      name: "David Kim",
      role: "Frontend Developer",
      email_status: "ephemeral",
      pipeline_stage: "engaged",
      match_score: 74,
      confidence_tier: "AMBER",
      last_agent: "engage",
      ttl_expiry: "2026-04-18T10:00:00"
    },
    {
      id: "c4",
      name: "Aisha Patel",
      role: "UX Researcher",
      email_status: "ephemeral",
      pipeline_stage: "sourced",
      match_score: 88,
      confidence_tier: "GREEN",
      last_agent: "none",
      ttl_expiry: "2026-04-17T14:30:00"
    }
  ],
  calls: [
    {
      id: "call1",
      candidate_id: "c1",
      candidate_name: "Arjun Mehta",
      date: "2026-04-15T10:30:00",
      duration_minutes: 12,
      channel: "WhatsApp",
      outcome: "passed",
      consent_obtained: true,
      confidence: 0.84,
      summary: {
        questions: [{ q: "Experience with distributed systems?", a: "Led migration to microservices at Flipkart." }],
        key_signals: ["Strong systems thinking", "Production-scale experience"],
        concerns: ["Hasn't worked with AWS KMS"]
      },
      destroyed: ["Full conversation transcript", "Raw audio recording (Retell.ai)", "LLM reasoning trace"],
      persisted: ["Structured summary", "Consent record", "Outcome verdict in RuneGrid"]
    }
  ],
  interviews: [
    {
      id: "int1",
      candidate_id: "c1",
      candidate_name: "Arjun Mehta",
      date: "2026-04-15T14:00:00",
      duration_minutes: 45,
      rubric: {
        communication: { score: 7, max: 10, notes: "Clear explanations, good structure" },
        technical_depth: { score: 9, max: 10, notes: "Deep knowledge of distributed systems" },
        problem_solving: { score: 8, max: 10, notes: "Optimal solution on first approach" }
      },
      code_assessment: {
        language: "Python",
        problem: "Design a rate limiter using sliding window algorithm",
        quality_score: 87,
        code_snippet: "class SlidingWindowRateLimiter:\n    def __init__(self, max_requests, window_seconds):\n        self.max_requests = max_requests\n..."
      },
      recommendation: "Strong Hire",
      destroyed: ["Video stream input", "Raw transcript", "LLM reasoning trace in Redis"],
      persisted: ["Rubric scores", "Recommendation", "Code submission in RuneGrid"]
    }
  ],
  engagements: [
    {
      id: "eng3",
      candidate_id: "c3",
      candidate_name: "David Kim",
      health: 0.2, // Low health
      ghosting_flag: true,
      events: [
        { type: "email_sent", date: "2026-04-12T09:00:00", detail: "Personalized senior-level outreach" },
        { type: "email_opened", date: "2026-04-12T11:23:00", detail: "" },
        { type: "ghosting_alert", date: "2026-04-15T11:23:00", detail: "3+ days silence without reply" }
      ],
      destroyed: ["Draft email content generation", "LLM generation context mapping"],
      persisted: ["Engagement events", "Ghosting flags"]
    }
  ],
  consents: [
    {
      id: "con1",
      candidate_id: "c1",
      candidate_name: "Arjun Mehta",
      scopes: ["pii_read", "experience_verify", "github_analysis"],
      granted_at: "2026-04-14T14:20:00",
      status: "active",
      data_held: [
        { field: "Full Name", value: "Arjun Mehta", source: "Verbal consent (QRecruiter)", editable: true },
        { field: "Email", value: "arjun.m@gmail.com", source: "PDL enrichment", editable: true },
        { field: "GitHub", value: "github.com/arjunmehta", source: "Bright Data", editable: true }
      ]
    }
  ],
  pipeline: { sourced: 42, screened: 28, interviewed: 18, engaged: 12, offered: 6, hired: 4 },
  agentStatus: {
    qrecruiter: { active_calls: 2, completed_today: 12, pass_rate: 0.83, status: "active" },
    qinterviewer: { in_progress: 1, completed_today: 5, avg_score: 0.78, status: "active" },
    engage: { candidates_engaged: 34, ghosting_alerts: 1, reply_rate: 0.91, status: "active" },
  },
  escalations: [
    { id: "esc1", status: "pending" }
  ],
  ephemeralStats: {
    redis_active_sessions: 247,
    data_purged_today_gb: 12.4,
    items_vaulted_runegrid: 89,
    compliance_health: 100
  }
};

export const getCalls = () => DataStore.calls;
export const getInterviews = () => DataStore.interviews;
export const getEngagements = () => DataStore.engagements;
export const getConsents = () => DataStore.consents;
export const getCandidates = () => DataStore.candidates;

export default DataStore;
