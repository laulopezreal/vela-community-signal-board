# Community Signal Board

Turn community chaos into clear next actions.

Built for founder and operator communities where opportunities get buried in chat noise.

## Why this exists
Important updates are scattered across channels and disappear fast.
Community Signal Board gives you one ranked queue so you can act today, not next week.

## One-line pitch
A lightweight board that captures community signals, ranks what matters now, and generates a shareable daily digest.

## What it does
- Add high-signal updates in seconds
- Rank them with a transparent formula: `urgency * 2 + relevance + confidence`
- Filter by category and urgency
- Surface clear next-action guidance
- Generate a daily brief and digest for async alignment

## Judge quickstart (90 seconds)
1. Run the app locally.
2. Turn **Submission Mode ON**.
3. Click **Run Judge Fast Path**.
4. Show ranked output and explain the scoring formula.
5. Close with impact: fewer missed opportunities, faster team alignment.

## Run locally
No build step required.

```bash
cd app
python3 -m http.server 5173
```

Open: http://localhost:5173

## Phase0 API quickcheck
- Contracts: `contracts/phase0/contracts.json`
- API server: `node server/phase0/server.js`
- Deterministic fixture demo: `node scripts/phase0/demo_phase0_flow.js`

## Challenge alignment
### Value Proposition
Helps real communities convert scattered signals into a same-day action queue.

### Creativity
Applies a simple, explainable prioritization engine to noisy community workflows.

### Technical Execution
Deterministic ranking, fast UI flow, and practical export path for real team use.

### Writing Quality
Clear story: noise in, priority out, action taken.

## MVP scope
Included:
- Signal capture form
- Ranked dashboard
- Filters
- Digest export

Not included (intentional):
- Auth and multi-tenant accounts
- Deep external integrations
- Heavy analytics layer

## Submission files
- `submission/SUBMISSION_DRAFT.md`
- `submission/SUBMISSION_RULES_SSOT.md`
- `submission/REPO_READINESS.md`

## 30-second opening narrative
Small communities lose opportunities because high-signal updates are fragmented across chats and channels. Community Signal Board turns that noise into one ranked action queue plus a daily brief and digest in under a minute.

## Phase1 reliability pipeline (PRD-02)
Run deterministic reliability path with idempotency + retry + DLQ:

```bash
node scripts/phase1/run_phase1_pipeline.js data/phase1/sample-phase1-events.json
```

Inspect DLQ entries:

```bash
node scripts/phase1/inspect_dlq.js
node scripts/phase1/inspect_dlq.js --trace <traceId>
node scripts/phase1/inspect_dlq.js --from 2026-03-02T02:00:00Z --to 2026-03-02T03:00:00Z
```

Replay failed entries by trace ID or time range:

```bash
node scripts/phase1/replay_dlq.js --trace <traceId>
node scripts/phase1/replay_dlq.js --from 2026-03-02T02:00:00Z --to 2026-03-02T03:00:00Z
```

Persistence files (`data/phase1/`): `idempotency.json`, `normalized-signals.json`, `ranked-board.json`, `dead-letter-queue.jsonl`, `contract-validation-report.json`.

Phase1 contract validation quick checks:

```bash
node scripts/phase1/test_contracts.js
node scripts/phase1/generate_contract_report.js
```

Contract docs:
- `contracts/phase1/signal.schema.v1.json`
- `contracts/phase1/read-model.contract.v1.json`
- `contracts/phase1/README.md`

## Acceptance + UX states (PRD)
- Shared state resolver: `app/ux-state.js`
- Canonical states on OPS + Taskmaster dashboard cards:
  - loading, ready, empty, partial, recoverable error, blocking error
- State-specific CTAs (retry, refresh, open runbook)
- Last updated + freshness age label per dashboard
- Screen-reader announcements via aria-live status regions
- Filter/cursor preservation during refresh/error transitions

Validation:
```bash
node scripts/ux_state_transitions_test.js
```

## Phase 2 Preview
Next implementation lane adds realtime board updates and observability baseline:
- SSE updates for board refresh events
- `/metrics` and `/readyz` endpoints
- basic alerting/runbook support
