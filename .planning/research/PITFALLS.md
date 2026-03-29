# Domain Pitfalls: HandyLink Beta Polish

**Domain:** Two-sided marketplace (trades) — ASP.NET Core 10 + React + Expo
**Researched:** 2026-03-29
**Confidence note:** Codebase-specific pitfalls are HIGH confidence (derived from CONCERNS.md and direct code analysis). External integration pitfalls (Supabase OAuth, maps, GDPR) are MEDIUM confidence (training knowledge; WebSearch/WebFetch unavailable during this research run).

---

## Critical Pitfalls

### Pitfall 1: Public Browse Exposes PII Through Unauthenticated API Calls

**What goes wrong:** You remove the frontend auth guard so anonymous users can browse jobs and workers. The backend `[Authorize]` on the controllers stays, so it looks safe. But then you create read endpoints without `[Authorize]` (or with `[AllowAnonymous]`) to support the browse UX — and those endpoints return full DTO objects that include `email`, `phone`, `userId`, or internal IDs that link to other data. Clients who are logged in and clients who are not see the same data shape; nobody notices the leak until someone scrapes it.

**Why it happens:** Browse-first refactoring is done incrementally. Developers remove the frontend `ProtectedRoute` wrapper, add `[AllowAnonymous]` to GET endpoints, and ship. The DTO review step gets skipped because "it's just a read endpoint."

**Consequences:** User email and phone numbers (PII under GDPR) become publicly accessible without authentication. Romanian GDPR enforcement (ANSPDCP) can fine up to 4% of annual turnover for exactly this kind of breach.

**Warning signs:**
- `GET /api/jobs` or `GET /api/workers` returns `email`, `phone`, or internal profile IDs in the response body
- The public response DTO is the same type used by authenticated endpoints
- No distinct `PublicJobDto` / `PublicWorkerDto` type exists in the codebase

**Prevention:**
- Create separate `PublicJobResponse` and `PublicWorkerSummaryResponse` records that omit all PII
- Review every field in the response before marking an endpoint `[AllowAnonymous]`
- Add an integration test that calls the public endpoint without a token and asserts the response contains no email/phone fields
- The HandyLink codebase already correctly reads user identity from JWT — maintain that discipline even on public endpoints that need to check "is this the owner?"

**Phase:** Browse-first UX refactoring

---

### Pitfall 2: Social Login Creates Duplicate Accounts for Existing Email/Password Users

**What goes wrong:** A user signs up with `anna@gmail.com` + password. Later you add Google OAuth. Anna clicks "Continue with Google" using the same `anna@gmail.com`. Supabase creates a second identity record for her instead of linking to the existing account. She now has two separate `auth.users` rows, two `profiles` rows, and her jobs/bids/reviews are split across both. She sees an empty account and thinks she lost her data.

**Why it happens:** Supabase Auth treats email+password and OAuth as separate identity providers by default. Automatic account linking by email across providers is a security risk (email ownership is not always verified before OAuth sign-in), so Supabase does not do it automatically unless you enable the `autoconfirm` flag and configure linking explicitly.

**Consequences:** User data fragmentation, loss of trust at beta launch, complex data cleanup. If a worker's `StripeAccountId` is on the old profile, they cannot get paid after switching to OAuth login.

**Warning signs:**
- `profiles` table has two rows with the same email but different UUIDs
- No database trigger or application logic merges Supabase identities on OAuth sign-in
- No UI prompt that says "an account already exists with this email — log in with your password instead"

**Prevention:**
- Enable Supabase's identity linking feature (introduced in Supabase Auth v2.x) via the dashboard under Auth > Settings > "Link accounts by email"
- Alternatively: before completing OAuth sign-in, check if a profile with that email already exists and surface a merge prompt in the UI
- For HandyLink specifically: the `profiles` table has a unique constraint on the Supabase `user_id` (the PK is the Supabase UUID) — a second OAuth sign-in for the same email will create a second row and bypass this only if the UUIDs differ, which they will
- Test this scenario explicitly before launch: create an email account, then OAuth sign-in with the same email, and verify the outcome

