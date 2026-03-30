# Phase 8: Critical Bug Fixes — Research

**Researched:** 2026-03-30
**Domain:** ASP.NET Core 10 VSA+CQRS — missing endpoints, missing DI registrations
**Confidence:** HIGH (all findings from direct codebase inspection)

## Summary

Phase 8 fixes four specific backend gaps that collectively break the core job-lifecycle flow. Three bugs are missing feature slices (endpoints that the frontend and mobile call but the backend never implemented). One bug is two missing DI registrations in `Program.cs` that cause an `InvalidOperationException` on every request to `/api/workers`.

All four fixes are purely backend. No frontend changes are required — the callers already exist and will work as-is once the backend endpoints and DI registrations are present. Each fix is independent of the others and can be implemented and tested in isolation.

The project uses VSA+CQRS via MediatR for all new backend features (Phase 3.5+ rule). BUG-01, BUG-02, and BUG-04 each require a new feature slice following the established pattern. BUG-03 is a two-line addition to `Program.cs`.

**Primary recommendation:** Implement each bug fix as a self-contained task: one task per feature slice, one task for the DI registration, one task for tests. The fixes do not require schema changes, migration scripts, or frontend edits.

---

## Project Constraints (from CLAUDE.md)

- Architecture: VSA + CQRS via MediatR — no new Service classes (Phase 3.5+ rule)
- Controllers: only `_mediator.Send()` — no business logic in controllers
- User identity: always `GetUserId()` from JWT — never from request body
- Database: Supabase PostgreSQL — schema changes via SQL scripts only, never EF migrations
- Secrets: environment variables only — never hardcode
- Tests: xUnit + Moq + FluentAssertions; integration tests use `CustomWebAppFactory` with in-memory EF

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | Client can view all bids submitted on their job (`GET /api/jobs/{id}/bids` missing) | Add `GetBidsForJob` query slice + controller action |
| BUG-02 | Client can advance job status (`PATCH /api/jobs/{id}/status` missing) | Add `UpdateJobStatus` command slice + controller action |
| BUG-03 | Worker profile endpoints do not crash (`WorkerService`/`WorkerRepository` not DI-registered) | Two `AddScoped` lines in `Program.cs` |
| BUG-04 | Client can reject individual bids (`PATCH /api/bids/{id}/reject` missing) | Add `RejectBid` command slice + controller action |
</phase_requirements>

---

## Standard Stack

This phase uses only the existing project stack — no new packages.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MediatR | 12.4.1 | CQRS handler dispatch | Project standard for all post-3.5 features |
| FluentValidation | 11.x | Request validation via pipeline | Auto-runs via `ValidationBehaviour<,>` |
| EF Core | 10.0.4 | DB queries | Handlers call `HandyLinkDbContext` directly |
| xUnit | 2.9.3 | Test runner | Project standard |
| FluentAssertions | 8.x | Test assertions | Project standard |
| Moq | 4.20.72 | Mocking | Project standard |

**No new packages required.**

---

## Architecture Patterns

### Feature Slice Structure (mandatory)

Every new feature slice follows this exact layout:

```
backend/HandyLink.API/Features/{Domain}/{Action}/
  {Action}Command.cs   — record implementing IRequest<{Action}Response>
  {Action}Handler.cs   — implements IRequestHandler<{Action}Command, {Action}Response>
  {Action}Validator.cs — FluentValidation rules (omit only if no validation needed)
  {Action}Response.cs  — output record
```

### Pattern 1: Query slice (BUG-01 — GetBidsForJob)

**What:** Read-only query that returns all bids for a job. The client is the owner and needs to see bids to act on them.

**Route:** `GET /api/jobs/{jobId}/bids` — added to `BidsController` alongside existing endpoints.

**Authorization:** Caller must be the job's `ClientId`. Return 403 if not. The frontend passes the Supabase Bearer token; `GetUserId()` extracts the caller's ID.

**Response shape expected by frontend** (`JobDetailPage.jsx` line 191, `job-detail.tsx` line 66):
The frontend maps over `bids` and accesses `bid.id`, `bid.workerId`, `bid.priceEstimate`, `bid.message`, `bid.status`. The response must include those fields.

```csharp
// GetBidsForJobQuery.cs
public record GetBidsForJobQuery(Guid ClientId, Guid JobId) : IRequest<List<GetBidsForJobResponse>>;

// GetBidsForJobResponse.cs
public record GetBidsForJobResponse(
    Guid Id,
    Guid JobId,
    Guid WorkerId,
    decimal PriceEstimate,
    string Message,
    string Status,
    DateTimeOffset CreatedAt);

// Handler pattern — direct DbContext call, same as all other handlers
public class GetBidsForJobHandler(HandyLinkDbContext context)
    : IRequestHandler<GetBidsForJobQuery, List<GetBidsForJobResponse>>
```

