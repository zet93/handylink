---
phase: 12-social-login
verified: 2026-04-02T05:49:04Z
status: gaps_found
score: 3/5 must-haves verified
gaps:
  - truth: "A visitor can sign in on mobile via Google and proceed to job browse or role flow"
    status: partial
    reason: "Mobile Google OAuth initiates correctly but after sign-in the root layout routes by user_metadata.role (Supabase JWT metadata) not by profile row presence — a brand-new Google user has no user_metadata.role, falls through to /(client) and bypasses select-role entirely"
    artifacts:
      - path: "mobile/app/_layout.tsx"
        issue: "onAuthStateChange does not check for missing profile; getSession routing uses user_metadata?.role with no fallback to select-role"
      - path: "mobile/app/(auth)/login.tsx"
        issue: "handleGoogleSignIn calls signInWithGoogle() but does not navigate to /(auth)/select-role on success — post-OAuth navigation is never triggered from the login screen"
    missing:
      - "After mobile Google OAuth callback, check whether a profile row exists (GET /api/users/me); if 404, route to /(auth)/select-role"
      - "Alternatively, handle SIGNED_IN event in _layout.tsx and route to /(auth)/select-role when profile is absent"

  - truth: "A Google login with existing email/password account is merged to existing user, not duplicated"
    status: failed
    reason: "This is handled entirely by Supabase Auth's built-in OAuth account linking when the same email already exists. No application-level deduplication code is needed or present, and no test verifies this end-to-end behavior. The SocialAuthTests only verify EnsureUserProfileAsync idempotency (profile upsert), not the Supabase-level account linking. Marking as unverifiable programmatically — requires live Supabase environment with Google provider enabled."
    artifacts: []
    missing:
      - "Document that account deduplication is delegated to Supabase Auth (same-email OAuth auto-links to existing account) in a comment or ADR"
      - "Integration test cannot cover this without a live Supabase environment — flag for human verification"

  - truth: "AUTH-02: User can sign up and log in with Facebook (via Supabase OAuth)"
    status: failed
    reason: "Facebook OAuth is not implemented anywhere — no signInWithFacebook helper, no Facebook button in LoginPage/RegisterPage/AuthPromptSheet or mobile login/register screens"
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
      - "Add signInWithFacebook() to AuthContext (web) and supabase.ts (mobile)"
      - "Add 'Continue with Facebook' button to LoginPage, RegisterPage (web) and login.tsx, register.tsx, AuthPromptSheet (mobile)"
human_verification:
  - test: "Test Google OAuth end-to-end on web"
    expected: "New Google user is redirected through /auth-callback -> /select-role -> /jobs or /worker/browse after role selection; existing email/password user with same email is linked to existing account and skips role selection"
    why_human: "Requires live Supabase project with Google provider enabled and a real Google account"
  - test: "Test account linking (same email, Google + password)"
    expected: "Signing in via Google with the same email as an existing email/password account returns the same user ID and same profile row — no duplicate profile"
    why_human: "Requires live Supabase environment; cannot be verified by in-memory DB tests"
---

# Phase 12: Social Login Verification Report

**Phase Goal:** Users can sign up and log in with Google, with correct role assignment and no duplicate account creation
**Verified:** 2026-04-02T05:49:04Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A visitor can sign in on web via Google and proceed to job browse or role flow | VERIFIED | `signInWithGoogle` in AuthContext.jsx; button in LoginPage + RegisterPage; AuthCallbackPage routes to /select-role if no profile, else to /jobs or /worker/browse |
| 2 | A visitor can sign in on mobile via Google and proceed to job browse or role flow | PARTIAL | signInWithGoogle helper exists in supabase.ts; button in login.tsx, register.tsx, AuthPromptSheet; but post-OAuth navigation never triggers select-role — root layout uses user_metadata.role not profile row presence |
| 3 | A Google login with existing email/password account is merged, not duplicated | UNCERTAIN | Backend EnsureUserProfileAsync is idempotent (tested); Supabase handles OAuth account linking natively; cannot verify the Supabase-level deduplication without a live environment |
| 4 | A new social login user sees role selection before full access | PARTIAL | Web: VERIFIED (AuthCallbackPage → /select-role when userProfile is null). Mobile: FAILED (no routing to select-role after Google OAuth in mobile flow) |
| 5 | Existing profile users skip role selection on social login and continue | VERIFIED | EnsureUserProfileAsync returns existing profile without modification (unit-tested); AuthCallbackPage routes directly to /jobs or /worker/browse when userProfile is set |

