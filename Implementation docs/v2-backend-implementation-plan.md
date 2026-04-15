# Implementation Plan v2: Agentic Recruiter — Backend Architecture

> **Date**: 2026-04-16  
> **Type**: Backend (Python/FastAPI)  
> **Principles**: SOLID throughout  
> **Predecessor**: [v1-static-frontend-plan.md](./v1-static-frontend-plan.md)

---

## Overview

Build the **backend engine** for the Agentic Recruiter (Qalana) platform — a **compliance-first, agent-orchestrated recruiting pipeline** powered by three sequential AI agents: **QRecruiter** (voice screening) → **Qinterviewer** (technical assessment) → **Qalana Engage** (candidate engagement).

The backend enforces **Ephemeral Enrichment Architecture** (enrich in memory, persist only after consent), **HITL escalation**, and **data sovereignty** across the entire pipeline.

---

## SOLID Principles — How They Apply

Every module, class, and service in this backend is designed to respect SOLID:

| Principle | Application in This System |
|-----------|---------------------------|
| **S — Single Responsibility** | Each agent is a standalone service. Each middleware layer does exactly one thing. Each repository handles one entity. |
| **O — Open/Closed** | Agent behaviors are extended via strategy patterns and plugins, not by modifying core agent code. New validation layers, new ATS connectors, new outreach channels are added without touching existing implementations. |
| **L — Liskov Substitution** | All three agents implement a common `BaseAgent` interface and can be swapped/mocked. All repositories implement a common `Repository` protocol. |
| **I — Interface Segregation** | Agents expose only the methods their consumers need. The consent service doesn't expose purge methods. The evaluation service doesn't expose engagement methods. Fine-grained interfaces for each concern. |
| **D — Dependency Inversion** | All services depend on abstractions (protocols/interfaces), never on concrete implementations. Database, cache, LLM, and external API clients are all injected via dependency injection. |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Python 3.12+ | Primary language |
| **Framework** | FastAPI | Async HTTP + WebSocket server |
| **Orchestration** | LangGraph | Agentic state machine |
| **LLM (Reasoning)** | Claude 3.5 Sonnet (Anthropic) | Evaluation, validation, summarization |
| **LLM (Cost-efficient)** | GPT-4o mini (OpenAI) | Email generation, telemetry sampling |
| **Voice** | Retell.ai | QRecruiter voice AI |
| **Database** | PostgreSQL (AWS RDS) | Dual-cluster persistent storage |
| **Cache** | Redis (AWS ElastiCache) | Ephemeral enrichment layer |
| **Task Queue** | Celery + Redis | Async jobs (outreach, purge, learning loop) |
| **Encryption** | AWS KMS + pgcrypto | Field-level encryption |
| **ATS Integration** | Merge.dev | Unified ATS connector |
| **Enrichment** | People Data Labs, Bright Data | Candidate data enrichment |
| **Observability** | OpenTelemetry + LangSmith | Tracing, metrics, logging |
| **Charts (future FE)** | Chart.js | Data visualization |

---

## Project Structure (SOLID-Aligned)

