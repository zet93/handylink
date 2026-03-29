# Technology Stack — Beta Polish Integrations

**Project:** HandyLink
**Milestone:** Beta Polish
**Researched:** 2026-03-29
**Mode:** Subsequent milestone (additions to existing stack)

---

## Context

This file covers only the new libraries/services needed for the beta-polish integrations. The base stack (ASP.NET Core 10, React + Vite + Tailwind, React Native + Expo, Supabase, Stripe) is already locked and documented in `.planning/codebase/STACK.md`.

---

## 1. Social Login — Google + Facebook via Supabase OAuth

### Recommendation

Use Supabase's built-in OAuth support. No new auth library is needed on the backend. The existing `@supabase/supabase-js` client on web and mobile handles everything.

**Confidence: HIGH** — Supabase OAuth is a core Supabase feature, well-documented and stable.

### Web (React + Vite)

No new packages. The existing `@supabase/supabase-js` 2.x client has `signInWithOAuth`:

```js
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
})
```

Supabase handles the OAuth dance and redirects back with a session. A `/auth/callback` route that calls `supabase.auth.exchangeCodeForSession()` is required.

### Mobile (React Native + Expo)

The mobile app already uses the PKCE flow (detected in `mobile/services/supabase.ts`). OAuth on mobile requires:

- `expo-auth-session` — browser-based OAuth redirect handling
- `expo-web-browser` — opens the OAuth provider in a browser tab

```
npx expo install expo-auth-session expo-web-browser
```

Versions (Expo 55 compatible): `expo-auth-session` ~6.x, `expo-web-browser` ~14.x.

The flow: open browser → redirect to Supabase OAuth URL → deep-link back to app with code → exchange for session. Deep-link scheme must be registered in `app.json` (`scheme: "handylink"` or similar).

**Do not use** `@react-native-google-signin/google-signin` or `react-native-fbsdk-next` — these are native SDK integrations that require EAS builds and separate Google/Facebook app registrations. They add complexity that is not warranted for beta. Supabase's web-based OAuth flow works with Expo Go and requires no native build.

### Backend

No changes needed. The backend validates Supabase JWTs regardless of how the user authenticated. Social login users get the same HS256-signed JWT.

### Configuration required

In Supabase Dashboard → Authentication → Providers:
- Enable Google: requires Google OAuth Client ID + Secret (from Google Cloud Console)
- Enable Facebook: requires Facebook App ID + Secret (from Meta Developer Portal)

---

## 2. Maps / Location

### Recommendation

**react-native-maps** for mobile, **Leaflet + OpenStreetMap** for web.

**Confidence: MEDIUM** — react-native-maps is the dominant React Native maps library; Leaflet is well-established for web. Versions verified against Expo compatibility matrix as of training cutoff (August 2025).

### Mobile

```
npx expo install react-native-maps
```

Package: `react-native-maps` ~1.18.x (current as of mid-2025 for Expo 55 managed workflow).

- Uses Google Maps on Android, Apple Maps on iOS by default
- Requires `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` for Android (set in `app.json` under `android.config.googleMaps.apiKey`)
- iOS uses Apple Maps by default — no API key needed for basic display
- Supports `MapView`, `Marker`, `Circle` components

**Do not use Mapbox** on mobile for beta. Mapbox React Native (`@rnmapbox/maps`) requires native code and a custom EAS build. It cannot run in Expo Go, which is the target for beta device testing. The added capability (vector tiles, offline maps) is not needed at beta scale.

### Web (React)

```
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

Packages: `leaflet` ~1.9.x, `react-leaflet` ~4.2.x.

- Free, no API key required — uses OpenStreetMap tiles
- `react-leaflet` 4.x requires React 18+ (project is on React 19 — compatible)
- Displays job location pins and worker markers

**Do not use Google Maps JS API** on web for beta — billing setup required, usage monitoring overhead. OpenStreetMap via Leaflet is sufficient for Romanian market beta.

**Do not use Mapbox GL JS** on web for beta — requires API token, higher complexity, monthly free tier limits.

### Geocoding

For converting addresses to coordinates (job location pinning), use the **Google Geocoding API** (REST, called from the backend) or **Nominatim** (OpenStreetMap geocoding, free, no key, lower rate limits). For beta, Nominatim is sufficient.

Backend call pattern: `GET https://nominatim.openstreetmap.org/search?q={address}&format=json&countrycodes=ro` — no SDK, raw HTTP via `HttpClient`.

---

## 3. Push / SMS / Email Notifications

### Existing (keep)

Expo Push Notifications are already implemented (`expo-notifications` 55.0.12, backend sends via `exp.host` HTTP endpoint). No changes needed for push.

### Email — Recommendation: Resend

```
dotnet add package Resend
```

NuGet: `Resend` ~0.7.x (the official .NET client).

- Free tier: 3,000 emails/month, 100/day — sufficient for beta
- Simple HTTP API, excellent .NET SDK
- Used via a new MediatR handler: `SendEmailNotificationHandler`

