# PRD: Data Pipeline and Contracts

## Objective
Stabilize data movement into dashboards through explicit contracts, validation gates, and deterministic recovery behavior.

## Scope
- In scope: ingestion schema contract, transform contract, storage contract, dashboard read contract.
- In scope: validation, dead-lettering, replay protocol, idempotency enforcement.
- Out of scope: changing source systems or introducing a new datastore.

## Data sources
- Raw source payloads from configured connectors
- Normalized records in `data/phase1/signals.json`
- Failures in `data/phase1/dead-letter-queue.jsonl`
- Replay/dedupe metadata in `data/phase1/idempotency.json`

## Functional requirements
1. Define canonical signal schema (required fields, enums, time format).
2. Validate all inbound records against schema before persistence.
3. Route invalid records to dead-letter queue with reason code.
4. Enforce idempotency using stable event key and replay-safe writes.
5. Publish read-model contract consumed by OPS and Taskmaster dashboards.
6. Provide daily contract validation report with pass/fail counts.

## Non-functional requirements
- At-least-once ingestion with exactly-once effective write via idempotency keys.
- Contract validation overhead < 15% of baseline processing time.
- Replay must be deterministic and bounded by configurable batch size.
- Observability: emit metrics for contract failures by source and reason.

## Implementation steps
1. Write versioned schema files and contract README in `prd/` references.
2. Add validator module at ingestion boundary.
3. Implement dead-letter writer with reason taxonomy.
4. Add idempotency middleware for inserts/updates.
5. Build read-model adapter for dashboard endpoints.
6. Add contract test suite with valid/invalid fixtures and replay tests.

## Test/acceptance checklist
- [ ] Invalid payloads never enter normalized store.
- [ ] Dead-letter entries include source, event key, reason, timestamp.
- [ ] Replay does not duplicate records already applied.
- [ ] Dashboard endpoints remain stable across schema v1 payloads.
- [ ] Daily validation report is generated and stored.

## Risks
- Contract churn can break consumers if versioning discipline is weak.
- Dead-letter growth can mask systemic source failures.
- Non-deterministic source IDs can weaken idempotency guarantees.

## Rollback
- Keep previous contract version active behind `CONTRACT_VERSION=v1` switch.
- Disable new validator path and route to previous transform path if failure spikes.
- Preserve dead-letter logs for post-rollback replay.
