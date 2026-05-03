---
phase: 13-notifications-mobile-testing
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs
  - backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs
  - backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs
  - backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs
  - mobile/services/notifications.ts
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 13 Code Review

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 13 wired push notifications into `RejectBidHandler` and `UpdateJobStatusHandler`, and added tap-routing in the mobile notifications service. The core business logic is correct: state transitions, authorization guards, and notification dispatch are all sound. Three issues need attention: job-status tap-routing discards the `reference_id` and sends workers to the wrong screen, bare `await` on notification dispatch in both handlers violates the project's fire-and-forget pattern and can surface notification failures as handler errors, and the `router` parameter is typed `any` in the mobile service.

## Findings

### WR-001 · WARNING · mobile/services/notifications.ts:38-44

**Issue:** Job status notifications (`job_in_progress`, `job_completed`, `job_cancelled`) all route to `/(worker)/my-bids` instead of the specific job detail screen. The backend sends `job.Id` as `reference_id` in all three cases, but the tap handler ignores it. Workers tap the notification and land on a generic list instead of the relevant job.

**Fix:** Route job-status types to the worker job detail screen using `data.reference_id`, consistent with how `bid_received` uses `data.reference_id`:
```typescript
} else if (
  data?.type === 'job_in_progress' ||
  data?.type === 'job_completed' ||
  data?.type === 'job_cancelled'
) {
  if (data?.reference_id) {
    router.push({ pathname: '/(worker)/job-detail', params: { id: data.reference_id } });
  } else {
    router.push('/(worker)/my-bids');
  }
} else if (data?.type === 'bid_accepted' || data?.type === 'bid_rejected') {
  router.push('/(worker)/my-bids');
}
```

---

### WR-002 · WARNING · backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs:31-36

**Issue:** `await mediator.Send(new SendPushNotificationCommand(...))` is called bare after `SaveChangesAsync`. If the notification handler throws, the exception propagates through `RejectBidHandler.Handle` and surfaces as a 500 to the caller — even though the bid has already been persisted as `Rejected`. The project pattern for push notifications is fire-and-forget: errors logged, not propagated.

**Fix:** Wrap the notification dispatch in a try/catch so DB state and HTTP response are unaffected by notification failures:
```csharp
try
{
    await mediator.Send(new SendPushNotificationCommand(
        bid.WorkerId,
        "Bid not accepted",
        "The client chose another worker for this job.",
        "bid_rejected",
        bid.JobId), cancellationToken);
}
catch
{
    // non-fatal — notification failure must not roll back a successful rejection
}
```

---

### WR-003 · WARNING · backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs:54-55

**Issue:** Same bare `await mediator.Send(...)` pattern as WR-002. A notification dispatch failure after `SaveChangesAsync` will return a 500 despite the job status having been successfully updated in the database.

**Fix:** Wrap in try/catch identical in structure to WR-002:
```csharp
if (title is not null)
{
    try
    {
        await mediator.Send(new SendPushNotificationCommand(
            job.AcceptedBid.WorkerId, title, body!, typeStr!, job.Id), cancellationToken);
    }
    catch
    {
        // non-fatal
    }
}
```

---

### IR-001 · INFO · mobile/services/notifications.ts:31

**Issue:** `router` parameter is typed `any`, losing all type safety for navigation calls. Expo Router exports a typed router type.

**Fix:** Import and use the Expo Router type:
```typescript
import { Router } from 'expo-router';

export function setUpNotificationHandlers(router: Router): void {
```

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
