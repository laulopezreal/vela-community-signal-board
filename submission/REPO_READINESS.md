# Repo Readiness Path (Project Link Preparation)

## Goal
Produce a clean project link suitable for challenge submission with minimal risk.

## Readiness status
- [x] MVP code complete and locally verified
- [x] README includes pitch, scope, run instructions, and demo flow
- [x] Submission draft copy prepared
- [x] Screenshot asset captured
- [ ] Git repo initialized in `vela-mock` (if not already)
- [ ] Initial commit created
- [ ] Remote repository created
- [ ] Remote pushed
- [ ] Public or shareable project link inserted in `submission/SUBMISSION_DRAFT.md`

## Safe execution sequence
1. `cd /home/lauureal/.openclaw/workspace/vela-mock`
2. `git init`
3. `git add .`
4. `git commit -m "feat: weekend MVP community signal board"`
5. Create remote repo (GitHub UI or `gh repo create`)
6. `git branch -M main`
7. `git remote add origin <REPO_URL>`
8. `git push -u origin main`
9. Replace placeholder project link in submission draft

## Acceptance check before sharing link
- Repo opens without 404
- README renders correctly
- Run instructions work from fresh clone
- Screenshot and submission docs are present