**Do not use SendGrid** — higher complexity, older API design, Twilio acquisition has caused pricing unpredictability. **Do not use AWS SES** — setup overhead (domain verification, IAM) not warranted for beta.

New environment variable needed: `Resend:ApiKey`

### SMS — Recommendation: Defer for beta

SMS adds cost (Twilio ~$0.0075/SMS in Romania), requires phone number verification flow, and is not in the beta scope. The PROJECT.md lists "Push/SMS notifications" but in the constraints section states the goal is a functional demo. Use push notifications only for beta; add SMS post-beta when real users are onboarded.

If SMS is required: **Twilio** is the industry standard. NuGet: `Twilio` ~7.x. Environment variables: `Twilio:AccountSid`, `Twilio:AuthToken`, `Twilio:FromNumber`.

---

## 4. Analytics

### Recommendation: PostHog

**Confidence: MEDIUM** — PostHog is widely used as the open-source alternative to Mixpanel/Amplitude. Cloud-hosted free tier confirmed via training data; specific version numbers below are from August 2025 training.

PostHog cloud (hosted): free up to 1 million events/month. No infrastructure to manage.

### Web

```
npm install posthog-js
```

Package: `posthog-js` ~1.x (latest ~1.190.x as of mid-2025).

Minimal setup in `frontend/src/main.jsx`:
```js
import posthog from 'posthog-js'
posthog.init('VITE_POSTHOG_KEY', { api_host: 'https://eu.i.posthog.com' })
```

Use `https://eu.i.posthog.com` as the host — PostHog has EU-hosted cloud which satisfies GDPR requirements for Romanian users. This is important given the project's GDPR constraint.

### Mobile

```
npx expo install posthog-react-native
```

Package: `posthog-react-native` ~3.x.

Wrap the app in `<PostHogProvider>` in `mobile/app/_layout.tsx`. PostHog React Native supports:
- Manual event capture (`posthog.capture('bid_submitted', {...})`)
- Screen tracking (automatic with Expo Router integration)
- Session recording (available but not needed for beta)

### What NOT to use

- **Mixpanel** — paid beyond 100K events, proprietary, no EU data residency on free tier
- **Plausible** — web-only, no mobile SDK, no funnel analysis; good for pageviews but insufficient for this use case
- **Amplitude** — enterprise pricing model, complex setup, not needed at beta scale
- **Custom analytics** — significant build effort, reinvents a solved problem

### New environment variables

- Frontend: `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` (set to `https://eu.i.posthog.com`)
- Mobile: `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`

---

## 5. Monitoring & Alerting

### Recommendation

**Better Stack (Better Uptime)** for uptime monitoring + **Sentry** for error tracking.

**Confidence: MEDIUM** — Both services have confirmed free tiers and are commonly used for this stack. Specific SDK versions are from training data; verify on install.

### Uptime Monitoring: Better Stack

- Free tier: up to 10 monitors, 3-minute check interval, email + Slack alerts
- Configure an HTTP monitor on the existing `GET /health` endpoint (already implemented in `Program.cs`)
- Also monitor Vercel frontend URL
- No SDK required — purely external monitoring, configured in the Better Stack dashboard
- Alternative: **UptimeRobot** (also free, 5-minute intervals). Better Stack is preferred for lower check interval and cleaner UI.

### Error Tracking: Sentry

Backend:
```
dotnet add package Sentry.AspNetCore
```
NuGet: `Sentry.AspNetCore` ~5.x.

In `Program.cs`:
```csharp
builder.WebHost.UseSentry(o =>
{
    o.Dsn = builder.Configuration["Sentry:Dsn"];
    o.TracesSampleRate = 0.1; // 10% of transactions for beta
});
```

Frontend:
```
npm install @sentry/react
```
Package: `@sentry/react` ~8.x.

Mobile:
```
npx expo install @sentry/react-native
```
Package: `@sentry/react-native` ~6.x. Requires `expo-dev-client` or EAS build for full native crash reporting; source maps work in Expo Go for JS errors.

**Sentry free tier:** 5,000 errors/month, 10K performance transactions. Sufficient for beta.

**Do not use Datadog** — overkill for beta, expensive, complex setup. **Do not use New Relic** — same concerns.

### New environment variables

- Backend: `Sentry:Dsn`
- Frontend: `VITE_SENTRY_DSN`
- Mobile: `EXPO_PUBLIC_SENTRY_DSN`

---

## 6. Rate Limiting in ASP.NET Core 10

### Recommendation

Use **`Microsoft.AspNetCore.RateLimiting`** — it is built into ASP.NET Core 7+ and requires no additional NuGet package.

**Confidence: HIGH** — Verified directly from official Microsoft documentation (fetched during research). The API is stable and unchanged from 7.0 through 10.0.

### Implementation