**Validator:** Validate that `JobId` is not empty. No other rules needed.

**Controller action** (add to `BidsController`):
```csharp
[HttpGet("jobs/{jobId:guid}/bids")]
public async Task<IActionResult> GetBidsForJob(Guid jobId, CancellationToken ct)
    => Ok(await mediator.Send(new GetBidsForJobQuery(GetUserId(), jobId), ct));
```

Note: The handler must verify the caller owns the job and throw `ForbiddenException` if not — the controller only dispatches.

### Pattern 2: Status transition command (BUG-02 — UpdateJobStatus)

**What:** Allows the client (job owner) to advance job status. The frontend calls `PATCH /api/jobs/{id}/status` with body `{ status: "in_progress" }`.

**Route:** `PATCH /api/jobs/{id}/status` — added to `JobsController`.

**Allowed transitions** (based on domain model in ARCHITECTURE.md):
- `Accepted` → `InProgress`
- `InProgress` → `Completed`
- `InProgress` → `Cancelled`
- `Accepted` → `Cancelled`

The frontend currently only triggers `in_progress` (from the "Mark as In Progress" button when status is `accepted`). The command should validate the transition is legal and throw `ValidationException` for invalid ones.

**Status string mapping:** The frontend sends lowercase strings (`"in_progress"`). The `JobStatus` enum uses `InProgress`. The handler must parse the incoming string to the enum — or accept the enum directly and rely on the `JsonStringEnumConverter` already registered in `Program.cs` (line 22). The `JsonStringEnumConverter` serializes `InProgress` → `"InProgress"`, but the frontend sends `"in_progress"`. Resolution: accept the raw string in the command and map it manually, OR use a case-insensitive parse. Using a DTO with `[JsonConverter]` is also an option — keep it simple.

**Response:** Return the updated `JobStatus` string and `JobId`.

```csharp
// UpdateJobStatusCommand.cs
public record UpdateJobStatusCommand(Guid ClientId, Guid JobId, string Status)
    : IRequest<UpdateJobStatusResponse>;

// UpdateJobStatusResponse.cs
public record UpdateJobStatusResponse(Guid JobId, string Status);
```

**Controller action** (add to `JobsController`):
```csharp
[HttpPatch("{id:guid}/status")]
public async Task<IActionResult> UpdateJobStatus(Guid id, [FromBody] UpdateJobStatusDto dto, CancellationToken ct)
    => Ok(await mediator.Send(new UpdateJobStatusCommand(GetUserId(), id, dto.Status), ct));
```

Add a simple DTO in `HandyLink.Core/DTOs/` (or inline in the command) for `{ string Status }`.

### Pattern 3: Two-line DI fix (BUG-03 — Worker DI)

**What:** `WorkersController` constructor-injects `WorkerService`. `WorkerService` constructor-injects `IWorkerRepository`. Neither is registered. Adding two lines to `Program.cs` fixes runtime crashes.

**Exact insertion point:** After the existing registrations for `NotificationService` and `UserService` (lines 64–68 of `Program.cs`):

```csharp
// Program.cs — add these two lines
builder.Services.AddScoped<IWorkerRepository, WorkerRepository>();
builder.Services.AddScoped<WorkerService>();
```

Also add the required `using` for `WorkerRepository` if not already present. `WorkerRepository` is in `HandyLink.Infrastructure.Repositories` (already imported via `HandyLink.Infrastructure`). `IWorkerRepository` is in `HandyLink.Core.Interfaces`. Both namespaces are already used in `Program.cs`.

### Pattern 4: RejectBid command slice (BUG-04)

**What:** Allows the client to reject a specific pending bid. Route: `PATCH /api/bids/{id}/reject` — added to `BidsController`.

**Business rules:**
- Caller must be the job's `ClientId` — throw `ForbiddenException` otherwise
- Bid must be `Pending` — throw `ValidationException` if already accepted or rejected
- Only set `bid.Status = BidStatus.Rejected` and update `bid.UpdatedAt`
- Do NOT change job status (unlike `AcceptBid` which transitions the job)

This is simpler than `AcceptBid` — no cascade, no push notification required (per CONCERNS.md, the existing `BidService.RejectBidAsync` in the legacy service does not send a notification either; only acceptance triggers a push).

