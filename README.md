# Community Signal Board

Weekend challenge MVP for builder and operator communities.

## One-line pitch
A lightweight app that helps small communities capture scattered updates, rank what matters now, and export a daily action digest.

## What it does
- Captures high-signal updates manually (title, source, urgency, category, relevance, confidence, owner)
- Ranks updates with a transparent scoring formula: `urgency * 2 + relevance + confidence`
- Filters by category and urgency to focus fast
- Applies community templates (startup, OSS, local org) for faster, consistent capture
- Generates a daily brief markdown with action recommendations
- Copies top actions to clipboard for fast sharing in chat/email
- Exports a markdown digest for async sharing
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
- Demo screenshot: `/home/lauureal/.openclaw/media/browser/39817a38-936e-4f0b-8784-92077db4f6ce.png`
- Test report: `docs/TEST_REPORT.md`
- Submission copy: `submission/SUBMISSION_DRAFT.md`
- Repo readiness path: `submission/REPO_READINESS.md`

## Demo narrative (90 seconds)
1. Add 3-5 signals from different channels.
2. Show ranking order and explain urgency-weighted scoring.
3. Filter to critical opportunities.
4. Export markdown digest and preview output.
5. Close with impact: fewer missed opportunities, faster shared awareness.
