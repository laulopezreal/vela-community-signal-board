# ADR-0001: MVP Client-Only State and Migration to Multi-Tenant Production Architecture

- **Status:** Proposed
- **Date:** 2026-03-07
- **Decision owners:** Community Signal Board maintainers
- **Functional reference:** `app/index.html` and `app/main.js` are the source of truth for current UX, capture flow, and scoring behavior.

## Context

The current application is a static front-end MVP with no backend service. It uses browser-managed persistence and deterministic markdown exports to demonstrate value quickly.

Current in-app signal model (from `main.js`) uses:

- `title`
- `source`
- `category`
- `urgency`
- `relevance`
- `confidence`
- `owner`
- `createdAt`

Scoring in the MVP is intentionally transparent and currently defined as:

```text
score = urgency * 2 + relevance + confidence
```

## Current architecture constraints (as-built)

### 1) localStorage-only persistence

- All saved signals are persisted in browser storage under `STORAGE_KEY = community-signal-board-v1`.
- Form drafts are persisted under `FORM_DRAFT_KEY = community-signal-board-form-draft-v1`.
- Persistence and recovery behavior are best-effort and client-side only.
- No server-side durability guarantees exist today.

### 2) Single-tenant / single-session behavior

- Data is scoped to one browser profile on one device.
- There is no authentication, user identity, or organization boundary.
- No cross-device sync exists.
- Any collaborator workflow is manual (copying digest output to chat/email).

### 3) Static export-only outputs

- Output artifacts are generated client-side as markdown text.
- The two operational outputs are:
  - brief markdown
  - digest markdown
- No canonical server-side report store exists.
- No API contract currently versions exported artifacts.

## Decision

Keep `app/index.html` and `app/main.js` behavior stable as the MVP reference implementation while introducing a production target architecture that preserves the user-facing workflow and scoring semantics.

## Target production architecture

### A) API service

Introduce a backend API service to become the system of record for signals, actions, and exports.

Responsibilities:

- CRUD for signals and actions
- deterministic ranking endpoint that preserves MVP scoring logic
- export generation endpoints for brief/digest markdown
- audit/event logging for state changes

### B) Relational database for signals/actions

Adopt a relational database (for example PostgreSQL) for durable, queryable storage.

Core tables:

- `organizations`
- `users`
- `organization_memberships`
- `signals`
- `signal_actions`
- `ingestion_jobs`
- `ingestion_events`
- `exports`

### C) Auth + organizations model

Introduce identity and tenancy boundaries:

- authenticated users
- organization-based data partitioning
- role-aware access (e.g., admin/member/viewer)
- ownership attribution for created/updated records

### D) Background ingestion workers

Introduce asynchronous workers for external/community source ingestion.

Responsibilities:

- pull/parse source payloads
- normalize to internal signal schema
- deduplicate and upsert records
- enqueue scoring and export regeneration
- track retries/failures with observability hooks

## Migration mapping: MVP entities (`main.js`) -> backend schema

| MVP field (`main.js`) | Backend table.column | Type (suggested) | Mapping notes |
|---|---|---|---|
| `title` | `signals.title` | `TEXT NOT NULL` | Direct mapping; trim/collapse whitespace as in MVP sanitization. |
| `source` | `signals.source_label` | `TEXT NOT NULL` | Direct mapping from capture source name (Slack, email, etc.). |
| `category` | `signals.category` | `VARCHAR(32) NOT NULL` | Preserve MVP enum values initially (`Opportunity`, `Funding`, `Event`, `Tool`, `Hiring`). |
| `urgency` | `signals.urgency` | `SMALLINT NOT NULL` | Preserve MVP range clamp `1..5`. |
| `relevance` | `signals.relevance` | `SMALLINT NOT NULL` | Preserve MVP range clamp `1..5`. |
| `confidence` | `signals.confidence` | `SMALLINT NOT NULL` | Preserve MVP range clamp `1..5`. |
| `owner` | `signals.owner_display_name` + optional `signals.owner_user_id` | `TEXT NULL` + `UUID NULL` | Keep existing free-text `owner`; allow future linkage to a user account when resolvable. |
| `createdAt` | `signals.captured_at` | `TIMESTAMPTZ NOT NULL` | Convert from epoch millis to timestamp with timezone. |

### Additional backend-managed fields (new)

- `signals.id` (UUID PK)
- `signals.organization_id` (tenant boundary)
- `signals.created_by_user_id`
- `signals.updated_at`
- `signals.score_cached` (optional materialized score)
- `signals.raw_payload` (optional provenance JSON)

## Compatibility and rollout notes

1. **Phase 0 (current):** MVP remains static/client-only.
2. **Phase 1:** Add API and DB; dual-write from UI (local + API) behind feature flag.
3. **Phase 2:** Migrate read path to API-first with local fallback.
4. **Phase 3:** Introduce auth/org scoping and worker-based ingestion.
5. **Phase 4:** Deprecate localStorage as primary persistence, retaining optional offline draft cache only.

## Consequences

### Positive

- Durable and queryable history
- Multi-user collaboration with organization boundaries
- Observable ingestion pipeline
- Controlled export lifecycle and auditability

### Trade-offs

- Added operational complexity (API + DB + workers)
- Authentication and authorization overhead
- Migration effort for existing local data

## Out of scope (this ADR)

- Final provider selection for auth/database/queue
- Detailed API route specification
- Full ERD and indexing strategy