```csharp
// RejectBidCommand.cs
public record RejectBidCommand(Guid ClientId, Guid BidId) : IRequest<RejectBidResponse>;

// RejectBidResponse.cs
public record RejectBidResponse(Guid BidId, string Status);

// Controller action (add to BidsController)
[HttpPatch("bids/{bidId:guid}/reject")]
public async Task<IActionResult> RejectBid(Guid bidId, CancellationToken ct)
    => Ok(await mediator.Send(new RejectBidCommand(GetUserId(), bidId), ct));
```

**Validator:** Validate `BidId` is not empty. Business-rule validation (Pending check, ownership) belongs in the handler.

### Anti-Patterns to Avoid

- **Do not create a Service class** for any of these features — handlers only (CLAUDE.md non-negotiable rule).
- **Do not read user ID from request body** — always `GetUserId()` from JWT.
- **Do not run EF migrations** — no schema changes needed; all tables already exist.
- **Do not put business logic in controllers** — controller dispatches command, handler owns the logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Forbidden access check | Custom attribute | Throw `ForbiddenException` in handler — `GlobalExceptionMiddleware` maps it to 403 |
| Validation failure response | Manual ModelState checks | Throw `ValidationException` in handler — `ValidationBehaviour` catches it |
| Status string → enum parsing | Custom converter | `Enum.TryParse<JobStatus>(status, ignoreCase: true, out var result)` |
| Auth middleware | New middleware | Use existing `[Authorize]` + `GetUserId()` pattern |

---

## Common Pitfalls

### Pitfall 1: Status string case mismatch (BUG-02)

**What goes wrong:** Frontend sends `"in_progress"` (snake_case, lowercase). C# `JobStatus.InProgress` serialized by `JsonStringEnumConverter` produces `"InProgress"` (PascalCase). `Enum.Parse` is case-sensitive by default.

**Why it happens:** The enum converter handles serialization of responses, but not deserialization of incoming strings if they don't match the enum name exactly.

**How to avoid:** Use `Enum.TryParse<JobStatus>(dto.Status, ignoreCase: true, out var parsed)` in the handler, or strip underscores before parsing. Throw `ValidationException("Invalid status value.")` if parsing fails.

**Warning signs:** Handler throws an unhandled exception deserializing the command body → 500 instead of 400.

### Pitfall 2: GetBidsForJob leaks bids to non-owners (BUG-01)

**What goes wrong:** Omitting the ownership check allows any authenticated user to call `GET /api/jobs/{id}/bids` and see all bids.

**Why it happens:** Controllers only dispatch; ownership guard must be in the handler.

**How to avoid:** In `GetBidsForJobHandler`, load the job first, check `job.ClientId == command.ClientId`, throw `ForbiddenException` if not.

### Pitfall 3: Missing `using` statements after DI fix (BUG-03)

**What goes wrong:** `Program.cs` compiles fine locally but the added types need namespace imports.

**How to avoid:** Verify `WorkerRepository` (`HandyLink.Infrastructure.Repositories`) and `IWorkerRepository` (`HandyLink.Core.Interfaces`) are referenced. Check the existing `using` directives at the top of `Program.cs` — `HandyLink.Infrastructure.Repositories` and `HandyLink.Core.Interfaces` are not currently imported (only `HandyLink.Core.Entities.Enums`, `HandyLink.Core.Interfaces`, `HandyLink.Core.Services`, `HandyLink.Infrastructure.Data`, `HandyLink.Infrastructure.Repositories` are present — confirm at build time).

**Warning signs:** `CS0246: The type or namespace name 'WorkerRepository' could not be found`.

### Pitfall 4: RejectBid handler does not guard against re-rejecting (BUG-04)

**What goes wrong:** If a bid is already `Accepted`, rejecting it would silently downgrade its status.

**How to avoid:** Check `bid.Status == BidStatus.Pending` before changing it; throw `ValidationException("Bid is not in a rejectable state.")` otherwise.

---

## Code Examples

### Existing handler pattern (reference for all three new slices)

```csharp
// Source: backend/HandyLink.API/Features/Bids/AcceptBid/AcceptBidHandler.cs
public class AcceptBidHandler(HandyLinkDbContext context, IMediator mediator)
    : IRequestHandler<AcceptBidCommand, AcceptBidResponse>
{
    public async Task<AcceptBidResponse> Handle(AcceptBidCommand command, CancellationToken cancellationToken)
    {
        var bid = await context.Bids
            .Include(b => b.Job)
            .FirstOrDefaultAsync(b => b.Id == command.BidId, cancellationToken)
            ?? throw new NotFoundException("Bid not found.");

        if (bid.Job.ClientId != command.ClientId)
            throw new ForbiddenException("You are not the client for this job.");

        // ... business logic ...

        await context.SaveChangesAsync(cancellationToken);
        return new AcceptBidResponse(bid.Id, bid.JobId, bid.Status.ToString(), bid.Job.Status.ToString());
    }
}
```

