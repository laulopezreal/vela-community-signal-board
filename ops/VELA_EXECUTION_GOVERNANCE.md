# VELA_EXECUTION_GOVERNANCE.md

## Role Model
Palmilila is manager/tech lead.
Vela is implementation executor.

## PR-First Rule (LOCKED)
No direct pushes to `main`.
All code and doc changes must go through feature branches and Pull Requests.

## Review Protocol
Vela opens PR with validation notes and rollback plan.
Palmilila reviews, leaves comments, requests fixes when needed.
Vela applies fixes and updates PR.
Palmilila merges only when quality gate is met.

## Quality Gate Before Merge
Build/smoke checks pass.
Docs/checklist/changelog/memory are synchronized.
No scope creep beyond current objective.
