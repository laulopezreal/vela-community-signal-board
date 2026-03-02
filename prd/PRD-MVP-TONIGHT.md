# PRD: MVP Tonight

## Objective
Ship a deployable MVP tonight that gives actionable visibility into operations and task execution without waiting for full platform completeness.

## Scope
- In scope tonight: minimal OPS dashboard, minimal Taskmaster board, basic pipeline contract checks.
- In scope tonight: static auth-protected internal access, manual refresh fallback.
- Out of scope tonight: advanced analytics, long-term trend forecasting, multi-tenant controls.

## Data sources
- Existing phase1 data files (`signals.json`, `dead-letter-queue.jsonl`, `idempotency.json`)
- Current task store snapshot endpoint
- Runtime execution events from existing logs

## Functional requirements
1. Deliver two routes:
   - `/ops` with 4 core cards + failure list
   - `/taskmaster` with 5 lanes + assignee count
2. Implement one-click refresh on each dashboard.
3. Show blocker banner when data feed is stale (>15 minutes).
4. Add a single "retry failed" action for OPS failed items.
5. Add a single "mark done" action for Taskmaster tasks.

## Non-functional requirements
- End-to-end deployment in one evening window.
- No migration requiring downtime.
- Error handling must fail closed (show explicit degraded state, no silent empty UI).
- Keep dependencies to existing stack only.

## Implementation steps
1. Scaffold routes and shared dashboard shell.
2. Implement minimal aggregate endpoints.
3. Build core UI widgets (cards, table/list, lane board).
4. Add two critical actions (retry failed, mark done).
5. Add stale-data detector and degraded-state banners.
6. Run smoke tests and deploy behind feature flags.

## Test/acceptance checklist
- [ ] Both routes load in production environment.
- [ ] Core metrics and counts display non-null values.
- [ ] Stale-data banner appears when feed age threshold is exceeded.
- [ ] Retry failed and mark done actions succeed and persist.
- [ ] Feature flags can disable routes instantly.

## Risks
- MVP pressure may skip edge-case handling for action failures.
- Task state/action semantics may diverge from existing workflows.
- Limited observability could hide latent data drift.

## Rollback
- Disable `OPS_DASHBOARD_ENABLED` and `TASKMASTER_DASHBOARD_ENABLED`.
- Revert MVP route commit if runtime errors exceed threshold.
- Keep data processing jobs running unchanged to avoid side effects.
