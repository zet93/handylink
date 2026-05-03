# Phase 13: Notifications + Mobile Testing - Research

**Researched:** 2026-04-06
**Domain:** Push notification triggers (ASP.NET Core / MediatR) + Expo push notifications (React Native)
**Confidence:** HIGH

## Summary

Phase 13 is a narrow completion phase. The push notification infrastructure is already fully built and deployed. Two backend handlers (`RejectBidHandler`, `UpdateJobStatusHandler`) are missing `mediator.Send(new SendPushNotificationCommand(...))` calls — all other machinery (handler, command, Expo HTTP dispatch, error swallowing) is in place. The mobile routing switch in `setUpNotificationHandlers` is also almost complete: `bid_rejected` is already routed, only the three new job-status types need cases added.

The mobile testing half is entirely manual smoke-testing on physical devices. No new code is needed for MOB-01 through MOB-03; they validate what already exists. MOB-04 requires the notification triggers above to be wired before testing.

**Primary recommendation:** Wire the two backend handlers first (one `mediator.Send` each for RejectBid, three for UpdateJobStatus), update the mobile tap-routing switch, then run smoke tests on physical Android and iOS. Update existing unit tests to inject `IMediator` where the handler signatures change.

## Project Constraints (from CLAUDE.md)

- Architecture: VSA + CQRS via MediatR — no new Service classes, no Service classes at all post-phase 3.5
- NEVER read user ID from request body — always `GetUserId()` from JWT
- NEVER run EF migrations — schema changes via SQL scripts only
- NEVER hardcode secrets
- Backend target: net10.0, PostgreSQL via EF Core, Supabase Auth (JWT HS256)
- Mobile: React Native + Expo Router (TypeScript)
- Naming: feature slice classes follow `{Action}{Artifact}` pattern

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `RejectBid` handler must send a `SendPushNotificationCommand` to the worker — one-liner fix. Type: `bid_rejected`.
- **D-02:** `UpdateJobStatus` handler must send a `SendPushNotificationCommand` to the worker on all three transitions: InProgress, Completed, Cancelled.
- **D-03:** Only the worker is notified on job status changes — the client triggered the transition and already knows.
- **D-04:** `UpdateJobStatus` must load the worker for the accepted bid (the bid in `Accepted` status for that job) to get the `WorkerId` for the notification recipient.
- **D-05:** `bid_rejected` taps route to `/(worker)/my-bids` — already handled in `setUpNotificationHandlers`, no change needed.
- **D-06:** Job status notifications (InProgress, Completed, Cancelled) also route to `/(worker)/my-bids` — add cases for the new notification types in `setUpNotificationHandlers`.
- **D-07:** No job-detail deep-link for status notifications — worker bids list is sufficient.
- **D-08:** Physical Android device required for MOB-01/03/04.
- **D-09:** Physical iPhone required for MOB-02/04 — iOS simulator does not deliver push notifications.
- **D-10:** "Done" = smoke test these core flows end-to-end: app launches, login, browse jobs, post a job, submit a bid, bid notification received and tappable. If all pass, MOB-01–04 are satisfied.
- **D-11:** Testing is manual — no automated device farm. The developer runs the flows on their own hardware.

### Claude's Discretion

- Exact notification copy (title/body strings) — keep it short and clear, planner decides final wording.
- Whether to extract a helper (e.g., `NotifyWorker(jobId)`) or inline the `mediator.Send` call in each handler.

### Deferred Ideas (OUT OF SCOPE)

