---
phase: 10-browse-first-ux
plan: "01"
subsystem: backend
tags: [anonymous-access, auth, integration-tests, tdd]
dependency_graph:
  requires: []
  provides: [public-job-reads, public-worker-reads]
  affects: [frontend-browse, mobile-browse]
tech_stack:
  added: []
  patterns: [AllowAnonymous on method-level overrides class-level Authorize]
key_files:
  created:
    - backend/HandyLink.Tests/Integration/Controllers/AnonymousAccessTests.cs
  modified:
    - backend/HandyLink.API/Controllers/JobsController.cs
    - backend/HandyLink.API/Controllers/WorkersController.cs
    - backend/HandyLink.Tests/Integration/Controllers/JobsControllerTests.cs
decisions:
  - "Method-level [AllowAnonymous] overrides class-level [Authorize] — no class attribute needed at all; class dropped entirely for clarity"
  - "GetJobs_Returns401_WhenNoToken renamed and updated to expect 200 — old test asserted now-intentional behavior change"
metrics:
  duration: "94s"
  completed: "2026-04-01"
  tasks_completed: 2
  files_modified: 4
---

# Phase 10 Plan 01: Public Browse Endpoints Summary

**One-liner:** Replaced class-level `[Authorize]` with method-level `[AllowAnonymous]` on GET actions in JobsController and WorkersController, enabling unauthenticated browse access while keeping write endpoints protected.

## What Was Built

Anonymous GET access to four endpoints:
- `GET /api/jobs` — 200 without auth
- `GET /api/jobs/{id}` — 200 without auth
- `GET /api/workers` — 200 without auth
- `GET /api/workers/{id}` — not 401 without auth

Write endpoints remain protected:
- `POST /api/jobs` — 401 without auth
- `PATCH /api/jobs/{id}/status` — 401 without auth

## TDD Flow

**RED (commit 512ed18):** Created `AnonymousAccessTests.cs` with 6 tests. 4 GET tests failed (401), 2 write tests passed — expected RED state.

**GREEN (commit 6bcaecb):** Removed class-level `[Authorize]` from both controllers; added `[AllowAnonymous]` to GET actions and `[Authorize]` to write actions. All 6 anonymous access tests passed. Fixed `GetJobs_Returns401_WhenNoToken` in `JobsControllerTests.cs` (renamed + updated to expect 200). Full suite: 86/86 green.

## Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| 1 (RED) | 512ed18 | test | Add failing anonymous access integration tests |
| 2 (GREEN) | 6bcaecb | feat | Make job and worker GET endpoints publicly accessible |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
