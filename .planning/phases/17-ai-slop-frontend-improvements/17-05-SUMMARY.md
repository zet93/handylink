---
phase: 17-ai-slop-frontend-improvements
plan: "05"
subsystem: mobile screens
tags: [categories, romanian-labels, mobile, expo-router]
dependency_graph:
  requires:
    - 17-01 (mobile/constants/categories.ts)
  provides:
    - Romanian category labels on all four mobile user-visible screens
  affects:
    - mobile/app/(public)/browse.tsx
    - mobile/app/(public)/job-detail.tsx
    - mobile/app/(client)/post-job.tsx
    - mobile/app/(worker)/browse.tsx
tech_stack:
  added: []
  patterns:
    - Import getCategoryLabel from shared constants; raw enum values preserved for API payloads
key_files:
  created: []
  modified:
    - mobile/app/(public)/browse.tsx
    - mobile/app/(public)/job-detail.tsx
    - mobile/app/(client)/post-job.tsx
    - mobile/app/(worker)/browse.tsx
decisions:
  - FILTER_CATEGORIES preserves 'all' sentinel at index 0; CATEGORY_KEYS from constants drives all other entries
  - Worker browse 'all' chip labeled 'Toate' (Romanian); all other chips use getCategoryLabel
  - Picker value prop stays as raw enum string so API receives correct enum value
metrics:
  duration: "~10 minutes"
  completed: "2026-04-26T00:00:00Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 17 Plan 05: Mobile Category Labels Summary

Romanian category labels applied to all four mobile screens via `getCategoryLabel` from `mobile/constants/categories.ts`; raw enum values remain intact for API transmission.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T09 | Fix category labels in public browse and job detail | 74a3094 | mobile/app/(public)/browse.tsx, mobile/app/(public)/job-detail.tsx |
| T10 | Fix category labels in post-job and worker browse | 3bbc018 | mobile/app/(client)/post-job.tsx, mobile/app/(worker)/browse.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All four files import `getCategoryLabel` from `../../constants/categories`
- No `.charAt(0).toUpperCase()` category formatting remains in any of the four files
- `mobile/app/(worker)/browse.tsx` uses `FILTER_CATEGORIES = ['all', ...CATEGORY_KEYS]` with chip label `cat === 'all' ? 'Toate' : getCategoryLabel(cat)`
- `mobile/app/(client)/post-job.tsx` Picker uses `CATEGORY_KEYS.map` with `getCategoryLabel(c)` as label; `value={c}` stays raw
- Bid sheet subtitle in worker browse: `{selectedJob.city} · {getCategoryLabel(selectedJob.category)}`
- Local `const CATEGORIES` arrays removed from both post-job.tsx and worker browse.tsx

## Known Stubs

None.

## Threat Flags

None. Category display change is purely cosmetic — raw enum values are preserved as Picker `value` props and API payload fields. No new network endpoints or auth paths introduced.

## Self-Check: PASSED

- [x] mobile/app/(public)/browse.tsx modified with getCategoryLabel
- [x] mobile/app/(public)/job-detail.tsx modified with getCategoryLabel
- [x] mobile/app/(client)/post-job.tsx modified with getCategoryLabel + CATEGORY_KEYS
- [x] mobile/app/(worker)/browse.tsx modified with getCategoryLabel + FILTER_CATEGORIES
- [x] Commit 74a3094 exists (T09)
- [x] Commit 3bbc018 exists (T10)
