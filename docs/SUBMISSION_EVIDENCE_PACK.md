# Submission Evidence Pack (Judge Quick Access)

## Start Here (Judge-Speed Evidence Path)
1. Overview + demo path: [README.md](../README.md)
2. Deterministic proof index: [docs/SUBMISSION_EVIDENCE_PACK.md](./SUBMISSION_EVIDENCE_PACK.md)
3. Access-constrained fallback: [docs/JURY_ACCESS_FALLBACK_PACK.md](./JURY_ACCESS_FALLBACK_PACK.md)

Use this as a 30-second proof index during review.

## Product + Narrative
- Project overview and demo flow: [README.md](../README.md)
- Challenge-fit submission copy: [submission/SUBMISSION_DRAFT.md](../submission/SUBMISSION_DRAFT.md)

## Reliability + Technical Quality
- Core implementation: [app/main.js](../app/main.js)
- Manual validation coverage: QA checks summarized in this evidence pack and reproducible commands below

## Determinism + Demo Safety
- Fixed fixture and expected ranking outputs: [docs/DEMO_PROOF_ARTIFACT.md](./DEMO_PROOF_ARTIFACT.md)
- Primary one-click demo path control: [app/main.js](../app/main.js) (`Submission Mode ON` -> `Run Judge Fast Path`)
- Explicit fallback controls: [app/main.js](../app/main.js) (`Run Health Check` -> `Load Demo Scenario` -> `Generate Daily Brief` / `Export Digest`)
- Concrete deterministic brief sample: [docs/artifacts/sample-daily-brief.md](./artifacts/sample-daily-brief.md)
- Concrete deterministic digest sample: [docs/artifacts/sample-digest.md](./artifacts/sample-digest.md)
- Checksum + line-count manifest: [docs/artifacts/canonical-evidence-manifest.md](./artifacts/canonical-evidence-manifest.md)
- Visual proof (health PASS state): [docs/artifacts/loop9-health-pass.jpg](./artifacts/loop9-health-pass.jpg)
- Visual proof (canonical artifacts success state): [docs/artifacts/loop9-canonical-artifacts-success.jpg](./artifacts/loop9-canonical-artifacts-success.jpg)
- Visual proof integrity manifest (checksums + byte sizes): [docs/artifacts/loop10-visual-proof-manifest.md](./artifacts/loop10-visual-proof-manifest.md)
- Judge-run completion receipt sample (timestamp + health + generated filenames + receipt SHA-256 line): [docs/artifacts/judge-run-completion-receipt-2026-02-28.md](./artifacts/judge-run-completion-receipt-2026-02-28.md)
- Receipt hash verifier (CLI micro-proof): from repo root `./ops/verify_receipt_hash.sh docs/artifacts/judge-run-completion-receipt-2026-02-28.md` (or from `docs/`: `../ops/verify_receipt_hash.sh artifacts/judge-run-completion-receipt-2026-02-28.md`)
- Visual proof (submission controls state): [docs/artifacts/loop11-submission-mode-bundle.jpg](./artifacts/loop11-submission-mode-bundle.jpg)

## Real-world Input Readiness Proof
- Real value before/after comparison (baseline): [docs/artifacts/real-value-before-after.md](./artifacts/real-value-before-after.md)
- Discord pipeline value proof (thread aggregation, dedupe, decisions): [docs/artifacts/real-value-proof-discord-pipeline.md](./artifacts/real-value-proof-discord-pipeline.md)
- Adapter contract (Discord/X/export-ready, no secrets): [ops/real-input-adapter-contract.md](../ops/real-input-adapter-contract.md)
- Sample exported generic input file: [docs/artifacts/sample-exported-signals.json](./artifacts/sample-exported-signals.json)
- Sample Discord export input file: [docs/artifacts/sample-discord-export.json](./artifacts/sample-discord-export.json)
- Ranked queue output snapshot: [docs/artifacts/real-input-ranked-queue-snapshot.md](./artifacts/real-input-ranked-queue-snapshot.md)
- Discord normalized signals: [docs/artifacts/discord-pipeline/normalized-signals.json](./artifacts/discord-pipeline/normalized-signals.json)
- Discord thread aggregation: [docs/artifacts/discord-pipeline/thread-aggregation.json](./artifacts/discord-pipeline/thread-aggregation.json)
- Discord dedupe clusters: [docs/artifacts/discord-pipeline/dedupe-clusters.json](./artifacts/discord-pipeline/dedupe-clusters.json)
- Discord decision outputs: [docs/artifacts/discord-pipeline/decision-outputs.md](./artifacts/discord-pipeline/decision-outputs.md)
- Repro commands:
  - `node ops/run_local_ingestion.js`
  - `node ops/run_discord_pipeline.js docs/artifacts/sample-discord-export.json docs/artifacts/discord-pipeline`

## Judge Alignment

## Submission Readiness
- Repo and submit sequence: [submission/REPO_READINESS.md](../submission/REPO_READINESS.md)
- Jury access fallback pack (artifact-first when repo visibility is constrained): [docs/JURY_ACCESS_FALLBACK_PACK.md](./JURY_ACCESS_FALLBACK_PACK.md)
- Final gate checklist (SSOT): [submission/SUBMISSION_RULES_SSOT.md](../submission/SUBMISSION_RULES_SSOT.md)