**Phase:** Social login integration

---

### Pitfall 3: OAuth Callback Redirect URL Mismatch Breaks the Entire Auth Flow

**What goes wrong:** Google OAuth and the Supabase dashboard both require an exact allowlist of redirect URIs. In development you use `http://localhost:5173/auth/callback`. In production the URL is `https://handylink.vercel.app/auth/callback`. In the mobile app it is a deep link like `com.handylink.app://auth/callback`. If any of these is missing from the Google Cloud Console allowlist OR the Supabase Auth redirect URL allowlist, OAuth returns a redirect_uri_mismatch error and the user sees a blank screen or Google error page.

**Why it happens:** Developers test OAuth locally, it works, they deploy, and forget to add the production URL to both Google Cloud Console and Supabase dashboard. The mobile deep link is a third separate entry that is easy to overlook.

**Consequences:** Social login silently broken in production. Users see a Google error page. Since beta users are friends and family, they will report it verbally, not via a bug tracker — easy to miss for a day or two.

**Warning signs:**
- OAuth works in local dev but returns an error in production or on mobile
- The error message from Google is exactly `redirect_uri_mismatch`
- Supabase Auth logs show "Invalid redirect URL"

**Prevention:**
- Maintain a checklist of all redirect URIs: localhost, staging, production, and mobile deep link
- Add all of them to both the OAuth provider (Google/Facebook developer console) AND the Supabase dashboard's "Redirect URLs" allowlist before first test in any environment
- For the mobile app: Expo uses `makeRedirectUri()` from `expo-auth-session` — the scheme must match `app.json`'s `scheme` field (`com.handylink.app`)
- The existing mobile app already uses PKCE flow via `expo-secure-store` — ensure the OAuth callback is handled in the Supabase session listener in `_layout.tsx`

**Phase:** Social login integration

---

### Pitfall 4: Social Login Skips Role Assignment — User Lands With No Role

**What goes wrong:** The existing email/password registration flow collects a role ("client" or "worker") and creates a `profiles` row with that role set. Social OAuth sign-in bypasses that registration form entirely. Supabase Auth fires `onAuthStateChange` with a new user, but no `profiles` row exists yet, and no role has been set. The app's role-based routing (`/(client)/` vs `/(worker)/`) tries to read `profile.role` and gets `null` or a 404. The user is stuck in an auth loop or on a blank screen.

**Why it happens:** The registration flow and the OAuth callback are two different code paths. Developers wire the OAuth session listener but forget to handle the "new user with no profile" case.

**Consequences:** Any user who signs in via OAuth for the first time cannot use the app. On mobile, the `_layout.tsx` root layout routing check will fail silently or redirect to login in a loop.

**Warning signs:**
- After OAuth sign-in, `GET /api/users/me` returns 404 (no profile row exists yet)
- The mobile root layout does `if (!profile.role)` and routes to login, creating a loop
- No "complete your profile" or "choose your role" screen exists in `(auth)/` route group

**Prevention:**
- Add a post-OAuth onboarding step: after the OAuth callback creates the Supabase user, check if a `profiles` row exists; if not, redirect to a "choose your role" screen before entering the main app
- In the Supabase database, add a trigger on `auth.users` insert that creates a `profiles` stub row — but the role still needs to be collected from the user, so the trigger can only set a `pending` or empty role
- On the API side, handle the case where `GET /api/users/me` returns 404 gracefully in the frontend/mobile auth flow

**Phase:** Social login integration

---

## Moderate Pitfalls

### Pitfall 5: React Native Maps Freezes on Android With Many Markers

**What goes wrong:** `react-native-maps` renders Google Maps natively on Android and Apple Maps / Google Maps on iOS. If you render 50+ job markers or worker markers at once, Android devices (especially mid-range Romanian market phones — Xiaomi, Samsung A-series) stutter or freeze during pan/zoom because each marker is a native view bridge call. The JS thread and the native bridge get saturated.

