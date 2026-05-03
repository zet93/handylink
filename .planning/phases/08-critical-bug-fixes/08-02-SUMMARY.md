---
phase: 08-critical-bug-fixes
plan: 02
subsystem: backend
tags: [jobs, workers, cqrs, di, bug-fix]
dependency_graph:
  requires: []
  provides: [UpdateJobStatus handler, Worker DI registrations]
  affects: [JobsController, Program.cs, WorkersController]
tech_stack:
  added: []
  patterns: [VSA + CQRS via MediatR, snake_case status parsing, allowed-transitions hashset]
key_files:
  created:
    - backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusCommand.cs
    - backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs
    - backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusValidator.cs
    - backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusResponse.cs
    - backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs
    - backend/HandyLink.Tests/Integration/Controllers/WorkersControllerTests.cs
  modified:
    - backend/HandyLink.Core/DTOs/UpdateJobStatusDto.cs
    - backend/HandyLink.API/Program.cs
    - backend/HandyLink.API/Controllers/JobsController.cs
decisions:
  - "UpdateJobStatusDto changed from JobStatus enum to string Status to enable snake_case parsing in the handler"
  - "Custom HandyLink.Core.Exceptions.ValidationException used (not FluentValidation's) for transition errors, consistent with SubmitBidHandler pattern"
metrics:
  duration: 160s
  completed: 2026-03-31
  tasks_completed: 2
  files_changed: 9
---

# Phase 8 Plan 02: UpdateJobStatus command slice + Worker DI fix Summary

**One-liner:** PATCH /api/jobs/{id}/status handler with transition validation and Worker DI registrations fixing 500 crashes on GET /api/workers.

## What Was Done

### Task 1: UpdateJobStatus command slice + Worker DI fix + Workers integration test

Created the full VSA slice for `UpdateJobStatus` under `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/`. The handler:
- Parses status strings with underscore stripping (`"in_progress"` -> `"InProgress"`) and case-insensitive `Enum.TryParse`
- Validates transitions against an allowed set: Accepted->InProgress, Accepted->Cancelled, InProgress->Completed, InProgress->Cancelled
- Guards ownership via `ForbiddenException`, missing job via `NotFoundException`

Fixed `Program.cs` by adding `IWorkerRepository`/`WorkerRepository` and `WorkerService` DI registrations after the `UserService` registration.

Updated `UpdateJobStatusDto` from `JobStatus` enum to `string Status` to allow the handler to perform its own flexible parsing.

Added 6 unit tests (all green) and 1 integration test proving GET /api/workers returns 200 after the DI fix.

### Task 2: Wire UpdateJobStatus into JobsController

Added `[HttpPatch("{id:guid}/status")]` action to `JobsController` following the single-line MediatR dispatch pattern. Full build: 0 errors, 60 tests passing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated UpdateJobStatusDto from enum to string**
- **Found during:** Task 1
- **Issue:** Existing `UpdateJobStatusDto` used `JobStatus` enum type which would prevent the handler from receiving raw string values for snake_case parsing
- **Fix:** Changed DTO to `record UpdateJobStatusDto(string Status)` as specified in plan
- **Files modified:** `backend/HandyLink.Core/DTOs/UpdateJobStatusDto.cs`
- **Commit:** a627dfd

**2. [Rule 2 - Consistency] Used custom ValidationException instead of FluentValidation's**
- **Found during:** Task 1
- **Issue:** Plan specified `new ValidationException(new[] { new ValidationFailure(...) })` (FluentValidation pattern) but project uses custom `HandyLink.Core.Exceptions.ValidationException(string message)`
- **Fix:** Used the custom exception with string message, consistent with all other handlers (SubmitBidHandler, CreateReviewHandler etc.) and GlobalExceptionMiddleware handling
- **Files modified:** `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs`
- **Commit:** a627dfd

## Known Stubs

None.

## Self-Check: PASSED

All created files verified present. Both task commits (a627dfd, e3c406a) confirmed in git log.
