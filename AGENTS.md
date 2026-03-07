# AGENTS.md - Branch and PR Workflow

## Default branching rule
- All working branches must be created from the latest `dev`.
- Before creating a branch, sync `dev` with remote (`git fetch` + update local `dev`).

## Merge flow
- Feature/fix branches are merged into `dev`.
- Do not open feature/fix PRs directly to `main` unless explicitly approved.

## Main branch control
- PRs from `dev` to `main` are controlled and reviewed more strictly.
- Use `dev -> main` only for release-ready, validated changes.
