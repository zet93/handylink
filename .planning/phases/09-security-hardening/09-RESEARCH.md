# Phase 9: Security Hardening - Research

**Researched:** 2026-03-31
**Domain:** ASP.NET Core 10 security — PII projection, authorization auditing, Stripe webhook validation, rate limiting, CORS hardening
**Confidence:** HIGH

---

## Project Constraints (from CLAUDE.md)

- NEVER run `dotnet ef migrations add` or `dotnet ef database update` — use SQL scripts in `Data/Migrations/`
- NEVER put business logic in a Controller — only `_mediator.Send()`
- NEVER create a Service class after Phase 3.5 — use Handlers only
- NEVER read user ID from request body — always `GetUserId()` from JWT
- NEVER hardcode secrets — environment variables only
- Architecture: VSA + CQRS via MediatR — all new backend code is Handlers
- Feature folder path: `backend/HandyLink.API/Features/{Domain}/{Action}/`
- Required slice files: `{Action}Command.cs`, `{Action}Handler.cs`, `{Action}Validator.cs` (optional), `{Action}Response.cs`

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Unauthenticated users cannot access other users' personal data (email, phone) | PII audit findings below — `UserResponseDto` exposes `Phone`; worker and job response shapes confirmed clean; `GET /api/users/me` is already `[Authorize]`; no email stored in Profile entity |
| SEC-02 | Users can only edit or delete their own jobs, bids, and profiles | Ownership audit findings below — all mutating handlers verified; `GET /api/jobs/{id}/bids` also enforces ClientId ownership |
| SEC-03 | Stripe webhook requests are validated via signature (prevent spoofed payment events) | `HandleStripeWebhookHandler` already calls `EventUtility.ConstructEvent` — the problem is in the controller: `StripeException` from handler surfaces as 500 (not 400); handler catches and re-throws, GlobalExceptionMiddleware maps it to 500 |
| SEC-04 | Auth endpoints have rate limiting to prevent brute-force and signup spam | Auth is fully Supabase-side — HandyLink API has no login/register endpoints; rate limiting belongs on the API's own sensitive endpoints (webhook, payment intents); ASP.NET Core built-in `Microsoft.AspNetCore.RateLimiting` used |
| SEC-05 | CORS policy is tightened from AllowAll to allowed production origins only | `WithOrigins()` from config — `Cors:AllowedOrigins` array in appsettings; production origins: Vercel frontend + EAS mobile (no origin for React Native); current code uses `AllowAnyOrigin()` |
</phase_requirements>

---

## Summary

This phase closes five security gaps before the API is exposed to anonymous users. The findings from auditing the codebase are:

**SEC-01 (PII scrubbing):** The `Profile` entity has a `Phone` field. `UserResponseDto` includes `Phone` — but `GET /api/users/me` is `[Authorize]`, so this only leaks to the owner. `WorkerResponseDto` does NOT include phone or email. `JobSummary` and `GetJobByIdResponse` contain no PII. `GetBidsForJobResponse` contains `WorkerId` (a GUID, not PII). The job and worker listing endpoints are currently `[Authorize]` so anonymous access is blocked — but Phase 10 (Browse-First UX) will open them to anonymous users. The PII risk is: once `[AllowAnonymous]` is added to job/worker GET endpoints in Phase 10, the current response shapes are already safe. No changes needed to existing response shapes. However, the `GET /api/jobs/{id}/bids` endpoint currently checks `job.ClientId == query.ClientId` — which is correct ownership enforcement.

