# Project Research Summary

**Project:** HandyLink — Beta Polish Milestone
**Domain:** Two-sided service marketplace (tradespeople + clients), Romania
**Researched:** 2026-03-29
**Confidence:** MEDIUM-HIGH

## Executive Summary

HandyLink is a functioning marketplace at Phase 7 with core infrastructure complete (jobs, bids, workers, auth, Stripe, push notifications, CI/CD). The beta polish milestone has a narrow scope: fix four blocking bugs, open the browse experience to unauthenticated users, harden security to an acceptable level, add social login, and layer on observability (analytics, monitoring, error tracking). The app does not need new infrastructure — it needs polish, security gates, and friction removal.

The recommended build order is security-first, then UX. The browse-without-login change is the highest-impression UX win but it creates a PII exposure risk if the DTO audit is skipped — so PII protection and CORS hardening must be done before or in the same phase as opening up anonymous access. Social login is high-value (lower signup friction for Romanian Android users) but carries three distinct failure modes (redirect mismatch, duplicate accounts, missing role assignment) that all need deliberate handling. Maps and analytics are lower priority and should come after auth flows are stable.

The critical constraint across all phases is GDPR compliance: Romania is EU territory, PII must not appear in anonymous API responses, and analytics cannot fire before consent is collected. These are not "nice to have" — they are legal requirements. Treat them as blockers, not polish.

---

## Key Findings

### Stack Additions (from STACK.md)

No new core infrastructure is needed. All additions are additive libraries on the existing stack.

**New dependencies:**
- `expo-auth-session` + `expo-web-browser`: mobile OAuth via Supabase — required for social login on Expo Go without a native build
- `react-native-maps` ~1.18.x: map pins on mobile — use `PROVIDER_DEFAULT` (no Google API key on iOS)
- `leaflet` + `react-leaflet` ~4.2.x / ~1.9.x: job map on web — free, no API key, GDPR-safe (OpenStreetMap tiles)
- `Resend` ~0.7.x (.NET): transactional email — free tier covers beta; replaces void in current notification stack
- `posthog-js` + `posthog-react-native`: analytics — EU-hosted instance satisfies GDPR; free up to 1M events/month
- `Sentry.AspNetCore` + `@sentry/react` + `@sentry/react-native`: error tracking across all three platforms
- `Microsoft.AspNetCore.RateLimiting`: built-in since .NET 7, no extra package needed
- Better Stack (external): uptime monitoring, no SDK

**SMS is explicitly deferred.** Push notifications cover the same use case for beta at zero cost.

**9 new environment variables required** — see STACK.md for the complete list.

### Features (from FEATURES.md)

**Must-have for beta impression (in priority order):**
1. Browse jobs without login — registration walls reduce conversion 20–60%; this is the single highest-impact change
2. Neutral design system — gray/white/one accent; trades audience judges trust by clarity
3. Trust signals on worker cards — rating + review count + job count; without these workers look unhireable
4. Social login (Google web first) — primary auth path for Romanian Android users
5. Notification coverage audit — ensure bid-accepted and bid-rejected events always push

**Defer to post-beta:**
- Facebook login (Google covers 80% of the use case)
- Map/location UI (technically complex, not blocking the demo)
- In-app messaging, availability calendar, review media, dispute resolution, referral system
- Full-text / radius search (category + city filter is sufficient for <50 jobs)

**Anti-features confirmed:** No in-app chat, no worker availability calendar, no digest emails, no Romanian localization for beta.

### Architecture (from ARCHITECTURE.md)

All integrations fit the existing VSA+CQRS pattern without disruption. Key findings per integration:

- **Browse-without-login**: single-file change — remove class-level `[Authorize]` from `JobsController`, add per-action `[Authorize]` on mutations. Handlers are already safe for anonymous use (no `GetUserId()` calls on read handlers). Worker profile endpoints should stay authenticated for beta; only job listing goes public.
- **Social login**: backend zero changes — Supabase OAuth issues the same JWT structure. The gap is frontend only: `onAuthStateChange` must upsert the `profiles` row, and a "choose your role" screen must exist for new OAuth users.
- **Rate limiting**: insert `UseRateLimiter()` after `UseCors()`, before `UseAuthentication()`. Apply via `[EnableRateLimiting]` attributes on controllers — does not touch handlers.
- **Analytics**: client-side only. A thin `analytics.ts` wrapper around PostHog; no backend changes. Wrap the entire SDK initialization in a consent check.
- **Maps**: requires one SQL migration (`ALTER TABLE jobs ADD COLUMN latitude/longitude`) and additive field changes to `CreateJobCommand` and `GetJobsResponse.JobSummary`.

