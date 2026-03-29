# Architecture Patterns — Beta Polish Milestone

**Project:** HandyLink
**Researched:** 2026-03-29
**Scope:** How five target integrations fit the existing VSA+CQRS architecture

---

## Existing Architecture Snapshot

```
Request
  → GlobalExceptionMiddleware
  → CORS
  → Authentication (JWT HS256, Supabase)
  → Authorization ([Authorize] attribute)
  → Controller.Action()
      → mediator.Send(Command/Query)
          → ValidationBehaviour<TRequest,TResponse>
          → Handler.Handle()
          → HandyLinkDbContext → PostgreSQL (Supabase)
```

**Key invariants to preserve:**
- User identity always from `GetUserId()` → JWT `sub` claim; never from request body
- All new backend features: four-file slice in `Features/{Domain}/{Action}/`
- No new Service classes
- Schema changes via SQL scripts only, never EF migrations

---

## Integration 1: Supabase OAuth (Google / Facebook)

### How it fits

OAuth via Supabase is entirely a **frontend/mobile concern**. The backend requires zero changes.

Supabase handles the OAuth dance (redirect to Google/Facebook, receive callback, issue session) and returns an `access_token` JWT with the same structure as email/password login — same `sub` claim, same HS256 signature, same `authenticated` audience. The JWT Bearer middleware in `Program.cs` will accept it as-is.

**The one gap:** Social login does not automatically insert a row into the `profiles` table. The current `signUp` function in `AuthContext.jsx` inserts the profile explicitly after `supabase.auth.signUp()`. Social login bypasses that code path.

### Data flow

```
Web/Mobile
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Supabase OAuth redirect → Google → callback → Supabase issues JWT
  → onAuthStateChange fires with session
  → Check if profiles row exists for session.user.id
  → If missing: INSERT into profiles (and worker_profiles if role = worker)
  → Continue — backend receives same JWT as always
```

### Required changes

| Layer | Change | Where |
|-------|--------|-------|
| Frontend | Add `signInWithOAuth` method to `AuthContext` | `frontend/src/context/AuthContext.jsx` |
| Frontend | In `onAuthStateChange` handler: after session arrives, check `profiles` row; insert if absent | `AuthContext.jsx` |
| Mobile | Same OAuth trigger + profile-creation logic | `mobile/services/supabase.ts` + `_layout.tsx` |
| Mobile | Deep link / redirect URI config for Expo | `app.json` + Supabase dashboard |
| Backend | **None** | — |

### Build order

1. Configure OAuth provider in Supabase dashboard
2. Add redirect URI for web (`localhost:5173` + production Vercel URL) and mobile (`exp://` scheme + EAS URL)
3. Add `signInWithOAuth` + profile-upsert logic in `AuthContext.jsx`
4. Mirror in mobile
5. Test that `profiles` row is present before any authenticated API call

### Pitfall

The `signUp` flow currently inserts the profile row synchronously. OAuth must do the same check inside `onAuthStateChange`, not just on first sign-in — because the user may clear app data and re-authenticate via OAuth. Use `upsert` or check-then-insert, not a plain insert that will fail on conflict.

---

## Integration 2: Maps / Location

### Where location data lives today

The `Job` entity already has `City` (string) and `Country` (string = "RO"). There are no lat/lng coordinates in the schema.

### Required schema additions

Add `latitude` and `longitude` columns to the `jobs` table (nullable floats). Existing jobs without coordinates still render — the map simply omits them or falls back to city text.

```sql
-- Data/Migrations/add_job_coordinates.sql
ALTER TABLE jobs
  ADD COLUMN latitude  DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION;
```

### Data flow

```
Client creates job
  → CreateJobCommand gains optional Latitude, Longitude fields
  → CreateJobHandler persists them to jobs table
  → GetJobsQuery returns lat/lng in JobSummary
  → Frontend/mobile renders pin on map

Worker browses jobs
  → Map component queries GET /api/jobs (existing endpoint, no auth needed after browse-first change)
  → Renders pins from JobSummary.Latitude/Longitude
  → Tap pin → existing job detail flow
```

### VSA fit

Add `Latitude` and `Longitude` to `CreateJobCommand`, `CreateJobHandler`, `CreateJobResponse`, `GetJobsResponse.JobSummary`. These are additive — existing handlers do not break. No new handler is needed for location; it's a field addition to existing slices.