**SEC-02 (ownership enforcement):** Audit of all mutating handlers:
- `CreateJobHandler` — sets `ClientId = command.ClientId` from JWT. Safe.
- `UpdateJobStatusHandler` — checks `job.ClientId != command.ClientId`. Safe.
- `AcceptBidHandler` — checks `bid.Job.ClientId != command.ClientId`. Safe.
- `RejectBidHandler` — checks `bid.Job.ClientId != command.ClientId`. Safe.
- `SubmitBidHandler` — sets `WorkerId = command.WorkerId` from JWT. Safe. No ownership check needed (submitting to a job is allowed for any worker).
- `CreateReviewHandler` — checks `job.ClientId != command.ReviewerId`. Safe.
- `WorkerConnectOnboardHandler` — uses `GetUserId()` from JWT; fetches worker by `userId`. Safe.
- `CreatePaymentIntentHandler` — uses `GetUserId()` from JWT. Safe.
- `UpdateCurrentUserAsync` (UserService) — takes `userId` from JWT, fetches own profile. Safe.
- `WorkerService.GetWorkersAsync/GetWorkerByIdAsync` — read-only, no PII in WorkerResponseDto. Safe.

**Conclusion for SEC-02:** All existing handlers are correct. SEC-02 is a verification/documentation task, not a code change task.

**SEC-03 (Stripe webhook):** The handler already validates via `EventUtility.ConstructEvent`. The critical bug: `StripeException` thrown by the handler is not caught by `GlobalExceptionMiddleware` as a known type, so it maps to HTTP 500 instead of 400. The fix is to catch `StripeException` in `GlobalExceptionMiddleware` (or in the controller) and return 400.

**SEC-04 (rate limiting):** Supabase owns auth endpoints — HandyLink API has no `/api/auth/login` or `/api/auth/register`. Rate limiting at the API level applies to the API's own potentially-abused endpoints: `POST /api/payments/webhook` (already anonymous), `POST /api/payments/create-intent`, and `POST /api/jobs/{id}/bids`. The built-in `Microsoft.AspNetCore.RateLimiting` (added in .NET 7, in-box for .NET 10) is the right tool — no NuGet package needed.

**SEC-05 (CORS):** Replace `AllowAnyOrigin()` with `WithOrigins()` loaded from `Cors:AllowedOrigins` config key. Mobile React Native apps do not send an Origin header (they are not browsers), so they are unaffected by CORS. The production allowlist needs: the Vercel frontend URL. The development origin (`http://localhost:5173` for Vite) should remain in dev config.

**Primary recommendation:** These are five independent, low-risk changes to `Program.cs` + `GlobalExceptionMiddleware`. Each can be its own plan. No new entities, no schema changes, no NuGet packages for most items.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `Microsoft.AspNetCore.RateLimiting` | In-box (.NET 7+) | Rate limiting middleware | Built into ASP.NET Core, no extra package |
| `System.Threading.RateLimiting` | In-box | Rate limiter primitives (FixedWindow, SlidingWindow) | Built into .NET runtime |
| `Stripe.net` | 50.4.1 (already installed) | `EventUtility.ConstructEvent` for webhook signature | Already in use |

### No New NuGet Packages Required

All five security fixes use built-in ASP.NET Core 10 features or existing dependencies.

**Installation:**
```bash
# No new packages — all features are built into ASP.NET Core 10 / net10.0
```

---

## Architecture Patterns

### SEC-01: PII Response Shape Audit

No code changes required for SEC-01 before Phase 10. Current response shapes:

| Endpoint | Response Type | PII Fields | Safe? |
|----------|--------------|------------|-------|
| `GET /api/jobs` | `JobSummary` | None | Yes |
| `GET /api/jobs/{id}` | `GetJobByIdResponse` | None | Yes |
| `GET /api/jobs/{id}/bids` | `GetBidsForJobResponse` | None (WorkerId is GUID) | Yes |
| `GET /api/workers` | `WorkerResponseDto` | None (no phone/email) | Yes |
| `GET /api/workers/{id}` | `WorkerResponseDto` | None | Yes |
| `GET /api/users/me` | `UserResponseDto` | Phone (owner only, `[Authorize]`) | Yes — owner-gated |

**The action for SEC-01** is to add a test that confirms unauthenticated requests to job/worker endpoints return no email or phone. Currently those endpoints return 401 to unauthenticated callers (they are `[Authorize]`). Phase 10 will add `[AllowAnonymous]`, at which point the response shapes are already safe. SEC-01 can be closed by: (a) writing the test that verifies no PII in the response body, and (b) documenting the audit.

### SEC-02: Ownership Verification Pattern