**Suggested build order from ARCHITECTURE.md:** browse-without-login (backend) → browse-without-login (frontend/mobile) → rate limiting → social login → maps → analytics.

### Critical Pitfalls (from PITFALLS.md)

1. **PII in anonymous API responses** (CRITICAL) — Opening `GET /api/jobs` without creating a `PublicJobResponse` DTO will expose email/phone/internal IDs. GDPR fine risk. Prevention: dedicated public DTOs, integration test asserting no PII in anonymous response.

2. **Social login creates duplicate accounts** (CRITICAL) — Existing email+password users who later try Google OAuth will get a second `profiles` row, losing all their jobs/bids/reviews. Prevention: enable Supabase identity linking in dashboard, or surface "sign in with password instead" prompt.

3. **Social login skips role assignment** (CRITICAL) — OAuth bypasses the role-selection registration form. New OAuth users land with no `profiles` row and no role; mobile `_layout.tsx` auth loop results. Prevention: post-OAuth "choose your role" screen is mandatory, not optional.

4. **OAuth redirect URI mismatch** (HIGH) — Any missing entry in Google Cloud Console or Supabase dashboard allowlist silently breaks social login in that environment. Prevention: populate all redirect URIs (localhost, Vercel production, mobile deep link scheme) before first test.

5. **AllowAll CORS in production** (HIGH) — Currently `AllowAll` by design for dev; ships to production as-is. Exposes API to cross-origin request forgery against Stripe endpoints. Prevention: treat as pre-beta-launch blocker; lock to Vercel origin before sharing any public URL.

**Additional pitfalls to not miss:**
- Swagger exposed in production (5-minute fix, do alongside CORS)
- GDPR consent not collected before analytics fires (legal exposure on day one)
- Currency mismatch: `CreatePaymentIntentHandler` hardcodes USD; prices displayed in RON (fix before any real transaction)
- Stale Expo push tokens after deploy (ensure token refresh runs in `_layout.tsx` on every open)

---

## Implications for Roadmap

### Phase 1: Critical Bug Fixes
**Rationale:** Four endpoints are broken; the core bid-acceptance flow is non-functional. No amount of polish matters if the app cannot complete its primary workflow.
**Delivers:** Working end-to-end flow — client posts job, worker bids, client accepts, job advances through lifecycle.
**Addresses:** `GET /api/jobs/{id}/bids`, `PATCH /api/jobs/{id}/status`, `PATCH /api/bids/{id}/reject`, DI registration for `WorkerService`/`WorkerRepository`.
**Avoids:** Nothing to polish on a broken foundation.
**Research flag:** No — these are known missing endpoints. Standard MediatR handler pattern.

### Phase 2: Security Hardening
**Rationale:** Must complete before any anonymous access is enabled. PII protection, CORS lockdown, and Swagger gating are prerequisites for browse-without-login — not afterthoughts. Rate limiting also belongs here because it shares `Program.cs` changes with CORS.
**Delivers:** API safe to expose to anonymous users; GDPR-compliant data access; locked CORS; Swagger behind environment guard; rate limiting on bids and auth endpoints.
**Addresses:** PITFALLS 1, 10, 11, 12 (PII, CORS, rate limiting, Swagger).
**Avoids:** Opening anonymous browse before DTOs are audited would be a GDPR violation from launch day.
**Research flag:** No — all patterns are HIGH confidence (ASP.NET Core built-in rate limiter verified against official docs; `[AllowAnonymous]` + DTO split is standard).