- Facebook OAuth (AUTH-02) — defer to Phase 14 or a dedicated phase.
- Notification preferences / opt-out toggle — post-beta.
- Client notifications on status transitions they didn't trigger — not in scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTF-01 | Worker receives push notification when a new bid is submitted on their job | Already wired via `SubmitBidHandler` → `bid_received` to `job.ClientId`. NOTE: the REQUIREMENTS.md description says "worker receives when bid submitted on their job" but the existing implementation sends to the *client* (job owner). The correct mapping is: client gets `bid_received` when a worker bids on their job. This satisfies NOTF-02 as written. NOTF-01 is satisfied by `AcceptBidHandler` → `bid_accepted` to worker. No new wiring needed for NOTF-01/02. |
| NOTF-02 | Client receives notification when a worker bids on their job | Satisfied by existing `SubmitBidHandler` → `SendPushNotificationCommand(job.ClientId, ...)` with type `bid_received`. Already complete. |
| NOTF-03 | Both parties receive notification on key job status transitions | Worker side: `UpdateJobStatus` handler needs notifications for InProgress/Completed/Cancelled (D-02, D-04). Client side explicitly excluded per D-03. "Both parties" in the requirement is superseded by the locked decision. |
| MOB-01 | App runs without errors on a physical Android device | Manual smoke test — no code changes required unless bugs are found during testing. |
| MOB-02 | App runs without errors on a physical iOS device (or simulator) | Manual smoke test — iOS simulator acceptable per requirement text, but physical iPhone required per D-09 for push delivery (MOB-04). |
| MOB-03 | All navigation flows work correctly on physical devices | Manual smoke test covering flows defined in D-10. |
| MOB-04 | Push notifications are delivered and tappable on physical devices | Depends on NOTF backend wiring being complete first; then manual test on physical hardware. |
</phase_requirements>

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| MediatR | 12.4.1 | Handler dispatch | `IMediator` injected into handlers that fire notifications |
| SendPushNotificationCommand | — | Command record | `backend/HandyLink.Core/Commands/SendPushNotificationCommand.cs` |
| SendPushNotificationHandler | — | Fire-and-forget Expo HTTP push | `backend/HandyLink.API/Features/Notifications/SendPushNotification/` |
| expo-notifications | ~55.0.12 | Token registration + tap routing on mobile | Already in `mobile/package.json` |
| expo-device | ~55.0.10 | `Device.isDevice` guard | Already in `mobile/package.json` |

No new packages need to be installed for this phase.

## Architecture Patterns

### Backend: Adding `IMediator` to an existing handler

`RejectBidHandler` and `UpdateJobStatusHandler` currently take only `HandyLinkDbContext` via primary constructor. To send push notifications, both need `IMediator mediator` added as a constructor parameter — identical to how `AcceptBidHandler` and `SubmitBidHandler` are structured.

**Pattern (from `AcceptBidHandler.cs`):**
```csharp
public class AcceptBidHandler(HandyLinkDbContext context, IMediator mediator)
    : IRequestHandler<AcceptBidCommand, AcceptBidResponse>
{
    // ...
    await mediator.Send(new SendPushNotificationCommand(
        bid.WorkerId, "Bid accepted!", "Your bid has been accepted",
        "bid_accepted", bid.Job.Id), cancellationToken);
}
```

### RejectBid — one-liner addition

`bid.WorkerId` is available directly on the loaded `bid` entity (the handler already does `.Include(b => b.Job)`). Place the `mediator.Send` call after `SaveChangesAsync`.

```csharp
// After: await context.SaveChangesAsync(cancellationToken);
await mediator.Send(new SendPushNotificationCommand(
    bid.WorkerId,
    "Bid not accepted",
    "The client chose another worker for this job.",
    "bid_rejected",
    bid.JobId), cancellationToken);
```

### UpdateJobStatus — loading the accepted bid's WorkerId

The handler currently loads only the `Job` with no includes. Per D-04, it must find the accepted bid to get `WorkerId`. The `Job` entity has `AcceptedBidId` (nullable `Guid?`) and a `Bids` navigation collection.

Two valid patterns:

**Option A — use `AcceptedBidId` (preferred, avoids loading all bids):**
```csharp
var job = await context.Jobs
    .Include(j => j.AcceptedBid)   // navigation property on Job
    .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken)
    ?? throw new NotFoundException("Job not found.");

// After SaveChangesAsync, if job.AcceptedBid is not null:
await mediator.Send(new SendPushNotificationCommand(
    job.AcceptedBid.WorkerId,
    title, body, type, job.Id), cancellationToken);
```

**Option B — separate bid query (more verbose, not preferred):**
```csharp
var acceptedBid = await context.Bids
    .FirstOrDefaultAsync(b => b.JobId == job.Id && b.Status == BidStatus.Accepted, cancellationToken);
```

