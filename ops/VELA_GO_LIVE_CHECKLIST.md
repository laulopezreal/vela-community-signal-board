# VELA_GO_LIVE_CHECKLIST.md

Status: ACTIVE (pre-submission private mode)
Owner: Lau
Operator: Vela (with Palmilila reviewer loop)
Last updated: 2026-02-28 (discord pipeline loop)

## MUST-FIX-NOW (GO gate blockers)
- [ ] Internal governance purge check: confirm AGENTS/Important/Known/Fastfacts/MEMORY/SOUL/operations-journal are NOT present in submission repo.
- [x] Real value proof block is present with required evidence fields:
  - user/job-to-be-done definition
  - baseline state (before)
  - app-assisted state (after)
  - measurable delta (time saved, misses reduced, decision quality speed)
  - proof artifact pointers (where evidence lives)
  - evidence refs: `README.md` (Real Value Proof block), `submission/SUBMISSION_DRAFT.md` (Real Value Proof block), `docs/artifacts/real-value-before-after.md`, `docs/artifacts/real-input-ranked-queue-snapshot.md`, `ops/real-input-adapter-contract.md`
- [ ] Final contradiction sweep after latest edits (docs + checklist + submission copy)
- [ ] Verify receipt hash proof still PASS after all doc changes
- [ ] Ensure one canonical demo-path language across all judge-facing docs
- [ ] Confirm fallback pack is externally portable (zip-ready, not repo-dependent wording)
- [ ] Lock final submission narrative to one sharp value proposition + one CTA

## Discord Pipeline Readiness (this loop)
- [x] Discord ingest adapter from exported JSON to normalized signals (`ops/run_discord_pipeline.js`, `docs/artifacts/sample-discord-export.json`, `docs/artifacts/discord-pipeline/normalized-signals.json`)
- [x] Weighted scoring rubric implemented (Revenue/Product/Risk/Leverage) with deterministic weighted rank (`ops/run_discord_pipeline.js`)
- [x] Minimal thread aggregation and dedupe clustering generated (`docs/artifacts/discord-pipeline/thread-aggregation.json`, `docs/artifacts/discord-pipeline/dedupe-clusters.json`)
- [x] Decision outputs include owner/action/deadline/expected metric (`docs/artifacts/discord-pipeline/decision-outputs.json` + `.md`)
- [x] Real Value Proof artifact includes measurable before/after deltas (`docs/artifacts/real-value-proof-discord-pipeline.md`, `docs/artifacts/discord-pipeline/real-value-proof.json`)
- [x] Reliability hardening in place (malformed payload filtering, idempotent external-id handling, fallback dataset when no valid rows) (`ops/run_discord_pipeline.js`, `docs/artifacts/discord-pipeline/pipeline-errors.json`)
- [x] Submission docs/checklist alignment updated (`docs/SUBMISSION_EVIDENCE_PACK.md`, `ops/VELA_GO_LIVE_CHECKLIST.md`, `operations-journal/CHANGELOG.md`)

## SHOULD-FIX-SOON (high leverage, non-blocking)
- [ ] Tighten novelty framing vs “just a clean board” perception
- [ ] Add compact “why this wins” block mapped to judging criteria
- [ ] Rehearse judge demo in a fresh browser profile with download restrictions
- [ ] Ensure all artifact references are repo-local first (no absolute path dependency)
- [ ] Prepare one-page operator cheat sheet for live submit window

## FIRE-AT-WILL (until readiness check)
- [ ] Keep continuous quality loop on docs clarity + proof consistency
- [ ] Run polish iterations only when measurable clarity improves
- [ ] Maintain telemetry/journal hygiene, no silent drift
- [ ] Keep PR discipline one concern at a time
- [ ] Keep submission blocked until Lau-Lils-Vela GO gate

## GO GATE (Lau-Lils-Vela check)
If all MUST-FIX-NOW items are PASS:
- [ ] Make repo public
- [ ] Re-verify unauth access
- [ ] Submit immediately in same controlled session

## Execution protocol
- One loop = one concern.
- Every completed checkbox requires evidence (file path, command output, or screenshot reference).
- If blocked, log blocker + next-safe retry time.
- Update `operations-journal/CHANGELOG.md` after each consequential loop.