```
backend/
├── app/
│   ├── main.py                          # FastAPI application factory
│   ├── config.py                        # Settings (pydantic-settings)
│   ├── dependencies.py                  # Dependency injection container
│   │
│   ├── core/                            # ── Cross-cutting concerns ──
│   │   ├── interfaces/                  # Abstract protocols (D + I)
│   │   │   ├── __init__.py
│   │   │   ├── agent.py                 # IAgent protocol
│   │   │   ├── repository.py            # IRepository protocol
│   │   │   ├── cache.py                 # ICacheService protocol
│   │   │   ├── encryption.py            # IEncryptionService protocol
│   │   │   ├── llm.py                   # ILLMProvider protocol
│   │   │   ├── notification.py          # INotificationChannel protocol
│   │   │   └── enrichment.py            # IEnrichmentProvider protocol
│   │   │
│   │   ├── exceptions.py               # Domain exception hierarchy
│   │   ├── enums.py                     # Shared enums (ConfidenceTier, AgentState, etc.)
│   │   ├── events.py                    # Domain event definitions
│   │   └── security.py                 # Auth, JWT, RBAC utilities
│   │
│   ├── domain/                          # ── Domain models (pure, no dependencies) ──
│   │   ├── __init__.py
│   │   ├── candidate.py                 # Candidate, VerifiedProfile entities
│   │   ├── employer.py                  # Employer, TenantConfig entities
│   │   ├── job.py                       # Job, MasterCase entities
│   │   ├── dossier.py                   # Dossier, ReasoningChain entities
│   │   ├── consent.py                   # ConsentRecord, ConsentScope entities
│   │   ├── session.py                   # AgentSession, SessionState entities
│   │   ├── escalation.py               # Escalation, TutorSummary entities
│   │   └── telemetry.py                # TelemetryEvent, DriftMetric entities
│   │
│   ├── agents/                          # ── The Three Agents (S + L) ──
│   │   ├── __init__.py
│   │   ├── base.py                      # BaseAgent ABC (Liskov contract)
│   │   ├── orchestrator.py              # Sequential pipeline: QRecruiter→Qinterviewer→Engage
│   │   │
│   │   ├── qrecruiter/                  # Agent 1: Voice Screening (S)
│   │   │   ├── __init__.py
│   │   │   ├── agent.py                 # QRecruiterAgent(BaseAgent)
│   │   │   ├── voice_handler.py         # Retell.ai integration
│   │   │   ├── consent_collector.py     # Verbal consent logic
│   │   │   ├── summary_extractor.py     # Post-call structured summary
│   │   │   └── schemas.py              # QRecruiter-specific DTOs
│   │   │
│   │   ├── qinterviewer/               # Agent 2: Technical Assessment (S)
│   │   │   ├── __init__.py
│   │   │   ├── agent.py                 # QinterviewerAgent(BaseAgent)
│   │   │   ├── rubric_evaluator.py      # Rubric scoring engine
│   │   │   ├── code_executor.py         # HackerRank-style code execution
│   │   │   ├── proctoring.py            # Video/code proctoring logic
│   │   │   └── schemas.py              # Qinterviewer-specific DTOs
│   │   │
│   │   └── engage/                      # Agent 3: Candidate Engagement (S)
│   │       ├── __init__.py
│   │       ├── agent.py                 # EngageAgent(BaseAgent)
│   │       ├── outreach_engine.py       # Personalized email/message generation
│   │       ├── ghosting_detector.py     # 3-day silence alert
│   │       ├── post_offer_tracker.py    # Post-offer engagement monitoring
│   │       └── schemas.py              # Engage-specific DTOs
│   │
│   ├── services/                        # ── Business logic services (S + O) ──
│   │   ├── __init__.py
│   │   ├── consent_service.py           # Consent Gate: ephemeral→persistent transition
│   │   ├── evaluation_service.py        # Triple-Layer Validation orchestration
│   │   ├── enrichment_service.py        # PDL/Bright Data enrichment (ephemeral only)
│   │   ├── master_case_service.py       # Master Case CRUD + persona ingestion
│   │   ├── dossier_service.py           # Dossier generation + reasoning chain
│   │   ├── escalation_service.py        # HITL escalation + 3-bullet summarization
│   │   ├── purge_service.py             # Atomic purge + anonymization pipeline
│   │   ├── telemetry_service.py         # Metrics collection + drift detection
│   │   └── learning_loop_service.py     # Post-hire inference extraction + bias audit
│   │
│   ├── infrastructure/                  # ── Concrete implementations (D) ──
│   │   ├── __init__.py
│   │   │
│   │   ├── persistence/                # Database layer
│   │   │   ├── __init__.py
│   │   │   ├── database.py              # SQLAlchemy async engine + session factory
│   │   │   ├── models.py               # ORM models (maps to ERD from docs)
│   │   │   ├── repositories/           # Concrete repository implementations
│   │   │   │   ├── __init__.py
│   │   │   │   ├── candidate_repo.py    # CandidateRepository(IRepository)
│   │   │   │   ├── employer_repo.py     # EmployerRepository(IRepository)
│   │   │   │   ├── job_repo.py          # JobRepository(IRepository)
│   │   │   │   ├── master_case_repo.py  # MasterCaseRepository(IRepository)
│   │   │   │   ├── dossier_repo.py      # DossierRepository(IRepository)
│   │   │   │   ├── consent_repo.py      # ConsentRepository(IRepository)
│   │   │   │   ├── session_repo.py      # AgentSessionRepository(IRepository)
│   │   │   │   └── escalation_repo.py   # EscalationRepository(IRepository)
│   │   │   └── migrations/             # Alembic migrations
│   │   │       └── ...
│   │   │
│   │   ├── cache/                       # Redis ephemeral layer
│   │   │   ├── __init__.py
│   │   │   └── redis_cache.py           # RedisCacheService(ICacheService)
│   │   │
│   │   ├── encryption/                  # AWS KMS integration
│   │   │   ├── __init__.py
│   │   │   └── kms_encryption.py        # KMSEncryptionService(IEncryptionService)
│   │   │
│   │   ├── llm/                         # LLM provider implementations
│   │   │   ├── __init__.py
│   │   │   ├── claude_provider.py       # ClaudeProvider(ILLMProvider)
│   │   │   └── openai_provider.py       # OpenAIProvider(ILLMProvider)
│   │   │
│   │   ├── notifications/              # Notification channel implementations
│   │   │   ├── __init__.py
│   │   │   ├── whatsapp_channel.py      # WhatsAppChannel(INotificationChannel)
│   │   │   └── slack_channel.py         # SlackChannel(INotificationChannel)
│   │   │
│   │   ├── enrichment/                  # External data providers
│   │   │   ├── __init__.py
│   │   │   ├── pdl_provider.py          # PDLProvider(IEnrichmentProvider)
│   │   │   └── brightdata_provider.py   # BrightDataProvider(IEnrichmentProvider)
│   │   │
│   │   ├── ats/                         # ATS integration
│   │   │   ├── __init__.py
│   │   │   └── merge_dev_client.py      # MergeDevATSClient
│   │   │
│   │   ├── voice/                       # Voice AI
│   │   │   ├── __init__.py
│   │   │   └── retell_client.py         # RetellVoiceClient
│   │   │
│   │   └── observability/              # Telemetry infra
│   │       ├── __init__.py
│   │       ├── otel_setup.py            # OpenTelemetry initialization
│   │       └── langsmith_tracer.py      # LangSmith trace exporter
│   │
│   ├── api/                             # ── HTTP layer (I) ──
│   │   ├── __init__.py
│   │   ├── middleware/                  # Request pipeline (S)
│   │   │   ├── __init__.py
│   │   │   ├── sovereignty_guard.py     # PII stripping without consent
│   │   │   ├── telemetry_middleware.py  # OTel span injection
│   │   │   ├── rate_limiter.py          # Rate limiting
│   │   │   └── circuit_breaker.py       # External service resilience
│   │   │
│   │   ├── routers/                     # Route handlers (S + I)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                  # POST /auth/login, /auth/register
│   │   │   ├── consent.py               # POST /v1/consent/grant, /v1/consent/revoke
│   │   │   ├── evaluation.py            # POST /v1/evaluate/score
│   │   │   ├── escalation.py            # POST /v1/agent/escalate, GET /v1/escalations
│   │   │   ├── jobs.py                  # CRUD /v1/jobs
│   │   │   ├── master_cases.py          # CRUD /v1/master-cases
│   │   │   ├── candidates.py            # GET /v1/candidates, /v1/candidates/{id}/dossier
│   │   │   ├── agents.py               # GET /v1/agents/status, POST /v1/agents/trigger
│   │   │   ├── telemetry.py             # GET /v1/telemetry/metrics, /v1/telemetry/alerts
│   │   │   ├── purge.py                 # POST /v1/purge/request, GET /v1/purge/audit
│   │   │   └── webhooks.py             # POST /webhooks/retell, /webhooks/whatsapp
│   │   │
│   │   └── schemas/                     # Request/Response DTOs (I)
│   │       ├── __init__.py
│   │       ├── auth_schemas.py
│   │       ├── consent_schemas.py
│   │       ├── evaluation_schemas.py
│   │       ├── escalation_schemas.py
│   │       ├── job_schemas.py
│   │       ├── candidate_schemas.py
│   │       ├── agent_schemas.py
│   │       ├── telemetry_schemas.py
│   │       └── purge_schemas.py
│   │
│   └── tasks/                           # ── Celery async workers ──
│       ├── __init__.py
│       ├── celery_app.py                # Celery configuration
│       ├── outreach_tasks.py            # Async email/message sending
│       ├── purge_tasks.py               # 3-stage purge pipeline
│       ├── learning_tasks.py            # Post-hire inference extraction
│       ├── ghosting_tasks.py            # 3-day silence detection cron
│       └── bias_audit_tasks.py          # Weekly bias audit
│
├── tests/                               # ── Test suite ──
│   ├── conftest.py                      # Fixtures, test DB, mock providers
│   ├── unit/
│   │   ├── test_agents/
│   │   │   ├── test_qrecruiter.py
│   │   │   ├── test_qinterviewer.py
│   │   │   └── test_engage.py
│   │   ├── test_services/
│   │   │   ├── test_consent_service.py
│   │   │   ├── test_evaluation_service.py
│   │   │   ├── test_purge_service.py
│   │   │   └── ...
│   │   └── test_domain/
│   │       ├── test_candidate.py
│   │       ├── test_dossier.py
│   │       └── ...
│   ├── integration/
│   │   ├── test_consent_flow.py         # Ephemeral → persistent transition
│   │   ├── test_agent_pipeline.py       # QRecruiter → Qinterviewer → Engage
│   │   ├── test_escalation_flow.py      # Grey zone → HITL handoff
│   │   └── test_purge_pipeline.py       # 3-stage purge
│   └── e2e/
│       └── test_full_recruitment_flow.py
│
├── alembic.ini                          # Alembic config
├── pyproject.toml                       # Dependencies & project config
├── Dockerfile
├── docker-compose.yml                   # PostgreSQL, Redis, Celery worker
└── .env.example
```

