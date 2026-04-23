---
phase: 15-analytics-observability
plan: "02"
subsystem: frontend-analytics
tags: [posthog, sentry, gdpr, consent, analytics]
dependency_graph:
  requires: []
  provides: [posthog-init, cookie-banner, sentry-init, analytics-events]
  affects: [frontend/src/main.jsx, frontend/src/context/AuthContext.jsx]
tech_stack:
  added: [posthog-js, "@posthog/react", "@sentry/react"]
  patterns: [GDPR consent gate, PostHog cookieless_mode, Sentry unconditional capture]
key_files:
  created:
    - frontend/src/lib/posthog.js
    - frontend/src/components/CookieBanner.jsx
    - frontend/src/components/__tests__/CookieBanner.test.jsx
  modified:
    - frontend/src/main.jsx
    - frontend/src/context/AuthContext.jsx
    - frontend/.env.example
decisions:
  - "cookieless_mode: on_reject — PostHog runs cookieless until user explicitly accepts; no identifiers stored before consent"
  - "Sentry initialized unconditionally — error capture requires no user consent under GDPR"
  - "posthog.identify passes only userId (UUID) and role — never email or PII"
  - "login event fires in onAuthStateChange SIGNED_IN branch — covers both email/password and Google OAuth"
metrics:
  duration: "~7 minutes"
  completed: "2026-04-23T18:43:02Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 3
---

# Phase 15 Plan 02: PostHog + Sentry Frontend Integration Summary

**One-liner:** JWT-gated PostHog analytics with GDPR cookieless_mode and bottom-bar consent banner, Sentry unconditional error capture, and lifecycle events (account_created, login, identify, reset) wired into AuthContext.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | PostHog init module + CookieBanner (TDD) | 22783bb | posthog.js, CookieBanner.jsx, CookieBanner.test.jsx |
| 2 | Wire PostHogProvider + Sentry + AuthContext events | a85729b | main.jsx, AuthContext.jsx |

## What Was Built

**Task 1 — posthog.js + CookieBanner (TDD RED→GREEN)**

- `frontend/src/lib/posthog.js`: Initializes PostHog with EU host (`https://eu.i.posthog.com`), `cookieless_mode: 'on_reject'`, and `defaults: '2026-01-30'`. Key reads from `VITE_PUBLIC_POSTHOG_KEY`.
- `frontend/src/components/CookieBanner.jsx`: Fixed-bottom consent bar rendered only when `get_explicit_consent_status()` returns `'pending'`. Accept calls `opt_in_capturing()`; Decline calls `opt_out_capturing()`. Both dismiss the banner via local state.
- `frontend/src/components/__tests__/CookieBanner.test.jsx`: 5 tests covering: no-render for granted/denied, renders for pending, Accept calls opt_in, Decline calls opt_out. Full RED→GREEN TDD cycle.

**Task 2 — main.jsx + AuthContext**

- `frontend/src/main.jsx`: Wraps `<App />` in `<PostHogProvider client={posthog}>` with `<CookieBanner />` as sibling. Sentry initialized at module level with `tracesSampleRate: 0.1` using `VITE_SENTRY_DSN`.
- `frontend/src/context/AuthContext.jsx`:
  - `usePostHog()` called inside `AuthProvider`
  - `loadProfile` → fires `posthog?.identify(userId, { role: data.role })` after profile resolves
  - `onAuthStateChange` SIGNED_IN → fires `posthog?.capture('login')`
  - `onAuthStateChange` SIGNED_OUT → fires `posthog?.reset()`
  - `signUp` → fires `posthog?.capture('account_created', { role })` after successful profile insert

## Test Results

All 23 frontend tests pass including 5 new CookieBanner tests.

```
Test Files  5 passed (5)
Tests       23 passed (23)
```

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information_disclosure | frontend/src/context/AuthContext.jsx | posthog.identify sends userId + role to PostHog EU cloud — mitigated per T-15-04: never sends email or PII |
| threat_flag: third_party_capture | frontend/src/main.jsx | Sentry.init sends JS exception data unconditionally — accepted per T-15-06 |

## Known Stubs

None — all analytics hooks are fully wired. PostHog capture is gated by SDK's internal opt-in state (set by CookieBanner). Sentry captures errors unconditionally.

## Self-Check

- [x] `frontend/src/lib/posthog.js` exists and contains `cookieless_mode`
- [x] `frontend/src/components/CookieBanner.jsx` exists and contains `opt_in_capturing`
- [x] `frontend/src/components/__tests__/CookieBanner.test.jsx` exists with 5 tests
- [x] `frontend/src/main.jsx` contains `PostHogProvider`, `Sentry.init`, `CookieBanner`
- [x] `frontend/src/context/AuthContext.jsx` contains `usePostHog`, `posthog?.identify`, `posthog?.reset`, `account_created`, `login`
- [x] Commits 22783bb and a85729b exist
