---
phase: 14-maps-location
plan: "01"
subsystem: backend
tags: [location, maps, jobs, workers, sql-migration, cqrs, tdd]
dependency_graph:
  requires: []
  provides:
    - location fields on jobs table (lat/lng/address)
    - location fields on worker_profiles table (lat/lng/service_radius_km)
    - UpdateWorkerLocation MediatR slice
    - PUT /api/users/me/location endpoint
  affects:
    - CreateJob API (accepts optional location fields)
    - GetJobs API (returns location in JobSummary)
    - GetJobById API (returns location in response)
tech_stack:
  added: []
  patterns:
    - VSA + CQRS for UpdateWorkerLocation slice
    - TDD (RED/GREEN) for handler tests
    - FluentValidation with When() conditional rules
key_files:
  created:
    - backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql
    - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationCommand.cs
    - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationHandler.cs
    - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationValidator.cs
    - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationResponse.cs
    - backend/HandyLink.Tests/Unit/Features/Workers/UpdateWorkerLocationHandlerTests.cs
  modified:
    - backend/HandyLink.Core/Entities/Job.cs
    - backend/HandyLink.Core/Entities/WorkerProfile.cs
    - backend/HandyLink.Infrastructure/Data/HandyLinkDbContext.cs
    - backend/HandyLink.Core/DTOs/CreateJobDto.cs
    - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs
    - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs
    - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs
    - backend/HandyLink.API/Controllers/JobsController.cs
    - backend/HandyLink.API/Features/Jobs/GetJobs/GetJobsResponse.cs
    - backend/HandyLink.API/Features/Jobs/GetJobs/GetJobsHandler.cs
    - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs
    - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdHandler.cs
    - backend/HandyLink.API/Controllers/UsersController.cs
    - backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs
    - backend/HandyLink.Tests/Unit/Services/JobServiceTests.cs
decisions:
  - UsersController injects both UserService (legacy) and IMediator — deliberate exception to avoid service migration out of scope; UpdateMe stays on UserService, UpdateLocation uses MediatR
  - Location fields are fully optional on jobs (no validator rules for lat/lng/address)
  - ServiceRadiusKm constrained to [10, 20, 50, 100] via FluentValidation; null allowed to clear
metrics:
  duration: "~12 minutes"
  completed: "2026-04-20"
  tasks_completed: 3
  files_changed: 15
---

# Phase 14 Plan 01: Location Fields Backend Foundation Summary

SQL migration plus entity/DTO/response updates to add location data support to the backend, with new UpdateWorkerLocation MediatR slice and unit tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SQL migration + entities + DbContext | 8576428 | 003_add_location_fields.sql, Job.cs, WorkerProfile.cs, HandyLinkDbContext.cs |
| 2 | Extend CreateJob/GetJobs/GetJobById slices | 5f51dc7 | 11 files — DTOs, commands, handlers, responses, controller, tests |
| 3 (RED) | Failing tests for UpdateWorkerLocation | fd5a8af | UpdateWorkerLocationHandlerTests.cs |
| 3 (GREEN) | Implement UpdateWorkerLocation slice + endpoint | cf337ea | Command, Handler, Validator, Response, UsersController |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed positional record constructor breaks in existing tests**
- **Found during:** Task 2 test run
- **Issue:** `CreateJobCommand` and `CreateJobDto` now have 3 additional positional parameters; existing `CreateJobHandlerTests` and `JobServiceTests` had calls without them — compile error CS7036
- **Fix:** Added `null, null, null` for `Latitude`, `Longitude`, `Address` in all affected test constructor calls
- **Files modified:** `CreateJobHandlerTests.cs`, `JobServiceTests.cs`
- **Commit:** 5f51dc7 (included in Task 2 commit)

## TDD Gate Compliance

- RED gate: `fd5a8af` — `test(14-01): add failing tests for UpdateWorkerLocation handler`
- GREEN gate: `cf337ea` — `feat(14-01): implement UpdateWorkerLocation slice and PUT /api/users/me/location endpoint`

Both gates present in git log. Sequence is correct.

## Known Stubs

None — all location fields wire through to real DB columns via EF Core. SQL migration must be run in Supabase before API calls with location data will persist correctly.

## Threat Flags

None — no new auth paths or network endpoints beyond the authenticated PUT /api/users/me/location (protected by existing `[Authorize]` on the controller class).

## Self-Check: PASSED

- [x] `003_add_location_fields.sql` exists
- [x] `UpdateWorkerLocationHandler.cs` exists
- [x] `UpdateWorkerLocationHandlerTests.cs` exists (79 lines)
- [x] Commit 8576428 exists
- [x] Commit 5f51dc7 exists
- [x] Commit fd5a8af exists
- [x] Commit cf337ea exists
- [x] `dotnet test` — 104 passed, 0 failed
