# Technical Concerns
_Last updated: 2026-03-29_

## Summary

The codebase is in good structural health for its phase — VSA+CQRS is applied consistently for new features, authorization is correct, and validation pipelines are in place. The primary concerns are a missing GET bids endpoint (breaking the frontend/mobile UI), two DI registrations absent from `Program.cs` that will cause runtime crashes, and architectural drift where older Service-class code coexists with the newer handler-based code without being migrated or removed.

---

## Critical Concerns

### Missing `GET /api/jobs/{id}/bids` endpoint

- **Issue:** Both `frontend/src/pages/JobDetailPage.jsx` (line 191) and `mobile/app/(client)/job-detail.tsx` (line 66) call `GET /api/jobs/{id}/bids`, but no such route exists in the backend. `BidsController` only exposes `POST /api/jobs/{jobId}/bids` and `PATCH /api/bids/{bidId}/accept`. The bids list will always return an empty array or a 404.
- **Files:** `backend/HandyLink.API/Controllers/BidsController.cs`, `frontend/src/pages/JobDetailPage.jsx`, `mobile/app/(client)/job-detail.tsx`
- **Impact:** Clients cannot see bids on their own jobs — the core bid acceptance flow is broken in both web and mobile.
- **Fix:** Add `[HttpGet("jobs/{jobId:guid}/bids")]` handler with a `GetBidsForJob` query slice under `Features/Bids/GetBidsForJob/`.

---

### Missing `PATCH /api/jobs/{id}/status` endpoint

- **Issue:** `frontend/src/pages/JobDetailPage.jsx` (line 196) calls `PATCH /api/jobs/${id}/status` to transition a job from `accepted` → `in_progress`. No such route exists in `JobsController` or any feature handler. The "Mark as In Progress" button will always 404.
- **Files:** `backend/HandyLink.API/Controllers/JobsController.cs`, `frontend/src/pages/JobDetailPage.jsx`
- **Impact:** Clients cannot advance the job lifecycle past `accepted` on the web frontend; payment cannot be triggered until status is `in_progress`.
- **Fix:** Add `PATCH /api/jobs/{id}/status` endpoint with `UpdateJobStatus` command slice under `Features/Jobs/UpdateJobStatus/`.

---

### Missing DI registrations for `WorkerService` and `WorkerRepository`

- **Issue:** `WorkersController` depends on `WorkerService` (constructor injection), and `WorkerService` depends on `IWorkerRepository`. Neither is registered in `backend/HandyLink.API/Program.cs`. The `WorkerRepository` class exists but is never wired.
- **Files:** `backend/HandyLink.API/Program.cs`, `backend/HandyLink.API/Controllers/WorkersController.cs`, `backend/HandyLink.Core/Services/WorkerService.cs`, `backend/HandyLink.Infrastructure/Repositories/WorkerRepository.cs`
- **Impact:** Any request to `GET /api/workers` or `GET /api/workers/{id}` will throw an `InvalidOperationException` at runtime. This is a startup/request crash, not just degraded behavior.
- **Fix:** Add `builder.Services.AddScoped<IWorkerRepository, WorkerRepository>()` and `builder.Services.AddScoped<WorkerService>()` to `Program.cs`.

---

### Missing `PATCH /api/bids/{id}/reject` endpoint

- **Issue:** `frontend/src/pages/JobDetailPage.jsx` (line 34) and `mobile/app/(client)/job-detail.tsx` (line 81) both call `PATCH /api/bids/{bidId}/reject`. This route does not exist. The reject button silently fails.
- **Files:** `backend/HandyLink.API/Controllers/BidsController.cs`, `frontend/src/pages/JobDetailPage.jsx`, `mobile/app/(client)/job-detail.tsx`
- **Impact:** Clients cannot reject bids from the UI.
- **Fix:** Add `RejectBid` feature slice under `Features/Bids/RejectBid/` and a corresponding `[HttpPatch("bids/{bidId:guid}/reject")]` action to `BidsController`.

---

## Medium Concerns

### Stripe API key set redundantly per-request in handlers

- **Issue:** `CreatePaymentIntentHandler` (line 41) and `WorkerConnectOnboardHandler` (line 22) both call `StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"]` on every request, despite the key already being set globally in `Program.cs` (line 19). This is harmless in practice but pollutes request handling with global-state mutation and could cause test interference.
- **Files:** `backend/HandyLink.API/Features/Payments/CreatePaymentIntent/CreatePaymentIntentHandler.cs`, `backend/HandyLink.API/Features/Payments/WorkerConnectOnboard/WorkerConnectOnboardHandler.cs`, `backend/HandyLink.API/Program.cs`
- **Fix:** Remove the per-handler `StripeConfiguration.ApiKey = ...` assignments; rely solely on the `Program.cs` startup assignment.

