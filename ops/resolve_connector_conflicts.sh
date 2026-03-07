#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

"$ROOT/ops/check_connector_fixtures.sh"
node "$ROOT/ops/run_discord_pipeline.js" "$ROOT/scripts/fixtures/discord-raw-events.json" "$ROOT/docs/artifacts/discord-pipeline" >/dev/null

echo "CONFLICT_RESOLUTION_READY: regenerated deterministic connector + discord artifacts"
