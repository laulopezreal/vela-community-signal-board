# Real Value Proof - Discord Pipeline (Before vs After)

## Scope
Proof that Vela moves Discord export input from noisy chat logs to actionable owner-assigned decisions.

## Reproduce

```bash
cd /home/lauureal/git/vela-community-signal-board
node --check ops/run_discord_pipeline.js
node ops/run_discord_pipeline.js docs/artifacts/sample-discord-export.json docs/artifacts/discord-pipeline
```

## Before (raw Discord export)
- Raw messages: **8**
- Malformed messages: **2**
- Duplicate messages: **1**
- Decision objects: **0**

## After (normalized + scored + clustered)
- Normalized valid signals: **5**
- Thread groups aggregated: **3**
- Unique dedupe clusters: **4**
- Decision objects generated: **5**
- Decision coverage: **100%** of normalized signals
- Dedupe reduction: **20%**

## Measurable delta
- **+5 actionable decisions** generated from zero (owner + action + deadline + expected metric)
- **2 malformed rows automatically filtered** (reliability hardening)
- **1 duplicate collapsed** (idempotent ingestion + clustering)
- **Operator latency reduced** from manual chat reading to ranked decision feed (artifact-backed)

## Evidence artifacts
- Input dataset: `docs/artifacts/sample-discord-export.json`
- Normalized signals: `docs/artifacts/discord-pipeline/normalized-signals.json`
- Thread aggregation: `docs/artifacts/discord-pipeline/thread-aggregation.json`
- Dedupe clusters: `docs/artifacts/discord-pipeline/dedupe-clusters.json`
- Decision outputs (JSON): `docs/artifacts/discord-pipeline/decision-outputs.json`
- Decision outputs (MD): `docs/artifacts/discord-pipeline/decision-outputs.md`
- Value proof metrics: `docs/artifacts/discord-pipeline/real-value-proof.json`
- Pipeline summary stats: `docs/artifacts/discord-pipeline/pipeline-summary.json`