**Score:** 3/5 truths verified (2 partial/failed, 1 uncertain)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/context/AuthContext.jsx` | signInWithProvider/socialAuth | VERIFIED | Contains `signInWithGoogle` and `completeRoleSelection`; both wired to UI |
| `mobile/services/supabase.ts` | flowType: 'pkce' | VERIFIED | `flowType: 'pkce'` present on line 19; `signInWithGoogle` exported |
| `backend/HandyLink.Core/Services/UserService.cs` | GetCurrentUserAsync / UpdateCurrentUserAsync | VERIFIED | Both methods present plus `EnsureUserProfileAsync` for OAuth profile upsert |
| `backend/HandyLink.Tests/Integration/Controllers/SocialAuthTests.cs` | End-to-end role assignment tests | VERIFIED | 5 integration tests covering: new profile creation, existing profile preservation, worker_profiles row, 401 unauthenticated, GET /me after role assign; all pass |
| `frontend/src/pages/RoleSelectPage.jsx` | Role selection UI | VERIFIED | Renders client/worker/both options; calls completeRoleSelection; navigates correctly |
| `frontend/src/pages/AuthCallbackPage.jsx` | OAuth redirect handler | VERIFIED | Checks userProfile; routes to /select-role or home based on profile presence |
| `mobile/app/(auth)/select-role.tsx` | Mobile role selection screen | VERIFIED | Posts to /api/users/me/role; routes to /(worker)/browse or /(client); but never navigated to from mobile login |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `frontend/src/pages/LoginPage.jsx` | `AuthContext.jsx` | `signInWithGoogle` button click | WIRED | `signInWithGoogle` destructured from `useAuth()` and called on button onClick |
| `frontend/src/pages/RegisterPage.jsx` | `AuthContext.jsx` | `signInWithGoogle` button click | WIRED | Same pattern as LoginPage |
| `frontend/src/pages/AuthCallbackPage.jsx` | `RoleSelectPage.jsx` | navigate('/select-role') | WIRED | Navigates to /select-role when userProfile is null |
| `frontend/src/pages/RoleSelectPage.jsx` | `backend POST /api/users/me/role` | `completeRoleSelection(role)` | WIRED | AuthContext.completeRoleSelection POSTs to /api/users/me/role with bearer token |
| `mobile/app/(auth)/login.tsx` | `mobile/services/supabase.ts` | `signInWithGoogle()` | WIRED | Imports and calls signInWithGoogle; button rendered |
| `mobile/app/(auth)/login.tsx` | `mobile/app/(auth)/select-role.tsx` | navigation after OAuth | NOT_WIRED | handleGoogleSignIn has no navigation on success; OAuth callback returns control to the OS deep-link handler, but mobile root layout does not route to select-role |
| `backend/HandyLink.Core/Services/UserService.cs` | `backend/HandyLink.API/Controllers/UsersController.cs` | `EnsureUserProfileAsync` | WIRED | POST /api/users/me/role calls `userService.EnsureUserProfileAsync(GetUserId(), dto.Role, ct)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `AuthCallbackPage.jsx` | `userProfile` | `AuthContext.loadProfile` → Supabase `profiles` table | Yes — real Supabase query | FLOWING |
| `RoleSelectPage.jsx` | n/a (action-only) | Calls `completeRoleSelection` → fetch POST | Yes — real API call | FLOWING |
| `UserService.EnsureUserProfileAsync` | profile row | `ProfileRepository.GetByIdTrackedAsync` → EF Core query | Yes — real DB query | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Backend tests (SocialAuthTests + UserServiceTests) | `dotnet test --filter SocialAuthTests\|UserServiceTests` | 12 passed, 0 failed | PASS |
| Frontend tests (LoginPage + RoleSelectPage) | `npx vitest run` | 18 passed, 0 failed | PASS |
| Mobile Google OAuth → select-role routing | Manual only | Not runnable without device | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 12-01-PLAN.md | User can sign up and log in with Google (via Supabase OAuth) | PARTIAL | Web flow complete and tested; mobile OAuth initiates but post-login routing does not reach select-role for new users |
| AUTH-02 | 12-01-PLAN.md | User can sign up and log in with Facebook (via Supabase OAuth) | BLOCKED | No Facebook OAuth implementation in any application file |
| AUTH-03 | 12-01-PLAN.md | Social login creates a profile with correct role assignment | PARTIAL | Backend EnsureUserProfileAsync and web flow fully implemented and tested; mobile select-role screen exists but is not reachable from mobile Google OAuth flow |

