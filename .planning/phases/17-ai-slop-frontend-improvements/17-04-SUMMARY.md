---
phase: 17-ai-slop-frontend-improvements
plan: "04"
subsystem: frontend/web
tags: [categories, romanian-labels, navbar, lucide-react, active-states]
dependency_graph:
  requires:
    - 17-01 (frontend/src/constants/categories.js)
  provides:
    - PostJobPage with Romanian category labels
    - NavBar with Lucide Bell icon and active link states
  affects:
    - frontend/src/pages/PostJobPage.jsx
    - frontend/src/components/NavBar.jsx
tech_stack:
  added: []
  patterns:
    - Import shared category constants instead of local array
    - NavLink className callback for active-state styling
key_files:
  created: []
  modified:
    - frontend/src/pages/PostJobPage.jsx
    - frontend/src/components/NavBar.jsx
decisions:
  - Reuse getCategoryLabel and CATEGORY_KEYS from constants/categories.js — no local duplication
  - NavLink used only for route links; logo and auth buttons remain as Link/button
  - Bell rendered without explicit color to inherit text color from parent
metrics:
  duration: "~10 minutes"
  completed: "2026-04-26T18:30:00Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 17 Plan 04: PostJobPage Labels and NavBar Polish Summary

Romanian category labels wired into PostJobPage select via shared constants; NavBar emoji bell replaced with Lucide Bell SVG and route links upgraded to NavLink with active-state styling.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T07 | Romanian labels in PostJobPage category select | 8157805 | frontend/src/pages/PostJobPage.jsx |
| T08 | NavBar polish — Bell icon, active link states | 51e7683 | frontend/src/components/NavBar.jsx |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm run build` exits 0 (545ms, 628 modules)
- No `replace('_', ' ')` in PostJobPage.jsx
- No 🔔 emoji in NavBar.jsx
- `getCategoryLabel` imported and used in PostJobPage.jsx
- `z.enum(CATEGORY_KEYS)` — option values remain raw enum strings
- `NavLink` used for all 4 route links in both nav variants
- `Bell` icon from lucide-react renders at size 20

## Known Stubs

None.

## Threat Flags

None. Category option values remain raw enum strings validated by Zod before submission; no new network endpoints or auth paths introduced.

## Self-Check: PASSED

- [x] `frontend/src/pages/PostJobPage.jsx` modified — CATEGORY_KEYS import, getCategoryLabel in options
- [x] `frontend/src/components/NavBar.jsx` modified — Bell icon, NavLink active states
- [x] Commit 8157805 exists (T07)
- [x] Commit 51e7683 exists (T08)
- [x] Build passes