---

## SOLID Breakdown by Layer

### 1. Core Interfaces (`core/interfaces/`) — **D + I**

These are the abstractions that everything depends on. No concrete implementations.

#### `IAgent` Protocol (Liskov contract for all 3 agents)

```python
# core/interfaces/agent.py
from typing import Protocol
from domain.session import AgentSession
from domain.dossier import Dossier

class IAgent(Protocol):
    """Base contract all agents must satisfy (L - Liskov)."""

    async def execute(self, session: AgentSession) -> AgentResult:
        """Run the agent's core logic for this session."""
        ...

    async def can_handle(self, session: AgentSession) -> bool:
        """Check if this agent should process this session."""
        ...

    async def generate_summary(self, session: AgentSession) -> dict:
        """Generate the structured summary (what persists)."""
        ...

    async def destroy_ephemeral(self, session_id: str) -> None:
        """Destroy all session-scoped data (what gets purged)."""
        ...
```

#### `IRepository` Protocol (generic data access)

```python
# core/interfaces/repository.py
from typing import Protocol, TypeVar, Generic, Optional
T = TypeVar("T")

class IRepository(Protocol[T]):
    """Generic repository contract (D - Dependency Inversion)."""

    async def get_by_id(self, id: str) -> Optional[T]: ...
    async def create(self, entity: T) -> T: ...
    async def update(self, entity: T) -> T: ...
    async def delete(self, id: str) -> bool: ...
    async def list(self, filters: dict | None = None) -> list[T]: ...
```

