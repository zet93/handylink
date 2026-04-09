# Phase 13: Notifications + Mobile Testing - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all remaining push notification triggers so every key job event sends a push, and validate the full app end-to-end on physical Android and iOS hardware.

Scope:
- Add `RejectBid` notification to worker (backend gap — mobile routing already exists)
- Add `UpdateJobStatus` notifications to worker on InProgress, Completed, Cancelled
- Wire notification tap deep-link routing for job-status and bid-rejected types
- Smoke-test core flows on physical Android device and physical iPhone

Out of scope:
- Facebook OAuth (AUTH-02) — deferred, not in Phase 13 goal
- Client-side notifications for status changes they triggered themselves
- Notification preferences or opt-out settings

</domain>

<decisions>
## Implementation Decisions

### Notification triggers

- **D-01:** `RejectBid` handler must send a `SendPushNotificationCommand` to the worker — one-liner fix. Type: `bid_rejected`.
- **D-02:** `UpdateJobStatus` handler must send a `SendPushNotificationCommand` to the worker on all three transitions: InProgress, Completed, Cancelled.
- **D-03:** Only the worker is notified on job status changes — the client triggered the transition and already knows. Keep notification noise low.
- **D-04:** `UpdateJobStatus` must load the worker for the accepted bid (the bid in `Accepted` status for that job) to get the `WorkerId` for the notification recipient.

### Notification messages (suggested copy — planner can refine)
- `bid_rejected` → "Your bid was not accepted" / "The client chose another worker for this job."
- `job_in_progress` → "Job started" / "The client marked your job as in progress."
- `job_completed` → "Job completed" / "The client has marked the job as complete."
- `job_cancelled` → "Job cancelled" / "The client cancelled this job."

### Notification tap deep-linking

- **D-05:** `bid_rejected` taps route to `/(worker)/my-bids` — already handled in `setUpNotificationHandlers`, no change needed.
- **D-06:** Job status notifications (InProgress, Completed, Cancelled) also route to `/(worker)/my-bids` — add cases for the new notification types in `setUpNotificationHandlers`.
- **D-07:** No job-detail deep-link for status notifications — worker bids list is sufficient and avoids needing to pass job ID in every payload.

### Mobile testing scope

- **D-08:** Physical Android device required for MOB-01/03/04.
- **D-09:** Physical iPhone required for MOB-02/04 — iOS simulator does not deliver push notifications.
- **D-10:** "Done" = smoke test these core flows end-to-end: app launches, login, browse jobs, post a job, submit a bid, bid notification received and tappable. If all pass, MOB-01–04 are satisfied.
- **D-11:** Testing is manual — no automated device farm. The developer runs the flows on their own hardware.

### Claude's Discretion
- Exact notification copy (title/body strings) — keep it short and clear, planner decides final wording.
- Whether to extract a helper (e.g., `NotifyWorker(jobId)`) or inline the `mediator.Send` call in each handler.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend notification infrastructure
- `backend/HandyLink.API/Features/Notifications/SendPushNotification/SendPushNotificationHandler.cs` — existing fire-and-forget push handler
- `backend/HandyLink.Core/Commands/SendPushNotificationCommand.cs` — command shape (UserId, Title, Body, Type, ReferenceId)
- `backend/HandyLink.API/Features/Bids/SubmitBid/SubmitBidHandler.cs` — reference pattern for calling SendPushNotificationCommand
- `backend/HandyLink.API/Features/Bids/AcceptBid/AcceptBidHandler.cs` — reference pattern
- `backend/HandyLink.API/Features/Bids/RejectBid/RejectBidHandler.cs` — needs notification added
- `backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs` — needs notification added

### Mobile notification service
- `mobile/services/notifications.ts` — token registration + tap-routing handler (setUpNotificationHandlers)
- `mobile/app/_layout.tsx` — where registerForPushNotifications and setUpNotificationHandlers are called

### Requirements
- `.planning/ROADMAP.md` (Phase 13 section)
- `.planning/REQUIREMENTS.md` (NOTF-01, NOTF-02, NOTF-03, MOB-01, MOB-02, MOB-03, MOB-04)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SendPushNotificationCommand` + handler: already registered, fire-and-forget, just call `mediator.Send(new SendPushNotificationCommand(...))`.
- `setUpNotificationHandlers` in `notifications.ts`: switch on `data.type` — add new cases for `job_in_progress`, `job_completed`, `job_cancelled`, `bid_rejected` routing to `/(worker)/my-bids`.

### Established Patterns
- Handlers call `mediator.Send(new SendPushNotificationCommand(...))` inline — no wrapper service.
- Notification types are plain strings passed as the `Type` field (e.g., `"bid_received"`, `"bid_accepted"`).
- Non-fatal: push failures are logged but not thrown.

### Integration Points
- `UpdateJobStatusHandler` needs to load the winning bid (`BidStatus.Accepted`) for the job to get `WorkerId`.
- `RejectBidHandler` already has `bid.WorkerId` available — trivial to add the send.

### What's already wired
- `bid_received` (SubmitBid → client) ✓
- `bid_accepted` (AcceptBid → worker) ✓
- `bid_rejected` mobile routing ✓ — backend send missing
- Job status transitions → no notifications yet

</code_context>

<specifics>
## Specific Ideas

- The mobile routing for `bid_rejected` already exists in `setUpNotificationHandlers` — the backend just never fires it. Planner should note this is a one-liner in `RejectBidHandler`.
- For `UpdateJobStatus`, the handler currently only tracks `job.ClientId` — planner will need to add an `.Include(j => j.Bids)` or a separate query to find the accepted bid's `WorkerId`.

</specifics>

<deferred>
## Deferred Ideas

- Facebook OAuth (AUTH-02) — mentioned in Phase 12 context as a possible Phase 13 addition, but Phase 13 goal is Notifications + Mobile Testing only. Defer to Phase 14 or a dedicated phase.
- Notification preferences / opt-out toggle — post-beta.
- Client notifications on status transitions they didn't trigger (e.g., worker marks InProgress) — not in scope, only client can change status currently.

</deferred>

---

*Phase: 13-notifications-mobile-testing*
*Context gathered: 2026-04-06*
