# Milestone: Beta Polish — Project Summary

**Generated:** 2026-04-06
**Milestone Status:** In Progress (5/8 phases complete)
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

**HandyLink** is a two-sided marketplace for manual tradespeople (electricians, plumbers, painters, etc.) and the clients who need them, targeting the Romanian market first. Clients post jobs; workers bid on them. A review-based trust system separates quality workers from the rest.

**Core Value:** A client can find a trusted local tradesperson and a worker can find their next job — without friction, without guesswork.

**Market thesis:** AI will drive demand for skilled manual workers who cannot be automated. HandyLink positions early in Romania where digital booking for tradespeople is still fragmented.

**Users:** Two roles — `client` (posts jobs) and `worker` (bids on them). A user can hold both roles.

**Milestone Goal:** A functional, polished demo for friends and family in Romania — core flow works end-to-end, anonymous browsing is safe and friction-free, the app looks trustworthy, and basic operational visibility is in place.

**Foundation (v1.0 Core Platform, shipped 2026-03-29):**
Phases 1–7 delivered the full-stack backbone: job posting, bidding, worker profiles, Supabase auth, push notifications, React web frontend, React Native mobile app, and Stripe Connect payments with 10% platform fee. The Beta Polish milestone (Phases 8–15, in progress) is hardening, polishing, and expanding that foundation for a real-world demo.

---

## 2. Architecture & Technical Decisions

