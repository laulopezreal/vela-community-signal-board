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
- Manual validation coverage: [docs/TEST_REPORT.md](./TEST_REPORT.md)
- Final quality review: [docs/FINAL_SUBMISSION_REVIEW.md](./FINAL_SUBMISSION_REVIEW.md)

## Determinism + Demo Safety
- Fixed fixture and expected ranking outputs: [docs/DEMO_PROOF_ARTIFACT.md](./DEMO_PROOF_ARTIFACT.md)
- In-app preflight and deterministic demo flow controls: [app/main.js](../app/main.js) (`Run Health Check`, `Load Demo Scenario`, `Generate Daily Brief`, `Export Digest`)
- Concrete deterministic brief sample: [docs/artifacts/sample-daily-brief.md](./artifacts/sample-daily-brief.md)
- Concrete deterministic digest sample: [docs/artifacts/sample-digest.md](./artifacts/sample-digest.md)
- Checksum + line-count manifest: [docs/artifacts/canonical-evidence-manifest.md](./artifacts/canonical-evidence-manifest.md)
- Visual proof (health PASS state): [docs/artifacts/loop9-health-pass.jpg](./artifacts/loop9-health-pass.jpg)
- Visual proof (canonical artifacts success state): [docs/artifacts/loop9-canonical-artifacts-success.jpg](./artifacts/loop9-canonical-artifacts-success.jpg)
- Visual proof integrity manifest (checksums + byte sizes): [docs/artifacts/loop10-visual-proof-manifest.md](./artifacts/loop10-visual-proof-manifest.md)
- Judge-run completion receipt sample (timestamp + health + generated filenames + receipt SHA-256 line): [docs/artifacts/judge-run-completion-receipt-2026-02-28.md](./artifacts/judge-run-completion-receipt-2026-02-28.md)
- Receipt hash verifier (CLI micro-proof): from repo root `./ops/verify_receipt_hash.sh docs/artifacts/judge-run-completion-receipt-2026-02-28.md` (or from `docs/`: `../ops/verify_receipt_hash.sh artifacts/judge-run-completion-receipt-2026-02-28.md`)
- Visual proof (submission controls state): [docs/artifacts/loop11-submission-mode-bundle.jpg](./artifacts/loop11-submission-mode-bundle.jpg)

## Judge Alignment
- Criterion-to-evidence mapping: [docs/JUDGE_ALIGNMENT_MATRIX.md](./JUDGE_ALIGNMENT_MATRIX.md)
- Win-priority synthesis from rubric research: [docs/WIN_SIGNAL_SYNTHESIS.md](./WIN_SIGNAL_SYNTHESIS.md)

## Submission Readiness
- Repo and submit sequence: [submission/REPO_READINESS.md](../submission/REPO_READINESS.md)
- Jury access fallback pack (artifact-first when repo visibility is constrained): [docs/JURY_ACCESS_FALLBACK_PACK.md](./JURY_ACCESS_FALLBACK_PACK.md)
- Final gate checklist: [ops/VELA_SUBMISSION_CHECKLIST.md](../ops/VELA_SUBMISSION_CHECKLIST.md)
