# PRD: Acceptance and UX States

## Objective
Define clear acceptance criteria and user-facing UI states so operators always understand system status, data freshness, and next actions.

## Scope
- In scope: canonical UX states for OPS and Taskmaster dashboards.
- In scope: acceptance gates for release decision.
- Out of scope: visual brand refresh and non-operational marketing UI.

## Data sources
- Dashboard read endpoints (metrics, queues, tasks)
- Pipeline health/status endpoint
- Action mutation responses (retry, assign, mark done)

## Functional requirements
1. Implement explicit UI states on both dashboards:
   - Loading
   - Ready
   - Empty
   - Partial data
   - Error (recoverable)
   - Error (blocking)
2. Provide state-specific CTA copy (retry, refresh, open runbook).
3. Show "last updated" timestamp and freshness age.
4. Surface action result toasts with success/failure details.
5. Preserve user filters and cursor context after refresh/errors.

## Non-functional requirements
- State transitions must be deterministic and testable.
- No blank screens under API failures.
- Accessibility: status messages announced for screen readers.
- UX copy must be concise and operational (no ambiguous phrasing).

## Implementation steps
1. Create shared UI state contract and component map.
2. Implement state resolver utility from endpoint response signatures.
3. Build reusable state panels (empty, error, partial, loading).
4. Wire state telemetry events for transition tracking.
5. Add integration tests for all state transitions per route.
6. Run acceptance walk-through with checklist sign-off.

## Test/acceptance checklist
- [ ] Every API outcome maps to one defined UI state.
- [ ] Partial-data state shows available metrics + missing-segment notice.
- [ ] Blocking error state provides actionable recovery path.
- [ ] Filter state persists after error and successful retry.
- [ ] Screen reader announces state changes.

## Risks
- Inconsistent endpoint error shapes can produce wrong state mapping.
- Excessive toast noise can reduce operator signal-to-noise ratio.
- Partial-data handling may hide systemic pipeline degradation.

## Rollback
- Revert to baseline generic error handling component.
- Disable advanced state resolver via `UX_STATE_RESOLVER_ENABLED` flag.
- Keep acceptance checklist as gate for re-enabling.
