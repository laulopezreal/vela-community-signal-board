#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${DISCORD_BOT_TOKEN:?set DISCORD_BOT_TOKEN}"
: "${DISCORD_GUILD_ID:?set DISCORD_GUILD_ID}"
: "${DISCORD_CHANNEL_ALLOWLIST:?set DISCORD_CHANNEL_ALLOWLIST (comma-separated channel ids)}"

export PHASE1_PORT="${PHASE1_PORT:-8791}"
export DISCORD_CONNECTOR_ENABLED="${DISCORD_CONNECTOR_ENABLED:-true}"

echo "[rex] starting phase1 live ingest server on :${PHASE1_PORT}"
node server/phase1/server.js &
SERVER_PID=$!
trap 'kill ${SERVER_PID} 2>/dev/null || true' EXIT

sleep 2

echo "[rex] check /readyz"
curl -sf "http://127.0.0.1:${PHASE1_PORT}/readyz" | sed -n '1,120p'

echo "[rex] check /v1/live/board/stream (SSE warmup)"
curl -sN --max-time 3 "http://127.0.0.1:${PHASE1_PORT}/v1/live/board/stream" | sed -n '1,20p' || true

echo "[rex] check /v1/live/board"
curl -sf "http://127.0.0.1:${PHASE1_PORT}/v1/live/board" | sed -n '1,120p'

echo "[rex] check /metrics"
curl -sf "http://127.0.0.1:${PHASE1_PORT}/metrics" | grep -E 'phase1_(ingest|discord_gateway|uptime)'

echo "[rex] server running with live Discord connector. Press Ctrl+C to stop."
wait ${SERVER_PID}