Option A is cleaner. `Job.AcceptedBid` is already a navigation property on the entity (`public Bid? AcceptedBid { get; set; } = null!;`).

Guard: if `job.AcceptedBid` is null (e.g., Cancelled before an accepted bid exists), skip the notification. This matches the fire-and-forget non-fatal pattern.

### Notification type strings and message copy

| Transition | Type string | Suggested title | Suggested body |
|------------|-------------|-----------------|----------------|
| RejectBid | `bid_rejected` | "Bid not accepted" | "The client chose another worker for this job." |
| Accepted → InProgress | `job_in_progress` | "Job started" | "The client marked your job as in progress." |
| InProgress → Completed | `job_completed` | "Job completed" | "The client has marked the job as complete." |
| * → Cancelled | `job_cancelled` | "Job cancelled" | "The client cancelled this job." |

The Cancelled transition can occur from both `Accepted` and `InProgress` states — a single send after status change covers both.

### Mobile: updating `setUpNotificationHandlers`

Current switch in `mobile/services/notifications.ts` handles `bid_received`, `bid_accepted`, `bid_rejected`. Add the three new job-status types — all route to `/(worker)/my-bids` per D-06:

```typescript
export function setUpNotificationHandlers(router: any): void {
  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as any;
    if (data?.type === 'bid_received' && data?.reference_id) {
      router.push({ pathname: '/(client)/job-detail', params: { id: data.reference_id } });
    } else if (
      data?.type === 'bid_accepted' ||
      data?.type === 'bid_rejected' ||
      data?.type === 'job_in_progress' ||
      data?.type === 'job_completed' ||
      data?.type === 'job_cancelled'
    ) {
      router.push('/(worker)/my-bids');
    }
  });
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Push delivery to Expo devices | Custom WebSocket or FCM/APNs direct | `SendPushNotificationHandler` via Expo Push HTTP API — already exists |
| Notification tap routing | Custom deep-link parser | `addNotificationResponseReceivedListener` + `router.push` — already in `notifications.ts` |
| Push token storage | Custom token table | `Profile.ExpoPushToken` column + `PUT /api/users/me` — already exists |

## Common Pitfalls

### Pitfall 1: Handler constructor change breaks existing unit tests

**What goes wrong:** `RejectBidHandler` and `UpdateJobStatusHandler` tests construct the handler with only `(ctx)`. After adding `IMediator mediator` to the constructor, tests fail to compile.

**How to avoid:** Update `Build()` factory in both test classes to inject `new Mock<IMediator>().Object` — identical to the pattern already used in `AcceptBidHandlerTests` and `SubmitBidHandlerTests`.

**Files to update:**
- `backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs`
- `backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs`

### Pitfall 2: `AcceptedBid` navigation not loaded — null reference when sending job status notification

**What goes wrong:** `job.AcceptedBid` is null if the query doesn't `.Include(j => j.AcceptedBid)`. Attempting `job.AcceptedBid.WorkerId` throws `NullReferenceException`.

**How to avoid:** Add `.Include(j => j.AcceptedBid)` to the query in `UpdateJobStatusHandler`, and guard with `if (job.AcceptedBid is not null)` before sending.

**Note:** Cancelled jobs that were never accepted (`AcceptedBid` is null) should silently skip the notification.

### Pitfall 3: Sending notification before `SaveChangesAsync`

**What goes wrong:** If `SaveChangesAsync` fails after the notification was sent, the push fires but the state change didn't persist — data inconsistency.

**How to avoid:** Follow the existing pattern in `AcceptBidHandler` and `SubmitBidHandler`: always call `SaveChangesAsync` first, then `mediator.Send(new SendPushNotificationCommand(...))`.

### Pitfall 4: iOS simulator does not deliver push notifications

**What goes wrong:** Developer tests on iOS simulator, marks MOB-04 as done, but real users on physical iPhones never receive notifications.

**How to avoid:** Per D-09, physical iPhone is mandatory for MOB-04. iOS simulator is acceptable only for MOB-01/02/03 (app runs / navigation works).

### Pitfall 5: Expo Go vs EAS build for push notification testing

**What goes wrong:** Expo Go does not support background notifications on newer iOS versions. Push notifications may appear unreliable or fail silently.

**How to avoid:** Use `npx expo start` with development build or Expo Go for the smoke test. Physical device must have the Expo Go app (or a dev build) and must be on a network where the API is reachable (or pointed at the deployed Render API). The `EXPO_PUBLIC_API_URL` must point to the running backend.

### Pitfall 6: `bid_rejected` routing already exists — don't duplicate

**What goes wrong:** Developer adds a new `bid_rejected` case to the switch, creating two conflicting conditions.

**How to avoid:** The existing `else if (data?.type === 'bid_accepted' || data?.type === 'bid_rejected')` already handles `bid_rejected`. Only add the three new `job_*` types.

## Code Examples

### RejectBidHandler — after patch
```csharp
// Source: pattern from AcceptBidHandler.cs + RejectBidHandler.cs
public class RejectBidHandler(HandyLinkDbContext context, IMediator mediator)
    : IRequestHandler<RejectBidCommand, RejectBidResponse>
{
    public async Task<RejectBidResponse> Handle(RejectBidCommand command, CancellationToken cancellationToken)
    {
        var bid = await context.Bids
            .Include(b => b.Job)
            .FirstOrDefaultAsync(b => b.Id == command.BidId, cancellationToken)
            ?? throw new NotFoundException("Bid not found.");

        if (bid.Job.ClientId != command.ClientId)
            throw new ForbiddenException("You are not the client for this job.");

        if (bid.Status != BidStatus.Pending)
            throw new ValidationException("Bid is not in a rejectable state.");

        bid.Status = BidStatus.Rejected;
        bid.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        await mediator.Send(new SendPushNotificationCommand(
            bid.WorkerId,
            "Bid not accepted",
            "The client chose another worker for this job.",
            "bid_rejected",
            bid.JobId), cancellationToken);

        return new RejectBidResponse(bid.Id, bid.Status.ToString());
    }
}
```

### UpdateJobStatusHandler — notification dispatch logic
```csharp
// After SaveChangesAsync, resolve type string and send:
var (title, body) = newStatus switch
{
    JobStatus.InProgress => ("Job started", "The client marked your job as in progress."),
    JobStatus.Completed  => ("Job completed", "The client has marked the job as complete."),
    JobStatus.Cancelled  => ("Job cancelled", "The client cancelled this job."),
    _ => (null, null)
};

