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
- External API integrations
- Advanced analytics


## Architecture migration assumptions
- The ADR migration plan assumes organizations are the tenancy boundary and users can belong to multiple organizations via memberships.
- The current free-text `owner` field remains supported during migration and is mapped to `owner_display_name` until a resolvable user identity is available.
- MVP UX/scoring reference remains `app/index.html` + `app/main.js`; production work should preserve that behavior while moving persistence to API/DB.

## Dedicated style improvement loop (parallel to functional loop)
This repo now runs a separate style loop in parallel with feature work.

Style loop principles:
- No gradient page backgrounds unless Lau explicitly approves.
- Premium, clean, conversion-ready visual language.
- Small batches only: each style pass includes quick validation before the next pass.

Current style upgrades in this loop:
- Tighter visual hierarchy: cleaner heading scale, stronger spacing rhythm, calmer card surfaces.
- Component consistency: unified radius, border, shadow, button states, and focus-visible rings.
- Mobile polish: improved card/list behavior, better compact spacing, and safer bottom toast layout.

## Submission assets
- Demo screenshot: [docs/artifacts/judge-ready-screenshot.png](docs/artifacts/judge-ready-screenshot.png)
- Deterministic sample daily brief: [docs/artifacts/sample-daily-brief.md](docs/artifacts/sample-daily-brief.md)
- Deterministic sample digest: [docs/artifacts/sample-digest.md](docs/artifacts/sample-digest.md)
- Judge-run completion receipt sample: [docs/artifacts/judge-run-completion-receipt-2026-02-28.md](docs/artifacts/judge-run-completion-receipt-2026-02-28.md)
- Receipt hash verifier (CLI): `./ops/verify_receipt_hash.sh docs/artifacts/judge-run-completion-receipt-2026-02-28.md`
- Submission copy: [submission/SUBMISSION_DRAFT.md](submission/SUBMISSION_DRAFT.md)
- Repo readiness path: [submission/REPO_READINESS.md](submission/REPO_READINESS.md)
- Jury access fallback pack (artifact-first, no public-repo assumption): [docs/JURY_ACCESS_FALLBACK_PACK.md](docs/JURY_ACCESS_FALLBACK_PACK.md)

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

Persistence files (`data/phase1/`): `idempotency.json`, `normalized-signals.json`, `ranked-board.json`, `dead-letter-queue.jsonl`.


## Phase 2 Preview
Next implementation lane adds realtime board updates and observability baseline:
- SSE updates for board refresh events
- `/metrics` and `/readyz` endpoints
- basic alerting/runbook support
