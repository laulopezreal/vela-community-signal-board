# Competitive Comparison Matrix (Loop 22)

Date: 2026-02-28
Scope: Docs-first parity and differentiation audit for Community Signal Board.

## Comparator set
- Notion database + views
- Trello board + labels
- Airtable base + filtered views
- Generic newsletter curation docs workflow (manual markdown)

## Functionality parity and differentiation

| Capability | Community Signal Board | Notion DB | Trello | Airtable | Manual docs workflow |
|---|---|---|---|---|---|
| Fast capture of updates | Yes, single form | Yes | Yes | Yes | Slow, manual |
| Priority ranking | Built-in urgency-weighted score | Manual formulas | Manual labels | Formula fields | Manual |
| Deterministic demo baseline | Yes, fixed seeded scenario | No native path | No native path | No native path | Possible but manual |
| In-app health preflight | Yes, one click | No | No | No | No |
| One-click evidence bundle | Yes | No | No | No | No |
| Receipt with hash validation | Yes | No | No | No | No |
| Judge-speed submission mode | Yes | No | No | No | No |
| Explainable scoring at item level | Partial before loop 22, now explicit formula text per item | Usually hidden in formula columns | Weak | Medium | Depends on author |

## Highest-EV gaps found
1. **Score explainability depth**: tools like Airtable can expose formulas in-table; our app had global formula text but weaker per-item explanation in primary list scan.
2. **Evidence verification discoverability**: strong artifacts exist, but cross-doc discoverability can still depend on judge reading order.

## Loop-22 selected gap closure (smallest high-EV)
Chosen gap: **Score explainability depth**.

Why this one:
- Highest confidence for judge trust uplift in first 30 seconds.
- Very small risk surface: display-layer copy only, no ranking logic changes.
- Improves parity against formula-forward tools while preserving current deterministic flow.

Implemented in loop 22:
- Added explicit per-item formula breakdown in list metrics.
- Added score badge tooltip and accessible label with formula breakdown.

Non-selected gap in this loop:
- Evidence discoverability can be improved later via lightweight cross-link index polish only.
