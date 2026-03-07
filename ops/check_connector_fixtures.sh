#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_OUT="$ROOT/docs/artifacts/connector-pipeline"
SNAP_DIR="$ROOT/docs/artifacts/connector-fixture-snapshots"

rm -f "$ROOT/server/db/community_signal_board.json"
rm -rf "$TMP_OUT"
node "$ROOT/ops/run_connector_jobs.js" >/dev/null

for file in discord-normalized.json discord-errors.json slack-normalized.json slack-errors.json email-normalized.json email-errors.json; do
  diff -u "$SNAP_DIR/$file" "$TMP_OUT/$file"
done

echo "CONNECTOR_FIXTURES_PASS"