### Tech Stack
- **Backend:** ASP.NET Core 10 Web API (C#), PostgreSQL via EF Core, Supabase Auth (JWT HS256)
- **Frontend:** React 19 + Vite + Tailwind CSS 4 + React Query + React Router 7
- **Mobile:** React Native 0.83 + Expo 55 + Expo Router (file-based routing, TypeScript)
- **Database:** Supabase PostgreSQL — schema changes via SQL scripts, never EF migrations
- **Payments:** Stripe Connect (marketplace model, 10% platform fee, worker onboarding)
- **Auth:** Supabase JWT — Google OAuth added in Phase 12; Facebook deferred
- **CI/CD:** Render (backend), Vercel (frontend), EAS (mobile)

### Architecture Decisions

- **VSA + CQRS via MediatR (Phase 3.5+)**
  - **Why:** Clean separation of feature concerns; avoids service-layer bloat as the codebase grows. Each feature lives in its own folder with Command/Handler/Validator/Response records.
  - **Rule:** No new Service classes after Phase 3.5 — all new backend features go through Handler slices only.

- **Method-level `[AllowAnonymous]` overrides class-level `[Authorize]`**
  - **Phase:** 10 (Browse-First UX)
  - **Why:** Cleanest mechanism in ASP.NET Core; dropped the class-level attribute entirely for clarity. Allows GET endpoints to be public while keeping write endpoints protected without duplicating auth attributes.

- **UpdateJobStatusDto uses `string Status` (not enum)**
  - **Phase:** 8 (Critical Bug Fixes)
  - **Why:** Enables flexible snake_case parsing in the handler (`"in_progress"` → `InProgress`). The handler owns the parsing and transition validation logic.

- **SecurityTestFactory subclasses CustomWebAppFactory for rate limit tests**
  - **Phase:** 9 (Security Hardening)
  - **Why:** Shared factory with `PermitLimit=1000` avoids polluting other test classes with rate-limit exhaustion. Isolation subclass sets `PermitLimit=3` for the 429 test.

- **CORS falls back to `AllowAnyOrigin` when `Cors:AllowedOrigins` is empty**
  - **Phase:** 9 (Security Hardening)
  - **Why:** Preserves zero-config dev setups; production must set `Cors:AllowedOrigins` in environment variables.

- **Auth-on-action UX (public browse, prompt only at gated actions)**
  - **Phase:** 10 (Browse-First UX)
  - **Why:** First impression matters — forcing login before viewing jobs kills conversion. Visitors see live job data immediately; auth prompt appears only when posting a job or submitting a bid.

- **Return URL pattern: `/login?return=<encoded-path>`**
  - **Phase:** 10 (Browse-First UX)
  - **Why:** After auth, users land exactly where they were. Threaded through `ProtectedRoute` → login/register → `navigate(returnTo)`. Mobile uses `returnTo` param in Expo Router.

- **Mobile uses `(public)` route group for anonymous screens**
  - **Phase:** 10 (Browse-First UX)
  - **Why:** Expo Router's route groups allow structural separation without URL changes. App now launches to `/(public)/browse` instead of forcing `/(auth)/login`.

- **`onAuthStateChange` filtered to `SIGNED_IN` event only**
  - **Phase:** 10 (Browse-First UX)
  - **Why:** Prevents double-redirect from initial subscription fire when the listener is registered.

- **Mobile root layout routes by `GET /api/users/me` profile presence, not `user_metadata.role`**
  - **Phase:** 12 (Social Login)
  - **Why:** New OAuth users have no profile row yet — `user_metadata.role` is absent for them. Profile-presence routing handles both new OAuth users (→ `select-role`) and returning users (→ role-based home) with one code path.

- **`SIGNED_IN` event in `onAuthStateChange` is the single routing trigger after OAuth deep-link callback**
  - **Phase:** 12 (Social Login)
  - **Why:** OAuth deep-link fires after the OS browser completes sign-in. `_layout.tsx` handles all post-OAuth routing; login/register screens leave the spinner active on success and delegate routing entirely to the layout.

- **`EnsureUserProfileAsync` upserts profile on first OAuth login**
  - **Phase:** 12 (Social Login)
  - **Why:** Same method handles both new and returning users. If a profile exists (email/password user who OAuth-linked), it is preserved. No duplicate profile creation.

- **Design tokens via CSS custom properties (web) and `design.ts` constants (mobile)**
  - **Phase:** 11 (App Design)
  - **Why:** Single source of truth for colors, typography, and spacing. Enables consistent updates without hunting across component files.

---

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 1–7 | Core Platform | ✅ Complete (v1.0) | Full-stack marketplace: job posting, bidding, auth, payments, web + mobile |
| 8 | Critical Bug Fixes | ✅ Complete | Fixed 4 blocking bugs: bids view, bid rejection, job status advancement, worker DI |
| 9 | Security Hardening | ✅ Complete | PII-safe API, ownership enforcement, Stripe webhook validation, rate limiting, CORS |
| 10 | Browse-First UX | ✅ Complete | Anonymous job/worker browsing on web and mobile, auth-on-action prompt, return URL |
| 11 | App Design | ✅ Complete | Neutral design system (tokens + typography), trust signals on cards, responsive layouts |
| 12 | Social Login | ✅ Complete (AUTH-02 deferred) | Google OAuth on web + mobile, role selection for new users, idempotent profile upsert |
| 13 | Notifications + Mobile Testing | 🔲 Not started | Push notifications for all job events + physical device testing |
| 14 | Maps & Location | 🔲 Not started | Optional job location, map display, worker service area |
| 15 | Analytics + Observability | 🔲 Not started | GDPR-gated analytics, error capture, uptime monitoring |

---

## 4. Requirements Coverage

### Completed
- ✅ **BUG-01** — `GET /api/jobs/{id}/bids` endpoint; clients can view all bids on their jobs (Phase 8)
- ✅ **BUG-02** — `PATCH /api/jobs/{id}/status` with transition validation; full job lifecycle works (Phase 8)
- ✅ **BUG-03** — Worker DI registrations fixed; worker endpoints no longer 500 (Phase 8)
- ✅ **BUG-04** — `PATCH /api/bids/{id}/reject`; clients can reject pending bids (Phase 8)
- ✅ **SEC-01** — No PII (email/phone) in public job/worker API responses; proven by 4 integration tests (Phase 9)
- ✅ **SEC-02** — Non-owners receive 403 on all mutating endpoints; proven by 4 integration tests (Phase 9)
- ✅ **SEC-03** — Invalid Stripe webhook signature → 400 (not 500); tested (Phase 9)
- ✅ **SEC-04** — Rate limiter (20 req/min) on payment create-intent and submit-bid; tested (Phase 9)
- ✅ **SEC-05** — CORS config-driven via `Cors:AllowedOrigins`; tested for allow and deny (Phase 9)
- ✅ **UX-01** — Anonymous visitors see full open jobs list (web + mobile) (Phase 10)
- ✅ **UX-02** — Anonymous visitors can open job detail page (web + mobile) (Phase 10)
- ✅ **UX-03** — Anonymous visitors can browse worker profiles (web + mobile) (Phase 10)
- ✅ **UX-04** — Auth prompt appears only on gated action; return URL restores context (Phase 10)
- ✅ **UX-05** — Landing page shows 6 live open jobs; hero CTAs for browse/post-job (Phase 10)
- ✅ **DSG-01** — Neutral color palette (grays, whites, blue accent) via CSS tokens + mobile constants (Phase 11)
- ✅ **DSG-02** — Typography constants applied consistently across web and mobile (Phase 11)
- ✅ **DSG-03** — JobCard trust signals (rating, review count, job count); bid flow guidance added (Phase 11)
- ✅ **DSG-04** — Mobile layout guardrails; no overflow on phone sizes (Phase 11)
- ✅ **DSG-05** — Web responsive layouts for mobile/tablet/desktop (Phase 11)
- ✅ **AUTH-01** — Google OAuth on web + mobile via Supabase PKCE; new users → role selection (Phase 12)
- ✅ **AUTH-03** — Role selection creates profile + optional worker_profiles row; idempotent (Phase 12)

### Deferred / Not Started
- ⚠️ **AUTH-02** — Facebook OAuth declared in Phase 12 plan but not implemented; deferred to Phase 13
- ❌ **MOB-01–04** — Physical device testing; not yet started (Phase 13)
- ❌ **NOTF-01–03** — Push notification audit for all job events; not yet started (Phase 13)
- ❌ **MAP-01–03** — Maps/location; not yet started (Phase 14)
- ❌ **ANLX-01–03** — Analytics with GDPR consent; not yet started (Phase 15)
- ❌ **OPS-01–04** — Monitoring, backups, dependency cadence, moderation; not yet started (Phase 15)

---

## 5. Key Decisions Log

| ID | Decision | Phase | Rationale |
|----|----------|-------|-----------|
| D-08-1 | `string Status` DTO instead of enum for job status transitions | 8 | Enables flexible snake_case parsing in handler |
| D-08-2 | Custom `ValidationException` (not FluentValidation's) for transition errors | 8 | Consistent with existing codebase pattern across all handlers |
| D-09-1 | No production code changes needed for ownership enforcement | 9 | Research confirmed existing handlers already throw `ForbiddenException` — tests prove, not fix |
| D-09-2 | Webhook endpoint excluded from rate limiting | 9 | Stripe IP pool would be throttled otherwise |
| D-09-3 | CORS fallback to `AllowAnyOrigin` when config is empty | 9 | Preserves zero-config dev setups; production must set env var |
| D-10-1 | Drop class-level `[Authorize]`; method-level `[AllowAnonymous]` on GET actions | 10 | Cleanest mechanism; no attribute duplication |
| D-10-2 | `NotificationBell` suppressed for anonymous users | 10 | Prevents 401 → axiosClient redirect interceptor → infinite loop |
| D-10-3 | Mobile app launches to `/(public)/browse` instead of `/(auth)/login` | 10 | Anonymous-first entry; auth only on gated action |
| D-10-4 | `onAuthStateChange` checks `event === 'SIGNED_OUT'` (not all events) | 10 | Prevents double-redirect from initial subscription fire |
| D-11-1 | CSS custom properties for web tokens; `design.ts` for mobile | 11 | Single source of truth; consistent updates without hunting files |
| D-12-1 | `EnsureUserProfileAsync` is idempotent; upserts on first OAuth login | 12 | Handles new and returning users in one code path; no duplicate profiles |
| D-12-2 | `POST /api/users/me/role` is single source of truth for role assignment | 12 | Decouples role assignment from OAuth provider metadata |
| D-12-3 | Mobile root layout routes by `GET /api/users/me` presence, not `user_metadata.role` | 12 | OAuth users have no `user_metadata.role` before profile creation |
| D-12-4 | `SIGNED_IN` event is the single routing trigger post-OAuth deep-link | 12 | Avoids duplicate navigation from login/register screen handlers |

---

## 6. Tech Debt & Deferred Items

### Known Tech Debt

- **Currency mismatch:** `CreatePaymentIntentHandler` hardcodes USD. Must be changed to RON before any real transaction. Affects Phase 7 code.
- **Legacy Service classes:** `BidService`, `JobService`, `ReviewService`, `WorkerService` from Phase 3 coexist with VSA handlers. Some logic is duplicated. Not blocking beta — resolve before scaling.
- **AUTH-02 (Facebook OAuth):** Declared as in-scope in Phase 12 plan but not implemented. Deferred to Phase 13. No `signInWithFacebook` helper exists anywhere.
- **Mobile TypeScript errors (pre-existing):** 14 TypeScript errors exist in unrelated files (`@expo/vector-icons` type declarations missing, profile property access on `{}`, notifications behavior type mismatch). None were introduced by Beta Polish phases.
- **E2E tests require running web server:** `e2e/tests/mobile-layout.spec.ts` cannot run in CI without a web server; timed out. Playwright mobile layout tests are written but not integrated into CI.

### Active Blockers / Concerns

- `expo-auth-session` version compatibility with Expo 55 — unverified; resolve with `npx expo install` during Phase 13 planning.
- `react-native-maps` Expo 55 compatibility — unverified; physical Android device test mandatory before Phase 14 sign-off.
- PostHog mobile consent flow implementation — needs verification against current PostHog docs for Phase 15.

### Human Verification Pending

Phase 12 (Social Login) requires human verification before full sign-off:
1. **Web Google OAuth end-to-end** — requires live Supabase project with Google provider enabled and a real Google account.
2. **Mobile Google OAuth end-to-end** — requires physical device/simulator with Expo deep-link handling.
3. **Account linking (same email, Google + existing password)** — cannot be replicated with in-memory test DB; requires live environment.

---

## 7. Getting Started

### Run the Project

```bash
# Backend (from backend/)
dotnet run --project HandyLink.API       # API at http://localhost:5272

# Frontend (from frontend/)
npm run dev                               # Web at http://localhost:5173

# Mobile (from mobile/)
npx expo start                           # Expo Go / simulator
```

### Run Tests

```bash
# All backend tests (from backend/)
dotnet test

# Single test filter
dotnet test --filter "FullyQualifiedName~SomeTest"

# Frontend tests (from frontend/)
npx vitest

# E2E (from e2e/ — requires web server running)
npx playwright test
```

### Key Directories

```
backend/HandyLink.API/Features/       ← VSA feature slices (one folder per domain/action)
backend/HandyLink.API/Controllers/    ← Thin controllers; only _mediator.Send()
backend/HandyLink.Tests/              ← Unit + integration tests
frontend/src/pages/                   ← React pages (PascalCase + Page suffix)
frontend/src/components/              ← Shared components (JobCard, NavBar, AuthPromptModal)
mobile/app/(public)/                  ← Anonymous browsing screens
mobile/app/(client)/                  ← Authenticated client screens
mobile/app/(worker)/                  ← Authenticated worker screens
mobile/app/(auth)/                    ← Login, register, select-role
.planning/phases/                     ← GSD planning artifacts per phase
```

### Where to Look First

- **Adding a new backend feature:** Create a VSA slice in `backend/HandyLink.API/Features/{Domain}/{Action}/`. Four files: `{Action}Command.cs`, `{Action}Handler.cs`, `{Action}Validator.cs`, `{Action}Response.cs`. Wire into the relevant controller with `_mediator.Send()`.
- **Core job lifecycle:** `backend/HandyLink.API/Features/Jobs/` and `backend/HandyLink.API/Features/Bids/`
- **Auth flow (web):** `frontend/src/context/AuthContext.jsx` → `AuthCallbackPage.jsx` → `RoleSelectPage.jsx`
- **Auth flow (mobile):** `mobile/app/_layout.tsx` (routing logic) → `mobile/app/(auth)/`
- **Design tokens:** `frontend/src/App.css` (CSS custom properties) and `mobile/app/constants/design.ts`

### Configuration Keys Required

| Key | Where | Purpose |
|-----|-------|---------|
| `ConnectionStrings:DefaultConnection` | User secrets / env | PostgreSQL connection |
| `Supabase:JwtSecret` | User secrets / env | JWT validation (required at startup) |
| `Supabase:Url` | User secrets / env | JWT issuer construction |
| `Stripe:SecretKey` | User secrets / env | Stripe API calls |
| `Stripe:WebhookSecret` | User secrets / env | Webhook signature validation |
| `Cors:AllowedOrigins` | appsettings / env | Production frontend URL(s) |
| `VITE_SUPABASE_URL` | `.env` | Web Supabase client |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Mobile Supabase client |

---

## Stats

- **Milestone:** Beta Polish (Phases 8–15)
- **Timeline:** 2026-03-29 → ongoing (as of 2026-04-06)
- **Phases complete:** 5 / 8 (phases 8, 9, 10, 11, 12)
- **v1 Requirements met:** 21 / 37 (57%)
- **Commits (since milestone start):** ~60
- **Contributors:** Nemeth Zoltan
- **Backend tests (current):** 96 passing

---

*Summary generated: 2026-04-06*
*Source artifacts: ROADMAP.md, REQUIREMENTS.md, PROJECT.md, STATE.md, phases 08–12 SUMMARY + VERIFICATION + CONTEXT files*
