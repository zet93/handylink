# Phase 15: Analytics + Observability - Research

**Researched:** 2026-04-21
**Domain:** Analytics (PostHog), Error Tracking (Sentry), Uptime Monitoring, GDPR consent, ASP.NET Core 10 observability
**Confidence:** HIGH (core stack verified against registries and official docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANLX-01 | Key user events tracked (job posted, bid submitted, account created, login) | PostHog `capture()` calls in handlers and frontend event hooks |
| ANLX-02 | Funnel visibility — where do users drop off? | PostHog funnels built from captured events in dashboard, no additional code needed |
| ANLX-03 | Basic dashboard or reporting to see usage trends | PostHog built-in dashboards and Insights (zero-code, post-instrumentation) |
| OPS-01 | App health monitoring — alerts when API is down or error rate spikes | UptimeRobot free tier for HTTP uptime + Sentry alert rules for error rate |
| OPS-02 | Automated Supabase database backups configured | GitHub Actions + Supabase CLI `db dump` (free tier limitation documented) |
| OPS-03 | Dependency update process documented | README/OPERATIONS.md doc — no runtime code required |
| OPS-04 | Basic content moderation — mechanism to report and remove flagged content | DEFERRED — see scope decision below |
</phase_requirements>

---

## Summary

Phase 15 adds analytics tracking, error capture, and uptime monitoring across three platforms (ASP.NET Core 10 backend, React/Vite web, React Native/Expo 55 mobile) with a GDPR consent gate mandatory before any tracking fires.

**PostHog** is the right analytics choice for this context: 1M free events/month covers the beta stage comfortably (~50 MAU), it has first-class React and React Native SDKs, built-in funnel analysis (ANLX-02), and explicit `optIn()`/`optOut()` APIs that map directly to the GDPR consent gate requirement. The EU-hosted instance (`eu.i.posthog.com`) eliminates data residency concerns for Romanian users. Mixpanel and Amplitude are excluded: Mixpanel free tier is 20M events but EU data residency costs money; Amplitude free tier is 10M events but the React Native GDPR consent flow is less documented. PostHog wins on the consent API maturity and EU hosting combination.

**Sentry** covers error capture on all three platforms: `Sentry.AspNetCore` 6.4.1 (NuGet) for the backend, `@sentry/react` 10.x for web, and `@sentry/react-native` 8.8.0 for mobile with Expo plugin support confirmed for Expo 55.

**UptimeRobot** free tier provides 50 monitors at 5-minute intervals — sufficient for a single Render API health endpoint plus Vercel frontend. No code changes required; it is dashboard-only external monitoring.

**OPS-04 (content moderation)** is out of scope for this phase. It requires an admin UI, a reporting mechanism, and backend moderation endpoints — that is a separate feature slice, not an observability concern. Admin capabilities map to v2 requirements (ADMIN-01, ADMIN-02, ADMIN-03). Defer to a future phase.

**Primary recommendation:** Use PostHog (EU cloud) + Sentry + UptimeRobot. Initialize PostHog with `defaultOptIn: false` on both web and mobile, show a consent banner/modal before calling `optIn()`. Sentry initializes unconditionally (error capture is not "tracking" under GDPR — no consent required for technical monitoring).

---

## OPS-04 Scope Decision

**OPS-04 is deferred out of Phase 15.**

Rationale: Content moderation requires (a) a "report" action on job/account entities (new backend endpoint), (b) an admin review interface, and (c) a removal/ban mechanism. None of these are observability concerns. They map directly to v2 ADMIN-01/02/03 requirements. Including them here would bloat the phase scope and delay shipping the analytics/monitoring work. The REQUIREMENTS.md traceability row for OPS-04 should remain Phase 15 but be explicitly marked deferred in the plan.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| GDPR consent state | Browser / Client + Mobile | — | Consent must be stored per-device; localStorage (web) and AsyncStorage (mobile) via PostHog's own persistence |
| Analytics event capture | Frontend Server (web page actions) + Mobile app | API (backend events are not typical) | User-facing events originate where user actions happen; backend capture is optional enrichment |
| Error tracking | All tiers independently | — | Each Sentry SDK reports to the same project but operates independently |
| Uptime monitoring | CDN / External probe | — | UptimeRobot pings Render API from outside — zero code changes to app |
| Supabase backup | Database / Storage + CI | — | GitHub Actions cron runs `supabase db dump` against managed DB |
| Funnel reporting | Analytics dashboard | — | PostHog dashboard, no app-side code beyond event names |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| posthog-js | 1.369.5 | Web analytics + consent management | Official PostHog web SDK; `opt_in_capturing()` / `opt_out_capturing()` APIs; EU host option |
| @posthog/react | (bundled with posthog-js) | React hooks (`usePostHog`) | Official React wrapper |
| posthog-react-native | 4.42.3 | Mobile analytics + consent | Expo-native install, `defaultOptIn: false` + `optIn()` / `optOut()` APIs |
| @sentry/react | 10.49.0 | Web error capture | Official Sentry React SDK, matches sentry-js monorepo |
| @sentry/react-native | 8.8.0 | Mobile error capture | Latest stable; Expo plugin confirmed working with Expo 55 (lazy Metro fix shipped) |
| Sentry.AspNetCore | 6.4.1 | Backend error capture | NuGet; adds .NET 10 support; published 2026-04-21 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-file-system | (expo install) | PostHog RN storage | Required peer for posthog-react-native in Expo |
| expo-application | (expo install) | PostHog RN device info | Required peer for posthog-react-native in Expo |
| expo-device | (expo install) | PostHog RN device info | Required peer for posthog-react-native in Expo |
| expo-localization | (expo install) | PostHog RN locale | Required peer for posthog-react-native in Expo |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostHog EU | Mixpanel | Mixpanel free has no EU region; requires paid for GDPR compliance |
| PostHog EU | Amplitude | Less documented GDPR consent API for React Native; no free EU hosting |
| UptimeRobot | Better Stack / BetterUptime | Better Stack has richer incident management but only 10 free monitors vs 50 |
| UptimeRobot | Render built-in health checks | Render has no alerting on free tier; no external probe |
| Sentry free cloud | Self-hosted Sentry | Setup overhead not justified for beta; 5K errors/month free tier sufficient |

**Installation — web:**
```bash
cd frontend
npm install posthog-js @posthog/react @sentry/react
```

**Installation — mobile:**
```bash
cd mobile
npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
npx expo install @sentry/react-native
```

**Installation — backend (NuGet):**
```xml
<PackageReference Include="Sentry.AspNetCore" Version="6.4.1" />
```

**Version verification:** [VERIFIED: npm registry 2026-04-21]
- posthog-js: 1.369.5
- posthog-react-native: 4.42.3
- @sentry/react: 10.49.0
- @sentry/react-native: 8.8.0 (peerDeps: expo >=49, react-native >=0.65 — both satisfied by Expo 55 / RN 0.83)
- Sentry.AspNetCore: 6.4.1 [VERIFIED: nuget.org 2026-04-21]

---

## Architecture Patterns

### System Architecture Diagram

```
User Action (web/mobile)
        │
        ▼
[Consent Gate] ──── not given ──── [Banner/Modal] ──── optIn() ────┐
        │ given                                                      │
        ▼                                                            ▼
[PostHog.capture(event)]                                   [PostHog resumes]
        │
        ▼
[PostHog EU Cloud] ──── Funnel / Dashboard ──── Dev view
        
[JS/RN Runtime Error]
        │
        ▼
[Sentry SDK] (no consent required)
        │
        ▼
[Sentry Cloud] ──── Alert ──── Email / Slack

[Render API] ◄── HTTP probe every 5min ── [UptimeRobot]
                                               │
                                        Alert on failure
                                               │
                                           Email / SMS

[GitHub Actions cron] ── supabase db dump ──► S3 / GitHub artifact
```

### Recommended Project Structure

No new top-level directories needed. Changes are additive:

```
frontend/src/
├── lib/
│   ├── supabase.js          (existing)
│   └── posthog.js           (NEW: posthog init with GDPR config)
├── components/
│   └── CookieBanner.jsx     (NEW: consent banner component)
└── main.jsx                 (MODIFIED: wrap with PostHogProvider + Sentry.init)

mobile/
├── services/
│   ├── posthog.ts           (NEW: PostHog init)
│   └── sentry.ts            (NEW: Sentry init)
├── components/
│   └── ConsentModal.tsx     (NEW: consent modal for mobile)
└── app/
    └── _layout.tsx          (MODIFIED: wrap with PostHogProvider, Sentry.wrap)

backend/HandyLink.API/
├── Program.cs               (MODIFIED: builder.WebHost.UseSentry())
└── HandyLink.API.csproj     (MODIFIED: add Sentry.AspNetCore package)

.github/workflows/
└── backup.yml               (NEW: Supabase backup cron)
```

### Pattern 1: Web GDPR-Gated PostHog Initialization

**What:** Initialize PostHog with `cookieless_mode: 'on_reject'` so no cookies are set until the user explicitly accepts. Show a banner on first visit.
**When to use:** Required for all EU-targeted apps under GDPR Article 7.

```javascript
// frontend/src/lib/posthog.js
// Source: https://posthog.com/tutorials/react-cookie-banner
import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  cookieless_mode: 'on_reject',
})

export default posthog
```

```jsx
// frontend/src/components/CookieBanner.jsx
// Source: https://posthog.com/tutorials/react-cookie-banner
import { useState } from 'react'
import { usePostHog } from '@posthog/react'

export function CookieBanner() {
  const posthog = usePostHog()
  const [status, setStatus] = useState(() => posthog.get_explicit_consent_status())

  if (status !== 'pending') return null

  return (
    <div className="fixed bottom-0 w-full bg-white border-t p-4 flex gap-4 justify-center">
      <p>We use analytics cookies to improve HandyLink.</p>
      <button onClick={() => { posthog.opt_in_capturing(); setStatus('granted') }}>Accept</button>
      <button onClick={() => { posthog.opt_out_capturing(); setStatus('denied') }}>Decline</button>
    </div>
  )
}
```

```jsx
// frontend/src/main.jsx (modified)
import posthog from './lib/posthog'
import { PostHogProvider } from '@posthog/react'
import * as Sentry from '@sentry/react'
import { CookieBanner } from './components/CookieBanner'

Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.1 })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
      <CookieBanner />
    </PostHogProvider>
  </StrictMode>
)
```

### Pattern 2: Mobile GDPR-Gated PostHog (Expo Router)

**What:** Initialize PostHog with `defaultOptIn: false`; show a modal on first launch asking for consent.
**When to use:** Mobile equivalent of the web cookie banner.

```typescript
// mobile/app/_layout.tsx (modified excerpt)
// Source: https://posthog.com/docs/libraries/react-native
import { PostHogProvider } from 'posthog-react-native'
import * as Sentry from '@sentry/react-native'

Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1 })

export default Sentry.wrap(function RootLayout() {
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
      options={{
        host: 'https://eu.i.posthog.com',
        defaultOptIn: false,
      }}
    >
      <QueryClientProvider client={queryClient}>
        {/* rest of providers */}
        <ConsentModal />
        <Slot />
      </QueryClientProvider>
    </PostHogProvider>
  )
})
```

```typescript
// mobile/components/ConsentModal.tsx
import { usePostHog } from 'posthog-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function ConsentModal() {
  const posthog = usePostHog()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('consent_decided').then(val => {
      if (!val) setVisible(true)
    })
  }, [])

  const accept = async () => {
    posthog.optIn()
    await AsyncStorage.setItem('consent_decided', 'granted')
    setVisible(false)
  }
  const decline = async () => {
    posthog.optOut()
    await AsyncStorage.setItem('consent_decided', 'denied')
    setVisible(false)
  }
  // render modal when visible
}
```

> **Note on mobile consent persistence:** PostHog RN persists `optIn`/`optOut` state internally via `expo-file-system`. However, for the first-launch modal, a separate `AsyncStorage` key (`consent_decided`) guards against showing the modal again. [VERIFIED: posthog-react-native docs]

### Pattern 3: Backend Sentry Setup

**What:** Single line in `Program.cs` enables error capture, request data, and breadcrumbs for ASP.NET Core.

```csharp
// backend/HandyLink.API/Program.cs
// Source: https://docs.sentry.io/platforms/dotnet/guides/aspnetcore/
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseSentry(o =>
{
    o.Dsn = builder.Configuration["Sentry:Dsn"];
    o.TracesSampleRate = 0.1;
    o.SendDefaultPii = false; // GDPR: do not send PII (email, user IP) by default
});
```

Add to `appsettings.json` (placeholder only — real value in user secrets / env var):
```json
{
  "Sentry": {
    "Dsn": ""
  }
}
```

### Pattern 4: Analytics Event Capture (named events)

Standard event names to use across platforms for ANLX-01 funnel consistency:

| Event | Platform | Where to fire |
|-------|----------|---------------|
| `job_posted` | web + mobile | after successful POST /api/jobs |
| `bid_submitted` | web + mobile | after successful POST /api/jobs/{id}/bids |
| `account_created` | web + mobile | after Supabase signUp completes |
| `login` | web + mobile | after Supabase signIn completes |
| `page_viewed` (auto) | web | PostHog autocapture |

```typescript
// mobile — after successful bid submit
const posthog = usePostHog()
posthog.capture('bid_submitted', { job_id: jobId })
```

```javascript
// web — after successful job post
const posthog = usePostHog()
posthog.capture('job_posted', { category: job.category })
```

### Pattern 5: Supabase Backup via GitHub Actions

```yaml
# .github/workflows/backup.yml
# Source: https://supabase.com/docs/guides/deployment/ci/backups
name: Supabase Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 02:00 UTC daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: supabase/setup-cli@v1
      - name: Dump database
        run: supabase db dump --db-url "${{ secrets.SUPABASE_DB_URL }}" -f backup.sql
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: supabase-backup-${{ github.run_id }}
          path: backup.sql
          retention-days: 30
```

### Anti-Patterns to Avoid

- **Initializing PostHog before consent check:** Any `posthog.init()` or `PostHogProvider` mounting must use `cookieless_mode: 'on_reject'` (web) or `defaultOptIn: false` (mobile) — never initialize with defaults.
- **Calling `posthog.identify()` before consent:** Identify links a user's identity to events. Only call after `optIn()`. Use anonymous capture before consent.
- **Sentry `SendDefaultPii: true`:** Default is false; keep it false. Sending user PII (emails, IPs) to Sentry requires separate GDPR justification.
- **Hardcoding Sentry DSN or PostHog key in source:** Use environment variables (`VITE_SENTRY_DSN`, `VITE_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_KEY`, `Sentry:Dsn` config key).
- **Adding `@sentry/react-native` without the Expo plugin:** Without the `@sentry/react-native/expo` plugin in `app.json`, source maps won't upload and stack traces will be minified in production builds.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Consent persistence | Custom localStorage wrapper | PostHog `cookieless_mode` + `opt_in_capturing()` | PostHog handles persistence, re-hydration, and server-side sync |
| Mobile consent persistence | Custom file storage | PostHog RN internal + `AsyncStorage` guard | PostHog RN persists opt state across app restarts via expo-file-system |
| Error capture + stack traces | try/catch logging | Sentry SDK | Sentry captures unhandled promises, ANRs, native crashes; hand-rolled logging misses all of these |
| Uptime monitoring | Health check ping script | UptimeRobot | External probe catches Render container restarts that internal health endpoints never see |
| Funnel analysis SQL | Custom Supabase query | PostHog Insights | Funnel queries require time-window session stitching — extremely hard to do correctly |
| Database backup scheduling | Custom cron server | GitHub Actions + Supabase CLI | GitHub provides free cron scheduling with artifact storage |

**Key insight:** The entire observability stack (PostHog + Sentry + UptimeRobot) is free-tier covered for a 50 MAU beta. Zero infrastructure cost. Don't spend phase time building infrastructure that already exists as managed services.

---

## Common Pitfalls

### Pitfall 1: PostHog Mobile Consent Not Persisting Across App Restarts

**What goes wrong:** User accepts consent, relaunches app, modal appears again.
**Why it happens:** The `ConsentModal` re-renders because the `AsyncStorage` guard check is async — there's a brief render before the stored value is loaded.
**How to avoid:** Initialize the `visible` state from a synchronous cache or show a loading state while `AsyncStorage.getItem` resolves. Do not default `visible` to `true`.
**Warning signs:** Consent modal flickers on every cold start.

### Pitfall 2: Sentry Tracing Middleware Crash on .NET 10 (Pre-6.0.0)

**What goes wrong:** API crashes on startup with a middleware ordering exception.
**Why it happens:** Sentry.AspNetCore 5.x had a tracing middleware bug specific to .NET 10. Fixed in 6.x. [VERIFIED: WebSearch citing sentry-dotnet releases]
**How to avoid:** Use Sentry.AspNetCore 6.4.1 — the version pinned in this research.
**Warning signs:** API startup fails immediately after adding `UseSentry()`.

### Pitfall 3: PostHog Events Fire Before Provider Mounts

**What goes wrong:** `usePostHog()` returns `undefined` on first render; calling `.capture()` throws.
**Why it happens:** The `PostHogProvider` wraps the component tree but there's a render cycle before it initializes.
**How to avoid:** Always null-check: `posthog?.capture(...)`. This is idiomatic in PostHog's own docs.
**Warning signs:** `Cannot read properties of undefined (reading 'capture')` in console.

### Pitfall 4: Sentry Missing Source Maps on Expo Production Builds

**What goes wrong:** Sentry shows minified stack traces like `at e (bundle.js:1:12345)`.
**Why it happens:** Source maps are only uploaded during native EAS builds when the Expo plugin is configured. Dev builds use Metro source map resolution.
**How to avoid:** Add `@sentry/react-native/expo` plugin to `app.json`. Set `SENTRY_AUTH_TOKEN` as EAS secret, not in `.env`.
**Warning signs:** Stack traces in Sentry look minified even when viewing recent app versions.

### Pitfall 5: Supabase Free Tier Has No Backup Retention Guarantee

**What goes wrong:** Automated backup exists but retention period is not documented for free tier (Pro = 7 days, Enterprise = 30 days).
**Why it happens:** Supabase free tier docs only say "daily automatic backups" without specifying retention. [VERIFIED: supabase.com/docs/guides/platform/backups]
**How to avoid:** Use the GitHub Actions backup (Pattern 5) as the canonical backup. GitHub artifact `retention-days: 30` provides 30-day history independent of Supabase's own retention.
**Warning signs:** Assuming Supabase dashboard backups are sufficient for compliance.

---

## Code Examples

### PostHog Identify After Login (web)

```javascript
// Source: https://posthog.com/docs/libraries/react
const posthog = usePostHog()

// After Supabase signIn succeeds
posthog?.identify(user.id, {
  email: user.email,
  role: profile.role,
})
posthog?.capture('login')
```

### PostHog Screen Tracking (Expo Router)

```typescript
// Source: https://posthog.com/docs/libraries/react-native
import { usePathname, useSegments } from 'expo-router'
const posthog = usePostHog()
const pathname = usePathname()

useEffect(() => {
  posthog?.screen(pathname)
}, [pathname])
```

### Sentry Error Boundary (React web)

```jsx
// Source: https://docs.sentry.io/platforms/javascript/guides/react/
import * as Sentry from '@sentry/react'

export default Sentry.withErrorBoundary(App, {
  fallback: <p>Something went wrong.</p>,
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sentry-expo` (Expo-owned package) | `@sentry/react-native` with Expo plugin | 2023 | `sentry-expo` is deprecated; migrate docs exist at docs.sentry.io |
| PostHog `opt_out_capturing_by_default: true` | `defaultOptIn: false` (RN) / `cookieless_mode: 'on_reject'` (web) | 2024–2025 | Both still work but the new APIs are more explicit and match GDPR consent semantics better |
| Manual `pg_dump` for Supabase backups | `supabase db dump` via CLI | 2023 | CLI handles auth automatically; manual `pg_dump` requires direct DB connection string exposure |

**Deprecated/outdated:**
- `sentry-expo`: Deprecated by Expo team; use `@sentry/react-native` + Expo plugin directly
- PostHog `api_host: 'https://app.posthog.com'`: Outdated; use `https://us.i.posthog.com` (US) or `https://eu.i.posthog.com` (EU)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostHog EU host is `eu.i.posthog.com` (not `eu.posthog.com`) | Standard Stack, Code Examples | Events silently fail or go to wrong region; verify in PostHog dashboard after project creation |
| A2 | Sentry free tier includes 5K errors/month — sufficient for 50 MAU beta | Standard Stack | If errors exceed limit, captures stop until next month; upgrade to paid Sentry or reduce `tracesSampleRate` |
| A3 | `@react-native-async-storage/async-storage` is already installed (it is a posthog-react-native peer) | Architecture Patterns | If not installed, ConsentModal persistence breaks; install with `npx expo install @react-native-async-storage/async-storage` |

---

## Open Questions (RESOLVED)

1. **PostHog project region: EU or US?**
   - What we know: EU instance is `eu.i.posthog.com`, hosted Frankfurt (AWS eu-central-1)
   - What's unclear: The PostHog project must be created in the EU region at signup time — it cannot be migrated later
   - Recommendation: Create the PostHog project on `eu.posthog.com` (not `us.posthog.com`) before any implementation begins
   - RESOLVED: EU region adopted — all plans use `eu.i.posthog.com` and `eu.posthog.com`.

2. **Sentry project DSN values**
   - What we know: Sentry DSNs are generated per-project in the Sentry dashboard
   - What's unclear: Whether a single Sentry project covers all three platforms or separate projects per platform
   - Recommendation: One Sentry project is fine for beta; use environment filtering or tags. Add DSNs as secrets in Render (backend), Vercel (web), and EAS (mobile).
   - RESOLVED: Single Sentry project adopted — all three platforms use one project with environment/platform tags.

3. **OPS-04 content moderation timeline**
   - What we know: Deferred from this phase
   - What's unclear: Whether it should be Phase 16 or bundled into the v2 ADMIN phase
   - Recommendation: Log as a separate backlog item. Do not block Phase 15 sign-off on this.
   - RESOLVED: Deferred per D-18 — not planned in Phase 15; logged as a backlog item for the future ADMIN phase.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | posthog-js, @sentry/react installs | ✓ | (project already uses npm) | — |
| Expo CLI (`npx expo install`) | posthog-react-native, @sentry/react-native | ✓ | Expo 55.0.6 | — |
| .NET 10 SDK | Sentry.AspNetCore NuGet install | ✓ | net10.0 (confirmed by CLAUDE.md) | — |
| GitHub Actions | Supabase backup cron | ✓ | (repo is on GitHub) | Manual CLI dump |
| UptimeRobot | OPS-01 uptime monitoring | ✓ (sign-up required) | Free tier | Better Stack free tier (10 monitors) |
| Sentry account | Error tracking | ✓ (sign-up required) | Free tier | — |
| PostHog account (EU) | Analytics | ✓ (sign-up required) | Free tier (1M events/month) | — |
| `SUPABASE_DB_URL` secret | GitHub Actions backup | ✗ (not yet set) | — | Manual export via Supabase dashboard |

**Missing dependencies with no fallback:**
- `SUPABASE_DB_URL` GitHub secret — must be set before backup workflow runs; the DB URL is found in Supabase dashboard > Settings > Database > Connection string

**Missing dependencies with fallback:**
- None blocking

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | xUnit 2.9.3 (backend) + Vitest 4.1.0 (frontend) |
| Config file | `frontend/vite.config.js` (jsdom environment set) |
| Quick run command (backend) | `dotnet test backend/ --filter "FullyQualifiedName~Analytics"` |
| Quick run command (frontend) | `npm run test` (from `frontend/`) |
| Full suite command | `dotnet test backend/ && npm run test --prefix frontend` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANLX-01 | PostHog capture called on job_posted, bid_submitted, etc. | unit (component) | `npm run test --prefix frontend -- --grep "analytics"` | ❌ Wave 0 |
| ANLX-02 | Funnel exists in PostHog dashboard | manual-only | N/A — dashboard config, not code | manual |
| ANLX-03 | Dashboard visible with events | manual-only | N/A | manual |
| OPS-01 | UptimeRobot monitor created and alerting | manual-only | N/A — external service config | manual |
| OPS-02 | Backup workflow runs without error | CI smoke | GitHub Actions run log review | ❌ Wave 0 |
| OPS-03 | Dependency update process documented | manual review | N/A | manual |

### Sampling Rate

- **Per task commit:** `npm run test --prefix frontend`
- **Per wave merge:** `dotnet test backend/ && npm run test --prefix frontend`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/__tests__/CookieBanner.test.jsx` — covers ANLX-01 consent gate behavior
- [ ] `.github/workflows/backup.yml` — covers OPS-02; verify syntax via `act` or first push

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Analytics/monitoring does not touch auth |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (partial) | Event property values passed to PostHog should not include raw user input without sanitization |
| V6 Cryptography | no | DSNs and API keys are not cryptographic secrets requiring rotation policy |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Leaking PII to Sentry (email, phone) | Information Disclosure | `SendDefaultPii: false` on `SentryOptions`; scrub before capture |
| Leaking PII to PostHog (email in event props) | Information Disclosure | Only pass `user.id` (UUID) to `posthog.identify()`, not email |
| PostHog key exposed in client bundle | Information Disclosure | Acceptable — PostHog project API key is designed to be public; only the Personal API key (write access) is secret |

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view posthog-react-native`, `npm view posthog-js`, `npm view @sentry/react-native`) — versions verified 2026-04-21
- nuget.org Sentry.AspNetCore page — version 6.4.1 confirmed, .NET 10 support confirmed, published 2026-04-21
- posthog.com/docs/libraries/react-native — consent API (`defaultOptIn: false`, `optIn()`, `optOut()`)
- posthog.com/tutorials/react-cookie-banner — `cookieless_mode: 'on_reject'`, consent banner pattern
- docs.sentry.io/platforms/react-native/manual-setup/expo/ — Expo plugin setup, metro.config.js
- supabase.com/docs/guides/platform/backups — free tier backup retention (unspecified), daily auto-backup confirmed

### Secondary (MEDIUM confidence)

- WebSearch: Sentry.AspNetCore 6.x adds .NET 10 support (confirmed by nuget.org primary source)
- WebSearch: UptimeRobot free tier 50 monitors at 5-min intervals (confirmed by uptimerobot.com pricing page)
- posthog.com/pricing — 1M free events/month (verified)

### Tertiary (LOW confidence)

- A2 (Assumptions Log): Sentry free tier 5K errors/month — based on training knowledge, not confirmed from sentry.io pricing in this session

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions verified against npm registry and nuget.org
- Architecture: HIGH — consent patterns verified from official PostHog tutorials
- Pitfalls: MEDIUM — Sentry .NET 10 bug (Pitfall 2) verified via WebSearch citing sentry-dotnet release notes; others are ASSUMED from documentation patterns
- Supabase backup free tier retention: LOW — docs confirmed daily auto-backup exists but retention period is unspecified for free tier

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable ecosystem; PostHog and Sentry versions change but APIs are stable)