**Why it happens:** Developers test on flagship devices or simulators. The problem only surfaces on real mid-range hardware under load. The default `MapView` has no virtualization — it renders all markers regardless of visibility.

**Consequences:** The maps screen becomes unusable on the devices most of your Romanian beta users will have.

**Warning signs:**
- Frame drops on Android during map pan when more than ~20-30 markers are visible
- The JS thread profiler (Flipper or Expo Dev Tools) shows sustained >60ms frame time during map interaction
- Markers rendered as `<Marker>` JSX children rather than via the `tracksViewChanges` prop set to false

**Prevention:**
- Set `tracksViewChanges={false}` on all `<Marker>` components once the image/icon has loaded — this is the single highest-impact optimization for marker performance
- Cluster markers using `react-native-map-clustering` or `react-native-maps-super-cluster` — never render >20 markers individually
- Limit the map data query to a bounding box matching the current viewport, not "all jobs" or "all workers"
- Test on a physical Android device (not an emulator) before considering the feature done — the emulator does not reproduce bridge bottlenecks accurately

**Phase:** Maps/location integration

---

### Pitfall 6: Location Permission Flow Handled Incorrectly on iOS

**What goes wrong:** iOS requires a two-step permission: first `requestForegroundPermissionsAsync()`, which shows the system dialog. If the user denies it, subsequent calls return `denied` permanently until the user manually goes to Settings. Developers often call the permission request inside a `useEffect` on screen mount — so it fires the moment the maps screen opens, before the user understands why the app needs location. Users trained to deny location requests on cold prompts deny it, and the map never works.

**Why it happens:** The permission request is added as a dev afterthought. No value-proposition explanation ("so you can see nearby workers") is shown before the system dialog appears.

**Consequences:** A significant fraction of iOS beta users will permanently deny location and see a broken map with no recovery path in the UI.

**Warning signs:**
- `expo-location` permission request fires on screen mount with no preceding explanation UI
- No "location denied" fallback state in the map screen — just a blank map or crash
- `app.json` is missing `NSLocationWhenInUseUsageDescription` (required on iOS, will cause App Store rejection later)

**Prevention:**
- Show an in-app pre-permission explanation screen or modal before calling the system dialog
- Handle the `denied` case explicitly: show a message with a button that deep-links to `Linking.openSettings()` so users can re-enable
- Add `NSLocationWhenInUseUsageDescription` to `app.json` `ios.infoPlist` immediately, even if it only matters for store submission later — it affects the system dialog text
- For beta: consider making location optional — allow browsing all jobs without location, and show location-filtered results only if permission is granted

**Phase:** Maps/location integration

---

### Pitfall 7: GDPR Consent Not Collected Before Analytics Events Fire

**What goes wrong:** You integrate an analytics SDK (PostHog, Mixpanel, Firebase Analytics). The SDK is initialized in `App.tsx` or the root layout and starts capturing events the moment the app launches — before any consent is collected from the user. Under GDPR Article 6, tracking behavioral data requires either a legitimate interest basis (hard to claim for analytics on a non-essential feature) or explicit consent. Romania's ANSPDCP (supervisory authority) can issue fines. More practically: Romanian app stores (Google Play and Apple App Store) both require you to declare data collection, and Apple will reject apps that collect analytics without a declared privacy manifest.

**Why it happens:** Analytics is added quickly during beta prep. The consent flow feels like friction and gets deferred. The SDK fires events immediately on initialization.

**Consequences:** GDPR violation from day one of beta; App Store rejection risk; user trust damage if beta users discover data collection.

**Warning signs:**
- Analytics SDK initialized unconditionally in the root component or `app.json` config plugin
- No cookie/consent banner exists on the web frontend
- No privacy policy URL is linked anywhere in the app
- `AnalyticsService.track()` is called before any consent check

