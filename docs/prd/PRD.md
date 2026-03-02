# PRD: Discord Native Integration for Community Signal Board

## 1) Objective
Build a production-ready Discord integration that ingests raw community signals directly from Discord, normalizes and ranks them, and serves a trustworthy decision-ready board to operators.

## 2) Success Criteria
- Ingest raw Discord events into durable storage with traceability.
- Produce normalized signals and ranked outputs deterministically.
- Expose board data via API for frontend consumption.
- Maintain reliability guarantees (idempotency, retry, DLQ, replay).
- Preserve security with least-privilege bot scopes and safe token handling.

## 3) User Problems
- High-value opportunities are buried in Discord channel noise.
- Manual triage is slow and inconsistent.
- No shared, auditable prioritization path for operator actions.

## 4) Personas
- Community Operator: triages opportunities and assigns actions.
- Growth/PM Lead: needs ranked queue and deadlines.
- Reviewer/Judge: needs reproducible proof path from input to decision output.

## 5) Scope
### In scope
- Discord bot gateway ingestion path.
- Fallback export/pull path.
- Raw event contract and normalized signal contract.
- Ranking + decision outputs.
- API endpoints for ingestion and board read.
- Reliability + observability baseline.

### Out of scope (for initial rollout)
- Full multi-tenant RBAC UI.
- Advanced semantic enrichment models.
- Complex analytics dashboards beyond baseline metrics.

## 6) Functional Requirements
1. POST `/v1/ingest/discord/events` accepts Discord raw events.
2. Persist raw events append-only with trace metadata.
3. Normalize events into canonical `NormalizedSignal` records.
4. Dedupe and rank signals into ordered board payload.
5. Produce decision outputs with owner/action/deadline/expected metric.
6. GET `/v1/board` returns latest ranked board snapshot.
7. Replay capability by trace ID/time range.
8. Deterministic fixture flow for demo evidence.

## 7) Non-Functional Requirements
- Reliability: idempotent ingestion, retries with backoff+jitter, DLQ.
- Performance: near-real-time target in later phase, stable batch in phase 0.
- Security: secrets in env only, allowlisted channels, audit logging.
- Operability: structured logs, health checks, clear runbooks.

## 8) Data Contracts (Summary)
- `DiscordRawEvent`: provider/event_type/event_id/timestamps/guild+channel+message IDs/payload/hash/idempotency_key/trace_id.
- `NormalizedSignal`: canonical source link/content/author/timestamps/scores/dedupe/quality flags.
- `DecisionOutput`: rank band/owner/action/deadline/metric/explainability/audit refs.

## 9) API Contract (Initial)
- `POST /v1/ingest/discord/events`
  - Input: one or many `DiscordRawEvent`
  - Output: accepted/rejected counts + trace IDs
- `GET /v1/board`
  - Output: ranked signals + decision outputs + metadata (`generated_at`, `source`, `trace_ref`)

## 10) Milestones
- Phase 0: contracts + ingest endpoint + persisted board endpoint + deterministic fixture flow.
- Phase 1: normalization/dedupe/ranking worker + idempotency/retry/DLQ/replay.
- Phase 2: near-real-time streaming updates + observability and alerts.

## 11) Risks and Mitigation
- Discord API/rate limits -> bounded retries + fallback export mode.
- Event duplication/out-of-order -> idempotency keys + deterministic upserts.
- Judge/demo fragility -> fixture-based end-to-end proof command.
- Drift between docs/code -> contract-first docs and validation checks.

## 12) Acceptance
- End-to-end command demonstrates: raw event -> normalized signal -> ranked board -> decision output.
- `GET /v1/board` is reproducible from persisted data.
- Reliability controls are implemented and documented.
