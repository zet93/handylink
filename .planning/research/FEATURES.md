# Feature Landscape

**Domain:** Two-sided service marketplace (tradespeople + clients), Romania beta
**Researched:** 2026-03-29
**Confidence note:** WebSearch and WebFetch tools were unavailable. All findings below are drawn from training-data knowledge of Airbnb, Fiverr, TaskRabbit, Upwork, and Thumbtack patterns (knowledge cutoff August 2025). Confidence marked per finding.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Browse jobs/workers without login | Every major marketplace (Airbnb, Fiverr, Upwork) allows anonymous browsing. Forced login before seeing value kills first impressions; NNGroup research consistently shows registration walls reduce conversion by 20–60%. | Low | Backend: mark job/worker endpoints as `[AllowAnonymous]`. Frontend: remove `ProtectedRoute` from browse pages. Sensitive fields (emails, phones) must still be masked. |
| Lazy auth prompt | User hits a gated action (post job, submit bid), gets a modal or redirect to login — not a hard block on the landing page. Return to the same page after auth. | Low–Med | Store intended destination before redirect; restore after login. Supabase session check on page load handles this. |
| Clear role selection at signup | Client vs. Worker is a fork — users must know which path they're on. TaskRabbit and Fiverr make this explicit at registration with two distinct CTAs, not a radio button buried in a form. | Low | Already has role-based routing. The signup screen needs two clear role options up front. |
| Worker profile with photo, categories, and rating | Trust anchor. Without a visible rating and photo, users won't contact a stranger for home access. Even a 0-review profile with a photo and bio is more trustworthy than an avatar-less record. | Low | Entities exist. UI polish needed. |
| Job detail page with bid count visible | Clients need social proof that the job attracted interest. Workers need to see how many competitors they're up against. Both Upwork and Thumbtack show bid count on listings. | Low | Data exists. UI needs to surface it. |
| Bid status visibility for workers | Worker submits bid, then has no idea what happened — this breaks trust immediately. Workers must see Pending / Accepted / Rejected per bid. | Low | BidStatus enum exists. UI needs to expose it clearly. |
| Masking of personal contact info pre-transaction | Email and phone must not appear in public API responses. This is both a GDPR concern (Romania = EU) and a marketplace norm — if users can bypass the platform to contact each other, the platform loses value. | Med | Backend: audit all public endpoints for PII leakage. No schema change needed. |
| Basic search / filter on job listings | Category filter and city/region filter are the minimum. Users landing on a list of 30 unsorted jobs from every category will immediately leave. | Low–Med | Category filter is low (enum-based). Location is medium (requires location field on jobs). |

---

## Differentiators

Features not universally expected but that increase trust, retention, and word-of-mouth for a beta.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Google login (social auth) | Frictionless for Romanian users who are deeply Google-integrated (Android dominance in Romania). Reduces signup abandonment. Fiverr and Airbnb both offer it prominently. | Low–Med | Supabase Auth natively supports Google OAuth. Requires Google Cloud Console setup + Supabase dashboard config. No backend code changes needed — auth token flow is identical. Web: `supabase.auth.signInWithOAuth({ provider: 'google' })`. Mobile: Expo `expo-auth-session` + Supabase. |
| Facebook login | Secondary to Google in Romania, but still relevant for the 35–55 demographic that makes up a meaningful share of home-repair clients. | Low–Med | Same Supabase OAuth pattern as Google. Facebook App Console setup required. Recommend: implement Google first, Facebook as follow-on. |
| Neutral, professional design system | Trades audience is practical and skeptical of flashy apps. A clean gray/white palette with one accent color (blue or orange) reads as "this is a legitimate business tool" rather than "startup experiment." TaskRabbit uses navy + white; Thumbtack uses blue + white. | Med | No external dependency. Pure CSS/Tailwind token system. Highest ROI design task for beta impression. |
| Pin job location on map | Clients want workers nearby; workers want to filter by proximity. Even a simple static map pin (Google Maps embed or Mapbox) on the job detail page dramatically increases perceived legitimacy. | Med | Google Maps Embed API is easiest (static, no JS SDK needed for a pin). Requires a lat/lng field on jobs or address geocoding. |
| Notification for key events | New bid received, bid accepted/rejected, job status changed. Users who don't get notified stop checking the app. Push notifications already exist via Expo; the gap is coverage completeness. | Low | Push notification infrastructure is already built. Audit which events trigger notifications vs. which are silently missing. |
| "How it works" landing section | First-time visitors (friends and family beta) need a 3-step explainer before they understand the product. Airbnb's original landing page was mostly this. | Low | Static content. No backend needed. |

---

## Anti-Features