**Prevention:**
- Defer analytics SDK initialization until after user consent is recorded (either explicit "Accept analytics" or implicit consent via a clear notice — but explicit is safer for Romania)
- On web: implement a cookie consent banner that blocks analytics until accepted; store the decision in localStorage
- On mobile: show a one-time consent screen during onboarding; store the decision in `AsyncStorage` or `expo-secure-store`; initialize the analytics SDK only if consent is `true`
- Write and publish a minimal privacy policy before beta launch — it needs to list what you collect, why, and who has access. It can be a single-page document on a Vercel route
- For beta scope: consider using analytics with no PII (PostHog with `person_profiles: 'never'`) and relying on the "legitimate interest" basis for aggregate product analytics — consult a GDPR advisor before public launch

**Phase:** Analytics integration

---

### Pitfall 8: Stripe Test Mode Keys in Production Environment

**What goes wrong:** During development all Stripe keys are test keys (`sk_test_...`, `pk_test_...`). When you prepare for beta, someone updates the Render environment variable to the live secret key but forgets the frontend's `VITE_STRIPE_PUBLIC_KEY` still points to the test publishable key. Stripe throws a mismatch error: "The client secret does not match the publishable key." Alternatively, the opposite happens: test keys ship to production and real users (if any) cannot complete payments.

**Why it happens:** Stripe has two separate keys per environment (test and live), and they exist in multiple places: backend env var (Render), frontend env var (Vercel), mobile env var (EAS `eas.json`). The `WebhookSecret` is also environment-specific because test webhooks go through Stripe CLI's local listener, not the production webhook endpoint.

**Consequences:** Payment flow completely broken at beta launch. The webhook endpoint signature validation will also fail if the WebhookSecret is mismatched.

**Warning signs:**
- Stripe error `No such payment_intent` in logs (test PaymentIntent ID used against live API)
- `VITE_STRIPE_PUBLIC_KEY` starts with `pk_test_` in Vercel production deployment settings
- `Stripe:WebhookSecret` in Render doesn't match the webhook endpoint's signing secret in the Stripe dashboard

**Prevention:**
- Create a per-environment checklist for Stripe key rotation: backend (Render), frontend (Vercel), mobile (`eas.json` production profile), webhook endpoint
- The HandyLink project notes "Real transactions in beta — functional demo only, not expecting live money flow" — stay on test mode keys for the full beta to avoid this risk
- If you do switch to live mode later: do it atomically — update all four locations in the same deployment window and test end-to-end immediately

**Phase:** Beta launch preparation

---

### Pitfall 9: Expo Push Tokens Registered Against Test Environment, Invalid in Production

**What goes wrong:** During development, users register their Expo push tokens against `EXPO_PUBLIC_API_URL=http://localhost:5272`. When the app is rebuilt for beta testing and the API URL changes to Render, the old push tokens in the database are still valid Expo tokens — but the user profiles that hold them were registered in the local dev DB, not the production DB. Production users who install the beta build register new tokens against production correctly, but any tester who had the dev build installed may have stale tokens in the `profiles` table if data was not wiped between environments.

**Why it happens:** The dev environment and production environment share the same Supabase project, or the production DB was seeded from dev data. Token registration on app launch silently overwrites the old value, so this self-heals once users open the app — but the window between deploy and first open means push notifications fail for existing testers.

**Warning signs:**
- Push notification delivery failures in backend logs for tokens registered before the production deploy
- `ExpoPushToken` in the database contains tokens from a different build version (Expo tokens encode the app slug and experience)
- The error from Expo Push API: `DeviceNotRegistered` or `InvalidCredentials`

**Prevention:**
- The existing `PUT /api/users/me` endpoint updates the push token on each app launch — ensure this runs early in the app lifecycle (`_layout.tsx`) so tokens are refreshed before any notification arrives
- Handle `DeviceNotRegistered` errors from the Expo Push API by clearing the stale token from the profile rather than retrying
- Use a separate Supabase project or schema for dev/staging vs production — currently the project uses one Supabase project for everything, which increases this risk

**Phase:** Beta launch preparation

---

### Pitfall 10: AllowAll CORS Stays in Production

