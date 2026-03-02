# PRD: Taskmaster Dashboard

## Objective
Create an execution dashboard for work orchestration that makes task priority, ownership, SLA risk, and completion flow explicit for daily shipping.

## Scope
- In scope: task queue board, SLA/risk views, assignee workload summary, quick state transitions.
- In scope: integration with existing task metadata and run states.
- Out of scope: replacing the current task engine or introducing new workflow semantics.

## Data sources
- Task store (active, queued, blocked, done states)
- Assignment metadata (owner, reviewer, due date, tags)
- Execution events (started, paused, completed, failed)

## Functional requirements
1. Display canonical task lanes: Backlog, Ready, In Progress, Blocked, Done.
2. Show per-lane counts and SLA-risk badges (green/yellow/red).
3. Provide assignee workload panel with WIP limit indicators.
4. Support inline actions: assign, reprioritize, move state, mark blocked/unblocked.
5. Show blocker reasons and dependency links per task.
6. Include "Today focus" section (top 3 highest impact tasks).

## Non-functional requirements
- Board interactions must complete < 300ms perceived latency.
- No data loss during concurrent edits (optimistic updates with server reconciliation).
- Keyboard-accessible interactions for all lane operations.
- Event history retention minimum 30 days.

## Implementation steps
1. Add `/taskmaster` route and state model for lane rendering.
2. Create aggregate endpoint for board snapshot + workload summary.
3. Implement lane UI with drag/drop and action menu fallbacks.
4. Implement mutation endpoints with conflict detection (version field).
5. Add dependency and blocker panel in task details drawer.
6. Add tests for concurrency conflicts, state transitions, and SLA badges.

## Test/acceptance checklist
- [ ] Lane counts match task store after refresh.
- [ ] Drag/drop and action-menu transitions both persist correctly.
- [ ] Conflicting edits surface a clear reconciliation message.
- [ ] SLA badges change when due date thresholds are crossed.
- [ ] "Today focus" auto-updates with priority and deadline changes.

## Risks
- Concurrent edits can create operator confusion without clear conflict UX.
- Over-aggressive WIP thresholds can reduce throughput.
- Dependency graph drift can make blocked state inaccurate.

## Rollback
- Gate dashboard under `TASKMASTER_DASHBOARD_ENABLED`.
- Revert route + mutation handlers if transition integrity fails.
- Keep task engine unchanged so rollback does not alter task data.