Features to deliberately not build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| In-app messaging / chat | High complexity (WebSockets or polling, message storage, read receipts, moderation surface). Not needed for beta — phone or WhatsApp works fine between a client and a selected worker. | After bid is accepted, show the worker's (masked) contact method only to the client who accepted. |
| Advanced search (keyword, radius slider, price range) | Over-engineering for a beta with <50 jobs. A category dropdown and city selector is sufficient. Full-text search adds infrastructure (Postgres FTS or Algolia) for zero beta benefit. | Ship category + city filter. Add full-text search post-beta when there's enough data. |
| Worker availability calendar | Complex state management, no value when the job posting model already handles scheduling via the job description text. TaskRabbit has this but built it years into product maturity. | Workers can note availability in their profile bio or job bid message. |
| Review photos / media uploads on jobs | Binary moderation problem — every uploaded image needs review. Storage costs and complexity are disproportionate to beta value. | Text-only reviews and text-only job descriptions for beta. |
| Dispute resolution workflow | Requires human judgment, defined SLAs, and legal exposure. Not appropriate for a demo with friends and family who trust the founder. | Note the gap in PITFALLS. Add a simple "Report" button that emails the admin. |
| Referral / invite system | Premature. Build it when you have product-market fit and want to scale. | Manual invites for beta (password gate already handles this). |
| Multi-language / Romanian localization | PROJECT.md explicitly defers this. All beta users will be Romanian but bilingual enough for an English UI. | Hardcode English. Add i18n scaffolding after beta if there's traction. |

---

## Feature Details by Research Area

### 1. Browse-Without-Login

**Pattern (HIGH confidence — consistent across Airbnb, Fiverr, Upwork, TaskRabbit):**
- Landing page shows real content (real job listings or worker profiles), not a marketing splash.
- Zero friction to browse. No cookie wall or email capture before seeing the list.
- Auth gate is contextual: triggered only when the user attempts a transactional action (post, bid, review, pay).
- Gate is a modal or inline prompt ("Sign in to submit a bid"), not a hard redirect that loses the user's context.
- After login/register, user is returned to the exact page they were on — not dumped on a dashboard.

**For HandyLink specifically:**
- `GET /api/jobs` and `GET /api/jobs/{id}` become `[AllowAnonymous]` with PII fields stripped from the response.
- `GET /api/workers` and `GET /api/workers/{id}` become `[AllowAnonymous]` — show categories, rating, review count, but not email/phone.
- `ProtectedRoute` is removed from browse pages on web; mobile's `_layout.tsx` auth guard is relaxed for browse routes.
- The password beta gate already wraps the whole app — that stays. This is about in-app auth, not the beta gate.

**What to strip from anonymous responses:**
- Email address
- Phone number
- Expo push token
- Any internal ID that could be used to enumerate users

### 2. App Design for Service Marketplaces

**Color system (MEDIUM confidence — pattern-based, not a single authoritative source):**
- Neutral base: white background (`#FFFFFF`), light gray surface (`#F5F5F5` or `#F8F8F8`), dark gray text (`#1A1A1A`).
- One primary accent: blue (`#2563EB` Tailwind blue-600) or orange (`#EA580C` Tailwind orange-600). Blue reads as trustworthy/professional. Orange reads as energetic/tradesperson.
- Avoid: gradients, bright multi-color palettes, dark mode for beta (doubles the design work).
- Typography: one sans-serif family (Inter is the Tailwind default and works well). 16px body, 24px headings. No decorative fonts.

**Trust signals (HIGH confidence — well-documented in marketplace UX literature):**
- Star rating with review count displayed on every worker card: "4.8 (23 reviews)" not just "4.8 stars".
- Verified badge if any identity verification exists.
- Job count: "47 jobs completed" on worker profile.
- Response time indicator: "Usually responds within 2 hours" — useful even if manually set for beta.
- Profile photo is mandatory for workers; a gray silhouette is trust-negative.

**Navigation (HIGH confidence):**
- Client flow: Browse jobs → Post a job → Manage my jobs → My profile.
- Worker flow: Browse jobs → My bids → My profile.
- No more than 4 tabs in mobile bottom nav. Fiverr and TaskRabbit both use 4 or fewer.
- Web: sticky top nav with role-aware links. "Post a Job" CTA always visible for clients.

### 3. Social Login UX

**Web pattern (HIGH confidence — Supabase + Google OAuth is well-documented):**
- "Continue with Google" button above the email/password form, visually separated by an "or" divider.
- Button uses Google's official branding guidelines (white button, Google logo, "Continue with Google" text).
- Clicking redirects to Google OAuth, returns to app with session established.
- Supabase handles token exchange; frontend calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.

**Mobile pattern (MEDIUM confidence — Expo + Supabase OAuth has more moving parts):**
- Expo's `expo-auth-session` library handles the in-app browser OAuth flow.
- User taps "Continue with Google", in-app browser opens, returns via deep link.
- Supabase mobile OAuth requires a custom URL scheme configured in `app.json` and Supabase dashboard.
- Facebook login uses the same pattern; Facebook also requires the app's bundle ID in the Facebook Developer Console.
- Known complexity: deep link handling on Android vs. iOS differs; test on physical devices.

