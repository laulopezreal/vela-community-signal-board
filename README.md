# Community Signal Board

Turn community chaos into clear next actions.

Built for founder and operator communities where opportunities get buried in chat noise.

## Why this exists
Important updates are scattered across channels and disappear fast.
Community Signal Board gives you one ranked queue so you can act today, not next week.

## One-line pitch
A lightweight board that captures community signals, ranks what matters now, and generates a shareable daily digest.

## What it does
- Captures high-signal updates manually (title, source, urgency, category, relevance, confidence, owner)
- Tracks workflow fields per signal (`status`, `due_at`, `assigned_user_id`, `action_notes`)
- Ranks updates with a transparent scoring formula: `urgency * 2 + relevance + confidence`
- Filters by category and urgency to focus fast
- Applies community templates (startup, OSS, local org) for faster, consistent capture
- Shows per-signal next-action guidance directly in the ranked board
- Supports async collaboration with per-signal comments + activity log
- Raises notifications for urgency threshold, overdue assigned work, and new assignments
- Sends daily priority and weekly team digests through Slack webhook and/or email client (`mailto`)
- Generates a daily brief markdown with action recommendations and explicit scoring formula
- Copies top actions to clipboard for fast sharing in chat/email
- Exports a markdown digest with recommended actions for async sharing
- Primary one-click judge path via **Submission Mode + Run Judge Fast Path**
- Explicit fallback demo flow via **Run Health Check + Load Demo Scenario**
- Generates daily brief and digest markdown artifacts for judging evidence
- Safely recovers from corrupted localStorage data without breaking app load

## Why this community
Small founder and builder groups miss opportunities when important signals are split across Slack, X, email, and chats. This app creates one clean board and one daily digest.

## Real Value Proof (submission block)
- **User / job-to-be-done:** founder/operator who must convert scattered community signals into a same-day prioritized action queue.
- **Baseline (before):** manual multi-channel scanning, ad hoc prioritization, no reproducible ranked output from exported real inputs.
- **After (with app):** exported JSON signals pass through a deterministic adapter path into a ranked queue using Vela scoring.
- **Measurable delta:** triage moves from variable manual sorting to one deterministic command run with replayable output artifact.
- **Proof artifacts:** [docs/artifacts/real-value-before-after.md](docs/artifacts/real-value-before-after.md), [ops/real-input-adapter-contract.md](ops/real-input-adapter-contract.md), [docs/artifacts/sample-exported-signals.json](docs/artifacts/sample-exported-signals.json), [docs/artifacts/real-input-ranked-queue-snapshot.md](docs/artifacts/real-input-ranked-queue-snapshot.md)

## Real input readiness (local, no secrets)
Run the local ingestion bridge from repo root:

```bash
npm install
npm start
```

Open: http://localhost:5173

### Backend/auth assumptions
- This repo now runs a built-in `server/` (Express + SQLite) and serves the front-end from the same port.
- Authentication uses a **magic-link style** flow via API endpoints (`/api/auth/request-link` + `/api/auth/verify`).
- For local development, the front-end auto-bootstraps a demo session (`demo@community.local`) and stores only the session token in localStorage.
- All signal and digest queries are scoped to the authenticated organization through membership checks.

### API endpoints (server)
- `POST /api/auth/request-link` and `POST /api/auth/verify`
- `GET /api/me`
- `GET /api/signals`, `GET /api/signals/filters`, `POST /api/signals`, `PATCH /api/signals/:id`, `DELETE /api/signals/:id`
- `POST /api/digests/generate`

### Import existing local export JSON
Use the migration script to import historic local export payloads into org-scoped backend records:

```bash
npm run import:local-export -- ./docs/artifacts/sample-exported-signals.json "Community Signal Board Demo Org" "demo@community.local"
```


## Connector ingestion pipeline (Discord / Slack / Email)

This repo now includes localized connector jobs that run a deterministic ingestion flow:

1. fetch/import payload (fixture exports under `ops/fixtures/`)
2. normalize to a shared signal shape
3. dedupe by `dedupeKey`
4. score via shared rubric module (`server/lib/scoring/`)
5. persist with idempotency checks into a local DB file (`server/db/community_signal_board.json`)

Run all connector jobs:

```bash
node ops/run_connector_jobs.js
```

Run fixture snapshot check (CI uses the same command):

```bash
./ops/check_connector_fixtures.sh
```

### Assumptions made for this implementation

- Because this MVP is local-first and has no dedicated connector backend service yet, the connector "DB" is implemented as a deterministic file-backed store in `server/db/community_signal_board.json` plus a SQL schema reference in `server/db/schema.sql`.
- Connector run history UI reads a generated static artifact at `app/data/connector-run-history.json`.
- Existing connector scripts under `ops/` are deterministic fixture drivers, not production ingestion daemons.
- Connector fixture CI runs on `dev` pushes and pull requests to match the current branch policy.
- If artifact conflicts happen during rebases/merges, run `./ops/resolve_connector_conflicts.sh` to regenerate deterministic connector + discord fixture outputs before finalizing conflicts.

## MVP scope
Included:
- Signal capture form
- Ranked dashboard
- Filters
- Digest export

## Implementation assumptions (for this iteration)
- Delivery is implemented in-browser (no backend service). Slack delivery uses an incoming webhook URL configured in UI; email delivery opens the user's email client via `mailto`.
- "Newly assigned" notifications are inferred from workflow activity entries generated when `assigned_user_id` changes.
- Overdue logic is date-only (`due_at < current local date`) and excludes signals already marked `done` or `dismissed`.

Not included (intentional weekend non-goals):
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


## Contribution workflow
- All pull requests must target the `dev` branch.
- CI enforces this via `.github/workflows/pr-base-dev.yml`; PRs to other base branches will fail the check.

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
