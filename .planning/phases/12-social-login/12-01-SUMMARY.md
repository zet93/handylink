---
phase: 12-social-login
plan: 01
subsystem: auth
tags: [social-login, google-oauth, role-selection, supabase, pkce]
dependency_graph:
  requires: []
  provides: [google-oauth-web, google-oauth-mobile, role-selection-ui, profile-upsert-endpoint]
  affects: [frontend/auth, mobile/auth, backend/users]
tech_stack:
  added: []
  patterns: [supabase-oauth-pkce, profile-upsert-on-demand, tdd-red-green]
key_files:
  created:
    - frontend/src/pages/RoleSelectPage.jsx
    - frontend/src/pages/RoleSelectPage.test.jsx
    - frontend/src/pages/AuthCallbackPage.jsx
    - mobile/app/(auth)/select-role.tsx
    - backend/HandyLink.Tests/Integration/Controllers/SocialAuthTests.cs
  modified:
    - frontend/src/context/AuthContext.jsx
    - frontend/src/pages/LoginPage.jsx
    - frontend/src/pages/RegisterPage.jsx
    - frontend/src/pages/LoginPage.test.jsx
    - frontend/src/App.jsx
    - mobile/services/supabase.ts
    - mobile/app/(auth)/login.tsx
    - mobile/app/(auth)/register.tsx
    - mobile/components/AuthPromptSheet.tsx
    - backend/HandyLink.Core/Interfaces/IProfileRepository.cs
    - backend/HandyLink.Core/Services/UserService.cs
    - backend/HandyLink.API/Controllers/UsersController.cs
    - backend/HandyLink.Infrastructure/Repositories/ProfileRepository.cs
    - backend/HandyLink.Tests/Unit/Services/UserServiceTests.cs
decisions:
  - "EnsureUserProfileAsync upserts profile on first OAuth login — same method handles both new and returning users"
  - "POST /api/users/me/role endpoint is the single source of truth for role assignment after OAuth"
  - "AuthCallbackPage checks userProfile presence to decide route: /select-role if missing, /jobs or /worker/browse if present"
  - "Mobile select-role screen posts to /api/users/me/role with Supabase session token directly"
metrics:
  duration: "9m"
  completed: "2026-04-02"
  tasks: 3
  files: 14
---

# Phase 12 Plan 01: Social Login Summary

Google OAuth via Supabase with post-login role assignment, web and mobile, no duplicate profile creation for existing email/password users.

## What Was Built

**Backend:**
- `UserService.EnsureUserProfileAsync(userId, role)` — upserts profile row; if role is `worker` or `both`, also creates `worker_profiles` row; preserves existing profile if one exists
- `IProfileRepository` extended with `AddAsync` and `AddWorkerProfileAsync`
- `POST /api/users/me/role` endpoint on `UsersController` — accepts `{ role }` body, calls `EnsureUserProfileAsync`

**Frontend (web):**
- `AuthContext`: added `signInWithGoogle()` (Supabase OAuth redirect) and `completeRoleSelection(role)` (calls `/api/users/me/role` then reloads profile)
- `LoginPage` / `RegisterPage`: "Continue with Google" button
- `RoleSelectPage`: new route `/select-role` — shows client/worker/both choices, calls `completeRoleSelection`, redirects to appropriate home
- `AuthCallbackPage`: new route `/auth-callback` — OAuth redirect target; routes to `/select-role` if no profile, else to home

**Mobile:**
- `supabase.ts`: exported `signInWithGoogle()` helper using PKCE flow (already configured)
- `login.tsx` / `register.tsx`: "Continue with Google" button + `handleGoogleSignIn`
- `select-role.tsx`: new screen in `(auth)` group — posts role to backend, redirects to `/(client)` or `/(worker)/browse`
- `AuthPromptSheet`: added "Continue with Google" option

## Tests

- 7 `UserServiceTests` (unit) — EnsureUserProfileAsync happy paths and edge cases
- 5 `SocialAuthTests` (integration) — new profile creation, existing profile preservation, worker_profiles row, 401 unauthenticated, GET /me after role assign
- 6 `LoginPage` tests — added Google button render and invocation tests
- 4 `RoleSelectPage` tests — role options, client/worker navigation
- **96 total backend tests pass. 18 frontend tests pass.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mobile has no test framework**
- **Found during:** Task 3
- **Issue:** `mobile/__tests__/auth/social-login.test.tsx` cannot run — mobile has no Jest/Vitest setup (no test script in package.json, no devDependency)
- **Fix:** Moved mobile coverage into backend integration tests and frontend unit tests instead. Mobile OAuth flow is tested indirectly via API contract tests.
- **Files modified:** none (no mobile test infrastructure added — would require Rule 4 scope change)
- **Commit:** b795092

**2. [Rule 1 - Bug] `dynamic` JSON access doesn't work with System.Text.Json**
- **Found during:** Task 3 (first test run)
- **Issue:** `ReadFromJsonAsync<dynamic>()` returns `JsonElement`, not a CLR dynamic — property access throws `RuntimeBinderException`
- **Fix:** Switched to `JsonDocument.Parse` + `GetProperty("role").GetString()`
- **Files modified:** `SocialAuthTests.cs`
- **Commit:** b795092

## Known Stubs

None — all data flows are wired. The `signInWithGoogle` on web initiates a real Supabase OAuth redirect (requires Google provider enabled in Supabase dashboard). The `AuthCallbackPage` relies on `AuthContext.userProfile` being populated by `onAuthStateChange` after the OAuth session is established, which is the same mechanism used for email/password login.

## Self-Check: PASSED