**What goes wrong:** The CORS policy is currently `AllowAll` (`any origin/method/header`). This is documented and intentional for development. If it ships to production without being locked down, any website in the world can make authenticated requests to the HandyLink API using a logged-in user's browser session. This is not just a theoretical risk: a malicious site can iframe a Google OAuth flow, obtain a token, and call the HandyLink API — all from the user's browser.

**Why it happens:** Tightening CORS is on the "security" list but gets deprioritized because "it works fine open." The only environments that matter are the ones users are using right now, which are also the only environments where the permissive policy is active.

**Consequences:** Cross-origin request forgery surface area on an API that holds payment-related data (Stripe Connect IDs, bid acceptance endpoints). Medium severity for a friends-and-family beta; high severity before any public launch.

**Warning signs:**
- `Program.cs` CORS policy still contains `AllowAnyOrigin()`, `AllowAnyMethod()`, `AllowAnyHeader()`
- No explicit allowed origins list exists in `appsettings.json` or environment config
- The Render environment variables have no `AllowedOrigins` setting

**Prevention:**
- Replace `AllowAll` with a named policy that reads allowed origins from configuration: `builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()`
- Set `AllowedOrigins` in Render to `https://handylink.vercel.app` for production
- Keep a separate `AllowAll` policy active only in `Development` environment
- This is documented in CONCERNS.md and ARCHITECTURE.md as a known item — treat it as a pre-beta-launch blocker, not a nice-to-have

**Phase:** Security hardening

---

### Pitfall 11: Rate Limiting Absence on Auth Endpoints Enables Credential Stuffing

**What goes wrong:** No rate limiting exists on any endpoint. The Supabase Auth endpoints have their own built-in rate limiting (configurable in the dashboard), but the HandyLink API's own endpoints — especially `POST /api/bids` (bid flooding) and any future `POST /api/auth/*` proxy routes — are wide open. A single user can submit 1,000 bids programmatically against every open job in the system.

**Why it happens:** Rate limiting is infrastructure-level work that doesn't produce visible user-facing features, so it keeps getting deferred.

**Consequences:** Spam bids pollute the marketplace at beta. Bid flooding by one worker makes it appear that many workers are interested in a job, manipulating a client's perception. On auth endpoints: credential stuffing attacks enumerate valid accounts.

**Warning signs:**
- No `AspNetCoreRateLimit` or `dotnet-ratelimiter` package in the backend `.csproj`
- The Supabase dashboard > Auth > Rate Limits shows default values (300/hour for email sign-ups) — likely sufficient for beta but worth verifying
- `POST /api/bids` has no per-user call frequency check

**Prevention:**
- For beta: implement ASP.NET Core's built-in `RateLimiter` middleware (added in .NET 7, available in .NET 10) with a sliding window policy of ~10 requests/minute per user on bid submission
- Apply a stricter policy on any auth-adjacent endpoints
- The existing `[Authorize]` on bid endpoints means only authenticated users can flood bids — the attack surface is smaller, but a compromised or malicious beta user could still abuse it

**Phase:** Security hardening

---

### Pitfall 12: Swagger Exposed in Production Leaks Full API Contract

**What goes wrong:** `UseSwagger()` and `UseSwaggerUI()` are called unconditionally in `Program.cs`. Any person who visits `https://[render-app].onrender.com/swagger` can see the complete API contract, all route parameters, request/response shapes, and enum values. This is documented in CONCERNS.md as a medium concern.

**Why it happens:** The environment guard was applied to the DataSeeder but forgotten for Swagger (a common oversight when copy-pasting the Swagger setup from boilerplate).

**Consequences:** Exposes the full attack surface of the API. Easier for someone to craft malicious requests or discover undocumented behavior. Low risk for a private beta; unacceptable before public launch.

**Warning signs:**
- `https://[production-url]/swagger` returns HTTP 200 and a visible UI
- `Program.cs` has no `if (app.Environment.IsDevelopment())` guard around the Swagger calls