---

### Architectural drift: Service classes not migrated to handlers (post Phase 3.5)

- **Issue:** `HandyLink.Core/Services/` contains `BidService`, `JobService`, `ReviewService`, and `WorkerService` — all Service-class implementations of business logic. Per `CLAUDE.md`, after Phase 3.5 all new logic must go through Handlers, and Service classes must not be created. These services appear to be legacy from Phase 3 but are partially superseded — `BidService.AcceptBidAsync` and `RejectBidAsync` duplicate logic that also lives in `AcceptBidHandler`. `ReviewService` duplicates `CreateReviewHandler`. Neither code path is the canonical one.
- **Files:** `backend/HandyLink.Core/Services/BidService.cs`, `backend/HandyLink.Core/Services/ReviewService.cs`, `backend/HandyLink.Core/Services/JobService.cs`, `backend/HandyLink.Core/Services/WorkerService.cs`
- **Impact:** Logic duplication — two separate code paths for accept bid and create review. Bugs fixed in one path may not be fixed in the other. Tests in `HandyLink.Tests/Unit/Services/` test the Services, not the Handlers, making test coverage misleading.
- **Fix:** For each service that has a handler equivalent, remove the service and migrate any remaining logic to handlers. `NotificationService` and `UserService` have no handler equivalents and can remain until migrated.

---

### Currency hardcoded to USD while UI displays RON

- **Issue:** `CreatePaymentIntentHandler` (line 49) hardcodes `Currency = "usd"` in the Stripe `PaymentIntentCreateOptions`. The web frontend (`JobDetailPage.jsx`, `WorkerBrowsePage.jsx`) and mobile UI display prices as "RON". Stripe will charge in USD; the user sees RON. This is a functional mismatch.
- **Files:** `backend/HandyLink.API/Features/Payments/CreatePaymentIntent/CreatePaymentIntentHandler.cs`, `frontend/src/pages/JobDetailPage.jsx`, `mobile/app/(client)/job-detail.tsx`
- **Fix:** Either standardize currency to a single value stored on the Job entity (or in config), or accept it as a field on the payment command. Align frontend display labels with what Stripe actually charges.

---

### Platform fee hardcoded at 10% with no configuration

- **Issue:** `CreatePaymentIntentHandler` (line 44) calculates `feeInCents = amountInCents * 0.10m` — the platform take-rate is a magic number with no config key.
- **Files:** `backend/HandyLink.API/Features/Payments/CreatePaymentIntent/CreatePaymentIntentHandler.cs`
- **Fix:** Move the rate to `appsettings.json` under a key like `Payments:PlatformFeePercent` and read it via `IConfiguration`.

---

### Swagger exposed unconditionally in all environments

- **Issue:** `Program.cs` (lines 81–82) calls `app.UseSwagger()` and `app.UseSwaggerUI()` outside any environment guard. In contrast, the DataSeeder is wrapped in `if (app.Environment.IsDevelopment())`. Swagger is therefore active in production (Render).
- **Files:** `backend/HandyLink.API/Program.cs`
- **Impact:** Exposes full API contract and schema publicly. Low severity while the app is in private beta but should be addressed before public launch.
- **Fix:** Wrap Swagger middleware in `if (app.Environment.IsDevelopment() || app.Environment.IsStaging())`.

---

### RLS policy allows workers to UPDATE bids they own (including already-accepted/rejected)

- **Issue:** `002_rls_policies.sql` (line 32) sets `bids_update_worker` with `USING (auth.uid() = worker_id)` — workers can update any of their bids with no status constraint. A worker could reopen a rejected bid directly against Supabase if they bypass the API.
- **Files:** `backend/HandyLink.Infrastructure/Data/Migrations/002_rls_policies.sql`
- **Fix:** Add a `WITH CHECK (status = 'pending')` constraint on the RLS UPDATE policy, or restrict to specific columns only.

---

### `CreateReviewHandler` computes rating average in-place instead of from DB

- **Issue:** `CreateReviewHandler` (lines 46–48) updates `AverageRating` by calculating `(existing * count + newRating) / newCount` in application code. `ReviewService` (lines 38–40) does the opposite — it queries the DB for the aggregate. If handlers are the canonical path, the in-handler approach is susceptible to race conditions under concurrent reviews for the same worker (no row-level locking).
- **Files:** `backend/HandyLink.API/Features/Reviews/CreateReview/CreateReviewHandler.cs`
- **Fix:** Compute the average via a DB aggregate (as `ReviewService` does) or use a database-level trigger/computed column on `worker_profiles`.