#### `ICacheService` Protocol (ephemeral layer)

```python
# core/interfaces/cache.py
from typing import Protocol, Optional, Any

class ICacheService(Protocol):
    """Ephemeral data contract (Redis or any TTL-based cache)."""

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None: ...
    async def get(self, key: str) -> Optional[Any]: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...
    async def flush_session(self, session_id: str) -> int: ...
```

#### `ILLMProvider` Protocol (swappable LLM backends)

```python
# core/interfaces/llm.py
from typing import Protocol
from enum import Enum

class LLMTask(Enum):
    EVALUATION = "evaluation"          # Claude (high-quality)
    SUMMARIZATION = "summarization"    # Claude
    EMAIL_GENERATION = "email_gen"     # GPT-4o mini (cost-efficient)
    JUDGE = "judge"                    # Claude (anti-hallucination)
    TELEMETRY_EVAL = "telemetry"       # GPT-4o mini (sampling)

class ILLMProvider(Protocol):
    """LLM abstraction — swap Claude/GPT without touching business logic."""

    async def complete(self, prompt: str, task: LLMTask, **kwargs) -> LLMResponse: ...
    async def complete_structured(self, prompt: str, schema: dict, task: LLMTask) -> dict: ...
```

#### `INotificationChannel` Protocol

```python
# core/interfaces/notification.py
from typing import Protocol

class INotificationChannel(Protocol):
    """Notification abstraction — WhatsApp, Slack, email, etc."""

    async def send_escalation(self, recruiter_id: str, summary: dict) -> bool: ...
    async def send_candidate_message(self, candidate_id: str, message: str) -> bool: ...
```

#### `IEnrichmentProvider` Protocol

```python
# core/interfaces/enrichment.py
from typing import Protocol

class IEnrichmentProvider(Protocol):
    """External data enrichment — PDL, Bright Data, GitHub, etc."""

    async def enrich_profile(self, query: dict) -> dict: ...
    async def get_provider_name(self) -> str: ...
```

#### `IEncryptionService` Protocol

```python
# core/interfaces/encryption.py
from typing import Protocol

class IEncryptionService(Protocol):
    """Encryption abstraction — AWS KMS or local for dev."""

    async def encrypt(self, plaintext: str, key_arn: str) -> bytes: ...
    async def decrypt(self, ciphertext: bytes, key_arn: str) -> str: ...
    async def schedule_key_deletion(self, key_arn: str, days: int = 30) -> None: ...
```

---

### 2. Domain Models (`domain/`) — **S**

Pure data classes. No framework dependencies, no side effects, no I/O. Each file owns one aggregate root.

#### Key Domain Entities

```python
# domain/candidate.py
@dataclass
class Candidate:
    candidate_id: str
    kms_key_arn: str
    email_enc: bytes | None      # Encrypted PII
    phone_enc: bytes | None      # Encrypted PII
    created_at: datetime
    consent_status: ConsentStatus

@dataclass
class VerifiedProfile:
    profile_id: str
    candidate_id: str
    resume_metadata: dict        # Structured skills, history
    verification_badges: dict    # IDfy/DigiLocker verified
```

```python
# domain/job.py
@dataclass
class Job:
    job_id: str
    employer_id: str
    raw_jd: str
    status: JobStatus            # Draft, Active, Closed

@dataclass
class MasterCase:
    case_id: str
    job_id: str
    immutable_rules: dict        # Hard Lines (non-negotiable)
    elastic_weights: dict        # Flexible heuristics
    learned_patterns: dict       # Adaptive Brain updates
```

```python
# domain/dossier.py
@dataclass
class ReasoningClaim:
    claim: str
    evidence: str                # Source URL (GitHub, etc.)
    grounding_status: GroundingStatus  # verified / inferred / ungrounded

@dataclass
class Dossier:
    dossier_id: str
    job_id: str
    candidate_id: str
    match_score: float
    confidence_tier: ConfidenceTier    # GREEN / AMBER / RED
    reasoning_summary: list[ReasoningClaim]
    hard_line_violations: list[str]
    triple_validation: TripleValidationResult
```

```python
# domain/consent.py
@dataclass
class ConsentRecord:
    consent_id: str
    candidate_id: str
    employer_id: str
    scoped_permissions: list[str]      # ["pii_read", "experience_verify"]
    expiry_date: datetime
    signature_blob: str                # Cryptographic signature
    status: ConsentStatus              # ACTIVE / REVOKED
```

```python
# domain/session.py
@dataclass
class AgentSession:
    session_id: str
    dossier_id: str | None
    current_state: AgentState          # AI_Mode / Evaluator / Human_Mode
    current_agent: AgentType           # QRECRUITER / QINTERVIEWER / ENGAGE
    risk_score: float
    pipeline_stage: PipelineStage      # SCREENING / INTERVIEWING / ENGAGING
```

---

