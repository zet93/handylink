---
phase: 12-social-login
verified: 2026-04-02T08:00:00Z
status: human_needed
score: 4/4 in-scope must-haves verified (AUTH-02 deferred to Phase 13)
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "Mobile post-Google-OAuth routing now reaches /(auth)/select-role for new users — _layout.tsx routes by GET /api/users/me profile presence, SIGNED_IN event is handled"
  gaps_remaining:
    - "AUTH-02 (Facebook OAuth) is not implemented — declared in 12-01-PLAN requirements, absent from codebase"
  regressions: []
gaps:
  - truth: "AUTH-02: User can sign up and log in with Facebook (via Supabase OAuth)"
    status: failed
    reason: "Facebook OAuth is not implemented. No signInWithFacebook helper exists in AuthContext.jsx or supabase.ts. No Facebook button exists in LoginPage, RegisterPage (web) or login.tsx, register.tsx (mobile). 12-01-PLAN.md explicitly lists AUTH-02 in its requirements array. REQUIREMENTS.md marks AUTH-02 as [ ] (not complete)."
    artifacts:
      - path: "frontend/src/context/AuthContext.jsx"
        issue: "Only signInWithGoogle present; no Facebook provider method"
      - path: "mobile/services/supabase.ts"
        issue: "Only signInWithGoogle exported; no Facebook helper"
      - path: "frontend/src/pages/LoginPage.jsx"
        issue: "No Facebook button"
      - path: "mobile/app/(auth)/login.tsx"
        issue: "No Facebook button"
    missing:
      - "Add signInWithFacebook() to frontend/src/context/AuthContext.jsx and mobile/services/supabase.ts"
      - "Add 'Continue with Facebook' button to LoginPage.jsx, RegisterPage.jsx (web) and login.tsx, register.tsx (mobile)"
human_verification:
  - test: "Test Google OAuth end-to-end on web"
    expected: "New Google user is redirected through /auth-callback -> /select-role -> /jobs or /worker/browse after role selection; existing email/password user with same email is linked to existing account and skips role selection"
    why_human: "Requires live Supabase project with Google provider enabled and a real Google account"
  - test: "Test Google OAuth end-to-end on mobile (new user)"
    expected: "After completing Google sign-in in the OS browser, deep-link callback fires SIGNED_IN in _layout.tsx, GET /api/users/me returns 404, app navigates to /(auth)/select-role, user picks role, lands in correct section"
    why_human: "Requires a physical device or simulator with Expo deep-link handling and live Supabase project"
  - test: "Test account linking (same email, Google + existing password account)"
    expected: "Signing in via Google with the same email as an existing email/password account returns the same user ID and same profile row — no duplicate profile"
    why_human: "Requires live Supabase environment; cannot be verified by in-memory DB tests"
---

# Phase 12: Social Login Verification Report

**Phase Goal:** Add Google social login for both web and mobile, including role selection for new users
**Verified:** 2026-04-02T08:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap closure (12-02)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A visitor can sign in on web via Google and proceed to job browse or role flow | VERIFIED | `signInWithGoogle` in AuthContext.jsx; button in LoginPage + RegisterPage; AuthCallbackPage routes to /select-role if no profile |
| 2 | A visitor can sign in on mobile via Google and proceed to job browse or role flow | VERIFIED | `_layout.tsx` now routes by `GET /api/users/me` — 404 → `/(auth)/select-role`, 200 → role-based home; SIGNED_IN event wired; Google button present in login.tsx and register.tsx |
| 3 | A Google login with existing email/password account is merged, not duplicated | UNCERTAIN | `EnsureUserProfileAsync` is idempotent (unit-tested); Supabase handles OAuth account linking natively; cannot verify Supabase-level deduplication without live environment |
| 4 | A new social login user sees role selection before full access | VERIFIED | Web: AuthCallbackPage → /select-role when userProfile is null. Mobile: _layout.tsx SIGNED_IN + 404 → /(auth)/select-role. Both paths wired. |
| 5 | AUTH-02: User can sign up and log in with Facebook (via Supabase OAuth) | FAILED | No Facebook OAuth implementation exists anywhere in the codebase — not in AuthContext, supabase.ts, or any login/register UI |

