# Community Signal Board

DEV Weekend Challenge MVP for builder and operator communities.

## Start Here (Judge-Speed Evidence Path)
Submission rules authority: [submission/SUBMISSION_RULES_SSOT.md](submission/SUBMISSION_RULES_SSOT.md)
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
- Primary one-click judge path via **Submission Mode + Run Judge Fast Path**
- Explicit fallback demo flow via **Run Health Check + Load Demo Scenario**
- Generates daily brief and digest markdown artifacts for judging evidence
- Safely recovers from corrupted localStorage data without breaking app load

## Why this community
Small founder and builder groups miss opportunities when important signals are split across Slack, X, email, and chats. This app creates one clean board and one daily digest.

## Real Value Proof (submission block)
- **User / job-to-be-done:** founder/operator who must convert scattered community signals into a same-day prioritized action queue.
- **Baseline (before):** manual multi-channel scanning, ad hoc prioritization, no reproducible ranked output from exported real inputs.
- **After (with app):** exported JSON signals pass through a deterministic adapter path into a ranked queue using Vela scoring.
- **Measurable delta:** triage moves from variable manual sorting to one deterministic command run with replayable output artifact.
- **Proof artifacts:** [docs/artifacts/real-value-before-after.md](docs/artifacts/real-value-before-after.md), [ops/real-input-adapter-contract.md](ops/real-input-adapter-contract.md), [docs/artifacts/sample-exported-signals.json](docs/artifacts/sample-exported-signals.json), [docs/artifacts/real-input-ranked-queue-snapshot.md](docs/artifacts/real-input-ranked-queue-snapshot.md)

## Real input readiness (local, no secrets)
Run the local ingestion bridge from repo root:

```bash
node ops/run_local_ingestion.js
```

This transforms exported external signals into a ranked queue snapshot via the same scoring flow (`urgency * 2 + relevance + confidence`).


## Assumptions for enterprise controls (local MVP)
- This remains a local-first browser app with no server/database, so RBAC, audit logs, observability, retention, and backups are implemented in localStorage scope.
- Organization scope is represented by an `orgId` string selected in-app; all list/query operations are filtered to the active org.
- Encryption at rest/in transit is represented by optional AES-GCM encrypted backup exports and HTTPS-only deployment guidance.
- Secrets management is modeled as operational guidance (environment/config discipline), not in-app secret storage.

## New governance, security, and onboarding capabilities
- **RBAC (org-scoped):** roles `admin`, `manager`, `contributor`, `viewer` now gate create/edit/delete/export/security actions.
- **Audit logs:** local immutable-style event stream for signal edits, score changes, ownership changes, digest/brief/backup exports, retention runs, and restores.
- **Observability:** structured console logs (`[structured]` JSON), per-action latency/error counters, and ingestion freshness alert panel.
- **Backup/restore + retention:** export backup JSON (optionally encrypted), restore backups, and apply retention days to audit log history.
- **Security hardening:** write-action rate limiting, basic abuse-pattern blocking, org/role permission checks, and encrypted backup option.
- **Onboarding acceleration:** sample dataset loader and in-app guided tour in addition to existing templates/demo scenario.

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
- Submission copy: [submission/SUBMISSION_DRAFT.md](submission/SUBMISSION_DRAFT.md)
- Repo readiness path: [submission/REPO_READINESS.md](submission/REPO_READINESS.md)
- Jury access fallback pack (artifact-first, no public-repo assumption): [docs/JURY_ACCESS_FALLBACK_PACK.md](docs/JURY_ACCESS_FALLBACK_PACK.md)

## 30-second opening narrative
"Small communities lose real opportunities because high-signal updates are scattered across Slack, email, WhatsApp, and X. Community Signal Board turns that noise into one ranked action queue plus a daily brief and digest in under a minute."

## Demo narrative (90 seconds)
1. Turn **Submission Mode ON** and click **Run Judge Fast Path**.
2. Confirm health/status and deterministic fixture output.
3. Show ranking order and explain urgency-weighted scoring.
4. Verify receipt/hash (`ops/verify_receipt_hash.sh`) and artifact links.
5. Close with impact: fewer missed opportunities, faster shared awareness.

## Judge-proof artifacts
- Deterministic proof: [docs/DEMO_PROOF_ARTIFACT.md](docs/DEMO_PROOF_ARTIFACT.md)
- Judge evidence pack (quick index): [docs/SUBMISSION_EVIDENCE_PACK.md](docs/SUBMISSION_EVIDENCE_PACK.md)