if (title is not null && job.AcceptedBid is not null)
{
    var typeStr = newStatus switch
    {
        JobStatus.InProgress => "job_in_progress",
        JobStatus.Completed  => "job_completed",
        JobStatus.Cancelled  => "job_cancelled",
        _ => null
    };
    if (typeStr is not null)
        await mediator.Send(new SendPushNotificationCommand(
            job.AcceptedBid.WorkerId, title, body!, typeStr, job.Id), cancellationToken);
}
```

### Unit test Build() update — after adding IMediator
```csharp
// Pattern from AcceptBidHandlerTests.cs — apply to RejectBidHandlerTests and UpdateJobStatusHandlerTests
private static (HandyLinkDbContext ctx, RejectBidHandler handler) Build()
{
    var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
    var ctx = new HandyLinkDbContext(opts);
    var mediator = new Mock<IMediator>().Object;
    return (ctx, new RejectBidHandler(ctx, mediator));
}
```

## Environment Availability

Step 2.6: No new external dependencies. All runtime dependencies (`expo-notifications`, `expo-device`, MediatR, IHttpClientFactory for Expo push HTTP) are already installed and configured. Mobile testing requires physical devices in the developer's possession — not a software dependency.

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| expo-notifications ~55.0.12 | MOB-04, NOTF-03 | Already in mobile/package.json | No install needed |
| MediatR 12.4.1 | NOTF-01–03 | Already registered in Program.cs | No install needed |
| Physical Android device | MOB-01/03/04 | Developer confirms (D-08) | — |
| Physical iPhone | MOB-02/04 | Developer confirms (D-09) | — |
| Expo Go or dev build | MOB-04 | Installed on test devices | — |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | xUnit 2.9.3 + FluentAssertions + Moq |
| Config file | `backend/HandyLink.Tests/HandyLink.Tests.csproj` |
| Quick run command | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandlerTests|FullyQualifiedName~UpdateJobStatusHandlerTests"` |
| Full suite command | `dotnet test backend/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTF-01 | `bid_accepted` notification sent to worker on bid accept | unit | `dotnet test backend/ --filter "FullyQualifiedName~AcceptBidHandlerTests"` | Already exists |
| NOTF-02 | `bid_received` notification sent to client on bid submit | unit | `dotnet test backend/ --filter "FullyQualifiedName~SubmitBidHandlerTests"` | Already exists |
| NOTF-03 (RejectBid) | `bid_rejected` notification sent to worker on bid reject | unit | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandlerTests"` | Exists — needs new test case |
| NOTF-03 (UpdateJobStatus) | `job_in_progress`/`job_completed`/`job_cancelled` notifications sent to worker | unit | `dotnet test backend/ --filter "FullyQualifiedName~UpdateJobStatusHandlerTests"` | Exists — needs new test cases |
| MOB-01 | App launches on Android without crash | manual-only | — | — |
| MOB-02 | App launches on iOS without crash | manual-only | — | — |
| MOB-03 | Navigation flows complete on physical devices | manual-only | — | — |
| MOB-04 | Push notifications delivered and tappable on physical devices | manual-only | — | — |

