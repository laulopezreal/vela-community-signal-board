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
- [x] Generate Daily Brief exports markdown with action recommendations
- [x] Export digest triggers markdown file download

## Known Limitations (MVP-accepted)
- No backend persistence (localStorage only)
- No auth / multi-user mode
