# PRD: OPS Dashboard

## Objective
Provide an operator-first dashboard that shows ingestion health, queue pressure, delivery reliability, and incident state in one screen so daily operations can be executed without log-diving.

## Scope
- In scope: web dashboard for ops metrics, alerts panel, runbook shortcuts, manual retry controls.
- In scope: read from existing pipeline stores and task execution logs.
- Out of scope: redesign of ingestion architecture, new alert transport channels.

## Data sources
- `data/phase1/signals.json` (latest normalized signals)
- `data/phase1/dead-letter-queue.jsonl` (failed records)
- `data/phase1/idempotency.json` (dedupe and replay state)
- Job execution logs from existing scheduler/runtime

## Functional requirements
1. Show 24h throughput, success rate, failure rate, and p95 processing latency.
2. Show queue-depth cards: pending, failed, retried, permanently dropped.
3. Show "Top blockers" list grouped by error type with sample record IDs.
4. Support filtered timeline by status, source, and severity.
5. Provide manual actions:
   - Retry selected failed records
   - Mark incident acknowledged
   - Open runbook links for each error class
6. Keep dashboard state shareable via URL query params.

## Non-functional requirements
- Initial load < 2s on warm cache.
- Data refresh every 60s without full page reload.
- UI must remain usable on 1366x768 and above.
- All operator actions must be audit-logged.

## Implementation steps
1. Add `/ops` route and layout shell.
2. Implement backend read endpoints for metrics aggregate + failure groups.
3. Implement cards + blockers table + timeline widgets.
4. Wire action endpoints for retry/acknowledge with audit log write.
5. Add URL-driven filters and persisted view state.
6. Add smoke tests for rendering and action roundtrips.

## Test/acceptance checklist
- [ ] Metrics cards match backend aggregates for same time window.
- [ ] Failure groups update after retry action.
- [ ] Retry action writes audit log entry with actor + timestamp.
- [ ] Filters persist in URL and survive refresh.
- [ ] Dashboard remains responsive under 5k-row timeline.

## Risks
- Aggregation queries can become expensive as volume grows.
- Manual retry could reintroduce duplicates if idempotency keys are missing.
- Inconsistent error taxonomies can fragment blocker grouping.

## Rollback
- Feature-flag `/ops` route behind `OPS_DASHBOARD_ENABLED`.
- On regression, disable flag and revert dashboard routes/endpoints.
- Keep data pipeline untouched so rollback is UI/API-only.
