# Submission Rules SSOT

Single source of truth for submission rules and pre-submit checks.

## External source (challenge announcement)
- DEV Weekend Challenge announcement:
  - https://dev.to/devteam/happening-now-dev-weekend-challenge-submissions-due-march-2-at-759am-utc-5fg8

## Operational interpretation (for this repo)
1) Submission materials must be judge-accessible at submission time.
2) If primary repo URL is used, it must be reachable by judges (test unauth access before submit).
3) If primary repo is not reachable, fallback evidence path must be complete and clearly linked.
4) Submission copy must not contain broken critical references.
5) Claims in submission copy must be reproducible with available artifacts/commands.

## Pre-submit gate (mandatory)
- [ ] Primary link accessibility verified (or fallback-first mode explicitly selected)
- [ ] Fallback pack complete and linked
- [ ] README + submission docs link integrity check passes (0 missing links)
- [ ] Evidence integrity checks pass (receipt/hash, reproducible commands)
- [ ] Final submission dry-run from clean/unauth perspective completed

## Decision mode
- If accessibility is uncertain, do not submit until one path is verified.
- Choose one explicit mode in `submission/REPO_READINESS.md`:
  - `primary_repo_mode`
  - `fallback_first_mode`