### 3. Agents (`agents/`) — **S + L + O**

Each agent is a single-responsibility unit implementing the `IAgent` contract. The orchestrator chains them sequentially.

#### `BaseAgent` (Abstract — Liskov contract)

```python
# agents/base.py
from abc import ABC, abstractmethod

class BaseAgent(ABC):
    """
    S: Each agent does exactly one thing.
    L: Any subclass can replace this without breaking the orchestrator.
    """

    def __init__(self, cache: ICacheService, llm: ILLMProvider):
        self._cache = cache
        self._llm = llm

    @abstractmethod
    async def execute(self, session: AgentSession) -> AgentResult: ...

    @abstractmethod
    async def generate_summary(self, session: AgentSession) -> dict: ...

    @abstractmethod
    async def destroy_ephemeral(self, session_id: str) -> None:
        """Each agent defines what IT specifically destroys."""
        ...

    async def should_escalate(self, session: AgentSession) -> bool:
        """Common grey-zone detection (60-75% confidence)."""
        return 0.60 <= session.risk_score <= 0.75
```

#### `QRecruiterAgent` — Voice Screening

```python
# agents/qrecruiter/agent.py

class QRecruiterAgent(BaseAgent):
    """
    S: Only handles voice screening.
    Ephemeral: Full conversation destroyed. Only structured summary persists.
    """

    def __init__(self, cache, llm, voice_client: RetellVoiceClient,
                 consent_collector: ConsentCollector):
        super().__init__(cache, llm)
        self._voice = voice_client
        self._consent = consent_collector

    async def execute(self, session: AgentSession) -> AgentResult:
        # 1. Initiate voice call via Retell.ai
        # 2. Obtain verbal consent before proceeding
        # 3. Conduct screening questions based on Master Case
        # 4. Generate structured summary
        # 5. Destroy raw conversation
        ...

    async def destroy_ephemeral(self, session_id: str) -> None:
        """Destroy: full conversation transcript, raw audio, LLM reasoning trace."""
        await self._cache.flush_session(f"qrecruiter:{session_id}")
```

#### `QinterviewerAgent` — Technical Assessment

```python
# agents/qinterviewer/agent.py

class QinterviewerAgent(BaseAgent):
    """
    S: Only handles technical interviews + code proctoring.
    Ephemeral: Video stream + raw transcript destroyed.
              Rubric scores + code submission + recommendation persist.
    """

    def __init__(self, cache, llm, rubric_evaluator: RubricEvaluator,
                 code_executor: CodeExecutor):
        super().__init__(cache, llm)
        self._rubric = rubric_evaluator
        self._code = code_executor

    async def execute(self, session: AgentSession) -> AgentResult:
        # 1. Set up interview environment
        # 2. Evaluate against rubric categories
        # 3. Execute code submission (HackerRank-style)
        # 4. Generate recommendation (Strong Hire/Hire/No Hire)
        # 5. Destroy video stream + raw transcript
        ...

    async def destroy_ephemeral(self, session_id: str) -> None:
        """Destroy: video stream, raw transcript, LLM reasoning trace."""
        await self._cache.flush_session(f"qinterviewer:{session_id}")
```

#### `EngageAgent` — Candidate Engagement

```python
# agents/engage/agent.py

class EngageAgent(BaseAgent):
    """
    S: Only handles candidate communication + engagement tracking.
    Ephemeral: Draft email content + LLM generation context destroyed after sending.
              Engagement events (opened/replied/ghosting) persist.
    """

    def __init__(self, cache, llm, outreach: OutreachEngine,
                 ghosting: GhostingDetector, post_offer: PostOfferTracker):
        super().__init__(cache, llm)
        self._outreach = outreach
        self._ghosting = ghosting
        self._post_offer = post_offer

    async def execute(self, session: AgentSession) -> AgentResult:
        # 1. Determine seniority-appropriate outreach
        # 2. Generate personalized message via LLM
        # 3. Send message
        # 4. Destroy draft + LLM context
        # 5. Monitor for ghosting (3+ days)
        ...

    async def destroy_ephemeral(self, session_id: str) -> None:
        """Destroy: draft email content, LLM generation context."""
        await self._cache.flush_session(f"engage:{session_id}")
```

#### `AgentOrchestrator` — Sequential Pipeline

```python
# agents/orchestrator.py

class AgentOrchestrator:
    """
    O: Add new agents without modifying this class (pipeline is configurable).
    D: Depends on IAgent interface, not concrete agents.
    """

    def __init__(self, pipeline: list[BaseAgent],
                 escalation_service: EscalationService):
        self._pipeline = pipeline          # [QRecruiter, Qinterviewer, Engage]
        self._escalation = escalation_service

    async def run_pipeline(self, session: AgentSession) -> PipelineResult:
        """Execute agents sequentially. Escalate on grey zone."""
        for agent in self._pipeline:
            if not await agent.can_handle(session):
                continue

            if await agent.should_escalate(session):
                await self._escalation.trigger(session)
                return PipelineResult(status="ESCALATED", stopped_at=agent)

            result = await agent.execute(session)
            await agent.destroy_ephemeral(session.session_id)

            if result.outcome == "FAILED":
                return PipelineResult(status="REJECTED", stopped_at=agent)

            session = self._advance_session(session, result)

        return PipelineResult(status="COMPLETED")
```