### Library recommendation

**React (web):** `react-leaflet` with OpenStreetMap tiles. No API key required, free, GDPR-friendly for Romanian users. Sufficient for beta. Google Maps requires billing account and exposes API key on client.

**React Native (mobile):** `react-native-maps` with `PROVIDER_DEFAULT` (Apple Maps on iOS, Google Maps on Android) or with `PROVIDER_GOOGLE` if Google Maps API key is acceptable. For beta, use `PROVIDER_DEFAULT` — no extra key management.

**Geocoding (city → lat/lng for existing jobs):** Nominatim (OpenStreetMap geocoding API) is free and does not require a key. Use it on the frontend when the user enters a city during job creation, to pre-fill coordinates before submitting the form.

### Component boundaries

| Component | Responsibility |
|-----------|---------------|
| `CreateJobForm` (web/mobile) | Geocode city input → lat/lng; include in POST body |
| `JobsMapView` (web) | New component; reads `GetJobsResponse`, renders `react-leaflet` map |
| `JobsMapView` (mobile) | New component; reads same data, renders `react-native-maps` |
| `CreateJobCommand` (backend) | Accepts optional `Latitude`, `Longitude` |
| `GetJobsResponse.JobSummary` (backend) | Exposes `Latitude`, `Longitude` |

### Build order

1. SQL migration: add `latitude`, `longitude` to `jobs`
2. Update `CreateJobCommand` + `CreateJobHandler` + `CreateJobResponse`
3. Update `GetJobsResponse.JobSummary` + `GetJobsHandler`
4. Add geocoding in `CreateJobForm` (web), then mobile
5. Add `JobsMapView` to web browse page
6. Add `JobsMapView` to mobile browse screen

---

## Integration 3: Analytics

### Decision: client-side only for beta

Analytics for a beta is about funnel visibility — do users reach the bid screen? Do they drop off at login? Do jobs get posted? All of these are frontend navigation events, not backend state changes. Backend instrumentation (emitting events from Handlers) adds complexity with no additional insight at this scale.

**Recommendation:** PostHog JS SDK (client-side only, self-hostable, GDPR-compliant, free tier). Alternatively, Plausible for simple page-level analytics without session recording.

### What to track (frontend + mobile)

| Event | Trigger | Platform |
|-------|---------|----------|
| `page_view` | Route change | Web (auto) |
| `job_list_viewed` | Jobs browse screen mount | Web + Mobile |
| `job_detail_viewed` | Job detail screen mount | Web + Mobile |
| `bid_started` | User taps "Submit Bid" | Web + Mobile |
| `bid_submitted` | Successful bid API call | Web + Mobile |
| `job_posted` | Successful job creation | Web + Mobile |
| `login_prompted` | Anonymous user hits auth wall | Web + Mobile |
| `signup_completed` | Profile created | Web + Mobile |

### VSA fit — no backend changes

No Handlers, no new Commands. Analytics is a pure cross-cutting concern on the client side. Use a thin `analytics.ts` module that wraps PostHog calls — components call `track('event_name', props)`, the module handles the SDK.

### Data flow

```
User action
  → Component calls analytics.track('event', props)
  → PostHog SDK batches and sends to PostHog ingestion endpoint
  → PostHog dashboard
```

### GDPR note

Romania is EU territory; GDPR applies. PostHog can be configured to anonymize IPs and not set persistent cookies. Add consent notice before initializing the SDK. Do not track PII (no emails, names, or user IDs in event properties).

### Build order

1. Create `frontend/src/lib/analytics.ts` with PostHog initialization + `track` wrapper
2. Initialize in `main.tsx` / root component
3. Add `track` calls at key funnel points (job list, job detail, bid submit, auth wall)
4. Mirror in mobile using `posthog-react-native`

---

## Integration 4: Rate Limiting (ASP.NET Core 10)

### Middleware placement

ASP.NET Core's built-in `Microsoft.AspNetCore.RateLimiting` (available since .NET 7, refined in .NET 8+) is the correct choice. No third-party package needed.

Rate limiting middleware must sit **after CORS and before Authentication** in the pipeline so that CORS preflight requests are not rate-limited and unauthenticated requests to auth endpoints are still limited.

**Corrected pipeline order:**

