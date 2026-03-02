# PRD-03: Phase 2 Realtime + Observability

## Goal
Deliver near-real-time board updates with operational visibility.

## Deliverables
- Live gateway consumer for Discord bot events.
- SSE/WebSocket board update channel.
- Metrics: ingest latency, success/error rates, DLQ volume, replay counts.
- Alerting thresholds and response runbook.

## Acceptance
- Board updates stream without manual refresh in supported mode.
- Ops can detect and triage failures within minutes.
- Reliability metrics are queryable and documented.
