# Manual Test Report (2026-02-27)

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
- [x] Generate Daily Brief exports markdown with action recommendations
- [x] Export digest triggers markdown file download
- [x] Corrupted localStorage payload does not crash startup (sandbox smoke test)
- [x] Style consistency pass applied (shared spacing/radius/border/button/focus tokens)
- [x] Accessibility pass: keyboard focus-visible ring appears on inputs/selects/buttons/delete actions
- [x] Responsive pass: controls stack correctly on narrow breakpoints and signal rows collapse cleanly
- [x] Constraint pass: page background remains solid (no gradients)
- [x] Empty state shows context-aware guidance (new board vs filtered no-results)
- [x] Score badge severity colors render consistently (low/medium/high/critical)
- [x] Toolbar controls stay readable in high-density laptop widths (compact spacing breakpoint)
- [x] Delete action is visually distinct and includes per-signal accessible label

## Known Limitations (MVP-accepted)
- No backend persistence (localStorage only)
- No auth / multi-user mode