```
GlobalExceptionMiddleware
  → Swagger
  → CORS
  → RateLimiting          ← insert here
  → Authentication
  → Authorization
  → Controllers
```

### Implementation pattern

In `Program.cs`, add before `builder.Build()`:

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Sliding window: auth endpoints — 10 requests per minute per IP
    options.AddSlidingWindowLimiter("auth", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;
        opt.PermitLimit = 10;
        opt.QueueLimit = 0;
    });

    // Fixed window: bid submission — 5 bids per minute per user
    options.AddFixedWindowLimiter("bids", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 5;
        opt.QueueLimit = 0;
    });

    options.RejectionStatusCode = 429;
});
```

After `app.Build()`, add `app.UseRateLimiter()` before `app.UseAuthentication()`.

Apply to specific endpoints via `[EnableRateLimiting("auth")]` on controller actions or the entire controller class.

### VSA fit

Rate limiting is applied at the controller level via attributes — it does not touch Handlers at all. This is correct for VSA: policy enforcement belongs at the boundary (controller), business logic belongs in the Handler.

### Endpoints to rate-limit

| Endpoint | Policy | Reason |
|----------|--------|--------|
| `POST /api/auth/*` (if any custom auth endpoints exist) | `auth` sliding window | Brute-force protection |
| Supabase Auth (client-side) | Supabase built-in limits | Not on backend |
| `POST /api/bids` | `bids` fixed window | Prevent bid spam |
| `POST /api/jobs` | General fixed window | Prevent job spam |

**Note:** Supabase Auth endpoints (login, signup) are called directly by the client to Supabase — they are not proxied through the ASP.NET API. Rate limiting on those happens at the Supabase layer (configurable in the dashboard). The ASP.NET rate limiter only applies to the HandyLink API itself.

### Build order

1. Add `builder.Services.AddRateLimiter(...)` in `Program.cs`
2. Add `app.UseRateLimiter()` after `app.UseCors()`, before `app.UseAuthentication()`
3. Decorate `BidsController` POST action with `[EnableRateLimiting("bids")]`
4. Decorate any high-risk mutation endpoints
5. Verify 429 response shape is consistent with existing `{ "error": "...", "statusCode": N }` format (extend `GlobalExceptionMiddleware` if needed)

---

## Integration 5: Browse-Without-Login

### Current state

`JobsController` has `[Authorize]` at the class level. Every endpoint — including `GET /api/jobs` and `GET /api/jobs/{id}` — requires a valid JWT. Anonymous users get 401.

### Required backend changes

Add `[AllowAnonymous]` to the read endpoints. Write endpoints (`POST /api/jobs`, `POST /api/bids`) keep `[Authorize]`.

This requires moving `[Authorize]` from the class level to individual write actions, or splitting the controller into read/write controllers.

**Recommended approach — override per-action (minimal diff):**

```csharp
[Route("api/jobs")]
[ApiController]
public class JobsController(IMediator mediator) : BaseController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetJobs(...) ...

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetJobById(...) ...

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateJob(...) ...
}
```

Same pattern for `WorkersController` browse endpoints.

### Handler safety

`GetJobsHandler` and `GetJobByIdHandler` do not call `GetUserId()` — they are already safe for anonymous use. Verify before removing `[Authorize]` from any action that the handler does not read from the JWT.

**Actions that MUST remain authorized** (call `GetUserId()`):
- `POST /api/jobs` — reads `ClientId` from JWT
- `POST /api/bids` — reads `WorkerId` from JWT
- `PATCH /api/jobs/{id}/status` — must verify caller is job owner
- `PATCH /api/bids/{id}/accept` / `reject` — must verify caller is job owner
- `POST /api/payments/*` — must verify caller identity
- `POST /api/reviews` — must verify caller is job participant

### Security constraint: PII protection

`GET /api/workers` and `GET /api/workers/{id}` return `WorkerProfile` data. Profile rows contain `full_name` and potentially contact info. Do not make these endpoints fully anonymous. Options:

- Return a reduced `WorkerSummary` (name, rating, categories, city) for anonymous; full profile only for authenticated
- Keep `[Authorize]` on worker profile endpoints for now; defer public worker browsing to post-beta

For beta: make job listing anonymous, keep worker profiles authenticated. This satisfies the "browse jobs without login" requirement while protecting user data.

### Required frontend / mobile changes

| Layer | Change |
|-------|--------|
| `frontend/src/api/axiosClient.js` | Remove 401 redirect for browse routes; only redirect to login on 401 from mutation calls |
| `AuthContext.jsx` | Expose `isAuthenticated` flag; components check it before showing bid/post actions |
| `JobsController` (backend) | `[AllowAnonymous]` on GET endpoints |
| Mobile `_layout.tsx` | Allow routing to browse screen without session; session only required for bid/post actions |

### Mobile routing change

Currently `_layout.tsx` redirects to `/(auth)/login` when there is no session. For browse-first, it should route unauthenticated users to a public browse screen (e.g., `/(public)/jobs`) and only gate on bid/post actions.

This requires adding a `(public)` route group or making the `(worker)/browse` and `(client)/browse` screens accessible without a role check.

### Build order

1. Remove class-level `[Authorize]` from `JobsController`; add per-action `[Authorize]` on mutations
2. Add `[AllowAnonymous]` to `GET /api/jobs` and `GET /api/jobs/{id}`
3. Verify `GetJobsHandler` and `GetJobByIdHandler` do not call `GetUserId()`
4. Update frontend `axiosClient` 401 handling
5. Add `isAuthenticated` guard to bid/post UI components
6. Update mobile `_layout.tsx` to allow public browse route
7. Add login prompt on mutation attempt for unauthenticated user

---

## Component Boundaries Summary

| Component | Layer | Communicates With | Auth Required |
|-----------|-------|------------------|---------------|
| `JobsController` (GET) | API boundary | `GetJobsHandler`, `GetJobByIdHandler` | No (AllowAnonymous) |
| `JobsController` (POST) | API boundary | `CreateJobHandler` | Yes |
| `BidsController` (POST) | API boundary | `SubmitBidHandler` | Yes |
| `GetJobsHandler` | Feature slice | `HandyLinkDbContext` | — (no JWT read) |
| `CreateJobHandler` | Feature slice | `HandyLinkDbContext` | — (receives ClientId from controller) |
| `AuthContext` (web) | Frontend state | Supabase JS SDK | — |
| `_layout.tsx` (mobile) | Mobile routing | Supabase JS SDK | — |
| `JobsMapView` (web/mobile) | UI component | `GET /api/jobs` response | No |
| `analytics.ts` | Frontend utility | PostHog SDK | No |
| Rate limiter middleware | API pipeline | Per-action policy | — |

---

## Suggested Build Order

This ordering respects dependencies and maximizes testable increments at each step.

1. **Browse-without-login (backend)** — unblocks all other frontend work; single-file change to `JobsController`
2. **Browse-without-login (frontend + mobile)** — update 401 handling, add public browse route in mobile
3. **Rate limiting** — `Program.cs` only; no feature slice needed; add after browse-without-login so GET endpoints are excluded from rate limits
4. **Supabase OAuth** — frontend-only after backend is confirmed unblocked; depends on public browse being testable
5. **Maps** — requires SQL migration + two backend field additions + new UI components; build after auth flow is stable
6. **Analytics** — last; wraps existing user flows; zero backend risk; easiest to add after all other flows are working

---

## Architecture Confidence

| Area | Confidence | Basis |
|------|------------|-------|
| Browse-without-login | HIGH | Direct code inspection of `JobsController`, `GetJobsHandler`; `[AllowAnonymous]` is a known ASP.NET Core attribute |
| Rate limiting | HIGH | Built-in `Microsoft.AspNetCore.RateLimiting` confirmed present since .NET 7; pipeline insertion point is deterministic |
| Supabase OAuth JWT compatibility | HIGH | Supabase OAuth issues same JWT structure as email/password; no backend change required |
| OAuth profile-upsert gap | HIGH | Direct inspection of `AuthContext.jsx` confirms `signUp` inserts profile; `onAuthStateChange` does not |
| Maps — field additions | HIGH | Direct inspection of `Job.cs` confirms `City`/`Country` present, no coordinates |
| Maps — library choice (Leaflet/react-native-maps) | MEDIUM | Based on known library landscape as of training cutoff; verify current Expo SDK compatibility before installing |
| Analytics — PostHog | MEDIUM | PostHog is well-established; GDPR configuration details should be verified against current PostHog docs |

---

_Architecture analysis: 2026-03-29_