**Prevention:**
- Wrap both `app.UseSwagger()` and `app.UseSwaggerUI()` in `if (app.Environment.IsDevelopment() || app.Environment.IsStaging())`
- This is a five-minute fix — do it in the same commit as CORS hardening
- Already tracked in CONCERNS.md

**Phase:** Security hardening

---

## Minor Pitfalls

### Pitfall 13: Deep Links on Android Break After Expo Build Upgrade

**What goes wrong:** Push notification tap deep links are hardcoded as URL strings (`/(client)/job-detail`, `/(worker)/my-bids`). These work in Expo Go but may fail in a standalone EAS build if the deep link scheme is not configured in `app.json`. Android additionally requires an intent filter in `AndroidManifest.xml`, which Expo normally generates from `app.json` — but only if the scheme is set.

**Warning signs:**
- Tapping a push notification on a physical Android device opens the app but lands on the home screen rather than the target route
- `app.json` has no `scheme` field or it doesn't match the URI scheme used in notification data

**Prevention:**
- Ensure `app.json` has `"scheme": "com.handylink.app"` set
- Test notification deep-link routing on a physical device with a standalone EAS development build, not just in Expo Go
- The existing deep-link routing in `SendPushNotificationHandler` uses screen path strings — ensure these match the Expo Router file-based route paths exactly (they are case-sensitive on iOS)

**Phase:** Beta launch preparation

---

### Pitfall 14: Concurrent Review Submissions Corrupt Worker Average Rating

**What goes wrong:** `CreateReviewHandler` computes the new `AverageRating` in application code using the pattern `(existingAvg * count + newRating) / newCount`. Under concurrent submissions for the same worker (unlikely in beta, but possible), two handlers read the same `AverageRating`, both increment independently, and the last write wins — discarding one review's contribution to the average. This is documented in CONCERNS.md.

**Warning signs:**
- `AverageRating` on a `WorkerProfile` does not match the mathematical average of the rows in the `reviews` table
- No `SELECT FOR UPDATE` or optimistic concurrency token on the `worker_profiles` row in the review handler

**Prevention:**
- Replace the in-handler calculation with a DB-level aggregate: `UPDATE worker_profiles SET average_rating = (SELECT AVG(rating) FROM reviews WHERE worker_id = $1) WHERE id = $1`
- Or use a PostgreSQL trigger on the `reviews` table to keep `average_rating` up to date — consistent with the project's SQL-script migration approach
- For beta scale (tens of users) this is unlikely to cause observable problems, but fix it before the rating data becomes meaningful

**Phase:** Beta polish / bug fixes

---

### Pitfall 15: Content Moderation Absence Enables Spam Job Listings That Erode Trust

**What goes wrong:** Without any moderation, a single bad actor can post dozens of fake job listings ("Need electrician urgently — pay upfront via bank transfer") that attract legitimate workers who waste time bidding on fraudulent work. At beta scale with friends and family this is very unlikely — but the moment you share the app link publicly (even just on social media), it will happen within days.

**Why it happens:** Moderation feels like a post-launch problem. It isn't — trust is the core value proposition of the marketplace and a single spam incident at beta permanently damages it in the minds of early adopters.

**Warning signs:**
- No report/flag mechanism exists on job listings or user profiles
- No admin panel exists to delete listings or suspend accounts
- Job descriptions have no profanity filter or spam pattern detection

**Prevention:**
- For beta minimum: build an admin-only endpoint `DELETE /api/jobs/{id}` (behind a hardcoded admin user check or a simple `[Authorize(Roles = "admin")]`) that allows the founder to remove listings without touching the database directly
- Add a "Report this listing" button that creates a notification or sends an email to the founder — does not require an automated system
- Supabase RLS already prevents workers from modifying other users' jobs — the attack surface is limited to the posting user's own listings
- Consider requiring email verification (Supabase supports this) before a user can post a job — this adds meaningful friction against throwaway accounts

**Phase:** Beta launch preparation / content moderation

---

### Pitfall 16: Currency Mismatch Between Stripe USD and Displayed RON

