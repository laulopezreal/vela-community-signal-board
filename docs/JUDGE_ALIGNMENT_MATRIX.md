# Judge Alignment Matrix

## Start Here (Judge-Speed Evidence Path)
1. Overview + demo path: [README.md](../README.md)
2. Deterministic proof index: [docs/SUBMISSION_EVIDENCE_PACK.md](./SUBMISSION_EVIDENCE_PACK.md)
3. Access-constrained fallback: [docs/JURY_ACCESS_FALLBACK_PACK.md](./JURY_ACCESS_FALLBACK_PACK.md)

| Likely Criterion | What judges look for | Vela evidence | Proof location |
|---|---|---|---|
| Innovation | Non-trivial, focused solution to a real pain point | Converts scattered community chatter into a ranked action queue + daily brief workflow | [README.md](../README.md) (pitch + problem), [submission/SUBMISSION_DRAFT.md](../submission/SUBMISSION_DRAFT.md) |
| Technical Execution | Working implementation, clean logic, reliability | Deterministic ranking formula, duplicate guard, schema-safe storage load, ID fallback, deterministic demo fixture | [app/main.js](../app/main.js), [docs/DEMO_PROOF_ARTIFACT.md](./DEMO_PROOF_ARTIFACT.md), [docs/TEST_REPORT.md](./TEST_REPORT.md) |
| Usability | Fast comprehension and low-friction usage | Single-screen flow, templates, filtering, score severity badges, contextual empty states, mobile polish | [app/index.html](../app/index.html), [app/styles.css](../app/styles.css), [docs/STYLE_LOOP.md](./STYLE_LOOP.md) |
| Real-world Impact | Clear community and practical value | Founder and operator community fit, action-oriented brief export, owner assignment for accountability | [README.md](../README.md), [submission/SUBMISSION_DRAFT.md](../submission/SUBMISSION_DRAFT.md) |
| Presentation | Clear, reproducible demo with strong narrative | 30-second opening narrative, 90-second script, one-click deterministic scenario, health check preflight | [README.md](../README.md), [submission/SUBMISSION_DRAFT.md](../submission/SUBMISSION_DRAFT.md), [docs/WIN_SIGNAL_SYNTHESIS.md](./WIN_SIGNAL_SYNTHESIS.md) |

## Access Note (Judge-Facing)
If the repo URL is not accessible in your environment, use [docs/JURY_ACCESS_FALLBACK_PACK.md](./JURY_ACCESS_FALLBACK_PACK.md) for an artifact-first verification path.

## Demo path normalization (judge-facing)
Primary path:
1. Turn **Submission Mode ON**.
2. Click **Run Judge Fast Path**.
3. Walk ranking order and urgency-weighted scoring.
4. Verify receipt/hash and artifact links.
5. Close on impact.

Explicit fallback path:
1. Click **Run Health Check** and confirm PASS/ATTENTION state is visible.
2. Click **Load Demo Scenario**.
3. Generate Daily Brief, then Export Digest.