### Existing DI registration pattern (reference for BUG-03)

```csharp
// Source: backend/HandyLink.API/Program.cs lines 64-68
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<NotificationService>();

builder.Services.AddScoped<IProfileRepository, ProfileRepository>();
builder.Services.AddScoped<UserService>();
```

### Existing controller action pattern (reference for all three controller additions)

```csharp
// Source: backend/HandyLink.API/Controllers/BidsController.cs
[HttpPatch("bids/{bidId:guid}/accept")]
public async Task<IActionResult> AcceptBid(Guid bidId, CancellationToken ct)
    => Ok(await mediator.Send(new AcceptBidCommand(GetUserId(), bidId), ct));
```

### Existing unit test pattern (reference for new handler tests)

```csharp
// Source: backend/HandyLink.Tests/Unit/Features/Bids/AcceptBidHandlerTests.cs
private static (HandyLinkDbContext ctx, AcceptBidHandler handler) Build()
{
    var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
    var ctx = new HandyLinkDbContext(opts);
    var mediator = new Mock<IMediator>().Object;
    return (ctx, new AcceptBidHandler(ctx, mediator));
}
```

### Existing integration test pattern (reference for new controller tests)

```csharp
// Source: backend/HandyLink.Tests/Integration/Controllers/BidsControllerTests.cs
[Fact]
public async Task SubmitBid_Returns201_WhenJobOpen()
{
    var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
    var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
    var http = AuthClient(worker.Id);
    var response = await http.PostAsJsonAsync($"/api/jobs/{job.Id}/bids", body);
    response.StatusCode.Should().Be(HttpStatusCode.Created);
}
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | xUnit 2.9.3 |
| Config file | `backend/HandyLink.Tests/HandyLink.Tests.csproj` |
| Quick run command | `dotnet test backend/ --filter "FullyQualifiedName~GetBidsForJob\|FullyQualifiedName~UpdateJobStatus\|FullyQualifiedName~RejectBid\|FullyQualifiedName~WorkerDI"` |
| Full suite command | `dotnet test backend/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | `GET /api/jobs/{id}/bids` returns 200 with bids list | unit + integration | `dotnet test backend/ --filter "FullyQualifiedName~GetBidsForJobHandler"` | Wave 0 |
| BUG-01 | Forbidden if caller is not the job owner | unit | `dotnet test backend/ --filter "FullyQualifiedName~GetBidsForJobHandler"` | Wave 0 |
| BUG-02 | `PATCH /api/jobs/{id}/status` transitions Accepted → InProgress | unit + integration | `dotnet test backend/ --filter "FullyQualifiedName~UpdateJobStatusHandler"` | Wave 0 |
| BUG-02 | Invalid status string returns 400 | unit | `dotnet test backend/ --filter "FullyQualifiedName~UpdateJobStatusHandler"` | Wave 0 |
| BUG-03 | `GET /api/workers` returns 200 (not 500) | integration | `dotnet test backend/ --filter "FullyQualifiedName~WorkersController"` | Wave 0 |
| BUG-04 | `PATCH /api/bids/{id}/reject` sets bid to Rejected | unit + integration | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandler"` | Wave 0 |
| BUG-04 | Cannot reject an already-accepted bid | unit | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandler"` | Wave 0 |

### Sampling Rate

- **Per task commit:** `dotnet test backend/ --filter "FullyQualifiedName~[feature name]"`
- **Per wave merge:** `dotnet test backend/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/HandyLink.Tests/Unit/Features/Bids/GetBidsForJobHandlerTests.cs` — covers BUG-01
- [ ] `backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs` — covers BUG-02
- [ ] `backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs` — covers BUG-04
- [ ] `backend/HandyLink.Tests/Integration/Controllers/WorkersControllerTests.cs` — covers BUG-03
- [ ] `TestDbSeeder` needs a `SeedBidAsync` helper for integration tests involving bids

---

## File Map — Exact Files to Create or Edit

### BUG-01: GET /api/jobs/{id}/bids

**Create:**
- `backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobQuery.cs`
- `backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobHandler.cs`
- `backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobValidator.cs`
- `backend/HandyLink.API/Features/Bids/GetBidsForJob/GetBidsForJobResponse.cs`
- `backend/HandyLink.Tests/Unit/Features/Bids/GetBidsForJobHandlerTests.cs`