### Phase 3: Browse-First UX
**Rationale:** Depends on Phase 2 (safe anonymous DTOs must exist first). Highest conversion impact of any UX change. Backend change is minimal; frontend/mobile changes are larger.
**Delivers:** Anonymous users can browse all job listings; auth is prompted lazily only on transactional action; mobile has a public browse route.
**Addresses:** FEATURES table stakes #1 (browse without login); lazy auth prompt; return-to-page after login.
**Avoids:** PII exposure risk is contained by Phase 2 public DTOs.
**Research flag:** No — direct code inspection confirms `GetJobsHandler` does not call `GetUserId()`; pattern is well-established.

### Phase 4: App Design
**Rationale:** No hard technical dependencies, but should come after browse-UX so the design work is applied to a stable, publicly-browsable flow rather than a locked-down one.
**Delivers:** Neutral color system (gray/white + one accent), consistent typography (Inter, 16px/24px), trust signals on worker cards (rating + review count + job count), role-aware navigation cleanup, "how it works" landing section.
**Addresses:** FEATURES differentiator #2 (neutral design), trust signals, navigation pattern.
**Research flag:** No — design patterns from Airbnb/Fiverr/TaskRabbit are HIGH confidence; Tailwind token system is well-documented.

### Phase 5: Social Login
**Rationale:** Depends on stable auth flow and public browse (Phases 2-3). Three failure modes (duplicate accounts, missing role, redirect mismatch) must all be addressed in a single coherent implementation. Google web first; mobile second; Facebook as optional follow-on.
**Delivers:** "Continue with Google" on web and mobile; post-OAuth "choose your role" onboarding screen; profile upsert in `onAuthStateChange`; Supabase identity linking enabled.
**Addresses:** FEATURES differentiator #1 (social auth); PITFALLS 2, 3, 4.
**Research flag:** MEDIUM — Expo 55 + `expo-auth-session` OAuth flow has moving parts (deep link scheme, PKCE, Android/iOS differences). Verify `expo-auth-session` version via `npx expo install`, not manual version pin.

### Phase 6: Notifications Audit
**Rationale:** Infrastructure exists; gap is coverage. Cheap to complete once the job lifecycle is fixed (Phase 1). Low risk, high trust impact.
**Delivers:** All six key notification events confirmed firing (new bid, bid accepted, bid rejected, job status change, payment processed). Push permission requested after first meaningful action, not on app open.
**Addresses:** FEATURES differentiator #5 (notification coverage).
**Research flag:** No — push notification handler pattern is already implemented; this is an audit + gap-fill.

### Phase 7: Maps / Location
**Rationale:** Lower priority than auth and design. Requires a schema migration (nullable lat/lng on jobs), backend field additions, and new UI components on both platforms. Technically straightforward but has mobile performance pitfalls on Android.
**Delivers:** Lat/lng on job creation (geocoded from city via Nominatim), map view on web job browse (Leaflet + OpenStreetMap), map view on mobile (react-native-maps). iOS location permission pre-explanation screen. Graceful fallback when coordinates are absent.
**Addresses:** FEATURES differentiator #3 (job location pin); PITFALLS 5, 6.
**Research flag:** MEDIUM — `react-native-maps` Expo 55 compatibility needs verification via `npx expo install`. Test on physical Android device (not emulator) before considering done.

### Phase 8: Analytics + Observability
**Rationale:** Last, by design — wraps existing flows once all other phases are stable. Analytics is highest risk if done early (GDPR consent gate is easy to miss). Monitoring and error tracking are pure add-on with no UX changes.
**Delivers:** PostHog analytics (EU-hosted, consent-gated, no PII in events); cookie/consent banner on web; Sentry error tracking on backend + frontend + mobile; Better Stack uptime monitoring on `/health` endpoint.
**Addresses:** PITFALL 7 (GDPR consent before analytics); STACK analytics/monitoring section.
**Research flag:** MEDIUM — GDPR consent implementation for PostHog on mobile needs care (AsyncStorage + conditional SDK init). PostHog EU host configuration should be verified against current docs before shipping.

### Phase Ordering Rationale

