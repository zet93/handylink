# Roadmap: HandyLink

## Milestones

- ✅ **v1.0 Core Platform** - Phases 1-7 (shipped 2026-03-29)
- 🚧 **Beta Polish** - Phases 8-15 (in progress)

## Phases

<details>
<summary>✅ v1.0 Core Platform (Phases 1-7) - SHIPPED 2026-03-29</summary>

### Phase 1-3: Clean Architecture + Core Marketplace
**Goal**: Job posting, bidding, worker profiles, and auth working end-to-end
**Plans**: Complete

### Phase 4: Web Frontend
**Goal**: React/Vite web app with job browsing and management
**Plans**: Complete

### Phase 5: Push Notifications
**Goal**: Expo push notifications for key events
**Plans**: Complete

### Phase 6: Mobile App
**Goal**: React Native/Expo mobile app with role-based navigation
**Plans**: Complete

### Phase 7: Stripe Payments
**Goal**: Stripe Connect with 10% platform fee and worker onboarding
**Plans**: Complete

</details>

### 🚧 Beta Polish (In Progress)

**Milestone Goal:** A functional, polished demo for friends and family in Romania — core flow works end-to-end, anonymous browsing is safe and friction-free, the app looks trustworthy, and basic operational visibility is in place.

## Phase Details

### Phase 8: Critical Bug Fixes
**Goal**: The core job-lifecycle flow works end-to-end — clients can see bids, accept or reject them, and advance jobs through every status
**Depends on**: Phase 7
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04
**Success Criteria** (what must be TRUE):
  1. Client can view all bids submitted on their job
  2. Client can reject a specific bid from the job detail page
  3. Client can advance a job from Accepted to In Progress and through to Completed
  4. Worker profile and bid endpoints do not return 500 errors at runtime
**Plans:** 2 plans
Plans:
- [ ] 08-01-PLAN.md — GetBidsForJob query + RejectBid command (BUG-01, BUG-04)
- [ ] 08-02-PLAN.md — UpdateJobStatus command + Worker DI fix (BUG-02, BUG-03)

### Phase 9: Security Hardening
**Goal**: The API is safe to expose to anonymous users — PII is protected, CORS is locked, webhooks are validated, and brute-force attacks are rate-limited
**Depends on**: Phase 8
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. An unauthenticated request to any job or worker listing endpoint returns no email addresses or phone numbers
  2. A user attempting to edit or delete another user's job or bid receives a 403 response
  3. A Stripe webhook request with an invalid signature is rejected with a 400 response
  4. Repeated login attempts from the same IP are throttled after a configurable limit
  5. The API rejects cross-origin requests from origins not in the production allowlist
**Plans**: TBD
**UI hint**: yes

### Phase 10: Browse-First UX
**Goal**: Visitors can browse jobs and workers without logging in, and auth is prompted only at the moment of action
**Depends on**: Phase 9
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. A visitor with no account can open the app and see a full list of open jobs
  2. A visitor can open an individual job detail page without being redirected to login
  3. A visitor can browse worker profiles without being redirected to login
  4. When a visitor attempts to post a job or submit a bid, a login prompt appears and after login they are returned to where they were
  5. The landing page communicates what HandyLink does without requiring a user to log in first
**Plans**: TBD
**UI hint**: yes

### Phase 11: App Design
**Goal**: The app has a consistent visual identity that communicates trust and makes key flows self-explanatory
**Depends on**: Phase 10
**Requirements**: DSG-01, DSG-02, DSG-03, DSG-04, DSG-05
**Success Criteria** (what must be TRUE):
  1. All screens across web and mobile use the same color palette (grays, whites, one accent) and type scale
  2. A first-time visitor can complete the browse → bid flow without any explanation
  3. Worker cards show rating, review count, and job count as visible trust signals
  4. Mobile screens have no overflowing elements or misaligned layouts on common phone sizes
  5. The web layout adapts correctly between mobile, tablet, and desktop viewports
**Plans**: TBD
**UI hint**: yes

### Phase 12: Social Login
**Goal**: Users can sign up and log in with Google, with correct role assignment and no duplicate account creation
**Depends on**: Phase 11
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A new user can tap "Continue with Google" on web and complete registration without entering a password
  2. A new OAuth user is shown a role-selection screen before being admitted to the app
  3. An existing email/password user who attempts Google OAuth with the same email is linked to their existing account, not given a new one
  4. Social login creates a profile row with the correct role (client or worker)
**Plans**: TBD
**UI hint**: yes

### Phase 13: Notifications + Mobile Testing
**Goal**: Push notifications fire for all key job events and the app runs correctly on physical Android and iOS devices
**Depends on**: Phase 12
**Requirements**: NOTF-01, NOTF-02, NOTF-03, MOB-01, MOB-02, MOB-03, MOB-04
**Success Criteria** (what must be TRUE):
  1. A worker receives a push notification when a client submits a bid on their job
  2. A client receives a push notification when a worker bids on their job
  3. Both parties receive notifications on job status transitions (accepted, in progress, completed)
  4. The app opens and all navigation flows complete without errors on a physical Android device
  5. The app opens and all navigation flows complete without errors on a physical iOS device or simulator
  6. Push notifications are delivered and tappable on physical devices
**Plans**: TBD

### Phase 14: Maps & Location
**Goal**: Jobs can have a location, and that location is visible to both clients and workers on a map
**Depends on**: Phase 13
**Requirements**: MAP-01, MAP-02, MAP-03
**Success Criteria** (what must be TRUE):
  1. A client can optionally add a location (address or map pin) when creating a job
  2. Job listings display a map or address so workers know where the work is
  3. A worker's profile can include a service area or home location
**Plans**: TBD
**UI hint**: yes

### Phase 15: Analytics + Observability
**Goal**: Key user events are tracked with GDPR consent, errors are captured across all platforms, and uptime is monitored
**Depends on**: Phase 14
**Requirements**: ANLX-01, ANLX-02, ANLX-03, OPS-01, OPS-02, OPS-03, OPS-04
**Success Criteria** (what must be TRUE):
  1. Job posted, bid submitted, account created, and login events appear in the analytics dashboard
  2. A funnel report shows where users drop off between landing and first bid or job post
  3. An alert fires when the API health endpoint is down or error rate spikes
  4. JavaScript and backend exceptions are captured in Sentry with stack traces
  5. Analytics events only fire after a user has given cookie/tracking consent
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-7. Core Platform | v1.0 | - | Complete | 2026-03-29 |
| 8. Critical Bug Fixes | Beta Polish | 0/2 | Planning complete | - |
| 9. Security Hardening | Beta Polish | 0/TBD | Not started | - |
| 10. Browse-First UX | Beta Polish | 0/TBD | Not started | - |
| 11. App Design | Beta Polish | 0/TBD | Not started | - |
| 12. Social Login | Beta Polish | 0/TBD | Not started | - |
| 13. Notifications + Mobile Testing | Beta Polish | 0/TBD | Not started | - |
| 14. Maps & Location | Beta Polish | 0/TBD | Not started | - |
| 15. Analytics + Observability | Beta Polish | 0/TBD | Not started | - |
