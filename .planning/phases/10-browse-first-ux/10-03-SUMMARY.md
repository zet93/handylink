---
phase: 10-browse-first-ux
plan: "03"
subsystem: mobile
tags: [ux, anonymous, browse, auth-prompt, expo-router]
dependency_graph:
  requires: [10-01]
  provides: [anonymous-mobile-browsing, auth-prompt-sheet, login-return-url]
  affects: [mobile/app/_layout.tsx, mobile/app/(public), mobile/components, mobile/app/(auth)]
tech_stack:
  added: []
  patterns: [auth-on-action, public-route-group, bottom-sheet-auth-prompt, return-url]
key_files:
  created:
    - mobile/app/(public)/_layout.tsx
    - mobile/app/(public)/browse.tsx
    - mobile/app/(public)/job-detail.tsx
    - mobile/app/(public)/workers.tsx
    - mobile/app/(public)/worker-detail.tsx
    - mobile/components/AuthPromptSheet.tsx
  modified:
    - mobile/app/_layout.tsx
    - mobile/app/(auth)/login.tsx
    - mobile/app/(auth)/register.tsx
decisions:
  - "Auth-on-action via bottom sheet: anonymous browse screens show no auth, BottomSheet opens only when user taps gated action"
  - "onAuthStateChange filtered to SIGNED_OUT event only to prevent double-redirect on initial subscription"
  - "returnTo param pattern in login/register to restore navigation context after auth"
metrics:
  duration: 232s
  completed: "2026-04-01"
  tasks_completed: 2
  files_modified: 9
---

# Phase 10 Plan 03: Mobile Anonymous Browsing + Auth Prompt Summary

Mobile app restructured for anonymous-first navigation using a (public) route group. App launches to a job browse screen — no login required. Auth bottom sheet appears only when user attempts a gated action.

## What Was Built

**Task 1 — Root layout + public route group (commit: 3650fa8)**

- `mobile/app/_layout.tsx`: changed no-session path from `/(auth)/login` to `/(public)/browse`; fixed `onAuthStateChange` to check `event === 'SIGNED_OUT'` before redirecting (prevents double-redirect from initial subscription fire)
- `mobile/app/(public)/_layout.tsx`: Stack layout for the public group (browse, job-detail, workers, worker-detail screens)
- `mobile/app/(public)/browse.tsx`: anonymous job list fetching `GET /api/jobs?status=Open`, FlatList with cards, header with Log in / Register buttons, Browse Workers link
- `mobile/app/(public)/job-detail.tsx`: anonymous job detail fetching `GET /api/jobs/{id}`, shows Submit a Bid button for open/bidding jobs that opens AuthPromptSheet
- `mobile/app/(public)/workers.tsx`: anonymous worker list fetching `GET /api/workers`, paginated FlatList
- `mobile/app/(public)/worker-detail.tsx`: anonymous worker profile fetching `GET /api/workers/{id}`, read-only display

**Task 2 — AuthPromptSheet + return URL (commit: dc2a61d)**

- `mobile/components/AuthPromptSheet.tsx`: bottom sheet auth prompt, snapPoints 35%, enablePanDownToClose, "Log in to continue" heading, Log in / Create account / Maybe later buttons, minHeight: 44 touch targets
- `mobile/app/(auth)/login.tsx`: reads `returnTo` param via `useLocalSearchParams`, redirects to returnTo after successful login instead of role-based routing
- `mobile/app/(auth)/register.tsx`: same returnTo pattern for post-registration redirect

## Deviations from Plan

None — plan executed exactly as written.

## Verification

TypeScript compilation after both tasks: 14 errors, all pre-existing (unrelated files: `@expo/vector-icons` type declarations missing, profile property access on `{}`, notifications behavior type mismatch). Zero new errors introduced by this plan.

Acceptance criteria met:
- `mobile/app/_layout.tsx` contains `router.replace('/(public)/browse')` in no-session branch
- `mobile/app/_layout.tsx` `onAuthStateChange` checks `event === 'SIGNED_OUT'`
- `mobile/app/(public)/_layout.tsx` exports a Stack layout
- `mobile/app/(public)/browse.tsx` fetches `GET /api/jobs`
- `mobile/app/(public)/job-detail.tsx` fetches `GET /api/jobs/{id}` and imports AuthPromptSheet
- `mobile/app/(public)/workers.tsx` fetches `GET /api/workers`
- `mobile/app/(public)/worker-detail.tsx` exists (read-only, no auth)
- `mobile/components/AuthPromptSheet.tsx` contains "Log in to continue", `snapPoints={['35%']}`, `enablePanDownToClose`, "Maybe later"
- `mobile/app/(auth)/login.tsx` contains returnTo param handling
- `mobile/app/(auth)/register.tsx` contains returnTo param handling
- None of the (public)/ screens import or check auth session

## Self-Check: PASSED

Files exist:
- mobile/app/(public)/_layout.tsx: FOUND
- mobile/app/(public)/browse.tsx: FOUND
- mobile/app/(public)/job-detail.tsx: FOUND
- mobile/app/(public)/workers.tsx: FOUND
- mobile/app/(public)/worker-detail.tsx: FOUND
- mobile/components/AuthPromptSheet.tsx: FOUND

Commits exist:
- 3650fa8: FOUND (feat(10-03): public route group)
- dc2a61d: FOUND (feat(10-03): auth prompt bottom sheet)
