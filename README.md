# Community Signal Board

Weekend challenge MVP for builder and operator communities.

## Start Here (Judge-Speed Evidence Path)
1. Overview + demo path: [README.md](./README.md)
2. Deterministic proof index: [docs/SUBMISSION_EVIDENCE_PACK.md](./docs/SUBMISSION_EVIDENCE_PACK.md)
3. Access-constrained fallback: [docs/JURY_ACCESS_FALLBACK_PACK.md](./docs/JURY_ACCESS_FALLBACK_PACK.md)

## One-line pitch
A lightweight app that helps small communities capture scattered updates, rank what matters now, and export a daily action digest.

## What it does
- Captures high-signal updates manually (title, source, urgency, category, relevance, confidence, owner)
- Ranks updates with a transparent scoring formula: `urgency * 2 + relevance + confidence`
- Filters by category and urgency to focus fast
- Applies community templates (startup, OSS, local org) for faster, consistent capture
- Shows per-signal next-action guidance directly in the ranked board
- Generates a daily brief markdown with action recommendations and explicit scoring formula
- Copies top actions to clipboard for fast sharing in chat/email
- Exports a markdown digest with recommended actions for async sharing
- Loads a deterministic demo scenario for a zero-risk judging walkthrough
- Runs an in-app health check preflight before live demo
- Supports a deterministic demo walkthrough via **Load Demo Scenario**
- Runs an in-app health check preflight before live demo
- Generates daily brief and digest markdown artifacts for judging evidence
- Safely recovers from corrupted localStorage data without breaking app load

## Why this community
Small founder and builder groups miss opportunities when important signals are split across Slack, X, email, and chats. This app creates one clean board and one daily digest.

## Run locally
No build step required.

```bash
cd app
python3 -m http.server 5173
```

Open: http://localhost:5173

## MVP scope
Included:
- Signal entry form
- Ranked dashboard
- Filters
- Digest export

Not included (intentional weekend non-goals):
- Auth and multi-tenant accounts
- External API integrations
- Advanced analytics

## Dedicated style improvement loop (parallel to functional loop)
This repo now runs a separate style loop in parallel with feature work.

Style loop principles:
- No gradient page backgrounds unless Lau explicitly approves.
- Premium, clean, conversion-ready visual language.
- Small batches only: each style pass includes quick validation before the next pass.

Current style upgrades in this loop:
- Tighter visual hierarchy: cleaner heading scale, stronger spacing rhythm, calmer card surfaces.
- Component consistency: unified radius, border, shadow, button states, and focus-visible rings.
- Mobile polish: improved card/list behavior, better compact spacing, and safer bottom toast layout.

## Submission assets
- Demo screenshot: [docs/artifacts/judge-ready-screenshot.png](docs/artifacts/judge-ready-screenshot.png)
- Deterministic sample daily brief: [docs/artifacts/sample-daily-brief.md](docs/artifacts/sample-daily-brief.md)
- Deterministic sample digest: [docs/artifacts/sample-digest.md](docs/artifacts/sample-digest.md)
- Judge-run completion receipt sample: [docs/artifacts/judge-run-completion-receipt-2026-02-28.md](docs/artifacts/judge-run-completion-receipt-2026-02-28.md)
- Receipt hash verifier (CLI): `./ops/verify_receipt_hash.sh docs/artifacts/judge-run-completion-receipt-2026-02-28.md`
- Test report: [docs/TEST_REPORT.md](docs/TEST_REPORT.md)
- Submission copy: [submission/SUBMISSION_DRAFT.md](submission/SUBMISSION_DRAFT.md)
- Repo readiness path: [submission/REPO_READINESS.md](submission/REPO_READINESS.md)
- Jury access fallback pack (artifact-first, no public-repo assumption): [docs/JURY_ACCESS_FALLBACK_PACK.md](docs/JURY_ACCESS_FALLBACK_PACK.md)

## 30-second opening narrative
"Small communities lose real opportunities because high-signal updates are scattered across Slack, email, WhatsApp, and X. Community Signal Board turns that noise into one ranked action queue plus a daily brief and digest in under a minute."

## Demo narrative (90 seconds)
1. Click **Run Health Check** and confirm PASS/ATTENTION state.
2. Click **Load Demo Scenario** for deterministic fixture data.
3. Show ranking order and explain urgency-weighted scoring.
4. Filter to urgency 4+ for triage speed.
5. Generate Daily Brief and Export Digest.
6. Close with impact: fewer missed opportunities, faster shared awareness.

## Judge-proof artifacts
- Deterministic proof: [docs/DEMO_PROOF_ARTIFACT.md](docs/DEMO_PROOF_ARTIFACT.md)
- Judge criterion mapping: [docs/JUDGE_ALIGNMENT_MATRIX.md](docs/JUDGE_ALIGNMENT_MATRIX.md)
- Win research synthesis: [docs/WIN_SIGNAL_SYNTHESIS.md](docs/WIN_SIGNAL_SYNTHESIS.md)
- Test report: [docs/TEST_REPORT.md](docs/TEST_REPORT.md)
- Final review: [docs/FINAL_SUBMISSION_REVIEW.md](docs/FINAL_SUBMISSION_REVIEW.md)
- Judge evidence pack (quick index): [docs/SUBMISSION_EVIDENCE_PACK.md](docs/SUBMISSION_EVIDENCE_PACK.md)
- Competitive comparison matrix (loop 22): [docs/COMPETITIVE_COMPARISON_MATRIX.md](docs/COMPETITIVE_COMPARISON_MATRIX.md)
