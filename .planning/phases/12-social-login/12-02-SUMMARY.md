---
phase: 12-social-login
plan: 02
subsystem: mobile/auth
tags: [mobile, oauth, routing, expo-router, supabase]
dependency_graph:
  requires: [12-01]
  provides: [mobile-oauth-routing-fix]
  affects: [mobile/auth]
tech_stack:
  added: []
  patterns: [profile-presence-routing, onAuthStateChange-SIGNED_IN, deferred-loading-state]
key_files:
  created: []
  modified:
    - mobile/app/_layout.tsx
    - mobile/app/(auth)/login.tsx
    - mobile/app/(auth)/register.tsx
decisions:
  - "Root layout routes by GET /api/users/me profile presence not user_metadata.role — handles new OAuth users without profiles"
  - "SIGNED_IN event in onAuthStateChange is the single routing trigger after OAuth deep-link callback"
  - "handleGoogleSignIn leaves loading spinner active on success — routing is delegated entirely to _layout.tsx"
metrics:
  duration: "3m"
  completed: "2026-04-02"
  tasks: 2
  files: 3
---

# Phase 12 Plan 02: Mobile OAuth Routing Fix Summary

Mobile root layout now routes new Google OAuth users to /(auth)/select-role via profile presence check, eliminating the user_metadata.role routing bug that silently landed OAuth users in /(client) without role assignment.

## What Was Built

**Task 1 — `_layout.tsx` profile-aware routing:**
- Added `import api from '../services/api'`
- Replaced `user_metadata?.role` routing in `getSession` block with `GET /api/users/me` call
- On 200: routes by `res.data.role` (worker → `/(worker)/browse`, else → `/(client)`)
- On 404: routes to `/(auth)/select-role` (new user, no profile yet)
- On other error: falls back to `/(public)/browse`
- Added `SIGNED_IN` branch to `onAuthStateChange` with the same profile check — fires when OAuth deep-link callback completes

**Task 2 — `login.tsx` and `register.tsx` Google sign-in wiring:**
- Applied 12-01 Google button UI (carry-forward from development branch, not present in worktree)
- `handleGoogleSignIn` calls `signInWithGoogle()`, dismisses loading only on error
- On success: loading spinner stays active while OS browser OAuth flow completes
- `_layout.tsx` SIGNED_IN event handles all post-OAuth routing — no duplicate navigation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree missing 12-01 mobile changes**
- **Found during:** Task 2
- **Issue:** Worktree was created before 12-01 commits; `login.tsx` and `register.tsx` lacked `handleGoogleSignIn`, `signInWithGoogle` import, Google button UI, and `useLocalSearchParams` for `returnTo` param
- **Fix:** Applied 12-01 changes (Google button, signInWithGoogle import, useLocalSearchParams) plus the 12-02 spec loading-state adjustment (leave spinner active on success instead of unconditional setLoading(false))
- **Files modified:** `mobile/app/(auth)/login.tsx`, `mobile/app/(auth)/register.tsx`
- **Commit:** 7b49de8

## Known Stubs

None — routing logic is fully wired. The `/(auth)/select-role` screen (created in 12-01) handles the POST /api/users/me/role call and subsequent role-based navigation.

## Self-Check: PASSED