**Edit:**
- `backend/HandyLink.API/Controllers/BidsController.cs` — add `[HttpGet("jobs/{jobId:guid}/bids")]` action and `using` for new query

---

### BUG-02: PATCH /api/jobs/{id}/status

**Create:**
- `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusCommand.cs`
- `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs`
- `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusValidator.cs`
- `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusResponse.cs`
- `backend/HandyLink.Core/DTOs/UpdateJobStatusDto.cs` (or inline in command)
- `backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs`

**Edit:**
- `backend/HandyLink.API/Controllers/JobsController.cs` — add `[HttpPatch("{id:guid}/status")]` action and `using` for new command

---

### BUG-03: Worker DI registrations

**Edit:**
- `backend/HandyLink.API/Program.cs` — add two `AddScoped` lines (and `using` if needed)

**Create:**
- `backend/HandyLink.Tests/Integration/Controllers/WorkersControllerTests.cs`

---

### BUG-04: PATCH /api/bids/{id}/reject

**Create:**
- `backend/HandyLink.API/Features/Bids/RejectBid/RejectBidCommand.cs`
- `backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs`
- `backend/HandyLink.API/Features/Bids/RejectBid/RejectBidValidator.cs`
- `backend/HandyLink.API/Features/Bids/RejectBid/RejectBidResponse.cs`
- `backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs`

**Edit:**
- `backend/HandyLink.API/Controllers/BidsController.cs` — add `[HttpPatch("bids/{bidId:guid}/reject")]` action and `using` for new command

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all fixes are backend code changes only; existing stack is already installed).

---

## Open Questions

1. **Should `GetBidsForJob` be accessible to workers too?**
   - What we know: The frontend `WorkerView` component (line 102) also calls the bids query (`queryKey: ['bids', id]`) to find `myBid`. The current client ownership check in the handler would return 403 to workers.
   - What's unclear: Whether workers should see all bids or just their own.
   - Recommendation: Return all bids if caller is the job owner (client), return only the caller's own bid if caller is a worker. Or simply return all bids to any authenticated user — RLS at the DB level is the security boundary. The frontend only displays "your bid" for workers anyway. Simplest safe approach: allow any authenticated user to see bids for a job they are party to (either client or bidder). For Phase 8, implement the client-only version first since that's what BUG-01 requires; reconsider in Phase 10 (Browse-First UX).

2. **Does `UpdateJobStatus` need to handle `Completed` → any transition for Phase 8?**
   - What we know: The Phase 8 success criteria only requires Accepted → InProgress and through to Completed.
   - Recommendation: Implement the full valid transition table (Accepted→InProgress, InProgress→Completed, InProgress→Cancelled, Accepted→Cancelled) for correctness, but do not block the phase on edge cases.

---

## Sources

### Primary (HIGH confidence)

All findings from direct codebase inspection:

- `backend/HandyLink.API/Controllers/BidsController.cs` — confirmed missing GET and PATCH reject routes
- `backend/HandyLink.API/Controllers/JobsController.cs` — confirmed missing PATCH status route
- `backend/HandyLink.API/Program.cs` — confirmed missing `IWorkerRepository` and `WorkerService` registrations
- `backend/HandyLink.API/Features/Bids/AcceptBid/AcceptBidHandler.cs` — canonical handler pattern
- `backend/HandyLink.Core/Entities/Bid.cs`, `Job.cs`, `Enums/JobStatus.cs`, `Enums/BidStatus.cs` — entity shapes confirmed
- `backend/HandyLink.Core/Services/WorkerService.cs` — service exists and has no DI registration
- `backend/HandyLink.Infrastructure/Repositories/WorkerRepository.cs` — repository exists and has no DI registration
- `backend/HandyLink.Core/Interfaces/IWorkerRepository.cs` — interface confirmed
- `frontend/src/pages/JobDetailPage.jsx` — confirmed all three API calls that are currently broken
- `backend/HandyLink.Tests/Unit/Features/Bids/AcceptBidHandlerTests.cs` — unit test pattern
- `backend/HandyLink.Tests/Integration/Controllers/BidsControllerTests.cs` — integration test pattern
- `.planning/codebase/CONCERNS.md` — confirmed all four bugs with root-cause analysis
- `.planning/codebase/ARCHITECTURE.md` — confirmed VSA+CQRS pattern and request pipeline

---

## Metadata

**Confidence breakdown:**
- Bug identification: HIGH — all four bugs verified by direct file inspection
- Fix approach: HIGH — exact file paths and code patterns confirmed from codebase
- Test patterns: HIGH — existing test files read directly; patterns are established

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase; no external dependencies)