Add to `Program.cs` after existing service registrations:

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Auth endpoints: strict limit by IP
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    // Bid submission: per authenticated user
    options.AddFixedWindowLimiter("bids", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync("Too many requests.", ct);
    };
});
```

Apply `UseRateLimiter()` in the middleware pipeline after `UseRouting()` and before `UseAuthentication()`.

Apply policies at the controller/endpoint level via `[EnableRateLimiting("auth")]` attribute — this fits the VSA handler pattern without requiring changes to the existing MediatR pipeline.

**Partitioning:** For auth endpoints, partition by IP. For bid endpoints, partition by user ID from JWT. Use `PartitionedRateLimiter.Create` for user-partitioned limits.

**What NOT to use:** Third-party packages like `AspNetCoreRateLimit` (NuGet) were the pre-.NET 7 solution. They are unnecessary now that the built-in middleware covers all the same scenarios. Do not add them.

---

## Additions Summary

| Integration | Library/Service | Where | Cost (beta) |
|-------------|----------------|-------|-------------|
| Social login | Supabase OAuth (built-in), `expo-auth-session`, `expo-web-browser` | Web + Mobile | Free |
| Maps (mobile) | `react-native-maps` ~1.18.x | Mobile | Free (Apple Maps); Google Maps API key for Android |
| Maps (web) | `leaflet` ~1.9.x + `react-leaflet` ~4.2.x | Frontend | Free (OpenStreetMap) |
| Geocoding | Nominatim (OpenStreetMap REST) | Backend | Free |
| Email | `Resend` ~0.7.x (.NET) | Backend | Free (3K/mo) |
| SMS | Deferred | — | — |
| Analytics | `posthog-js` ~1.x (web), `posthog-react-native` ~3.x (mobile) | Web + Mobile | Free (1M events/mo) |
| Uptime monitoring | Better Stack (external, no SDK) | Ops | Free (10 monitors) |
| Error tracking | `Sentry.AspNetCore` ~5.x, `@sentry/react` ~8.x, `@sentry/react-native` ~6.x | All | Free (5K errors/mo) |
| Rate limiting | `Microsoft.AspNetCore.RateLimiting` (built-in, no package) | Backend | Free |

---

## New Environment Variables Required

| Variable | Platform | Purpose |
|----------|----------|---------|
| `Resend:ApiKey` | Backend | Email sending |
| `Sentry:Dsn` | Backend | Error reporting |
| `VITE_POSTHOG_KEY` | Frontend | Analytics |
| `VITE_POSTHOG_HOST` | Frontend | Analytics host (EU) |
| `VITE_SENTRY_DSN` | Frontend | Error reporting |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Mobile | Android maps |
| `EXPO_PUBLIC_POSTHOG_KEY` | Mobile | Analytics |
| `EXPO_PUBLIC_POSTHOG_HOST` | Mobile | Analytics host (EU) |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile | Error reporting |

Google OAuth Client ID/Secret and Facebook App ID/Secret are configured in Supabase Dashboard — not in the app's environment.

---

## Confidence Summary

| Area | Confidence | Notes |
|------|------------|-------|
| Rate limiting (ASP.NET Core built-in) | HIGH | Verified via official Microsoft docs |
| Supabase OAuth (web) | HIGH | Core Supabase feature, stable API |
| Supabase OAuth (mobile PKCE flow) | MEDIUM | PKCE already implemented; `expo-auth-session` pattern is standard but Expo 55 compat not directly verified |
| react-native-maps | MEDIUM | Dominant library, but version for Expo 55 not directly verified — run `npx expo install` which auto-resolves compatible version |
| Leaflet / react-leaflet | HIGH | Stable, well-known, no native code |
| Resend (.NET) | MEDIUM | SDK is real, free tier confirmed, exact version needs verification on install |
| PostHog (web + mobile) | MEDIUM | EU host confirmed, free tier confirmed, versions from training data |
| Sentry (all platforms) | MEDIUM | Free tier confirmed, SDK versions from training data — verify on install |
| Better Stack (uptime) | MEDIUM | Free tier and feature set from training data — verify current limits before signing up |
| SMS deferral | HIGH | Deliberate decision, not a gap |

---

## Gaps / Verify Before Implementing

1. **`expo-auth-session` version** for Expo 55 — run `npx expo install expo-auth-session` to get the SDK-version-pinned release rather than specifying a version manually.
2. **Sentry React Native + Expo Go** — full native crash reporting requires `expo-dev-client`. For beta (Expo Go), only JS errors are captured. This is acceptable for beta but flag it.
3. **Nominatim rate limit** — 1 request/second limit. Acceptable for beta (users typing addresses). Add a debounce on the geocoding call (500ms minimum).
4. **Google Maps Android API key** for `react-native-maps` — requires enabling "Maps SDK for Android" in Google Cloud Console. Same project as Google OAuth can be used.

---

*Research date: 2026-03-29 | Model knowledge cutoff: August 2025 | Rate limiting docs: verified via official Microsoft source*
