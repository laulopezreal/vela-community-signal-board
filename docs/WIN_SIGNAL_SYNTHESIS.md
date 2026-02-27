# Win Signal Synthesis (2026-02-27)

## Sources reviewed
1. Devpost guide: "Understanding hackathon submission and judging criteria"
   - https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria
2. Devpost event rubric example (World Hackathon 2025)
   - https://world-hackathon.devpost.com/

## Cross-source winner pattern
Consistent criteria across sources:
- Innovation / originality
- Technical execution and code quality
- Usability and ease of use
- Real-world impact and clear community fit
- Presentation clarity and demo quality

Meta-pattern from guidance:
- Teams lose points on avoidable failures (missing requirements, unclear demo path, weak explanation), not only missing features.

## Inferred scoring priorities for Vela package
Given common Devpost-style rubrics, likely highest-EV order:
1. Demo reliability + presentation clarity (easy points, high downside if weak)
2. Usability and decision speed
3. Explicit impact/community fit proof
4. Technical quality and deterministic behavior
5. Novelty framing (positioning, not feature bloat)

## Gap map (before this batch)
- Strong: deterministic demo fixture, clear ranking model, concise pitch.
- Medium gap: no explicit in-product health/readiness indicator before demo run.
- Medium gap: no single judge-facing criterion-to-evidence matrix document.

## Improvements shipped in this batch
1. Added in-app **Run Health Check** action + visible health status pill.
   - Checks: storage roundtrip, deterministic demo ranking expectation, export capability, core crypto/id support.
   - Benefit: lowers live-demo failure risk and increases trust in technical reliability.
2. Added explicit **judge alignment matrix** (`docs/JUDGE_ALIGNMENT_MATRIX.md`).
   - Maps each common judging criterion to concrete Vela evidence and proof files.
   - Benefit: makes judge evaluation faster and reduces ambiguity penalty.

## Verification evidence
- `node --check app/main.js` passes.
- Local static serve smoke check passes.
- UI artifact confirms health-check control renders in toolbar.

## Rate-limit blocker note
- Brave Search returned 429 rate-limit twice consecutively during expanded source collection.
- Per policy, stopped retries and continued with fetched canonical sources already available.
- Next safe retry: after cooling window (>= 60s) or in a later cycle.