**What goes wrong:** `CreatePaymentIntentHandler` hardcodes `Currency = "usd"`. The frontend and mobile display prices as "RON." Stripe charges in USD; the user is quoted RON. At beta with no real transactions this is invisible — but the moment a real user pays, they will be charged in USD (converted by their bank) while the displayed price was in RON. At current exchange rates (~4.7 RON/USD) the amounts will be dramatically different. This is documented in CONCERNS.md.

**Warning signs:**
- Payment confirmation screen shows a RON amount but the Stripe dashboard records the charge in USD
- No `currency` field exists on the `jobs` table or as a config value

**Prevention:**
- Change `Currency = "usd"` to `Currency = "ron"` — Stripe supports RON (ISO 4217: `ron`)
- Verify that the Stripe account supports RON charges (requires a Stripe account registered in Romania or the EU)
- For beta with no real transactions: fix the display label to say "USD" if keeping USD, or fix the currency to RON — whichever is correct
- Move the currency to `appsettings.json` so it can be changed without a code deploy

**Phase:** Security hardening / beta polish

---

## Phase-Specific Warnings

| Phase Topic | Most Likely Pitfall | Mitigation |
|---|---|---|
| Browse-without-login refactoring | PII exposed via new `[AllowAnonymous]` endpoints (Pitfall 1) | Create dedicated public DTOs; audit every field before shipping |
| Social login (Supabase OAuth) | Redirect URI mismatch breaks the flow before any user logs in (Pitfall 3) | Populate all redirect URLs in Google Console + Supabase dashboard before first test |
| Social login (Supabase OAuth) | Role assignment skipped for OAuth users — auth loop (Pitfall 4) | Add "choose your role" post-OAuth screen as a required step |
| Social login (Supabase OAuth) | Duplicate accounts for existing users (Pitfall 2) | Enable Supabase identity linking or surface a "sign in with password instead" prompt |
| Maps integration | Android marker performance on mid-range devices (Pitfall 5) | Set `tracksViewChanges={false}`, cluster markers, test on physical device |
| Maps integration | iOS location permission denied permanently (Pitfall 6) | Pre-permission explanation screen; graceful `denied` fallback; `app.json` description key |
| Analytics | GDPR consent not collected before events fire (Pitfall 7) | Consent gate before SDK init; privacy policy published before beta launch |
| Security hardening | AllowAll CORS ships to production (Pitfall 10) | Treat as pre-beta-launch blocker; lock down to Vercel origin before any public URL sharing |
| Security hardening | Swagger in production (Pitfall 12) | Five-minute fix; do it alongside CORS hardening |
| Beta launch | Stripe test vs live key mismatch (Pitfall 8) | Stay on test keys for all of beta; create a deployment checklist for key rotation |
| Beta launch | Expo push tokens stale after deploy (Pitfall 9) | Token refresh on every app open in `_layout.tsx` |
| Beta launch | Deep link routing broken on Android standalone build (Pitfall 13) | Test on physical device with EAS dev build before launch |
| Content moderation | Fake job listings erode trust at first public share (Pitfall 15) | Admin delete endpoint + report button minimum before sharing any public link |

---

## Sources

- Codebase analysis: `.planning/codebase/CONCERNS.md` (HIGH confidence — direct code analysis)
- Project context: `.planning/PROJECT.md` (HIGH confidence)
- Integration context: `.planning/codebase/INTEGRATIONS.md` (HIGH confidence)
- Supabase OAuth identity linking behavior: MEDIUM confidence (training knowledge, Supabase Auth docs as of 2024-2025)
- React Native maps performance characteristics: MEDIUM confidence (training knowledge, react-native-maps GitHub issues and community reports)
- GDPR analytics requirements: MEDIUM confidence (training knowledge, EU GDPR Articles 6 and 7; Romanian ANSPDCP enforcement known from training data)
- Stripe currency and key management: HIGH confidence (Stripe documentation is stable; RON is a supported currency)
- Expo push token and deep link behavior: MEDIUM confidence (training knowledge, Expo documentation patterns)
