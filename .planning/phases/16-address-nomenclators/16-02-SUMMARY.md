---
phase: 16-address-nomenclators
plan: "02"
subsystem: database
tags: [migration, schema, sql, county, nomenclator]
dependency_graph:
  requires: []
  provides: [004_add_county_field.sql, county-column-jobs, county-column-profiles]
  affects: [public.jobs, public.profiles]
tech_stack:
  added: []
  patterns: [SQL DDL migration, ALTER TABLE ADD COLUMN IF NOT EXISTS]
key_files:
  created:
    - backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql
  modified: []
decisions:
  - "county is TEXT nullable — no NOT NULL, no DEFAULT (D-07: old records stay as NULL)"
  - "Target table for profile county is public.profiles, not public.worker_profiles"
  - "IF NOT EXISTS makes migration idempotent — safe to run multiple times"
metrics:
  duration: "< 2 minutes"
  completed: "2026-04-25T05:53:00Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 16 Plan 02: Add County SQL Migration Summary

**One-liner:** SQL migration adding nullable `county TEXT` column to `public.jobs` and `public.profiles` via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, ready for Supabase SQL editor execution.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create 004_add_county_field.sql migration | dbd4677 | `backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql` |

## Verification

```
grep -c "ADD COLUMN IF NOT EXISTS county TEXT" backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql
```

Output: `2` — confirmed.

Acceptance criteria verified:
- File exists at correct path
- 2 occurrences of `ADD COLUMN IF NOT EXISTS county TEXT`
- Contains `ALTER TABLE public.jobs`
- Contains `ALTER TABLE public.profiles`
- Does NOT contain `worker_profiles`
- Does NOT contain `NOT NULL` or `DEFAULT`
- Header: `-- Migration 004: Add county field to jobs and profiles`

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — DDL is developer-only, idempotent, no user-facing surface.

## Self-Check: PASSED

- `backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql` — FOUND
- Commit `dbd4677` — FOUND
