#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Rebuild deterministic connector snapshots
"$ROOT/ops/check_connector_fixtures.sh"

# Rebuild deterministic discord pipeline fixtures
node "$ROOT/ops/run_discord_pipeline.js" "$ROOT/docs/artifacts/sample-discord-export.json" "$ROOT/docs/artifacts/discord-pipeline" >/dev/null

echo "CONFLICT_RESOLUTION_READY: regenerated deterministic connector + discord artifacts"
