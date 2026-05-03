---
phase: 08-critical-bug-fixes
plan: 01
subsystem: backend
tags: [bids, cqrs, mediatr, vsa, query, command, unit-tests]
dependency_graph:
  requires: []
  provides: [GetBidsForJob, RejectBid]
  affects: [BidsController]
tech_stack:
  added: []
  patterns: [VSA feature slices, MediatR query/command, xUnit unit tests, in-memory EF Core]
key_files:
  created:
    - backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobQuery.cs
    - backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobHandler.cs
    - backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobValidator.cs
    - backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobResponse.cs
    - backend/HandyLink.API/Features/Bids/RejectBid/RejectBidCommand.cs
    - backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs
    - backend/HandyLink.API/Features/Bids/RejectBid/RejectBidValidator.cs
    - backend/HandyLink.API/Features/Bids/RejectBid/RejectBidResponse.cs
    - backend/HandyLink.Tests/Unit/Features/Bids/GetBidsForJobHandlerTests.cs
    - backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs
  modified:
    - backend/HandyLink.API/Controllers/BidsController.cs
decisions:
  - GetBidsForJobHandler takes no IMediator dependency (pure query, no side effects)
  - RejectBidHandler takes no IMediator dependency (no push notification needed for rejection)
metrics:
  duration: 8m
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_created: 10
  files_modified: 1
---

# Phase 8 Plan 01: GetBidsForJob and RejectBid Slices Summary

**One-liner:** Two VSA feature slices — GetBidsForJob query (owner-gated bid listing) and RejectBid command (pending-only rejection guard) — with full unit test coverage and BidsController wiring.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | GetBidsForJob query slice + RejectBid command slice | 649b641 | 10 files created |
| 2 | Wire GetBidsForJob and RejectBid into BidsController | b281de7 | BidsController.cs |

## What Was Built

### GetBidsForJob (BUG-01)
- `GET /api/jobs/{jobId}/bids` — returns all bids on a job in descending creation order
- 403 if caller is not the job owner; 404 if job does not exist
- Status returned as string (`"Pending"`, `"Accepted"`, `"Rejected"`, `"Withdrawn"`)

### RejectBid (BUG-04)
- `PATCH /api/bids/{bidId}/reject` — sets a pending bid to Rejected
- 403 if caller is not the job owner; 404 if bid does not exist
- 400 (ValidationException) if bid status is not Pending

## Test Results

All 61 tests pass (8 new + 53 existing):
- `GetBidsForJobHandlerTests`: 4 tests (not found, forbidden, empty list, returns bids)
- `RejectBidHandlerTests`: 4 tests (not found, forbidden, non-pending guard, happy path)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobHandler.cs — FOUND
- backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs — FOUND
- backend/HandyLink.API/Controllers/BidsController.cs — FOUND

Commits exist:
- 649b641 — FOUND
- b281de7 — FOUND
