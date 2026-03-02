# Checkpoint #1 - contracts + ingest + board (phase0)

This checkpoint adds a minimal file-backed phase0 API for Discord ingestion.

## Added endpoints

- `POST /v1/ingest/discord/events`
  - accepts either `{ "events": DiscordRawEvent[] }`, a single `DiscordRawEvent`, or an array.
  - normalizes incoming events, ranks them, and persists board output.
- `GET /v1/board`
  - returns the persisted ranked board and decision outputs.

## Contracts

JSON schema contracts are in:

- `ops/phase0/contracts.json`

Contains contract definitions for:
- `DiscordRawEvent`
- `NormalizedSignal`
- `DecisionOutput`

## Persistence

Phase0 store path:
- `data/phase0/store.json`

The store is append-safe for events and re-derives ranked output deterministically from all unique external IDs.

## Reproducible command block (end-to-end fixture demo)

Run from repo root:

```bash
node ops/phase0/demo_phase0_flow.js
```

Expected output includes:

- `PHASE0_API_LISTENING ...`
- `PHASE0_DEMO_PASS ingestAccepted=<n> ranked=<n> topSignal=<id>`

## Manual sanity check

```bash
# 1) start server
node ops/phase0/server.js

# 2) ingest fixture events
curl -sS -X POST http://127.0.0.1:8787/v1/ingest/discord/events \
  -H 'content-type: application/json' \
  --data @ops/phase0/fixtures/discord-raw-events.json

# 3) fetch persisted board
curl -sS http://127.0.0.1:8787/v1/board
```
