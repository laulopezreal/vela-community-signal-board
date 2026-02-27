# Deterministic Demo Proof Artifact

Date: 2026-02-27

## Purpose
Provide a reproducible, judge-safe demo path with fixed inputs and predictable outputs.

## How to trigger
1. Open app.
2. Click **Load Demo Scenario**.
3. Observe ranked list and stats.
4. Click **Generate Daily Brief** or **Export Digest**.

## Fixed fixture (seeded in `app/main.js`)
1. Grant call closes tonight for community tooling (Funding) -> urgency 5, relevance 4, confidence 4
2. AI safety workshop requests 2 startup mentors (Opportunity) -> urgency 4, relevance 5, confidence 4
3. Partner community opening senior ML role (Hiring) -> urgency 4, relevance 4, confidence 3
4. Open-source observability tool launches beta (Tool) -> urgency 3, relevance 4, confidence 3

Formula: `score = urgency * 2 + relevance + confidence`

Expected scores:
- Item 1: 18
- Item 2: 17
- Item 3: 15
- Item 4: 13

Expected ranking order:
1. Grant call closes tonight for community tooling (18)
2. AI safety workshop requests 2 startup mentors (17)
3. Partner community opening senior ML role (15)
4. Open-source observability tool launches beta (13)

Expected top stats after loading demo:
- Total Signals: 4
- High Urgency (4+): 3
- Average Score: 15.8
- Assigned Signals: 4

## Why this increases win probability
- Removes live-demo randomness and typing risk.
- Gives judges immediate proof that ranking logic is deterministic.
- Produces export artifacts with known output quality in under 30 seconds.
