---
phase: 16-address-nomenclators
plan: 03
subsystem: backend
tags: [county, entities, records, handlers, service, tests]
key-files:
  created: []
  modified:
    - backend/HandyLink.Core/Entities/Job.cs
    - backend/HandyLink.Core/Entities/Profile.cs
    - backend/HandyLink.Core/DTOs/CreateJobDto.cs
    - backend/HandyLink.Core/DTOs/UpdateUserDto.cs
    - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs
    - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs
    - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs
    - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdHandler.cs
    - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs
    - backend/HandyLink.Core/Services/UserService.cs
    - backend/HandyLink.API/Controllers/JobsController.cs
    - backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs
    - backend/HandyLink.Tests/Unit/Services/UserServiceTests.cs
    - backend/HandyLink.Tests/Unit/Services/JobServiceTests.cs
metrics:
  tasks_completed: 2
  tasks_total: 2
  files_changed: 14
---

# Plan 16-03 Summary: Backend County Layer

## What Was Built

Added `string? County` to all backend layers atomically to prevent positional record compilation failures.

| Layer | Change |
|-------|--------|
| Entities | `Job.cs`, `Profile.cs` — `public string? County { get; set; }` added |
| DTOs | `CreateJobDto`, `UpdateUserDto` — `string? County` added after `Country` |
| Command/Response | `CreateJobCommand`, `CreateJobResponse`, `GetJobByIdResponse` — `string? County` added positionally |
| Handlers | `CreateJobHandler` — `County = command.County` in job init + `job.County` in response; `GetJobByIdHandler` — `job.County` in response |
| Service | `UserService.UpdateCurrentUserAsync` — `if (dto.County is not null) profile.County = dto.County;` |
| Controller | `JobsController` — `dto.County` passed to `CreateJobCommand` |
| Tests | `CreateJobHandlerTests`, `UserServiceTests`, `JobServiceTests` — all positional call sites updated |

## Commits

| Commit | Description |
|--------|-------------|
| 7679a16 | feat(16-03): add County to entities, DTOs, positional records, controller, and tests (Task 1) |
| a47d25b | feat(16-03): wire County through handlers and UserService; fix all call sites (Task 2) |

## Deviations

- `JobServiceTests.cs` was not listed in the original plan's `files_modified` but required updating — it uses positional `CreateJobDto` constructors. Fixed as part of Task 2 to ensure build passes.
- `GetJobByIdHandlerTests.cs` did not require changes — it tests via `handler.Handle()` and checks result properties, not positional record construction.

## Self-Check: PASSED

- `dotnet build backend/` exits 0, 0 errors ✓
- `Job.cs` contains `public string? County { get; set; }` ✓
- `Profile.cs` contains `public string? County { get; set; }` ✓
- `CreateJobCommand.cs` contains `string? County` ✓
- `CreateJobResponse.cs` contains `string? County` ✓
- `GetJobByIdResponse.cs` contains `string? County` ✓
- `JobsController.cs` contains `dto.County` ✓
- `UserService.cs` contains `if (dto.County is not null) profile.County = dto.County;` ✓
- 11/11 targeted tests pass (CreateJobHandlerTests 2, GetJobByIdHandlerTests 2, UserServiceTests 7) ✓