**UX rule:** Social login should be the first option shown, not buried. First-time users in Romania who have a Google account will almost always choose it over email/password — reducing password-reset support burden.

### 4. Content Moderation Basics (Beta)

**Minimum viable moderation (HIGH confidence for the principle; MEDIUM for specific tooling):**

For a private beta with a password gate and <100 users, the risk of bad actors is very low. Full moderation tooling is premature. The minimum is:

| Mechanism | Purpose | Implementation |
|-----------|---------|---------------|
| Report button on job/worker/bid | User-initiated flagging | Sends email to admin (no DB table needed for beta) |
| Admin can delete any job or user | Manual intervention | Admin-only API endpoint; no admin UI needed for beta |
| Email verification at signup | Basic spam/bot prevention | Supabase handles this natively; enable in Supabase Auth settings |
| Rate limiting on POST endpoints | Prevent bid/job spam | ASP.NET Core rate limiting middleware (already in project roadmap) |

**What NOT to do for beta:**
- No automated content scanning (AWS Rekognition, OpenAI moderation API) — cost and complexity not justified.
- No multi-step human review queue — too slow for a demo-scale app.
- No appeal workflow.

### 5. Notification UX

**Which events trigger notifications (HIGH confidence — consistent across Fiverr, Upwork, TaskRabbit):**

| Event | Who Gets Notified | Channel | Priority |
|-------|-------------------|---------|----------|
| New bid submitted on my job | Client | Push + in-app | High |
| My bid was accepted | Worker | Push + in-app | High |
| My bid was rejected | Worker | Push + in-app | High |
| Job status changed (InProgress → Completed) | Client | Push + in-app | High |
| New review received | Worker | In-app only | Med |
| Payment processed | Client + Worker | In-app only | High |

**What NOT to notify (anti-density patterns):**
- Do not notify workers every time a new job is posted in their category — this is email spam and leads to push permission revocation.
- Do not notify clients for every worker profile view.
- Do not send daily/weekly digest emails for beta scale.

**Push permission timing (MEDIUM confidence):**
- Ask for push permission after the user has completed their first meaningful action (posted a job or submitted a bid), not on app open. Asking immediately on open results in ~50% denial rate. Asking after value delivery results in ~80% acceptance (industry pattern).
- iOS requires explicit permission request; Android 13+ also requires it. Expo's `Notifications.requestPermissionsAsync()` handles both.

**In-app notification center (already built in HandyLink):**
- Both client and worker tabs have a `notifications.tsx` screen. The gap is ensuring all the above events actually trigger the `SendPushNotificationCommand` in their respective handlers.

---

## Feature Dependencies

```
Browse-without-login
  → requires: PII masking on anonymous endpoints
  → requires: ProtectedRoute relaxed for browse routes
  → requires: lazy auth modal or redirect-with-return

Social login
  → requires: Google Cloud Console OAuth credentials
  → requires: Supabase Auth provider enabled in dashboard
  → mobile social login: requires: expo-auth-session + deep link config

Notifications (complete coverage)
  → requires: all transactional handlers call SendPushNotificationCommand
  → requires: push token registered for both client and worker roles

Content moderation (beta)
  → requires: rate limiting (already planned)
  → requires: email verification enabled in Supabase
  → Report button: requires: admin email destination configured
```

---

## MVP Recommendation for Beta Polish Milestone

**Prioritize (in order):**
1. Browse-without-login with PII masking — highest conversion impact, blocks the beta impression
2. Neutral design system (color tokens + typography) — second-biggest impression factor
3. Trust signals on worker cards (rating + review count + job count) — makes workers hireable-looking
4. Social login (Google web first, then mobile, then Facebook) — reduces signup friction
5. Notification coverage audit — ensure bid-accepted and bid-rejected events always push

**Defer to post-beta:**
- Map/location integration (nice but not blocking the demo)
- Facebook login (Google covers 80% of the use case)
- Content moderation tooling beyond rate limiting + email reporting
- Notification digest emails

---

## Sources

- Training data knowledge of Airbnb, Fiverr, Upwork, TaskRabbit, and Thumbtack UX patterns (HIGH confidence where patterns are consistent across all five; MEDIUM where fewer references).
- NNGroup login wall research — consistent finding that registration walls reduce conversion (HIGH confidence on the principle).
- Supabase Auth OAuth documentation pattern — `signInWithOAuth` API (HIGH confidence, stable API).
- Expo Notifications API — `requestPermissionsAsync` timing patterns (MEDIUM confidence, confirm against current Expo SDK docs).
- Note: WebSearch and WebFetch were unavailable during this research session. Claims marked HIGH are based on well-established, multi-source patterns that are unlikely to have changed. Claims marked MEDIUM should be verified against current docs before implementation.