---

### 4. Services (`services/`) — **S + O**

Each service owns one business capability. Services depend only on interfaces.

#### `ConsentService` — The Legal Bridge

```python
# services/consent_service.py

class ConsentService:
    """
    S: Only manages consent lifecycle (grant, revoke, verify).
    D: Depends on ICacheService, IRepository, IEncryptionService.
    """

    def __init__(self, cache: ICacheService, consent_repo: IRepository[ConsentRecord],
                 candidate_repo: IRepository[Candidate],
                 encryption: IEncryptionService):
        self._cache = cache
        self._consent_repo = consent_repo
        self._candidate_repo = candidate_repo
        self._encryption = encryption

    async def grant_consent(self, request: ConsentGrantRequest) -> ConsentRecord:
        """Move data from ephemeral Redis → encrypted RuneGrid vault."""
        # 1. Verify session exists in Redis (SovereigntyCheck middleware)
        # 2. Validate cryptographic signature
        # 3. Encrypt PII with candidate-specific KMS key
        # 4. Write to Consent_Ledger
        # 5. Persist to RuneGrid candidates + verified_profiles
        # 6. Flush Redis session
        ...

    async def revoke_consent(self, candidate_id: str) -> None:
        """Trigger the atomic purge pipeline."""
        # 1. Mark Consent_Ledger as REVOKED
        # 2. Dispatch Celery purge task with 30-day deadline
        ...
```

#### `EvaluationService` — Triple-Layer Validation

```python
# services/evaluation_service.py

class EvaluationService:
    """
    S: Only orchestrates the 3-layer validation.
    O: New validation layers can be added without modifying existing ones.
    """

    def __init__(self, llm: ILLMProvider,
                 master_case_repo: IRepository[MasterCase],
                 validators: list[IValidator]):    # O: extensible
        self._llm = llm
        self._mc_repo = master_case_repo
        self._validators = validators              # [RuleValidator, SemanticValidator, LLMJudge]

    async def score_candidate(self, job_id: str, candidate_data: dict) -> Dossier:
        """Run Triple-Layer Validation against Master Case."""
        master_case = await self._mc_repo.get_by_id(job_id)

        # Run all validators in sequence
        results = []
        for validator in self._validators:
            result = await validator.validate(candidate_data, master_case)
            results.append(result)
            if result.is_blocking_failure:
                break

        return self._build_dossier(results, master_case)
```

#### `PurgeService` — Atomic Purge & Anonymization

```python
# services/purge_service.py

class PurgeService:
    """
    S: Only manages the 3-stage purge pipeline.
    Stages: Vault Erasure → Brain Scrubbing → ATS Stub Anonymization
    """

    def __init__(self, encryption: IEncryptionService,
                 candidate_repo: IRepository[Candidate],
                 dossier_repo: IRepository[Dossier],
                 cache: ICacheService,
                 ats_client: MergeDevATSClient):
        ...

    async def execute_purge(self, candidate_id: str) -> PurgeAuditEntry:
        # Stage 1: Vault Erasure — KMS key destruction + record hard delete
        # Stage 2: Brain Scrubbing — Anonymize dossier reasoning (strip URLs, names)
        # Stage 3: ATS Stub — Replace name with REDACTED_BY_QALANA, nullify contact
        ...
```

#### `EscalationService` — HITL Handoff

```python
# services/escalation_service.py

class EscalationService:
    """
    S: Only manages HITL escalation lifecycle.
    D: Depends on INotificationChannel (WhatsApp/Slack abstracted).
    """

    def __init__(self, llm: ILLMProvider,
                 notification: INotificationChannel,
                 escalation_repo: IRepository[Escalation]):
        ...

    async def trigger(self, session: AgentSession) -> Escalation:
        # 1. Generate 3-bullet summary via LLM
        # 2. Route to assigned recruiter via notification channel
        # 3. Pause AI agent, switch session to Human_Mode
        # 4. Log escalation
        ...
```

---

### 5. Infrastructure (`infrastructure/`) — **D**

Concrete implementations of all interfaces. These are the only files that import external libraries.

#### Database Models (ERD from docs → SQLAlchemy)