All mutating handlers follow this pattern (confirmed in audit):
```csharp
// Source: backend/HandyLink.API/Features/Jobs/UpdateJobStatus/UpdateJobStatusHandler.cs
if (job.ClientId != command.ClientId)
    throw new ForbiddenException("You are not the client for this job.");
```
The `ForbiddenException` flows to `GlobalExceptionMiddleware` → HTTP 403.

**The action for SEC-02** is to write integration tests that prove a user attempting to mutate another user's resource receives 403. No handler code changes needed.

### SEC-03: Stripe Webhook — StripeException → 400

**Current state:** `PaymentsController.Webhook` reads body manually (`StreamReader`) and passes to `HandleStripeWebhookCommand`. The handler calls `EventUtility.ConstructEvent` which throws `StripeException` on bad signature. The handler catches it, logs it, then re-throws. `GlobalExceptionMiddleware` does not know about `StripeException`, so it returns 500.

**Fix:** Add `StripeException` to `GlobalExceptionMiddleware`:
```csharp
// In GlobalExceptionMiddleware.InvokeAsync switch expression, add:
Stripe.StripeException => (400, "Invalid webhook signature"),
```

This is a one-line change to the existing middleware. No handler changes needed.

**Note on raw body:** The controller already reads raw body correctly:
```csharp
// Source: backend/HandyLink.API/Controllers/PaymentsController.cs
var body = await new StreamReader(Request.Body).ReadToEndAsync(ct);
var sig = Request.Headers["Stripe-Signature"].ToString();
await mediator.Send(new HandleStripeWebhookCommand(body, sig), ct);
```
This is the correct pattern. Stripe requires the raw, unmodified body string. ASP.NET Core's default model binding does not interfere because the webhook action reads `Request.Body` directly.

**Do not** add `EnableBuffering()` or any body-buffering middleware — the current direct `StreamReader` approach is correct and sufficient.

### SEC-04: Rate Limiting

**Scope clarification:** Supabase owns `/auth/v1/token` (login), `/auth/v1/signup` (register). HandyLink API has no auth endpoints. Rate limiting at the API level protects:
- `POST /api/payments/create-intent` — payment initiation (expensive operation)
- `POST /api/jobs/{id}/bids` — bid spam prevention
- `POST /api/payments/webhook` — webhook flood protection (low priority, Stripe only calls this)

**Pattern — IP-partitioned fixed window limiter:**
```csharp
// Source: https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("api_write", opt =>
    {
        opt.PermitLimit = builder.Configuration.GetValue<int>("RateLimit:PermitLimit", 20);
        opt.Window = TimeSpan.FromMinutes(builder.Configuration.GetValue<int>("RateLimit:WindowMinutes", 1));
        opt.QueueLimit = 0;
    });
});
```

Apply to relevant controllers/endpoints via `[EnableRateLimiting("api_write")]` attribute on write action methods. `UseRateLimiter()` must be called after `UseRouting()` when using endpoint-specific attributes.

**Middleware order with rate limiter:**
```
GlobalExceptionMiddleware
→ Swagger
→ CORS                    (UseCors)
→ Authentication          (UseAuthentication)
→ Authorization           (UseAuthorization)
→ RateLimiting            (UseRateLimiter — after UseRouting when using [EnableRateLimiting])
→ Controllers             (MapControllers)
```

**Config-driven limits** (add to `appsettings.json`):
```json
{
  "RateLimit": {
    "PermitLimit": 20,
    "WindowMinutes": 1
  }
}
```

### SEC-05: CORS Hardening

**Pattern — config-driven allowlist:**
```csharp
// Source: https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader());
});
```

Replace `app.UseCors("AllowAll")` with `app.UseCors("AllowFrontend")`.

**Config in `appsettings.json`** (dev defaults):
```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

**Production origins** (set via environment variables on Render):
- Vercel frontend: set `Cors__AllowedOrigins__0` to the Vercel deployment URL (e.g., `https://handylink.vercel.app`)
- React Native (Expo): does NOT send Origin header — unaffected by CORS, no entry needed

