# PRD-01: Phase 0 Contracts + Ingest + Board API

## Goal
Ship contract-first foundation and deterministic board serving path.

## Deliverables
- Schema contracts for DiscordRawEvent, NormalizedSignal, DecisionOutput.
- `POST /v1/ingest/discord/events` endpoint.
- File-backed/raw persistence.
- `GET /v1/board` endpoint from persisted pipeline output.
- Fixture-driven demo command.

## Acceptance
- POST returns accepted/rejected with trace refs.
- GET returns ranked board payload.
- Demo command reproducibly generates proof artifacts.