- Phases 1-2 are pre-conditions for everything else. A broken app with open endpoints is worse than a broken app with locked endpoints.
- Phase 3 (browse-first) is the highest-leverage UX win but is unsafe without Phase 2.
- Phases 4-6 (design, social login, notifications) have no hard dependencies on each other and could be parallelized if there are multiple contributors — but social login is riskier so it benefits from landing after design stabilizes.
- Phase 7 (maps) is technically independent of Phase 5 (social login) but requires its own SQL migration; keep it isolated to reduce schema change risk.
- Phase 8 (analytics) is explicitly last to avoid GDPR compliance issues on earlier phases.

### Research Flags

Needs additional research during planning:
- **Phase 5 (Social Login):** `expo-auth-session` + Supabase OAuth on mobile has known device-specific behavior differences (Android vs iOS deep links). Run `npx expo install expo-auth-session expo-web-browser` to get SDK-version-pinned packages.
- **Phase 7 (Maps):** `react-native-maps` Expo 55 compatibility unverified. Physical Android device testing mandatory before sign-off.
- **Phase 8 (Analytics):** PostHog EU-hosted instance configuration and mobile consent flow implementation need verification against current PostHog docs.

Standard patterns (skip additional research):
- **Phase 1 (Bug Fixes):** Standard MediatR handler creation pattern.
- **Phase 2 (Security):** `Microsoft.AspNetCore.RateLimiting` is official .NET 7+ API; CORS configuration is standard ASP.NET Core pattern.
- **Phase 3 (Browse-first):** `[AllowAnonymous]` override on controller actions is standard ASP.NET Core.
- **Phase 6 (Notifications):** Existing `SendPushNotificationCommand` handler pattern just needs to be called from missing event handlers.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Rate limiting and Supabase OAuth are HIGH; library versions (react-native-maps, Sentry SDKs) are MEDIUM — verify via install, not manual pinning |
| Features | HIGH | Patterns consistent across Airbnb, Fiverr, Upwork, TaskRabbit; NNGroup login-wall research is well-established |
| Architecture | HIGH | Based on direct codebase inspection; `[AllowAnonymous]` gap and OAuth profile-upsert gap are confirmed, not inferred |
| Pitfalls | HIGH (codebase-specific), MEDIUM (integration-specific) | PII, CORS, Swagger, Stripe currency pitfalls derived from direct code analysis in CONCERNS.md; OAuth and maps pitfalls from training knowledge |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Expo 55 + `expo-auth-session`**: version compatibility not directly verified. Resolve with `npx expo install` during Phase 5 planning.
- **Sentry React Native in Expo Go**: full native crash reporting requires `expo-dev-client`. JS error capture works in Expo Go. Acceptable for beta; flag for post-beta native build phase.
- **Nominatim rate limit**: 1 req/sec. Must add 500ms debounce on geocoding call in job creation form or users will hit 429s on fast typing.
- **Currency**: `CreatePaymentIntentHandler` hardcodes USD. Fix to RON before any real transaction (even in test mode, the display label is wrong). Stripe RON support confirmed but requires EU-registered Stripe account.
- **Supabase identity linking**: this feature's availability in the project's current Supabase plan/version should be confirmed in the dashboard before Phase 5 planning.

---

## Sources

### Primary (HIGH confidence)
- Microsoft official docs — `Microsoft.AspNetCore.RateLimiting` API (verified during research)
- Codebase direct inspection — `JobsController`, `GetJobsHandler`, `AuthContext.jsx`, `profiles` table, `CONCERNS.md`
- Supabase Auth documentation — `signInWithOAuth`, PKCE flow, JWT structure

### Secondary (MEDIUM confidence)
- Training-data knowledge of Airbnb, Fiverr, Upwork, TaskRabbit, Thumbtack UX patterns
- PostHog EU-hosted cloud configuration and free tier
- Sentry SDK free tier and React Native Expo behavior
- React Native Maps performance characteristics and marker optimization
- GDPR Articles 6 and 7; Romanian ANSPDCP enforcement patterns
- Expo 55 library compatibility matrix (training data, August 2025 cutoff)

### Gaps (not researched — verify before implementation)
- `expo-auth-session` exact version for Expo 55 — use `npx expo install` to resolve
- Supabase identity-linking dashboard availability for current project plan
- PostHog mobile consent gate implementation details (current SDK docs)

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