**Critical rule:** `WithOrigins()` URLs must not have a trailing slash. `"https://handylink.vercel.app"` is correct; `"https://handylink.vercel.app/"` will silently fail.

**Do not** use `AllowCredentials()` together with wildcard methods/headers when origins are explicit — it is allowed, but only needed if the frontend sends cookies (it doesn't; it uses Bearer tokens via Authorization header).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom middleware with in-memory counters | `Microsoft.AspNetCore.RateLimiting` | Handles distributed concerns, auto-replenishment, proper 429 responses |
| Webhook signature validation | Manual HMAC comparison | `Stripe.EventUtility.ConstructEvent` | Stripe's library handles timing-safe comparison, version checking, tolerance window |
| CORS origin matching | Manual `Origin` header inspection | `builder.Services.AddCors` with `WithOrigins()` | Handles preflight (OPTIONS), vary headers, credentials correctly |

**Key insight:** All three "don't hand-roll" problems have subtle edge cases (race conditions in counters, timing attacks in HMAC comparison, OPTIONS preflight handling) that the standard solutions handle correctly.

---

## Common Pitfalls

### Pitfall 1: UseRateLimiter Placement
**What goes wrong:** `UseRateLimiter()` placed before `UseRouting()` when using `[EnableRateLimiting]` attributes — attributes are ignored because the middleware can't see the endpoint metadata.
**Why it happens:** Unlike `UseCors`, rate limiter needs endpoint resolution to match named policies.
**How to avoid:** Call `UseRateLimiter()` after `app.UseAuthorization()` and before `app.MapControllers()`.
**Warning signs:** Rate limits not applying to specific endpoints despite `[EnableRateLimiting]` attribute.

### Pitfall 2: CORS Trailing Slash
**What goes wrong:** Origin `"https://example.com/"` (trailing slash) silently fails to match requests from `"https://example.com"`.
**Why it happens:** CORS spec requires exact origin matching. ASP.NET Core does not normalize trailing slashes.
**How to avoid:** Always omit trailing slashes in `WithOrigins()` values.
**Warning signs:** CORS errors in browser console even after updating config.

### Pitfall 3: StripeException Not in GlobalExceptionMiddleware
**What goes wrong:** Invalid webhook signature returns HTTP 500 instead of 400.
**Why it happens:** `GlobalExceptionMiddleware` only knows `NotFoundException`, `ForbiddenException`, `ConflictException`, `ValidationException`. `Stripe.StripeException` falls through to the unhandled case → 500.
**How to avoid:** Add `Stripe.StripeException => (400, "Invalid webhook signature")` to the switch expression.
**Warning signs:** Stripe webhook test sends invalid event, gets 500 response, Stripe marks webhook as failed.

### Pitfall 4: Rate Limiting a Webhook Endpoint
**What goes wrong:** Rate-limiting `POST /api/payments/webhook` by IP causes Stripe's webhook delivery to be throttled if Stripe uses a small pool of IPs.
**Why it happens:** Stripe's delivery infrastructure uses a limited set of egress IPs.
**How to avoid:** Do not apply rate limiting to the webhook endpoint. The signature validation is the protection. Apply rate limiting only to client-facing write endpoints.

### Pitfall 5: AllowAll CORS in Test Environment
**What goes wrong:** Tests that configure `CustomWebAppFactory` don't set `Cors:AllowedOrigins`, so the new policy rejects all origins and integration tests start failing if they send an `Origin` header.
**Why it happens:** Integration tests don't set CORS config.
**How to avoid:** Either set `AllowedOrigins: ["*"]` in test config (falling back gracefully), or configure `CustomWebAppFactory` to set `Cors:AllowedOrigins` to include `http://localhost`. Most integration tests don't send Origin headers so this is low risk.

### Pitfall 6: SEC-04 Scope Confusion
**What goes wrong:** Plan tries to rate-limit `POST /auth/*` endpoints that don't exist in this API.
**Why it happens:** SEC-04 says "auth endpoints" — but auth is fully Supabase-side.
**How to avoid:** Rate limit HandyLink API write endpoints instead. Supabase rate limiting is configured in the Supabase project dashboard, not here.

---

## Code Examples

### GlobalExceptionMiddleware with StripeException
```csharp
// Source: backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs (modified)
var (status, message) = ex switch
{
    NotFoundException               => (404, ex.Message),
    ForbiddenException              => (403, ex.Message),
    ConflictException               => (409, ex.Message),
    Core.Exceptions.ValidationException => (400, ex.Message),
    Stripe.StripeException          => (400, "Invalid webhook signature"),
    _                               => (500, "An unexpected error occurred")
};
```

### Rate Limiter Registration in Program.cs
```csharp
// Source: https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("api_write", opt =>
    {
        opt.PermitLimit = builder.Configuration.GetValue<int>("RateLimit:PermitLimit", 20);
        opt.Window = TimeSpan.FromMinutes(builder.Configuration.GetValue<int>("RateLimit:WindowMinutes", 1));
        opt.QueueLimit = 0;
        opt.AutoReplenishment = true;
    });
});
```

### Apply Rate Limiting to Controller Action
```csharp
// Source: https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0
using Microsoft.AspNetCore.RateLimiting;

[HttpPost("create-intent")]
[EnableRateLimiting("api_write")]
public async Task<IActionResult> CreateIntent(...)
```

### CORS Config-Driven Registration
```csharp
// Source: https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader());
});
// ...
app.UseCors("AllowFrontend");
```

### Middleware Pipeline Order (final)
```csharp
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseRouting();          // add if not present — needed before UseRateLimiter
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();      // after UseAuthorization, before MapControllers
app.MapControllers();
app.MapGet("/health", () => Results.Ok());
```

**Note:** Current `Program.cs` does not call `app.UseRouting()` explicitly — ASP.NET Core 10 adds it implicitly before `app.MapControllers()`. However, `UseRateLimiter()` with endpoint-specific policies requires routing to be established first. Adding `app.UseRouting()` explicitly before `UseCors` makes the order unambiguous.

---

## Ownership Audit — Complete Table

| Handler | Mutates | Ownership Check | Pattern |
|---------|---------|-----------------|---------|
| `CreateJobHandler` | Job | ClientId set from JWT | Safe |
| `UpdateJobStatusHandler` | Job | `job.ClientId != command.ClientId` → 403 | Safe |
| `AcceptBidHandler` | Bid + Job | `bid.Job.ClientId != command.ClientId` → 403 | Safe |
| `RejectBidHandler` | Bid | `bid.Job.ClientId != command.ClientId` → 403 | Safe |
| `SubmitBidHandler` | Bid | WorkerId from JWT (no cross-user risk) | Safe |
| `CreateReviewHandler` | Review + WorkerProfile | `job.ClientId != command.ReviewerId` → 403 | Safe |
| `WorkerConnectOnboardHandler` | WorkerProfile | Fetches by userId from JWT | Safe |
| `CreatePaymentIntentHandler` | PaymentIntent | Uses userId from JWT | Safe |
| `UserService.UpdateCurrentUserAsync` | Profile | Fetches own profile by userId from JWT | Safe |
| `GetBidsForJobHandler` | Read | `job.ClientId != query.ClientId` → 403 | Safe |

**Conclusion:** No ownership holes found. SEC-02 requires tests, not code fixes.

---

## Environment Availability

Step 2.6: SKIPPED — this phase has no external dependencies. All five changes are code/config-only. No new services, databases, or CLI tools required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | xUnit 2.9.3 + FluentAssertions 8.x |
| Config file | `backend/HandyLink.Tests/HandyLink.Tests.csproj` |
| Quick run command | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests"` |
| Full suite command | `dotnet test backend/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | GET /api/jobs response contains no `email` or `phone` fields | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.PiiNotInJobsResponse"` | Wave 0 |
| SEC-01 | GET /api/workers response contains no `email` or `phone` fields | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.PiiNotInWorkersResponse"` | Wave 0 |
| SEC-02 | PATCH /api/jobs/{id}/status by non-owner returns 403 | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.UpdateJobStatus_Returns403_ForNonOwner"` | Wave 0 |
| SEC-02 | PATCH /api/bids/{id}/accept by non-owner returns 403 | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.AcceptBid_Returns403_ForNonOwner"` | Wave 0 |
| SEC-02 | PATCH /api/bids/{id}/reject by non-owner returns 403 | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.RejectBid_Returns403_ForNonOwner"` | Wave 0 |
| SEC-03 | POST /api/payments/webhook with invalid signature returns 400 | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.Webhook_Returns400_OnInvalidSignature"` | Wave 0 |
| SEC-04 | POST /api/payments/create-intent returns 429 after N requests | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.CreateIntent_Returns429_WhenRateLimited"` | Wave 0 |
| SEC-05 | Request from non-allowlisted origin is rejected by CORS | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.Cors_RejectsDisallowedOrigin"` | Wave 0 |
| SEC-05 | Request from allowlisted origin includes CORS headers | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests.Cors_AllowsAllowlistedOrigin"` | Wave 0 |

### Integration Test Pattern (existing)

Tests use `CustomWebAppFactory` (in-memory DB, fake JWT, test Stripe config). New tests follow the same pattern:
```csharp
// File: backend/HandyLink.Tests/Integration/Controllers/SecurityTests.cs
public class SecurityTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId) { ... }
    private HttpClient AnonClient() => factory.CreateClient();
}
```

### Wave 0 Gaps

- [ ] `backend/HandyLink.Tests/Integration/Controllers/SecurityTests.cs` — covers SEC-01 through SEC-05
- [ ] `CustomWebAppFactory` needs `Cors:AllowedOrigins` setting (e.g., `http://localhost`) for CORS tests to work

---

## Open Questions

1. **Vercel production URL**
   - What we know: Frontend is deployed to Vercel; CORS allowlist needs the exact URL
   - What's unclear: Is the Vercel URL known and stable (custom domain), or is it the auto-generated `*.vercel.app` URL?
   - Recommendation: Add `Cors:AllowedOrigins` as a config array; planner can use a placeholder like `https://handylink.vercel.app`; actual value set in Render environment variables before go-live

2. **Rate limit values for SEC-04**
   - What we know: Fixed window limiter with IP partition is the right pattern
   - What's unclear: What's a reasonable limit for `POST /api/jobs/{id}/bids`? (20/min is a sane default for beta)
   - Recommendation: Config-driven with defaults (20 req/min); adjust post-beta

3. **UseRouting() explicit call**
   - What we know: ASP.NET Core 10 inserts UseRouting implicitly before MapControllers
   - What's unclear: Whether the implicit insertion happens early enough for UseRateLimiter to see endpoint metadata
   - Recommendation: Add `app.UseRouting()` explicitly before `UseCors()` to guarantee correct ordering; safe to add explicitly even when implicit

---

## Sources

### Primary (HIGH confidence)
- [Microsoft Learn — Rate limiting middleware in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0) — all rate limiter API, `AddFixedWindowLimiter`, `UseRateLimiter`, `[EnableRateLimiting]`, middleware ordering
- [Microsoft Learn — Enable Cross-Origin Requests (CORS) in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0) — `WithOrigins()`, config-driven origins, middleware order, no-trailing-slash rule
- Codebase: `HandleStripeWebhookHandler.cs`, `PaymentsController.cs`, `GlobalExceptionMiddleware.cs` — direct inspection

### Secondary (MEDIUM confidence)
- [Stripe Documentation — Resolve webhook signature verification errors](https://docs.stripe.com/webhooks/signature) — confirmed raw body requirement and `ConstructEvent` pattern

### Tertiary (LOW confidence)
- None — all claims verified against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — built-in .NET features, verified via official Microsoft docs
- Architecture: HIGH — based on direct codebase inspection
- Pitfalls: HIGH — SEC-03 bug confirmed by reading both the handler and middleware; rate limiter ordering confirmed in official docs
- Ownership audit: HIGH — all handler files read and verified

**Research date:** 2026-03-31
**Valid until:** 2026-06-30 (stable APIs — rate limiter and CORS APIs are mature since .NET 7)
