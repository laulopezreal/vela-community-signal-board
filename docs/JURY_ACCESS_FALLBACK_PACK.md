# Jury Access Fallback Pack (Access-Ambiguity Safe)

## Start Here (Judge-Speed Evidence Path)
1. Overview + demo path: [README.md](../README.md)
2. Deterministic proof index: [docs/SUBMISSION_EVIDENCE_PACK.md](./SUBMISSION_EVIDENCE_PACK.md)
3. Access-constrained fallback: [docs/JURY_ACCESS_FALLBACK_PACK.md](./JURY_ACCESS_FALLBACK_PACK.md)

Use this pack if the GitHub repo URL is not directly accessible in your judging environment.

## Access Note (Judge-Facing)
- Primary repo URL may require visibility confirmation at review time.
- If the repo URL returns 404 or access is constrained, evaluate from the local artifact path below.
- This fallback preserves the same proof quality and deterministic verification path.

## Artifact-first verification path (no repo-visibility assumption)
1. Open [docs/SUBMISSION_EVIDENCE_PACK.md](./SUBMISSION_EVIDENCE_PACK.md) as the proof index.
2. Validate deterministic outputs:
   - [docs/artifacts/sample-daily-brief.md](./artifacts/sample-daily-brief.md)
   - [docs/artifacts/sample-digest.md](./artifacts/sample-digest.md)
   - [docs/artifacts/canonical-evidence-manifest.md](./artifacts/canonical-evidence-manifest.md)
3. Validate final-run receipt integrity:
   - [docs/artifacts/judge-run-completion-receipt-2026-02-28.md](./artifacts/judge-run-completion-receipt-2026-02-28.md)
   - From repo root: `./ops/verify_receipt_hash.sh docs/artifacts/judge-run-completion-receipt-2026-02-28.md`
   - From `docs/`: `../ops/verify_receipt_hash.sh artifacts/judge-run-completion-receipt-2026-02-28.md`
4. Validate quality and test coverage:

## Direct local-proof links
- Product/demo narrative: [README.md](../README.md)
- Submission copy: [submission/SUBMISSION_DRAFT.md](../submission/SUBMISSION_DRAFT.md)
- Demo determinism artifact: [docs/DEMO_PROOF_ARTIFACT.md](./DEMO_PROOF_ARTIFACT.md)

## Scope guard
This fallback pack changes access clarity only. It does not change UX, feature scope, or proof artifacts.
