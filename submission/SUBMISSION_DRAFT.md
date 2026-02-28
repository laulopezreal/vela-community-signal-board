# DEV Weekend Challenge Submission Draft

## Start Here (Judge-Speed Evidence Path)
Submission rules authority: [submission/SUBMISSION_RULES_SSOT.md](./SUBMISSION_RULES_SSOT.md)
1. Overview + demo path: [README.md](../README.md)
2. Deterministic proof index: [docs/SUBMISSION_EVIDENCE_PACK.md](../docs/SUBMISSION_EVIDENCE_PACK.md)
3. Access-constrained fallback: [docs/JURY_ACCESS_FALLBACK_PACK.md](../docs/JURY_ACCESS_FALLBACK_PACK.md)

## Project Name
Community Signal Board

## One-line summary
A simple board that helps small founder and operator communities turn scattered updates into one ranked daily digest.

## 30-second opening narrative
Small communities lose opportunities because high-signal updates are fragmented across Slack, email, WhatsApp, and X. Community Signal Board turns that noise into one ranked action queue plus a daily brief and digest in under a minute, so teams act before opportunities expire.

## Community Served
Small founder and operator communities that currently miss opportunities because updates are spread across multiple channels.

## Problem
High-value signals such as intros, grants, events, and hiring opportunities get buried in chat noise.

## Solution
A lightweight app that captures updates quickly, ranks them transparently, supports live triage controls, and exports a markdown digest for async team alignment.

## Core Features
- Manual signal ingestion (title, source, urgency, category, relevance, confidence, owner)
- Deterministic ranking (`urgency * 2 + relevance + confidence`)
- Live search + dashboard filtering (category + urgency) + clear reset
- Reliability guards (duplicate prevention, score clamping, empty-export prevention, schema-safe storage loading)
- In-app health-check preflight with explicit PASS/ATTENTION/FALLBACK status
- Markdown digest + daily brief export for async sharing

## Why this is a good challenge fit
- Clearly serves a real community with an explicit pain point
- Delivers immediate utility with a focused MVP
- Prioritizes reliability and usability over extra complexity

## Real Value Proof (submission block)
- **User / job-to-be-done:** founder/operator triaging fragmented community opportunities into one daily action queue.
- **Baseline (before):** fragmented channel scanning and non-reproducible prioritization.
- **After (with app):** exported channel signals are normalized and deterministically ranked into a queue and markdown proof snapshot.
- **Measurable delta:** from manual/variable sorting to one-command deterministic triage run.
- **Proof artifacts:** [docs/artifacts/real-value-before-after.md](../docs/artifacts/real-value-before-after.md), [ops/real-input-adapter-contract.md](../ops/real-input-adapter-contract.md), [docs/artifacts/sample-exported-signals.json](../docs/artifacts/sample-exported-signals.json), [docs/artifacts/real-input-ranked-queue-snapshot.md](../docs/artifacts/real-input-ranked-queue-snapshot.md)

## Demo Script (90 seconds)
Primary one-click path:
1. Turn **Submission Mode ON**.
2. Click **Run Judge Fast Path**.
3. Confirm deterministic outputs (ranking + artifacts) and briefly explain urgency-weighted scoring.
4. Verify receipt/hash integrity and point to evidence links.
5. Close with impact: fewer missed opportunities, faster shared awareness.

Explicit fallback two-step (if needed):
1. Click **Run Health Check** and confirm visible status.
2. Click **Load Demo Scenario** for deterministic seed data.
3. Generate Daily Brief and Export Digest markdown.

## Judge objection handling (short answers)
- "Why no backend?" -> Weekend MVP prioritizes reliable capture and decision speed. Local-first avoids infra risk during validation and still proves workflow value.
- "How is ranking trustworthy?" -> Formula is transparent and deterministic (`urgency * 2 + relevance + confidence`) with fixed demo proof artifact.
- "What makes this community-specific?" -> Templates, owners, and brief recommendations are tuned for founder and operator coordination, not generic note-taking.
- "How do we know the demo is not staged?" -> Seed fixture and expected outputs are documented in [docs/DEMO_PROOF_ARTIFACT.md](../docs/DEMO_PROOF_ARTIFACT.md), with concrete sample exports in [docs/artifacts/sample-daily-brief.md](../docs/artifacts/sample-daily-brief.md) and [docs/artifacts/sample-digest.md](../docs/artifacts/sample-digest.md), all reproducible live via the documented demo flow.

## Project Link
- Primary repo URL (if accessible): `https://github.com/laulopezreal/vela-community-signal-board`
- Access-safe fallback pack (no public-repo assumption): [docs/JURY_ACCESS_FALLBACK_PACK.md](../docs/JURY_ACCESS_FALLBACK_PACK.md)
- Demo screenshot: [docs/artifacts/judge-ready-screenshot.png](../docs/artifacts/judge-ready-screenshot.png)

## Run Instructions
- Root: `vela`
- Start: `cd app && python3 -m http.server 5173`
- Open: `http://localhost:5173`