### Sampling Rate

- **Per task commit:** `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandlerTests|FullyQualifiedName~UpdateJobStatusHandlerTests"`
- **Per wave merge:** `dotnet test backend/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

No new test files need to be created. Existing test classes must be updated:

- [ ] `RejectBidHandlerTests.cs` — add `IMediator` to `Build()`, add test: `Handle_SendsPushNotification_WhenBidRejected`
- [ ] `UpdateJobStatusHandlerTests.cs` — add `IMediator` to `Build()`, add `AcceptedBid` to seed data, add tests for each status notification type

## Open Questions

1. **`AcceptedBid` navigation vs. separate Bids query**
   - What we know: `Job.AcceptedBid` exists as a navigation property on the entity.
   - What's unclear: Whether the EF Core InMemory provider resolves `.Include(j => j.AcceptedBid)` correctly in existing tests. It should, as AcceptBidHandler tests seed the relationship.
   - Recommendation: Use `.Include(j => j.AcceptedBid)` — simpler and consistent.

2. **Expo Go push notification reliability on newer iOS**
   - What we know: Expo Go has historically had limitations with background push on iOS.
   - What's unclear: Exact behavior on iOS 17+ with Expo 55.
   - Recommendation: If push doesn't arrive in Expo Go, use a dev build via `npx expo run:ios`. This is a testing concern, not a code concern.

## Sources

### Primary (HIGH confidence)

- Source code read directly:
  - `backend/HandyLink.API/Features/Notifications/SendPushNotification/SendPushNotificationHandler.cs`
  - `backend/HandyLink.Core/Commands/SendPushNotificationCommand.cs`
  - `backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs`
  - `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs`
  - `backend/HandyLink.API/Features/Bids/AcceptBid/AcceptBidHandler.cs`
  - `backend/HandyLink.API/Features/Bids/SubmitBid/SubmitBidHandler.cs`
  - `mobile/services/notifications.ts`
  - `mobile/app/_layout.tsx`
  - `backend/HandyLink.Core/Entities/Job.cs`
  - `backend/HandyLink.Core/Entities/Bid.cs`
  - `backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs`
  - `backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs`
  - `backend/HandyLink.Tests/Unit/Features/Bids/AcceptBidHandlerTests.cs`
  - `backend/HandyLink.Tests/Unit/Features/Bids/SubmitBidHandlerTests.cs`

### Secondary (MEDIUM confidence)

- `.planning/phases/13-notifications-mobile-testing/13-CONTEXT.md` — locked decisions and code insights from prior discussion phase

## Metadata

**Confidence breakdown:**
- Backend notification wiring: HIGH — all source code read; pattern is exact copy of AcceptBidHandler
- Mobile tap-routing update: HIGH — source code read; change is additive to existing switch
- Unit test updates: HIGH — existing test patterns read; changes are mechanical
- Mobile smoke testing: HIGH (what to test) / N/A (execution depends on developer hardware)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable dependencies, no fast-moving libraries in scope)