```python
# infrastructure/persistence/models.py

# ═══ RuneGrid Cluster (Candidate Sovereignty) ═══

class CandidateModel(Base):
    __tablename__ = "candidates"
    candidate_id = Column(UUID, primary_key=True)
    kms_key_arn = Column(String, nullable=False)
    email_enc = Column(LargeBinary)                # pgcrypto encrypted
    phone_enc = Column(LargeBinary)                # pgcrypto encrypted
    created_at = Column(DateTime, default=func.now())

class VerifiedProfileModel(Base):
    __tablename__ = "verified_profiles"
    profile_id = Column(UUID, primary_key=True)
    candidate_id = Column(UUID, ForeignKey("candidates.candidate_id"))
    resume_metadata = Column(JSONB)
    verification_badges = Column(JSONB)

class ConsentLedgerModel(Base):
    __tablename__ = "consent_ledger"
    consent_id = Column(UUID, primary_key=True)
    candidate_id = Column(UUID, ForeignKey("candidates.candidate_id"))
    employer_id = Column(UUID, ForeignKey("employers.employer_id"))
    scoped_permissions = Column(JSONB)
    expiry_date = Column(DateTime)
    signature_blob = Column(String)

# ═══ Qalana Cluster (Employer Operations) ═══

class EmployerModel(Base):
    __tablename__ = "employers"
    employer_id = Column(UUID, primary_key=True)
    tenant_config = Column(JSONB)

class JobModel(Base):
    __tablename__ = "jobs"
    job_id = Column(UUID, primary_key=True)
    employer_id = Column(UUID, ForeignKey("employers.employer_id"))
    raw_jd = Column(Text)
    status = Column(PGEnum(JobStatus))

class MasterCaseModel(Base):
    __tablename__ = "master_cases"
    case_id = Column(UUID, primary_key=True)
    job_id = Column(UUID, ForeignKey("jobs.job_id"))
    immutable_rules = Column(JSONB)
    elastic_weights = Column(JSONB)
    learned_patterns = Column(JSONB)

class DossierModel(Base):
    __tablename__ = "dossiers"
    dossier_id = Column(UUID, primary_key=True)
    job_id = Column(UUID, ForeignKey("jobs.job_id"))
    candidate_id = Column(UUID)                    # Cross-cluster READ ONLY
    match_score = Column(Float)
    reasoning_summary = Column(JSONB)
    confidence_tier = Column(PGEnum(ConfidenceTier))

# ═══ HITL & Agent State Cluster ═══

class AgentSessionModel(Base):
    __tablename__ = "agent_sessions"
    session_id = Column(UUID, primary_key=True)
    dossier_id = Column(UUID, ForeignKey("dossiers.dossier_id"))
    current_state = Column(PGEnum(AgentState))
    current_agent = Column(PGEnum(AgentType))
    risk_score = Column(Float)

class HITLEscalationModel(Base):
    __tablename__ = "hitl_escalations"
    escalation_id = Column(UUID, primary_key=True)
    session_id = Column(UUID, ForeignKey("agent_sessions.session_id"))
    assigned_recruiter_id = Column(UUID)
    tutor_summary = Column(JSONB)
```

---

### 6. API Layer (`api/`) — **S + I**

Each router owns exactly one resource. Schemas are segregated per resource.

#### API Endpoints (from API Contract doc + agent surfaces)

| Method | Endpoint | Router | Source Doc |
|--------|----------|--------|------------|
| `POST` | `/auth/login` | auth.py | — |
| `POST` | `/auth/register` | auth.py | — |
| `POST` | `/v1/consent/grant` | consent.py | API Contract §1 |
| `POST` | `/v1/consent/revoke` | consent.py | Anonymization |
| `GET` | `/v1/consent/{candidate_id}` | consent.py | — |
| `POST` | `/v1/evaluate/score` | evaluation.py | API Contract §2 |
| `POST` | `/v1/agent/escalate` | escalation.py | API Contract §3 |
| `GET` | `/v1/escalations` | escalation.py | — |
| `PATCH` | `/v1/escalations/{id}/resolve` | escalation.py | — |
| `GET` | `/v1/jobs` | jobs.py | ERD |
| `POST` | `/v1/jobs` | jobs.py | ERD |
| `GET` | `/v1/jobs/{id}` | jobs.py | ERD |
| `POST` | `/v1/master-cases` | master_cases.py | MC Implementation |
| `GET` | `/v1/master-cases/{id}` | master_cases.py | MC Implementation |
| `PUT` | `/v1/master-cases/{id}` | master_cases.py | MC Implementation |
| `GET` | `/v1/candidates` | candidates.py | ERD |
| `GET` | `/v1/candidates/{id}/dossier` | candidates.py | ERD |
| `GET` | `/v1/agents/status` | agents.py | Telemetry |
| `POST` | `/v1/agents/pipeline/trigger` | agents.py | — |
| `POST` | `/v1/agents/pipeline/kill` | agents.py | Business Overview §4 |
| `GET` | `/v1/telemetry/metrics` | telemetry.py | Telemetry |
| `GET` | `/v1/telemetry/alerts` | telemetry.py | Telemetry |
| `GET` | `/v1/telemetry/drift` | telemetry.py | Telemetry |
| `POST` | `/v1/purge/request` | purge.py | Anonymization |
| `GET` | `/v1/purge/audit` | purge.py | Anonymization |
| `POST` | `/webhooks/retell` | webhooks.py | Technical Impl. |
| `POST` | `/webhooks/whatsapp` | webhooks.py | Technical Impl. |
| `POST` | `/webhooks/merge-dev` | webhooks.py | Technical Impl. |

#### Middleware Stack (from API Contract §4)

```
Request
  ↓
┌─────────────────────────────┐
│  Layer 1: Sovereignty Guard │  Strip PII unless consent_id in headers
├─────────────────────────────┤
│  Layer 2: Telemetry         │  OTel span injection + cost tracking
├─────────────────────────────┤
│  Layer 3: Rate Limiter      │  Per-tenant rate limits
├─────────────────────────────┤
│  Layer 4: Circuit Breaker   │  Retell.ai, Merge.dev resilience
└─────────────────────────────┘
  ↓
Router Handler
```

