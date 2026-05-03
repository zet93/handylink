# External Integrations
_Last updated: 2026-03-29_

## Summary
HandyLink integrates with Supabase for auth and database hosting, Stripe for payments and worker payouts via Connect, and Expo Push Notification Service for mobile notifications. All credentials flow through environment variables; no secrets are hardcoded.

## Authentication & Identity

**Provider:** Supabase Auth

- JWT algorithm: HS256, signed by Supabase
- Backend validates tokens in `backend/HandyLink.API/Program.cs`:
  - Issuer: `{Supabase:Url}/auth/v1`
  - Audience: `authenticated`
  - `ClockSkew: TimeSpan.Zero`
- Frontend client: `frontend/src/lib/supabase.js` — `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
- Mobile client: `mobile/services/supabase.ts` — uses `expo-secure-store` adapter for session persistence, PKCE flow
- Auth tokens injected into all API requests via Axios interceptors:
  - Frontend: `frontend/src/api/axiosClient.js`
  - Mobile: `mobile/services/api.ts`
- Frontend redirects to `/login` on 401 responses (via Axios response interceptor)

**Required config:**
- Backend: `Supabase:JwtSecret`, `Supabase:Url`
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Mobile: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Data Storage

**Database:** Supabase PostgreSQL

- Managed connection via EF Core + Npgsql in `backend/HandyLink.Infrastructure/`
- DbContext: `backend/HandyLink.Infrastructure/Data/HandyLinkDbContext.cs`
- PostgreSQL enums mapped: `job_category` → `JobCategory`, `job_status` → `JobStatus` (schema: `public`)
- Schema changes use SQL scripts in `Data/Migrations/` applied via Supabase SQL editor — EF migrations are not used
- Connection config: `ConnectionStrings:DefaultConnection`

**File Storage:** None detected — no S3, GCS, or Supabase Storage integration present.

**Caching:** None — no Redis or in-memory cache layer detected.

## Payment Processing

**Provider:** Stripe

**Backend integration (`backend/HandyLink.API/Features/Payments/`):**
- `CreatePaymentIntent/` — creates a PaymentIntent for a job; endpoint `POST /api/payments/create-intent`
- `HandleStripeWebhook/` — processes Stripe webhook events; endpoint `POST /api/payments/webhook` (anonymous, validated via `Stripe-Signature` header)
- `WorkerConnectOnboard/` — creates Stripe Connect onboarding link for workers; endpoint `POST /api/payments/connect-onboard`
- SDK: `Stripe.net` 50.4.1, initialized via `Stripe.StripeConfiguration.ApiKey` in `Program.cs`

**Frontend integration:**
- SDK: `@stripe/react-stripe-js` 5.6.1 + `@stripe/stripe-js` 8.9.0
- Payment UI: `frontend/src/components/PaymentForm.jsx`
- Config: `VITE_STRIPE_PUBLIC_KEY`

**Mobile integration:**
- SDK: `@stripe/stripe-react-native` 0.58.0

**Required config:**
- Backend: `Stripe:SecretKey`, `Stripe:WebhookSecret`
- Frontend: `VITE_STRIPE_PUBLIC_KEY`

**Incoming webhooks:**
- Endpoint: `POST /api/payments/webhook`
- Verified via `Stripe-Signature` header against `Stripe:WebhookSecret`

## Push Notifications

**Provider:** Expo Push Notification Service

- Backend sends notifications via HTTP POST to `https://exp.host/--/api/v2/push/send`
- Handler: `backend/HandyLink.API/Features/Notifications/SendPushNotification/SendPushNotificationHandler.cs`
- Uses `IHttpClientFactory` — no SDK, raw JSON payload
- Mobile registers for push tokens via `expo-notifications` in `mobile/services/notifications.ts`
- Push token stored on user profile (`Profile.ExpoPushToken`), updated via `PUT /api/users/me`
- Deep-link routing on notification tap: `bid_received` → `/(client)/job-detail`, `bid_accepted`/`bid_rejected` → `/(worker)/my-bids`
- No auth or API key required for Expo push endpoint

## CI/CD & Deployment

**Backend:**
- CI: GitHub Actions `.github/workflows/backend-ci.yml`
  - Runs on push/PR to `main`/`development` for `backend/**` changes
  - Steps: restore → build (Release) → unit tests (excludes `Category=Integration`) → upload TRX results
  - Deploy: triggers Render deploy hook on merge to `main` via `RENDER_DEPLOY_HOOK_URL` secret
- Hosting: Render

**Frontend:**
- CI: GitHub Actions `.github/workflows/frontend-ci.yml`
  - Runs on push/PR to `main`/`development` for `frontend/**` changes
  - Steps: install → test → build check
  - Build injects: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLIC_KEY`
- Hosting: Vercel with SPA rewrite (`frontend/vercel.json`)

**Mobile:**
- CI: GitHub Actions `.github/workflows/mobile-ci.yml`
  - Runs on push to `main` for `mobile/**` changes
  - Steps: install (`--legacy-peer-deps`) → TypeScript check only (no EAS build in CI)
- Hosting: EAS (Expo Application Services), bundle ID `com.handylink.app`

## Monitoring & Observability

**Error Tracking:** None detected — no Sentry, Datadog, or similar SDK present.

**Logs:**
- Backend: ASP.NET Core built-in `ILogger<T>` at `Information` level by default; `Microsoft.AspNetCore` at `Warning`
- Unhandled exceptions caught and logged by `backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs`
- Push notification failures logged at `Warning`/`Error` level but are non-fatal

**Health Check:**
- Endpoint: `GET /health` → 200 OK (registered in `Program.cs`)

## Environment Configuration Summary

| Variable | Where Used | Purpose |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | Backend | PostgreSQL connection |
| `Supabase:JwtSecret` | Backend | JWT signature validation |
| `Supabase:Url` | Backend | JWT issuer construction |
| `Stripe:SecretKey` | Backend | Stripe API calls |
| `Stripe:WebhookSecret` | Backend | Webhook signature verification |
| `VITE_API_URL` | Frontend | Axios base URL |
| `VITE_SUPABASE_URL` | Frontend | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase client |
| `VITE_STRIPE_PUBLIC_KEY` | Frontend | Stripe Elements |
| `EXPO_PUBLIC_API_URL` | Mobile | Axios base URL |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Supabase client |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Supabase client |
| `RENDER_DEPLOY_HOOK_URL` | GitHub Actions | Backend deploy trigger |

---

*Integration audit: 2026-03-29*
