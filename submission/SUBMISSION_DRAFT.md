# Weekend Challenge Submission Draft

## Project Name
Community Signal Board

## One-line summary
A simple board that helps small founder and operator communities turn scattered updates into one ranked daily digest.

## 30-second opening narrative
Small communities lose opportunities because high-signal updates are fragmented across Slack, email, WhatsApp, and X. Community Signal Board turns that noise into one ranked action queue and a daily brief in under a minute, so teams act before opportunities expire.

## Community Served
Small founder and operator communities that currently miss opportunities because updates are spread across multiple channels.

## Problem
High-value signals such as intros, grants, events, and hiring opportunities get buried in chat noise.

## Solution
A lightweight app that captures updates quickly, ranks them transparently, supports live triage controls, and exports a markdown digest for async team alignment.

## Core Features
- Manual signal ingestion (title, source, urgency, category, relevance)
- Deterministic ranking (`urgency * 2 + relevance + confidence`)
- Live search + dashboard filtering (category + urgency) + clear reset
- Reliability guards (duplicate prevention, score clamping, empty-export prevention)
- In-app health-check preflight for live demo confidence
- Markdown digest export for async distribution

## Why this is a good challenge fit
- Clearly serves a real community with an explicit pain point
- Delivers immediate utility with a focused MVP
- Prioritizes reliability and usability over extra complexity

## Demo Script (90 seconds)
1. Click **Run Health Check** and confirm PASS.
2. Click **Load Demo Scenario** for deterministic seed data.
3. Show ranking order and explain urgency-weighted score.
4. Filter to urgency 4+ and explain fast triage.
5. Generate Daily Brief and export digest markdown.
6. Close with impact: fewer missed opportunities, faster shared awareness.

## Judge objection handling (short answers)
- "Why no backend?" -> Weekend MVP prioritizes reliable capture and decision speed. Local-first avoids infra risk during validation and still proves workflow value.
- "How is ranking trustworthy?" -> Formula is transparent and deterministic (`urgency * 2 + relevance + confidence`) with fixed demo proof artifact.
- "What makes this community-specific?" -> Templates, owners, and brief recommendations are tuned for founder/operator coordination, not generic note-taking.
- "How do we know the demo is not staged?" -> Seed fixture and expected outputs are documented in `docs/DEMO_PROOF_ARTIFACT.md` and reproducible live via one button.

## Project Link
- Repo URL: `https://github.com/laulopezreal/vela-community-signal-board`
- Demo screenshot: `/home/lauureal/.openclaw/media/browser/39817a38-936e-4f0b-8784-92077db4f6ce.png`

## Run Instructions
- Root: `vela-mock`
- Start: `cd app && python3 -m http.server 5173`
- Open: `http://localhost:5173`
