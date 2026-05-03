# Phase 12: Social Login - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 12 is about enabling social login (Google OAuth first, Facebook optional later) and wiring it into the existing Supabase auth/profile system on web and mobile.

Scope includes:
- Add "Continue with Google" call to action on web login/register and mobile auth flows
- Post-OAuth role-selection gate (client/worker/both) for new users
- Existing email/password user + Google OAuth dedupe/merge behavior
- Propagate role into profile row / worker profile creation
- Keep Supabase JWT as auth mechanism; no separate backend auth provider.

Out of scope:
- Full Facebook OAuth implementation (deferred to next feature phase, affects AUTH-02)
- Multi-provider account linking UI for 3+ providers (phase 12 should remain minimum viable with Google)
- Full admin account split/merge tool (out of phase)

</domain>

<decisions>
## Implementation Decisions

### OAuth provider scope
- **D-01:** Phase 12 will ship with Google OAuth only (AUTH-01). Facebook remains on deck as ALPHA no-promise
  from AUTH-02.
- **D-02:** Design to allow adding Facebook later (reuse the same OAuth button/handler pattern) with
  minimal break.

### Post-OAuth role assignment
- **D-03:** After successful Google OAuth login, if user has no profile row, show a role selection screen with: `client`, `worker`, `both`.
- **D-04:** If role is selected, create profile row in `profiles` plus optional `worker_profiles` row for worker/both.
- **D-05:** If user already has a profile, skip role selection and continue.

### Existing account linking behavior
- **D-06:** If Google OAuth finds an existing Supabase user record with same email (shadowed sign-up), do not create duplicate profile; use existing user and run normal sign-in flow.
- **D-07:** Implement merge path /detection in front-end and/or backend:
  - On Google callback, call `GET /api/users/me`; if user missing row, upsert to ensure profile
  - If `supabase.auth.getUser()` returns an existing user and profile email matches existing user, continue with that identity.
- **D-08:** Do not create a separate account for OAuth user if same email is already registered with password. Instead, preserve same user identity and attach provider metadata.

### UI callouts (placement + gating)
- **D-09:** Add "Continue with Google" primary button on web `LoginPage.jsx` and `RegisterPage.jsx` near existing form submit.
- **D-10:** In mobile, add Google button on `(auth)/login.tsx` and `(auth)/register.tsx`, and on any auth gate bottom sheet (existing `AuthPromptSheet` in mobile components).
- **D-11:** Keep unauthenticated browse-first behavior (phase 10) intact; Google auth only triggers on gated action.

### the agent's Discretion
- Let planner decide exact button text ("Continue with Google", icon-only, or both) and spacing in the current design system.
- Let implementation use either a shared `useSocialAuth` hook or inline calls, as long as behavior is consistent.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` (Phase 12 Social Login section)
- `.planning/REQUIREMENTS.md` (AUTH-01/AUTH-02/AUTH-03)
- `.planning/STATE.md` (phase 10+ decisions and auth path notes)
- `frontend/src/context/AuthContext.jsx` (current Supabase email/password auth pipeline)
- `frontend/src/pages/LoginPage.jsx` (web login UI)
- `frontend/src/pages/RegisterPage.jsx` (web register UI + role selection)
- `mobile/services/supabase.ts` (Supabase mobile client config, PKCE, secure storage)
- `mobile/app/(auth)/login.tsx` (mobile login screen)
- `mobile/app/(auth)/register.tsx` (mobile register screen)
- `backend/HandyLink.API/Controllers/UsersController.cs` (me/profile endpoints)
- `backend/HandyLink.Core/Services/UserService.cs` (profile read/update logic)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/lib/supabase.js`: Supabase client initialization works for web.
- `mobile/services/supabase.ts`: already uses PKCE and secure store; can reuse this for OAuth.
- `frontend/src/context/AuthContext.jsx`: signIn and signUp logic, session/profile load flows.
- `mobile/app/(auth)/login.tsx`, `register.tsx`: existing email/password flows and navigation logic.
- `backend/UsersController` + `UserService`: exposes current user data and profile updates.

### Established Patterns
- Frontend uses context provider `useAuth()` and API navigation after login (`/jobs`).
- Profile creation on register in web is handled by `AuthContext.signUp` inserting profiles/workers.
- Mobile uses direct Supabase call then `api.post('/api/users/register', ...)` + fallback insert; same pattern can extend to OAuth.
- User role model is already captured in `profiles.role` and separate `worker_profiles` table.

### Integration Points
- Browser: `LoginPage`, `RegisterPage`, plus `AuthContext` internal `signIn`/`signUp` calls.
- Mobile: `(auth)` router screens and maybe `AuthPromptSheet` used by browse-first gating.
- Backend: `GET /api/users/me` (authenticated) and `PATCH /api/users/me` for profile updates.

</code_context>

<specifics>
## Specific Ideas

- Post-login role selection can reuse existing web `RegisterPage` radio selection UI; mobile can use the same cards design from register.
- Add explicit telemetry event `social_login_google` for analytics (phase 15 preparation).
- For linking account path, prefer Supabase built in "existing email provider" behavior, but keep an explicit safeguard in code to avoid two profile rows for same email.

</specifics>

<deferred>
## Deferred Ideas

- Add Facebook OAuth (AUTH-02) as a follow-up in Phase 13 if google-only rollout succeeded.
- Social profile picture sync and full name defaults are nice-to-have post-MVP.

### Reviewed Todos (not folded)
None — no todos matched phase 12.

</deferred>

---

*Phase: 12-social-login*
*Context gathered: 2026-04-02*
