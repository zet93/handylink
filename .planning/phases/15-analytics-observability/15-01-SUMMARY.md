---
phase: 15-analytics-observability
plan: "01"
subsystem: backend
tags: [sentry, observability, error-monitoring, gdpr]
dependency_graph:
  requires: []
  provides: [sentry-error-capture]
  affects: [backend/HandyLink.API/Program.cs]
tech_stack:
  added: [Sentry.AspNetCore 6.4.1]
  patterns: [UseSentry WebHost extension, Sentry:Dsn config key]
key_files:
  created: []
  modified:
    - backend/HandyLink.API/HandyLink.API.csproj
    - backend/HandyLink.API/Program.cs
    - backend/HandyLink.API/appsettings.json
decisions:
  - SendDefaultPii=false mandatory for GDPR — prevents email, IP, request body from reaching Sentry
  - TracesSampleRate=0.1 aligns backend with web and mobile at 10%
  - Sentry:Dsn left as empty string placeholder — real value goes in Render env var Sentry__Dsn
metrics:
  completed_date: "2026-04-23"
  tasks_completed: 2
  files_modified: 3
---

# Phase 15 Plan 01: Sentry Backend Error Monitoring Summary

**One-liner:** Sentry.AspNetCore 6.4.1 integrated into ASP.NET Core 10 with GDPR-safe config (SendDefaultPii=false, TracesSampleRate=0.1).

## What Was Built

Sentry error capture for the backend API. Unhandled exceptions that escape `GlobalExceptionMiddleware` are now captured with full stack traces and sent to Sentry. PII is explicitly disabled per GDPR requirements.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Sentry.AspNetCore NuGet package | 87e1c78 | HandyLink.API.csproj |
| 2 | Wire UseSentry in Program.cs + appsettings placeholder | 657c346 | Program.cs, appsettings.json |

## Decisions Made

1. **SendDefaultPii = false** — hard requirement for GDPR; prevents Sentry from capturing request bodies, emails, and IP addresses.
2. **TracesSampleRate = 0.1** — 10% trace sampling matches the rate used on web and mobile clients.
3. **Sentry:Dsn as empty string** — placeholder pattern consistent with existing config (Stripe, Supabase). Real DSN provided at runtime via `Sentry__Dsn` environment variable on Render.
4. **Sentry.AspNetCore 6.4.1** — pinned to 6.x; version 5.x has a tracing middleware crash bug on .NET 10.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-15-01 | `SendDefaultPii = false` in UseSentry config | Applied |
| T-15-02 | DSN placeholder — accept risk (write-only from app perspective) | Accepted |
| T-15-03 | HTTPS to Sentry ingest — accept risk (TLS handles transport) | Accepted |

## Operator Setup Required

To activate Sentry in production, set the environment variable on Render:
```
Sentry__Dsn = https://xxx@oyyy.ingest.sentry.io/zzz
```

Or in local development:
```bash
dotnet user-secrets set "Sentry:Dsn" "https://xxx@oyyy.ingest.sentry.io/zzz"
```

Without a DSN, Sentry initializes in no-op mode — the API runs normally but errors are not reported.

## Self-Check: PASSED

- [x] `backend/HandyLink.API/HandyLink.API.csproj` contains `Sentry.AspNetCore` Version="6.4.1"
- [x] `backend/HandyLink.API/Program.cs` contains `builder.WebHost.UseSentry`, `SendDefaultPii = false`, `TracesSampleRate = 0.1`
- [x] `backend/HandyLink.API/appsettings.json` contains `"Sentry"` section with `"Dsn"` key
- [x] `dotnet build backend/HandyLink.API` exits 0 with 0 warnings, 0 errors
- [x] Commits 87e1c78 and 657c346 exist in git log