---

### 7. Celery Tasks — **S**

Each task file owns exactly one async job category.

| Task | Schedule | Purpose |
|------|----------|---------|
| `outreach_tasks.py` | On-demand | Send personalized outreach via GPT-4o mini |
| `purge_tasks.py` | On-demand + 30-day deadline | 3-stage atomic purge pipeline |
| `learning_tasks.py` | On "Hired" event | Post-hire inference extraction → Master Case update |
| `ghosting_tasks.py` | Cron (every 6 hours) | Detect 3+ day silence → alert recruiter |
| `bias_audit_tasks.py` | Weekly cron | Run 500 biased/clean JD pairs → neutrality check |

---

### 8. Dependency Injection Container

```python
# dependencies.py

def get_cache() -> ICacheService:
    return RedisCacheService(settings.REDIS_URL)

def get_encryption() -> IEncryptionService:
    return KMSEncryptionService(settings.AWS_KMS_KEY_ARN)

def get_claude() -> ILLMProvider:
    return ClaudeProvider(api_key=settings.ANTHROPIC_API_KEY)

def get_openai() -> ILLMProvider:
    return OpenAIProvider(api_key=settings.OPENAI_API_KEY)

def get_notification() -> INotificationChannel:
    if settings.NOTIFICATION_CHANNEL == "whatsapp":
        return WhatsAppChannel(settings.META_API_KEY)
    return SlackChannel(settings.SLACK_WEBHOOK_URL)

# Agent pipeline assembly
def get_orchestrator() -> AgentOrchestrator:
    cache = get_cache()
    claude = get_claude()

    pipeline = [
        QRecruiterAgent(cache, claude, RetellVoiceClient(), ConsentCollector()),
        QinterviewerAgent(cache, claude, RubricEvaluator(), CodeExecutor()),
        EngageAgent(cache, get_openai(), OutreachEngine(), GhostingDetector(), PostOfferTracker()),
    ]
    return AgentOrchestrator(pipeline, get_escalation_service())
```

---

## Build Phases

| Phase | Scope | What It Delivers |
|-------|-------|-----------------|
| **1** | Core interfaces + domain models + config | All abstractions defined, zero runtime dependencies |
| **2** | Infrastructure: DB models + migrations + Redis cache | Data layer operational, ERD from docs implemented |
| **3** | Agent framework: BaseAgent + Orchestrator | Sequential pipeline skeleton (no real LLM calls yet) |
| **4** | QRecruiter agent + Retell.ai webhook | Voice screening end-to-end (first agent working) |
| **5** | Consent service + Consent Gate API | Ephemeral → persistent data flow |
| **6** | Evaluation service + Triple-Layer Validation | Scoring pipeline against Master Cases |
| **7** | Qinterviewer agent + code execution | Technical assessment + HackerRank-style code eval |
| **8** | Engage agent + outreach + ghosting detection | Engagement pipeline + Celery async tasks |
| **9** | HITL escalation + WhatsApp/Slack routing | Grey zone detection + human handoff |
| **10** | Purge pipeline + anonymization | 3-stage atomic purge (GDPR compliance) |
| **11** | Telemetry + observability + drift detection | OpenTelemetry + LangSmith integration |
| **12** | Learning loop + bias audit | Adaptive Brain + weekly bias check |
| **13** | Auth + RBAC + multi-tenancy | JWT + role-based access + RLS enforcement |
| **14** | Integration tests + E2E tests | Full pipeline validation |

---

## Open Questions

> [!IMPORTANT]
> 1. **Database deployment**: Single PostgreSQL instance with schema separation (RuneGrid vs Qalana schemas) or two physically separate instances as the docs suggest?

> [!IMPORTANT]
> 2. **Code execution sandbox for Qinterviewer**: Docker-based sandboxed execution (like Judge0) or delegate to an external service (HackerRank API, Sphere Engine)?

> [!IMPORTANT]
> 3. **LLM provider preferences**: Should Claude be the primary for all reasoning, with GPT-4o mini only for cost-efficient tasks (emails, telemetry sampling)? Or are there other preferences?

> [!IMPORTANT]
> 4. **Auth strategy**: JWT-based with refresh tokens? Or integrate with an external IdP (Auth0, Supabase Auth, AWS Cognito)?

---

## Verification Plan

### Automated Tests
- **Unit tests**: Every service tested with mocked interfaces (100% interface coverage)
- **Integration tests**: Consent flow, agent pipeline, purge pipeline tested against real PostgreSQL + Redis
- **E2E tests**: Full recruitment flow from sourcing → screening → interview → engage → hire
- **Bias audit**: Automated 500-pair JD bias test

### Manual Verification
- Trigger full pipeline via API: create job → build Master Case → trigger QRecruiter → advance to Qinterviewer → Engage → verify dossier
- Verify ephemeral data destruction: confirm Redis keys deleted after each agent
- Verify consent gate: attempt to read data without consent → should fail
- Verify purge: revoke consent → verify 3-stage purge completes → verify "Zombie Data" cron finds nothing
