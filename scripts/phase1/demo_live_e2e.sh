#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PORT="${PHASE1_PORT:-8791}"
BASE_URL="http://localhost:${PORT}"

export DISCORD_CONNECTOR_ENABLED=true
export DISCORD_CHANNEL_ALLOWLIST="chan-allow-1"

SERVER_LOG="$(mktemp)"
SSE_LOG="$(mktemp)"

cleanup() {
  if [[ -n "${SSE_PID:-}" ]]; then kill "$SSE_PID" >/dev/null 2>&1 || true; fi
  if [[ -n "${SERVER_PID:-}" ]]; then kill "$SERVER_PID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT

node "$ROOT_DIR/server/phase1/server.js" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
sleep 1

echo "--- readiness ---"
curl -sS "$BASE_URL/readyz"

echo "--- sse subscribe ---"
curl -sN "$BASE_URL/v1/live/board/stream" >"$SSE_LOG" &
SSE_PID=$!
sleep 1

echo "--- ingest request success ---"
TRACE_ID="trace_demo_discord_001"
curl -sS -X POST "$BASE_URL/v1/live/ingest/discord/event" \
  -H 'content-type: application/json' \
  -d '{
    "traceId": "'"$TRACE_ID"'",
    "event": {
      "id": "evt-demo-001",
      "channelId": "chan-allow-1",
      "channel": "Discord #founders",
      "author": "lau",
      "createdAt": "2026-03-02T03:00:00.000Z",
      "reactionCount": 9,
      "content": "urgent client deal intro needs automation playbook now"
    }
  }'

echo "--- board response ---"
curl -sS "$BASE_URL/v1/live/board"

sleep 1
echo "--- SSE receives update ---"
cat "$SSE_LOG"

echo "--- metrics update ---"
curl -sS "$BASE_URL/metrics"

echo "--- readiness OK ---"
curl -sS "$BASE_URL/readyz"

echo "--- server log ---"
cat "$SERVER_LOG"
