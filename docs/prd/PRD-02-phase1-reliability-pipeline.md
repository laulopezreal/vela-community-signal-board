# PRD-02: Phase 1 Reliability Pipeline

## Goal
Make ingestion and ranking resilient under real Discord traffic patterns.

## Deliverables
- Normalization + dedupe + ranking worker path.
- Idempotency store/guard by provider:event_type:event_id.
- Retry wrapper with exponential backoff + jitter.
- Dead-letter queue persistence and inspection command.
- Replay command by trace ID/time range.

## Acceptance
- Duplicate events are safely ignored.
- Failing events route to DLQ with reason.
- Replay recovers selected failed events without corruption.