---

### `SubmitBidHandler` does not notify the client via the in-app notification table

- **Issue:** `SubmitBidHandler` sends a push notification but does not insert a row into the `notifications` table. `BidService.SubmitBidAsync` (the legacy service version) does both. The VSA handler path only sends a push, so the `GET /api/notifications` endpoint will not show bid-received notifications for clients whose clients submitted bids through the handler path.
- **Files:** `backend/HandyLink.API/Features/Bids/SubmitBid/SubmitBidHandler.cs`
- **Fix:** Add `NotificationService.CreateAsync(...)` call in `SubmitBidHandler` mirroring the `BidService` implementation.

---

## Low Concerns / Nice-to-have

### `PasswordGate` stores the cleartext password in `localStorage`

- **Issue:** `PasswordGate.jsx` (line 17) stores the plaintext beta password in `localStorage` as `hl_access`. Anyone who views localStorage can extract the password to share it.
- **Files:** `frontend/src/components/PasswordGate.jsx`
- **Impact:** Low — this is an intentional temporary private-beta mechanism.
- **Fix:** Store a hashed or salted token instead of the raw password, or replace with server-side auth (e.g., Supabase invite-only). Remove the gate entirely at public launch.

---

### Worker identity shown as truncated UUID in bid cards

- **Issue:** `JobDetailPage.jsx` (line 62) and `mobile/app/(client)/job-detail.tsx` (line 149) display `bid.workerId.slice(0, 8)` as the worker identity. No worker name or profile link is included.
- **Files:** `frontend/src/pages/JobDetailPage.jsx`, `mobile/app/(client)/job-detail.tsx`
- **Impact:** Poor UX — clients cannot identify which worker placed a bid.
- **Fix:** Expand the bid response DTO to include `workerName` and `workerAvatarUrl`, populated via a JOIN in `GetJobByIdHandler` or a dedicated GetBidsForJob query.

---

### `add_expo_push_token.sql` stored in a different location than other migrations

- **Issue:** `backend/Data/Migrations/add_expo_push_token.sql` lives at `backend/Data/Migrations/` while the canonical migration folder is `backend/HandyLink.Infrastructure/Data/Migrations/`. This is likely an oversight that could confuse future contributors.
- **Files:** `backend/Data/Migrations/add_expo_push_token.sql`
- **Fix:** Move to `backend/HandyLink.Infrastructure/Data/Migrations/003_add_expo_push_token.sql` and use consistent numbering.

---

### Integration tests use in-memory EF provider, not PostgreSQL

- **Issue:** `CustomWebAppFactory` substitutes the production PostgreSQL provider with `UseInMemoryDatabase`. In-memory EF does not enforce foreign key constraints, does not support PostgreSQL-specific enum mappings, and does not validate SQL-level behaviours. Bugs that would fail on Postgres can pass all integration tests.
- **Files:** `backend/HandyLink.Tests/Integration/CustomWebAppFactory.cs`
- **Impact:** Medium-term testing reliability concern; no immediate breakage.
- **Fix:** Consider using Testcontainers for PostgreSQL in integration tests, or annotate current tests as "behavioral" rather than "integration" to set expectations.

---

### No test coverage for payment and notification flows

- **Issue:** No unit or integration tests exist for `CreatePaymentIntentHandler`, `HandleStripeWebhookHandler`, `WorkerConnectOnboardHandler`, or `SendPushNotificationHandler`. These are the most financially critical paths.
- **Files:** `backend/HandyLink.Tests/Unit/`, `backend/HandyLink.Tests/Integration/`
- **Fix:** Add unit tests using mocked `IConfiguration` and Stripe SDK abstractions, and integration tests for webhook signature validation.

---

## Strengths

- **Authorization is correct:** All controllers use `[Authorize]`, `GetUserId()` reads from JWT, and no user identity is accepted from request bodies.
- **Global exception handling:** `GlobalExceptionMiddleware` maps all domain exceptions to correct HTTP status codes with consistent JSON shape.
- **Validation pipeline:** `ValidationBehaviour<,>` runs FluentValidation automatically on every MediatR command — no controller needs to call `ModelState.IsValid`.
- **Webhook signature verification:** `HandleStripeWebhookHandler` correctly uses `EventUtility.ConstructEvent` with the webhook secret before processing events.
- **RLS enabled:** All six tables have Supabase RLS policies active; the API acts as a secondary enforcement layer.
- **Clean VSA slice structure:** Feature folders consistently contain Command/Query, Handler, Validator, and Response — easy to navigate and extend.
