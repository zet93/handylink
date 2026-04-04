---
phase: 09-security-hardening
verified: 2026-03-31T04:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 9: Security Hardening Verification Report

**Phase Goal:** Harden the API against known security gaps before enabling anonymous access in Phase 10 — prove PII is not exposed, ownership is enforced, Stripe exceptions return 400, rate limiting protects write endpoints, and CORS is config-driven.
**Verified:** 2026-03-31T04:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GET /api/jobs response body contains no email or phone field | VERIFIED | `PiiAuditTests.PiiNotInJobsResponse` passes; asserts `body.ToLower().Should().NotContain("email")` and `"phone"` |
| 2 | GET /api/workers response body contains no email or phone field | VERIFIED | `PiiAuditTests.PiiNotInWorkersResponse` and `PiiNotInWorkerByIdResponse` pass |
| 3 | PATCH /api/jobs/{id}/status by non-owner returns 403 | VERIFIED | `OwnershipTests.UpdateJobStatus_Returns403_ForNonOwner` passes with worker JWT |
| 4 | PATCH /api/bids/{id}/accept by non-owner returns 403 | VERIFIED | `OwnershipTests.AcceptBid_Returns403_ForNonOwner` passes |
| 5 | PATCH /api/bids/{id}/reject by non-owner returns 403 | VERIFIED | `OwnershipTests.RejectBid_Returns403_ForNonOwner` passes |
| 6 | A Stripe webhook with invalid signature returns 400, not 500 | VERIFIED | `SecurityMiddlewareTests.Webhook_Returns400_OnInvalidSignature` passes; `GlobalExceptionMiddleware.cs` line 22: `StripeException => (400, "Invalid webhook signature")` |
| 7 | POST /api/payments/create-intent returns 429 after exceeding rate limit | VERIFIED | `SecurityMiddlewareTests.CreateIntent_Returns429_WhenRateLimited` passes; `SecurityTestFactory` sets `PermitLimit=3`, 4th request asserts `TooManyRequests` |
| 8 | A request with an Origin not in the allowlist gets no Access-Control-Allow-Origin header | VERIFIED | `SecurityMiddlewareTests.Cors_RejectsDisallowedOrigin` passes; `evil.com` origin elicits no CORS header |
| 9 | A request with an allowed Origin gets the correct Access-Control-Allow-Origin header | VERIFIED | `SecurityMiddlewareTests.Cors_AllowsAllowlistedOrigin` passes; `localhost:5173` receives correct header |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/HandyLink.Tests/Integration/Controllers/PiiAuditTests.cs` | Integration tests proving no PII leaks | VERIFIED | 85 lines, 4 facts, all pass |
| `backend/HandyLink.Tests/Integration/Controllers/OwnershipTests.cs` | Integration tests proving 403 for non-owners | VERIFIED | 61 lines, 4 facts, all pass |
| `backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs` | StripeException mapped to 400 | VERIFIED | Line 22: `StripeException => (400, "Invalid webhook signature")` |
| `backend/HandyLink.API/Program.cs` | Rate limiter + config-driven CORS + UseRateLimiter + UseRouting | VERIFIED | Lines 73-83: `AddRateLimiter`; line 108: `UseRouting`; line 113: `UseRateLimiter`; line 46: `WithOrigins(allowedOrigins)` |
| `backend/HandyLink.API/appsettings.json` | RateLimit and Cors config sections | VERIFIED | Lines 13-19: `"RateLimit": { "PermitLimit": 20, "WindowMinutes": 1 }` and `"Cors": { "AllowedOrigins": ["http://localhost:5173"] }` |
| `backend/HandyLink.Tests/Integration/Controllers/SecurityMiddlewareTests.cs` | Tests for webhook 400, rate limiting 429, CORS headers | VERIFIED | 82 lines, 4 facts, all pass |
| `backend/HandyLink.Tests/Integration/TestDbSeeder.cs` | SeedBidAsync helper added | VERIFIED | Lines 36-46: `SeedBidAsync` method present |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PiiAuditTests.cs` | `/api/jobs`, `/api/workers` | HTTP GET + `body.ToLower().Should().NotContain()` | WIRED | All 4 PII test methods call the endpoints and assert string absence |
| `OwnershipTests.cs` | `/api/jobs/{id}/status`, `/api/bids/{id}/accept`, `/api/bids/{id}/reject` | HTTP PATCH with wrong-user JWT | WIRED | All 4 ownership tests use `AuthClient(worker.Id)` against client-owned resources |
| `Program.cs` | `GlobalExceptionMiddleware` | `UseMiddleware<GlobalExceptionMiddleware>` | WIRED | Line 103: `app.UseMiddleware<GlobalExceptionMiddleware>()` |
| `Program.cs` | Rate limiter | `AddRateLimiter` + `UseRateLimiter` | WIRED | Lines 73 and 113; `PaymentsController` line 16 and `BidsController` line 18 have `[EnableRateLimiting("api_write")]` |
| `Program.cs` | CORS | `WithOrigins(allowedOrigins)` | WIRED | Line 46: `policy.WithOrigins(allowedOrigins)` when `allowedOrigins.Length > 0`; `CustomWebAppFactory` seeds `Cors:AllowedOrigins:0 = http://localhost:5173` |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers security middleware and integration tests, not data-rendering components.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 12 phase-09 security tests pass | `dotnet test --filter PiiAuditTests\|OwnershipTests\|SecurityMiddlewareTests` | Passed: 12, Failed: 0 | PASS |
| Full suite (no regressions) | `dotnet test backend/` | Passed: 80, Failed: 0 | PASS |
| `GlobalExceptionMiddleware` contains StripeException arm | grep `StripeException` in middleware | `StripeException    => (400, "Invalid webhook signature")` on line 22 | PASS |
| `Program.cs` contains `AddRateLimiter` | grep `AddRateLimiter` | Found on line 73 | PASS |
| `Program.cs` contains `WithOrigins` | grep `WithOrigins` | Found on line 46 | PASS |
| `PaymentsController` has `[EnableRateLimiting]` on `CreateIntent` | Read file | Line 16: `[EnableRateLimiting("api_write")]` above `CreateIntent`, NOT on `Webhook` | PASS |
| `BidsController` has `[EnableRateLimiting]` on `SubmitBid` | Read file | Line 18: `[EnableRateLimiting("api_write")]` above `SubmitBid` | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 09-01-PLAN.md | PII (email, phone) not exposed in public-facing responses | SATISFIED | 4 PII audit tests pass; no email/phone in GET /api/jobs or GET /api/workers responses |
| SEC-02 | 09-01-PLAN.md | Users can only edit/delete their own resources (403 for non-owners) | SATISFIED | 4 ownership tests pass; UpdateJobStatus, AcceptBid, RejectBid, GetBidsForJob all return 403 for non-owners |
| SEC-03 | 09-02-PLAN.md | Stripe webhook requests validated via signature (spoofed events return 400) | SATISFIED | `StripeException => (400, ...)` in middleware; `Webhook_Returns400_OnInvalidSignature` test passes |
| SEC-04 | 09-02-PLAN.md | Rate limiting on write endpoints | SATISFIED | Fixed-window limiter `"api_write"` applied to `CreateIntent` and `SubmitBid`; `CreateIntent_Returns429_WhenRateLimited` test passes |
| SEC-05 | 09-02-PLAN.md | CORS tightened from AllowAll to allowed production origins | SATISFIED | `AllowAnyOrigin` replaced with `WithOrigins(allowedOrigins)` driven from config; CORS tests pass for both allowed and disallowed origins |

All 5 requirements declared in plan frontmatter are satisfied. REQUIREMENTS.md marks all five as `[x]` Complete for Phase 9. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `Program.cs` | 43-44 | `AllowAnyOrigin()` fallback when `allowedOrigins` is empty | Info | Intentional fallback for zero-config dev setups; documented in plan as acceptable; does not affect tests since test factory always seeds an origin |

No blocker anti-patterns found.

---

### Human Verification Required

None. All security behaviors are verifiable programmatically via the integration test suite.

---

### Gaps Summary

No gaps. All 9 observable truths are verified by passing tests, all 7 artifacts exist and are substantive and wired, all 5 requirement IDs (SEC-01 through SEC-05) are satisfied, and the full test suite is green at 80/80.

---

_Verified: 2026-03-31T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