**Note on AUTH-02:** REQUIREMENTS.md marks AUTH-02 as `[x]` (complete) and Phase 12 as "Complete" in the traceability table, but no Facebook OAuth code exists anywhere in the codebase. The implementation only covers Google.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mobile/app/_layout.tsx` | 20 | Routes by `user_metadata?.role` with no fallback to select-role | Blocker | New Google OAuth users on mobile skip role selection and land in /(client) regardless |
| `mobile/app/(auth)/login.tsx` | 24-28 | `handleGoogleSignIn` has no post-success navigation | Blocker | Mobile Google OAuth success is fire-and-forget — user is not routed anywhere |

### Human Verification Required

**1. Web Google OAuth end-to-end**

**Test:** On the web app, click "Continue with Google" on the login page. Complete Google sign-in with a brand-new Google account.
**Expected:** App redirects to /auth-callback, then to /select-role, user picks a role, then lands on /jobs or /worker/browse. No error.
**Why human:** Requires live Supabase project with Google OAuth provider configured and a real Google account.

**2. Account linking (same email, Google + existing password account)**

**Test:** Create an email/password account with email X. Sign out. Click "Continue with Google" using a Google account with email X.
**Expected:** User is authenticated as the same user ID as the original email/password account; no duplicate profile row is created; user proceeds directly to home (no role selection, since profile already exists).
**Why human:** Supabase OAuth account linking cannot be replicated with the in-memory test DB. Requires live environment.

### Gaps Summary

Three gaps block full goal achievement:

1. **AUTH-02 (Facebook) not implemented.** REQUIREMENTS.md declares AUTH-02 complete, but no Facebook OAuth code exists on web or mobile. The plan only implemented Google. This is the largest scope gap — an entire provider is missing.

2. **Mobile post-Google-OAuth routing does not reach select-role.** The mobile `select-role.tsx` screen exists and posts correctly to the backend, but a new Google OAuth user on mobile never navigates there. `handleGoogleSignIn` in `login.tsx` calls `signInWithGoogle()` and handles errors, but on success does nothing. The root `_layout.tsx` reads `user_metadata.role` (which is absent for new Google users) and falls through to `/(client)`. The select-role screen is effectively dead code in the mobile OAuth path.

3. **Account deduplication is Supabase-delegated and untestable without live environment.** The application correctly delegates this to Supabase Auth's built-in same-email OAuth linking. The EnsureUserProfileAsync is idempotent and tested. But no test verifies the Supabase-level behavior — this needs human verification against a live environment.

---

_Verified: 2026-04-02T05:49:04Z_
_Verifier: Claude (gsd-verifier)_
