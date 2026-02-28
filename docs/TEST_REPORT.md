# Manual Test Report (2026-02-28)

## Environment
- Local static server: `python3 -m http.server 5173`
- App URL: `http://127.0.0.1:5173`

## Checks
- [x] Page loads and main sections render
- [x] JS syntax validation: `node --check app/main.js`
- [x] Add signal form accepts valid inputs
- [x] Ranking formula applied: `urgency * 2 + relevance + confidence`
- [x] Owner and confidence fields are saved and rendered on each signal
- [x] Category filter updates list
- [x] Urgency filter updates list
- [x] Delete item removes record from list and storage
- [x] Template preset apply fills form defaults (source/category/urgency/relevance/confidence/owner)
- [x] Load Demo Scenario injects deterministic fixture and resets filters/search
- [x] Run Health Check reports pass/fail status for core runtime readiness
- [x] Demo Reset + Health Run macro executes atomic sequence (load demo -> clear filters -> run health -> focus top-ranked card)
- [x] Ranked cards display a per-signal recommended next action for immediate operator triage
- [x] Generate Daily Brief exports markdown with action recommendations and explicit scoring formula
- [x] Export digest triggers markdown file download and includes recommended action lines
- [x] Sort order has deterministic tie-break fallback (score -> createdAt -> title)
- [x] Corrupted localStorage payload does not crash startup (sandbox smoke test)
- [x] Storage write failures surface a non-blocking warning toast instead of crashing interactions
- [x] Export path supports Blob URL and data-URL fallback modes for broader browser reliability
- [x] Style consistency pass applied (shared spacing/radius/border/button/focus tokens)
- [x] Accessibility pass: keyboard focus-visible ring appears on inputs/selects/buttons/delete actions
- [x] Responsive pass: controls stack correctly on narrow breakpoints and signal rows collapse cleanly
- [x] Constraint pass: page background remains solid (no gradients)
- [x] Empty state shows context-aware guidance (new board vs filtered no-results)
- [x] Score badge severity colors render consistently (low/medium/high/critical)
- [x] Toolbar controls stay readable in high-density laptop widths (compact spacing breakpoint)
- [x] Delete action is visually distinct and includes per-signal accessible label
- [x] Delete now requires confirmation (with Shift-click quick-delete escape hatch) to prevent accidental destructive clicks during demos
- [x] Generate Judge Snapshot creates a judge-ready markdown artifact with health summary, board metrics, and top-ranked action set
- [x] Generate Judge Snapshot attempts clipboard copy after download for faster form pasting during submission
- [x] Submission Mode toggle hides non-essential controls and spotlights the judge demo path controls only
- [x] Submission spotlight strip renders deterministic 3-step judge flow (reset -> bundle -> paste)
- [x] Generate Final Evidence Bundle exports brief + digest + judge snapshot + manifest-reference in one click
- [x] Final Evidence Bundle auto-exports judge-run completion receipt with timestamp, health status, generated filenames, and receipt SHA-256 integrity line
- [x] Receipt hash verifier micro-proof passes via CLI: `./ops/verify_receipt_hash.sh docs/artifacts/judge-run-completion-receipt-2026-02-28.md`
- [x] End-to-end submission demo path validated: Submission Mode ON -> Demo Reset + Health Run -> Generate Final Evidence Bundle
- [x] Judge path hint is visible and primary demo controls are visually highlighted for faster scanning
- [x] Filter controls now expose explicit accessible names (search/category/urgency)
- [x] Confidence input includes helper microcopy describing expected scoring intent
- [x] Required-field failures render inline `role=alert` guidance, set `aria-invalid`, and focus first failing field
- [x] Signal cards are keyboard-focusable with visible focus ring for list traversal
- [x] Deterministic loop-15 validation pass: `node --check app/main.js` + static marker checks via local HTTP + `curl`
- [x] Readability micro-polish pass (loop 16): list metadata typography tuned for density/rhythm/contrast with no control/layout/functionality changes
- [x] Deterministic loop-16 validation pass (same gate as loop 15): `node --check app/main.js` + static marker checks via local HTTP + `curl`
- [x] New one-click `Run Judge Fast Path` macro executes judge sequence (Demo Reset + Health Run -> Generate Final Evidence Bundle) without changing scoring/deterministic behavior
- [x] Judge-path hint microcopy now prioritizes one-click route while preserving explicit fallback 2-step path
- [x] Loop-21 chained-macro toast polish suppresses intermediate success toasts during `Run Judge Fast Path` and emits one consolidated completion toast
- [x] Deterministic loop-21 validation pass: `node --check app/main.js` + marker checks for `judge-path-hint` and `form-error`
- [x] Loop-22 explainability polish: each ranked card now shows explicit score formula breakdown and score badge tooltip/aria label with formula text

## Known Limitations (MVP-accepted)
- No backend persistence (localStorage only)
- No auth / multi-user mode

## Receipt integrity correction (2026-02-28)
- Revalidated command:
  - `./ops/verify_receipt_hash.sh docs/artifacts/judge-run-completion-receipt-2026-02-28.md`
- Result:
  - `PASS: receipt body hash verified (630d3c800f4c7677a1a37def88ed814af01712e4d4a44215a29fb2b09c9b5717)`
