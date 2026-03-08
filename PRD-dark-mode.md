# PRD: Dark Mode Toggle

## Goal
Add a dark/light mode toggle to the Community Signal Board.

## Tasks
- [ ] Refactor `app/styles.css` to use CSS custom properties for all colors (background, surface, text, border, accent)
- [ ] Add a `.dark` class on `<body>` that overrides the color tokens to dark values
- [ ] Add a toggle button in the page header (sun/moon icon)
- [ ] Implement toggle logic in `app/main.js` — toggle `.dark` on body, persist to `localStorage`
- [ ] On page load, read `localStorage` preference and apply the correct theme
- [ ] Verify the app looks correct in both light and dark modes

## Constraints
- Vanilla JS only — no frameworks
- Do not break existing functionality
- Keep it simple — one toggle button, two themes
