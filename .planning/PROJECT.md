# HandyLink

## What This Is

HandyLink is a two-sided marketplace for manual tradespeople (electricians, plumbers, painters, etc.) and the clients who need them, targeting the Romanian market. Clients post jobs and workers bid on them — a review-based trust system separates quality workers from the rest. Built on the insight that AI will drive a surge in demand for manual labor that can't be automated.

## Core Value

A client can find a trusted local tradesperson and a worker can find their next job — without friction, without guesswork.

## Requirements

### Validated

- ✓ Job posting with categories and lifecycle (Open → Bidding → Accepted → InProgress → Completed) — Phase 3
- ✓ Worker bidding system with bid accept/reject — Phase 3
- ✓ Worker profiles with categories, ratings, and reviews — Phase 3
- ✓ Supabase auth with email/password login — Phase 3
- ✓ Stripe Connect payments with 10% platform fee and worker onboarding — Phase 7
- ✓ Push notifications via Expo Push API — Phase 5
- ✓ React/Vite web frontend with job browsing and management — Phase 4
- ✓ React Native/Expo mobile app with role-based navigation — Phase 6
- ✓ CI/CD pipeline (Render backend, Vercel frontend) — Phase 9
- ✓ Password gate for private beta access — Phase 8
- ✓ Google social login (web + mobile) with role selection for new users — Phase 12 (AUTH-01, AUTH-03; AUTH-02 Facebook deferred to Phase 13)

### Active

**Beta Polish — Critical bugs (app is broken without these):**
- [ ] Fix missing `GET /api/jobs/{id}/bids` endpoint — clients cannot see bids on their own jobs
- [ ] Fix missing `PATCH /api/jobs/{id}/status` endpoint — job lifecycle cannot advance past Accepted
- [ ] Fix missing DI registration for `WorkerService` and `WorkerRepository` — worker endpoints crash at runtime
- [ ] Fix missing `PATCH /api/bids/{id}/reject` endpoint — clients cannot reject bids

**Browse-first UX (highest priority for beta impression):**
- [ ] Public job and worker browsing without requiring login
- [ ] Prompt to log in only when user attempts to post a job or submit a bid
- [ ] Anonymous-friendly landing experience

**App Design:**
- [ ] Visual identity — neutral color palette (grays, whites, one accent), consistent typography
- [ ] Intuitive navigation — users know what to do next without explanation
- [ ] Mobile-first UI polish on both web and Expo app
- [ ] Responsive layouts for common screen sizes

**Security:** ✓ Validated in Phase 9
- ✓ PII audit — integration tests prove no email/phone in public-facing responses (SEC-01)
- ✓ Authorization audit — non-owners get 403 on job/bid mutations, proven by tests (SEC-02)
- ✓ Stripe webhook invalid signature returns 400 instead of 500 (SEC-03)
- ✓ Rate limiting (20 req/min) on payment and bid write endpoints (SEC-04)
- ✓ CORS replaced with config-driven WithOrigins (localhost:5173 default) (SEC-05)

**Mobile:**
- [ ] End-to-end test on physical Android and iOS devices
- [ ] Fix any navigation or layout issues discovered on real hardware

**Integrations:**
- [ ] Social login — Google and/or Facebook (lower friction for Romanian users)
- [ ] Maps/location — pin job locations, show nearby workers (Google Maps or Mapbox)
- [ ] Push/SMS notifications for key events (new bid, bid accepted, job update)
- [ ] Analytics — user behavior tracking, funnel visibility, drop-off identification

**Maintenance & Operations:**
- [ ] Monitoring and alerting — know when the app is down before users do
- [ ] Automated database backups via Supabase
- [ ] Dependency update cadence — security patches, framework upgrades
- [ ] Content moderation baseline — flag fake jobs, spam accounts, inappropriate listings

### Out of Scope

- Multi-country or multi-language launch — Romania only for beta; localization deferred
- Real transactions in beta — functional demo only, not expecting live money flow
- Native iOS/Android store submissions — Expo Go / EAS preview builds sufficient for beta
- B2B or agency accounts — individual workers only for now

## Context

**Codebase state:** Full-stack monorepo at Phase 7. Backend uses VSA + CQRS via MediatR (post Phase 3.5); all new features go through Handler slices. Several critical endpoints are missing (see Active bugs above) — the core bid-acceptance flow is broken in both web and mobile.

**Architecture drift:** Legacy Service classes (`BidService`, `JobService`, `ReviewService`, `WorkerService`) from Phase 3 coexist with newer handlers. Some logic is duplicated. Not blocking beta but should be resolved before scaling.

**Design state:** No visual identity yet. Both web and mobile use unstyled or default Tailwind. The app works but looks unpolished.

**CORS:** Config-driven via `Cors:AllowedOrigins` (Phase 9 complete). Ships `localhost:5173` in appsettings; production origins must be set in environment.

**Auth:** JWT HS256 via Supabase. `ValidateIssuer` and `ValidateAudience` are both false — acceptable for now with Supabase-issued tokens.

**Market timing:** The thesis is that automation/AI will increase demand for skilled manual workers who cannot be replaced. HandyLink positions early in the Romanian market where digital booking for tradespeople is still fragmented.

## Constraints

- **Tech stack**: ASP.NET Core 10 + React + Expo — no framework changes
- **Database**: Supabase PostgreSQL — schema changes via SQL scripts in `Data/Migrations/`, never EF migrations
- **Auth**: Supabase JWT — no switching providers; social login must flow through Supabase Auth
- **Architecture**: VSA + CQRS via MediatR for all new backend features — no new Service classes
- **Market**: Romania first — single currency (RON), single language, GDPR compliance required
- **Beta goal**: Functional demo, not production hardening — scope to what friends and family need to see it works

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| VSA + CQRS via MediatR (Phase 3.5+) | Clean separation of feature concerns, avoids service-layer bloat | — Pending eval |
| Supabase for auth + DB | Managed auth + PostgreSQL, low ops overhead for solo/small team | — Pending eval |
| Stripe Connect marketplace model | Handles worker payouts, platform fee, compliance | — Pending eval |
| Romania as initial market | Founder connections, smaller/testable scope | — Pending eval |
| Browse-first (no forced login) | First impression matters most — forcing login kills conversion | — Pending eval |
| Neutral color design direction | Trades audience is practical; trust comes from clarity not branding flair | — Pending eval |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after initialization*
