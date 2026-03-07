#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_OUT="$ROOT/docs/artifacts/connector-pipeline"
SNAP_DIR="$ROOT/docs/artifacts/connector-fixture-snapshots"

rm -f "$ROOT/server/db/community_signal_board.json"
rm -rf "$TMP_OUT"
node "$ROOT/ops/run_connector_jobs.js" >/dev/null

for file in "$SNAP_DIR"/*.json; do
  diff -u "$file" "$TMP_OUT/$(basename "$file")"
done

echo "CONNECTOR_FIXTURES_PASS"
