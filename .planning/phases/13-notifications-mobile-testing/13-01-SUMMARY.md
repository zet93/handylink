---
phase: 13-notifications-mobile-testing
plan: "01"
subsystem: backend
tags: [notifications, push, handlers, tdd, unit-tests]
dependency_graph:
  requires: []
  provides: [bid_rejected_notification, job_status_notifications]
  affects: [RejectBidHandler, UpdateJobStatusHandler]
tech_stack:
  added: []
  patterns: [TDD red-green, MediatR mediator chaining]
key_files:
  created: []
  modified:
    - backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs
    - backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs
    - backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs
    - backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs
decisions:
  - RejectBidHandler sends bid_rejected notification to worker after bid rejection; matches AcceptBidHandler pattern
  - UpdateJobStatusHandler sends job_in_progress/job_completed/job_cancelled to worker via AcceptedBid; silently skips when AcceptedBid is null
metrics:
  duration: 2min
  completed: "2026-04-09"
  tasks_completed: 2
  files_modified: 4
---

# Phase 13 Plan 01: Notification Wiring for RejectBid and UpdateJobStatus Summary

JWT HS256-signed push notifications wired into RejectBidHandler and UpdateJobStatusHandler using IMediator chaining and SendPushNotificationCommand, covering all remaining job lifecycle events.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add bid_rejected push notification to RejectBidHandler | 01212d2 | RejectBidHandler.cs, RejectBidHandlerTests.cs |
| 2 | Add job status push notifications to UpdateJobStatusHandler | 330f8bd | UpdateJobStatusHandler.cs, UpdateJobStatusHandlerTests.cs |

## What Was Built

**Task 1 — RejectBidHandler:**
- Added `IMediator mediator` to constructor (matching AcceptBidHandler pattern)
- Added `using HandyLink.Core.Commands;` import
- After `SaveChangesAsync`, sends `SendPushNotificationCommand(bid.WorkerId, "Bid not accepted", "The client chose another worker for this job.", "bid_rejected", bid.JobId)`
- Updated `RejectBidHandlerTests.Build()` to return `(ctx, handler, Mock<IMediator>)` 3-tuple
- Added `Handle_SendsPushNotification_WhenBidRejected` test — 5 tests total pass

**Task 2 — UpdateJobStatusHandler:**
- Added `IMediator mediator` to constructor
- Changed job query to `.Include(j => j.AcceptedBid)` to load accepted bid
- After `SaveChangesAsync`, conditionally sends notification based on new status (InProgress/Completed/Cancelled)
- Guard: `if (job.AcceptedBid is not null)` silently skips notification when no accepted bid
- Updated `UpdateJobStatusHandlerTests` with `withAcceptedBid` seed parameter and 4 new tests — 10 tests total pass

## Verification

Full backend test suite: **101 tests passed** (0 failures)

```
Passed!  - Failed: 0, Passed: 101, Skipped: 0, Total: 101
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files exist:
- FOUND: backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs
- FOUND: backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs
- FOUND: backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs
- FOUND: backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs

Commits exist:
- FOUND: 01212d2
- FOUND: 330f8bd
