---
phase: 09-security-hardening
plan: 02
subsystem: api
tags: [stripe, rate-limiting, cors, middleware, security]

requires:
  - phase: 07-stripe-payments
    provides: PaymentsController with webhook endpoint

provides:
  - StripeException mapped to 400 in GlobalExceptionMiddleware
  - Fixed-window rate limiter on create-intent and submit-bid endpoints
  - Config-driven CORS with WithOrigins(AllowFrontend) replacing AllowAnyOrigin
  - Integration tests proving all three security controls work

affects: [phase-10-anonymous-access, phase-09-01-authorization-audit]

tech-stack:
  added: [Microsoft.AspNetCore.RateLimiting, System.Threading.RateLimiting]
  patterns:
    - Fixed-window rate limiter registered via AddRateLimiter, applied per-endpoint with [EnableRateLimiting]
    - CORS origins loaded from Cors:AllowedOrigins config array, falls back to AllowAnyOrigin when empty
    - Test factory isolation via subclass (SecurityTestFactory) overriding PermitLimit to avoid polluting shared factory state

key-files:
  created:
    - backend/HandyLink.Tests/Integration/Controllers/SecurityMiddlewareTests.cs
  modified:
    - backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs
    - backend/HandyLink.API/Program.cs
    - backend/HandyLink.API/appsettings.json
    - backend/HandyLink.API/Controllers/PaymentsController.cs
    - backend/HandyLink.API/Controllers/BidsController.cs
    - backend/HandyLink.Tests/Integration/CustomWebAppFactory.cs

key-decisions:
  - "SecurityTestFactory subclasses CustomWebAppFactory and overrides PermitLimit=3 to isolate rate-limit test from shared factory"
  - "CORS falls back to AllowAnyOrigin when Cors:AllowedOrigins is empty, preserving existing dev setups without Cors config"
  - "Webhook endpoint excluded from rate limiting — Stripe IP pool would be throttled"

patterns-established:
  - "Rate limit test isolation: use a subclass factory with a tighter limit rather than modifying the shared factory"

requirements-completed: [SEC-03, SEC-04, SEC-05]

duration: 18min
completed: 2026-03-31
---

# Phase 9 Plan 02: Security Hardening — Middleware Security Summary

**StripeException mapped to 400, fixed-window rate limiter on write endpoints, config-driven CORS with integration tests for all three controls**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-31T00:00:00Z
- **Completed:** 2026-03-31T00:18:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- GlobalExceptionMiddleware now catches `StripeException` and returns 400 instead of 500 for invalid webhook signatures
- Fixed-window rate limiter (20 req/min default, configurable) applied to `POST /api/payments/create-intent` and `POST /api/jobs/{id}/bids`
- CORS replaced from `AllowAnyOrigin` to config-driven `WithOrigins(allowedOrigins)` with `AllowFrontend` policy; `appsettings.json` ships `localhost:5173` as default
- 4 integration tests cover all three security requirements; full suite green (72/72)

## Task Commits

1. **Task 1: StripeException mapping + rate limiting + CORS hardening** - `472f8f5` (feat)
2. **Task 2: Integration tests for webhook 400, rate limiting 429, CORS enforcement** - `60447bd` (test)

## Files Created/Modified

- `backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs` - Added `StripeException => (400, "Invalid webhook signature")` arm to switch
- `backend/HandyLink.API/Program.cs` - Added `AddRateLimiter`, `UseRateLimiter`, `UseRouting`; replaced CORS block with config-driven `AllowFrontend` policy
- `backend/HandyLink.API/appsettings.json` - Added `RateLimit` and `Cors` config sections
- `backend/HandyLink.API/Controllers/PaymentsController.cs` - Added `[EnableRateLimiting("api_write")]` to `CreateIntent`
- `backend/HandyLink.API/Controllers/BidsController.cs` - Added `[EnableRateLimiting("api_write")]` to `SubmitBid`
- `backend/HandyLink.Tests/Integration/Controllers/SecurityMiddlewareTests.cs` - New: 4 tests for SEC-03/04/05
- `backend/HandyLink.Tests/Integration/CustomWebAppFactory.cs` - Added Cors and RateLimit settings (PermitLimit=1000 for shared use)

## Decisions Made

- `SecurityTestFactory` subclasses `CustomWebAppFactory` and overrides `PermitLimit` to 3, so the 429 test only needs 4 requests while the shared factory stays at 1000 to avoid polluting other tests.
- CORS falls back to `AllowAnyOrigin` when `Cors:AllowedOrigins` is empty, preserving zero-config dev setups.
- Webhook endpoint excluded from `[EnableRateLimiting]` — Stripe's IP pool would be throttled otherwise.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed rate limiter test isolation causing BidsControllerTests to fail with 429**
- **Found during:** Task 2 (integration tests)
- **Issue:** All test classes share the same `CustomWebAppFactory` singleton. With `PermitLimit=3`, the `SecurityMiddlewareTests` exhausted the limit, causing `SubmitBid_Returns201_WhenJobOpen` in `BidsControllerTests` to get 429.
- **Fix:** Changed shared factory `PermitLimit` to 1000. Introduced `SecurityTestFactory : CustomWebAppFactory` that overrides to 3. `SecurityMiddlewareTests` uses `IClassFixture<SecurityTestFactory>`.
- **Files modified:** `SecurityMiddlewareTests.cs`, `CustomWebAppFactory.cs`
- **Verification:** `dotnet test backend/` → 72/72 passed
- **Committed in:** `60447bd`

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary for test correctness. No scope creep.

## Issues Encountered

None beyond the rate limiter isolation bug documented above.

## User Setup Required

None - no external service configuration required. CORS origins can be updated in `appsettings.json` or via environment variables for production deployment.

## Next Phase Readiness

- SEC-03, SEC-04, SEC-05 complete
- API is ready for anonymous access (Phase 10) — CORS and rate limiting guard write endpoints, webhook signature validated
- Production `Cors:AllowedOrigins` must be set to the actual frontend URL (Vercel deploy URL) before go-live

---
*Phase: 09-security-hardening*
*Completed: 2026-03-31*
