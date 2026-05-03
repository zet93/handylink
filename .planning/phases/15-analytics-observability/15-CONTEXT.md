# Phase 15: Analytics + Observability - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 15 delivers analytics event tracking with a GDPR consent gate, error capture via Sentry across all three platforms (web, mobile, backend), and uptime monitoring via UptimeRobot. No new user-facing screens beyond the consent UI. OPS-04 (content moderation) is explicitly deferred.

</domain>

<decisions>
## Implementation Decisions

### GDPR Consent Gate — Web
- **D-01:** Fixed bottom bar (non-blocking). User can browse immediately; bar stays pinned until they accept or decline.
- **D-02:** Dismiss without choosing = stays pending. Banner re-appears next session. No analytics fire until explicit consent is given.

### GDPR Consent Gate — Mobile
- **D-03:** Full-screen bottom sheet modal on first launch. Matches native mobile patterns.
- **D-04:** Same dismiss behavior as web: pending until explicit choice, re-shows on next cold start.

### PostHog Identity Linking
- **D-05:** Call `posthog.identify(user.id, { role: profile.role })` after **both** conditions are met: consent granted AND user is logged in. Never before both conditions.
- **D-06:** Pass only `user.id` (UUID) to identify — never email or phone. Include `role` (client | worker) as a person property to enable role-split funnel analysis.
- **D-07:** On logout, call `posthog.reset()` to detach identity from future anonymous events.

### Analytics Events (ANLX-01)
- **D-08:** Required events: `job_posted`, `bid_submitted`, `account_created`, `login`. Fire on both web and mobile.
- **D-09:** Web also gets PostHog autocapture for page views — no extra code needed.
- **D-10:** Event properties: `job_posted` → `{ category }`, `bid_submitted` → `{ job_id }`, `account_created` → `{ role }`, `login` → no extra props.

### PostHog Initialization
- **D-11:** Web: `cookieless_mode: 'on_reject'` (no cookies until accept). Host: `https://eu.i.posthog.com`.
- **D-12:** Mobile: `defaultOptIn: false`. Host: `https://eu.i.posthog.com`. PostHog project must be created in EU region at signup.

### Sentry
- **D-13:** Single Sentry project covers all three platforms (web, mobile, backend). Platform filtering via Sentry tags/environments.
- **D-14:** `SendDefaultPii: false` on backend. `tracesSampleRate: 0.1` on all platforms.
- **D-15:** Sentry initializes unconditionally (no consent required — error capture is not "tracking" under GDPR).

### OPS-02 Supabase Backup
- **D-16:** GitHub Actions cron (`backup.yml`), daily at 02:00 UTC. Stores dump as GitHub artifact with 30-day retention. `SUPABASE_DB_URL` must be added as a GitHub repository secret before the workflow runs.

### OPS-03 Dependency Update Docs
- **D-17:** Document in a new `OPERATIONS.md` at the repo root. Checklist format: check for major updates monthly, apply security patches immediately, test on a branch before merging.

### OPS-04 — Deferred
- **D-18:** Content moderation is out of scope for Phase 15. Log as a separate backlog item targeting a future admin/v2 phase.

### Claude's Discretion
- Sentry alert routing (email vs Slack/Discord): Claude decides based on what's simplest for a solo dev — email alerts are sufficient for beta.
- `posthog.screen(pathname)` screen tracking on mobile (Expo Router pathname hook): include if straightforward, skip if it adds provider complexity.
- Exact Tailwind styling for the consent banner (web) and consent modal (mobile): match existing app styles.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Patterns
- `.planning/phases/15-analytics-observability/15-RESEARCH.md` — Full technical research: library versions, code patterns for all 5 implementation patterns, pitfalls, anti-patterns. **Primary reference for this phase.**

### Project Foundation
- `CLAUDE.md` — Architecture rules: VSA + CQRS via MediatR for backend, no new Service classes, SQL scripts not EF migrations.
- `.planning/REQUIREMENTS.md` — Requirement IDs ANLX-01 through OPS-04 and their acceptance criteria.
- `.planning/ROADMAP.md` — Phase 15 success criteria and requirement mappings.

### Integration Points
- `backend/HandyLink.API/Program.cs` — Existing service registration; `builder.WebHost.UseSentry()` goes here.
- `frontend/src/main.jsx` — Entry point; `PostHogProvider` and `Sentry.init` wrap here.
- `frontend/src/context/AuthContext.jsx` — `signIn`, `signInWithGoogle`, `onAuthStateChange` — hook points for `login` and `account_created` events.
- `mobile/app/_layout.tsx` — Root layout; `PostHogProvider` + `Sentry.wrap` go here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/context/AuthContext.jsx`: Contains `signIn`, `signInWithGoogle`, `completeRoleSelection`, and `onAuthStateChange` — the natural insertion point for `login`, `account_created`, and `posthog.identify()` calls.
- `frontend/src/main.jsx`: Minimal, no providers — clean insertion point for `PostHogProvider` + `Sentry.init`.
- `mobile/app/_layout.tsx`: Root Expo Router layout — wrapping with `Sentry.wrap` and `PostHogProvider` follows the existing provider pattern.

### Established Patterns
- Backend uses `builder.WebHost.Use*()` extension methods in `Program.cs` for service wiring — Sentry follows the same pattern.
- Frontend uses env vars via `VITE_*` prefix; mobile uses `EXPO_PUBLIC_*` prefix — analytics keys follow the same convention.
- No existing analytics or error tracking code — clean slate.

### Integration Points
- PostHog `capture('job_posted')` fires after the `POST /api/jobs` response succeeds in `PostJobPage` (web) and `post-job.tsx` (mobile).
- PostHog `capture('bid_submitted')` fires after the bid submit mutation in `JobDetailPage` (web) and `job-detail.tsx` (mobile).
- `posthog.identify()` fires inside `AuthContext` after both consent state and user profile are confirmed.

</code_context>

<specifics>
## Specific Ideas

- Web consent banner: minimal Tailwind — white background, border-top, `fixed bottom-0 w-full`, two buttons (Accept / Decline). Should not interfere with the bottom nav on mobile web.
- Mobile consent: use `@gorhom/bottom-sheet` if available (already installed per RESEARCH.md peer deps), otherwise React Native `Modal`. Does not block app access — user can close and it re-appears next session.
- PostHog EU region: create the PostHog project at `eu.posthog.com` (not `us.posthog.com`) — cannot be migrated after creation.

</specifics>

<deferred>
## Deferred Ideas

- **OPS-04 (content moderation)**: Report/remove mechanism for flagged jobs and accounts. Requires admin UI and backend endpoints — belongs in a future v2/admin phase.
- **Sentry Slack/Discord integration**: Email alerts are sufficient for beta. Add Slack integration when team size warrants it.
- **PostHog screen tracking on mobile** (`posthog.screen(pathname)`): Nice-to-have; defer if it adds complexity to the `_layout.tsx` provider chain.
- **UptimeRobot SMS alerts**: Email-only for beta; SMS adds cost.

</deferred>

---

*Phase: 15-analytics-observability*
*Context gathered: 2026-04-21*