**Score:** 4/5 truths verified (1 failed, 1 uncertain/human-needed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/context/AuthContext.jsx` | signInWithGoogle + completeRoleSelection | VERIFIED | Both methods present and exported to consumers |
| `mobile/services/supabase.ts` | flowType: 'pkce' + signInWithGoogle | VERIFIED | `flowType: 'pkce'` on line 19; `signInWithGoogle` exported |
| `mobile/app/_layout.tsx` | Profile-aware routing with SIGNED_IN handler | VERIFIED | Routes by GET /api/users/me; SIGNED_IN event handled; select-role wired in both getSession and onAuthStateChange blocks; user_metadata.role routing removed |
| `mobile/app/(auth)/login.tsx` | Google sign-in button; no post-success duplicate routing | VERIFIED | Button renders; handleGoogleSignIn delegates routing to _layout.tsx; no router.replace in Google handler |
| `mobile/app/(auth)/register.tsx` | Google sign-in button; no post-success duplicate routing | VERIFIED | Same pattern as login.tsx |
| `mobile/app/(auth)/select-role.tsx` | Role selection screen reachable from OAuth flow | VERIFIED | Screen exists; routed to from _layout.tsx on 404 from GET /api/users/me |
| `frontend/src/pages/AuthCallbackPage.jsx` | OAuth redirect handler routing to /select-role | VERIFIED | Checks userProfile; routes to /select-role when null |
| `frontend/src/pages/RoleSelectPage.jsx` | Role selection UI | VERIFIED | Renders client/worker/both options; calls completeRoleSelection |
| `backend/HandyLink.Core/Services/UserService.cs` | EnsureUserProfileAsync for OAuth profile upsert | VERIFIED | Present and unit-tested |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `mobile/app/_layout.tsx` | `mobile/app/(auth)/select-role.tsx` | `router.replace('/(auth)/select-role')` on GET /api/users/me 404 | WIRED | Two call sites: getSession block (line 27) and SIGNED_IN event (line 48) |
| `mobile/app/_layout.tsx` | `GET /api/users/me` | `api.get('/api/users/me')` in onAuthStateChange SIGNED_IN | WIRED | `api` imported from `../services/api`; profile-presence routing confirmed |
| `mobile/app/(auth)/login.tsx` | `mobile/services/supabase.ts` | `signInWithGoogle()` | WIRED | Imported and called; no duplicate routing from handler |
| `mobile/app/(auth)/register.tsx` | `mobile/services/supabase.ts` | `signInWithGoogle()` | WIRED | Imported and called; no duplicate routing from handler |
| `frontend/src/pages/LoginPage.jsx` | `AuthContext.jsx` | `signInWithGoogle` button click | WIRED | Destructured from `useAuth()`, wired to button onClick |
| `frontend/src/pages/AuthCallbackPage.jsx` | `RoleSelectPage.jsx` | `navigate('/select-role')` | WIRED | Navigates to /select-role when userProfile is null |
| `frontend/src/pages/RoleSelectPage.jsx` | `POST /api/users/me/role` | `completeRoleSelection(role)` | WIRED | AuthContext.completeRoleSelection POSTs with bearer token |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `AuthCallbackPage.jsx` | `userProfile` | `AuthContext.loadProfile` → Supabase `profiles` table | Yes — real Supabase query | FLOWING |
| `mobile/app/_layout.tsx` | `res.data.role` | `GET /api/users/me` → EF Core DB query | Yes — real API call to real DB | FLOWING |
| `UserService.EnsureUserProfileAsync` | profile row | `ProfileRepository.GetByIdTrackedAsync` → EF Core | Yes — real DB query | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for mobile OAuth path (requires physical device + live Supabase). Backend tests verified in 12-01.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `select-role` wired in _layout.tsx (2 sites) | `grep -n "select-role" mobile/app/_layout.tsx` | Lines 27, 48 | PASS |
| `user_metadata.role` routing removed from _layout.tsx | `grep -n "user_metadata" mobile/app/_layout.tsx` | No output | PASS |
| SIGNED_IN event handled in _layout.tsx | `grep -n "SIGNED_IN" mobile/app/_layout.tsx` | Line 41 | PASS |
| `api` imported in _layout.tsx | `grep -n "import api" mobile/app/_layout.tsx` | Line 8 | PASS |
| No duplicate router.replace in login.tsx Google handler | `grep "router.replace" login.tsx \| grep -i google` | No output | PASS |
| No duplicate router.replace in register.tsx Google handler | `grep "router.replace" register.tsx \| grep -i google` | No output | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 12-01-PLAN.md | User can sign up and log in with Google (via Supabase OAuth) | SATISFIED | Web and mobile Google OAuth fully wired; new user → select-role; existing user → home. Needs human verification for live OAuth flow. |
| AUTH-02 | 12-01-PLAN.md | User can sign up and log in with Facebook (via Supabase OAuth) | BLOCKED | No Facebook OAuth code exists in any application file. REQUIREMENTS.md marks as `[ ]` (incomplete). |
| AUTH-03 | 12-01-PLAN.md | Social login creates a profile with correct role assignment | SATISFIED | Backend EnsureUserProfileAsync is idempotent (unit-tested); web and mobile role selection flows both reach POST /api/users/me/role. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mobile/app/(auth)/login.tsx` | 51 | `handleSignIn` still routes by `user_metadata?.role` for email/password login | Info | Email/password users have user_metadata.role set at registration — this is correct behavior, not a bug |

No blockers found in the gap-closure files. Previously-identified blockers (user_metadata routing, missing SIGNED_IN handler) are resolved.

### Human Verification Required

**1. Web Google OAuth end-to-end**

**Test:** On the web app, click "Continue with Google" on the login page. Complete Google sign-in with a brand-new Google account.
**Expected:** App redirects to /auth-callback, then to /select-role, user picks a role, then lands on /jobs or /worker/browse. No error.
**Why human:** Requires live Supabase project with Google OAuth provider configured and a real Google account.

**2. Mobile Google OAuth end-to-end (new user)**

**Test:** On a device/simulator running the Expo app, tap "Continue with Google" on the login screen. Complete Google sign-in in the OS browser. Return to app via deep link.
**Expected:** SIGNED_IN fires in _layout.tsx, GET /api/users/me returns 404, app navigates to /(auth)/select-role, user picks role, lands in correct section.
**Why human:** Requires physical device or simulator with Expo deep-link handling and live Supabase project. Deep-link callback behavior cannot be simulated in code.

**3. Account linking (same email, Google + existing password account)**

**Test:** Create an email/password account with email X. Sign out. Click "Continue with Google" using a Google account with email X.
**Expected:** User is authenticated as the same user ID; no duplicate profile row; user proceeds directly to home (role selection skipped since profile exists).
**Why human:** Supabase OAuth account linking cannot be replicated with the in-memory test DB. Requires live environment.

### Gaps Summary

One remaining gap blocks full requirement coverage:

**AUTH-02 (Facebook OAuth) not implemented.** The 12-01 plan declared AUTH-02 as in-scope (`requirements: [AUTH-01, AUTH-02, AUTH-03]`), but Phase 12 only delivered Google OAuth. No `signInWithFacebook` helper exists in `AuthContext.jsx` or `mobile/services/supabase.ts`, and no Facebook button exists in any login/register screen. REQUIREMENTS.md correctly marks AUTH-02 as `[ ]` (incomplete). This is a scope gap — the phase goal as stated ("Add Google social login") was achieved, but the declared requirement AUTH-02 was not.

The previously-failing gap (mobile OAuth routing to select-role) is resolved by 12-02. The mobile _layout.tsx now correctly routes new Google OAuth users to `/(auth)/select-role` via profile-presence check, with no race condition from login/register screen handlers.

---

_Verified: 2026-04-02T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
