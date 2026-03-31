# Requirements: HandyLink

**Defined:** 2026-03-29
**Core Value:** A client can find a trusted local tradesperson and a worker can find their next job — without friction, without guesswork.

## v1 Requirements (Beta Milestone)

These are the requirements for the beta release — a functional demo for friends and family in Romania.

### Bug Fixes (Core flow is broken without these)

- [x] **BUG-01**: Client can view all bids submitted on their job (`GET /api/jobs/{id}/bids` endpoint missing)
- [x] **BUG-02**: Client can advance job status from Accepted to In Progress (`PATCH /api/jobs/{id}/status` endpoint missing)
- [x] **BUG-03**: Worker profile endpoints do not crash at runtime (DI registrations for `WorkerService` and `WorkerRepository` missing)
- [x] **BUG-04**: Client can reject individual bids from the UI (`PATCH /api/bids/{id}/reject` endpoint missing)

### Browse-First UX

- [ ] **UX-01**: Visitor can browse all open jobs without logging in
- [ ] **UX-02**: Visitor can view individual job details without logging in
- [ ] **UX-03**: Visitor can browse worker profiles without logging in
- [ ] **UX-04**: Login prompt appears only when visitor attempts to post a job or submit a bid
- [ ] **UX-05**: Anonymous landing experience communicates the app's value clearly

### Design

- [ ] **DSG-01**: App uses a neutral, consistent color palette (grays, whites, one accent)
- [ ] **DSG-02**: Typography is consistent and readable across web and mobile
- [ ] **DSG-03**: Key user flows (browse → bid, post job → review bids) require no explanation
- [ ] **DSG-04**: Mobile layouts are correct on common screen sizes (no overflow, no misaligned elements)
- [ ] **DSG-05**: Web layouts are responsive (mobile, tablet, desktop)

### Security

- [ ] **SEC-01**: Unauthenticated users cannot access other users' personal data (email, phone)
- [ ] **SEC-02**: Users can only edit or delete their own jobs, bids, and profiles
- [x] **SEC-03**: Stripe webhook requests are validated via signature (prevent spoofed payment events)
- [x] **SEC-04**: Auth endpoints have rate limiting to prevent brute-force and signup spam
- [x] **SEC-05**: CORS policy is tightened from AllowAll to allowed production origins only

### Mobile

- [ ] **MOB-01**: App runs without errors on a physical Android device
- [ ] **MOB-02**: App runs without errors on a physical iOS device (or simulator)
- [ ] **MOB-03**: All navigation flows work correctly on physical devices
- [ ] **MOB-04**: Push notifications are delivered and tappable on physical devices

### Social Login

- [ ] **AUTH-01**: User can sign up and log in with Google (via Supabase OAuth)
- [ ] **AUTH-02**: User can sign up and log in with Facebook (via Supabase OAuth)
- [ ] **AUTH-03**: Social login creates a profile with correct role assignment

### Maps & Location

- [ ] **MAP-01**: Job creation includes an optional location (address or map pin)
- [ ] **MAP-02**: Job listings show location visually (map or address display)
- [ ] **MAP-03**: Worker profile can include a service area or location

### Notifications

- [ ] **NOTF-01**: Worker receives push notification when a new bid is submitted on their job (client perspective: when bid accepted)
- [ ] **NOTF-02**: Client receives notification when a worker bids on their job
- [ ] **NOTF-03**: Both parties receive notification on key job status transitions

### Analytics

- [ ] **ANLX-01**: Key user events are tracked (job posted, bid submitted, account created, login)
- [ ] **ANLX-02**: Funnel visibility — where do users drop off?
- [ ] **ANLX-03**: Basic dashboard or reporting to see usage trends

### Monitoring & Operations

- [ ] **OPS-01**: App health monitoring — alerts when API is down or error rate spikes
- [ ] **OPS-02**: Automated Supabase database backups configured
- [ ] **OPS-03**: Dependency update process documented — security patches, framework upgrades
- [ ] **OPS-04**: Basic content moderation — mechanism to report and remove flagged jobs or accounts

## v2 Requirements (Post-Beta)

### Multi-language

- **I18N-01**: Romanian language UI option
- **I18N-02**: Date/currency formatting for Romanian locale (RON)

### Advanced Matching

- **MATCH-01**: Worker discovery by category and location proximity
- **MATCH-02**: Recommended workers surfaced to client after job post
- **MATCH-03**: Worker availability calendar

### Payments Advanced

- **PAY-01**: Escrow hold — payment released after job completion confirmation
- **PAY-02**: Dispute resolution flow
- **PAY-03**: Invoicing for completed jobs

### Admin

- **ADMIN-01**: Admin dashboard for user management
- **ADMIN-02**: Admin can view and remove flagged content
- **ADMIN-03**: Admin can ban accounts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-country launch | Romania-first; localization complexity deferred |
| Real money transactions in beta | Demo milestone only; not hardening for production finance |
| App store submissions (iOS/Android) | Expo Go / EAS preview sufficient for beta testing |
| B2B / agency accounts | Individual workers only for now; complexity not justified |
| Real-time chat between client and worker | High complexity; bid comments sufficient for v1 |
| Video portfolios for workers | Storage/bandwidth cost; photo portfolio deferred to v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 8 (Critical Bug Fixes) | Complete |
| BUG-02 | Phase 8 (Critical Bug Fixes) | Complete |
| BUG-03 | Phase 8 (Critical Bug Fixes) | Complete |
| BUG-04 | Phase 8 (Critical Bug Fixes) | Complete |
| SEC-01 | Phase 9 (Security Hardening) | Pending |
| SEC-02 | Phase 9 (Security Hardening) | Pending |
| SEC-03 | Phase 9 (Security Hardening) | Complete |
| SEC-04 | Phase 9 (Security Hardening) | Complete |
| SEC-05 | Phase 9 (Security Hardening) | Complete |
| UX-01 | Phase 10 (Browse-First UX) | Pending |
| UX-02 | Phase 10 (Browse-First UX) | Pending |
| UX-03 | Phase 10 (Browse-First UX) | Pending |
| UX-04 | Phase 10 (Browse-First UX) | Pending |
| UX-05 | Phase 10 (Browse-First UX) | Pending |
| DSG-01 | Phase 11 (App Design) | Pending |
| DSG-02 | Phase 11 (App Design) | Pending |
| DSG-03 | Phase 11 (App Design) | Pending |
| DSG-04 | Phase 11 (App Design) | Pending |
| DSG-05 | Phase 11 (App Design) | Pending |
| AUTH-01 | Phase 12 (Social Login) | Pending |
| AUTH-02 | Phase 12 (Social Login) | Pending |
| AUTH-03 | Phase 12 (Social Login) | Pending |
| NOTF-01 | Phase 13 (Notifications + Mobile Testing) | Pending |
| NOTF-02 | Phase 13 (Notifications + Mobile Testing) | Pending |
| NOTF-03 | Phase 13 (Notifications + Mobile Testing) | Pending |
| MOB-01 | Phase 13 (Notifications + Mobile Testing) | Pending |
| MOB-02 | Phase 13 (Notifications + Mobile Testing) | Pending |
| MOB-03 | Phase 13 (Notifications + Mobile Testing) | Pending |
| MOB-04 | Phase 13 (Notifications + Mobile Testing) | Pending |
| MAP-01 | Phase 14 (Maps & Location) | Pending |
| MAP-02 | Phase 14 (Maps & Location) | Pending |
| MAP-03 | Phase 14 (Maps & Location) | Pending |
| ANLX-01 | Phase 15 (Analytics + Observability) | Pending |
| ANLX-02 | Phase 15 (Analytics + Observability) | Pending |
| ANLX-03 | Phase 15 (Analytics + Observability) | Pending |
| OPS-01 | Phase 15 (Analytics + Observability) | Pending |
| OPS-02 | Phase 15 (Analytics + Observability) | Pending |
| OPS-03 | Phase 15 (Analytics + Observability) | Pending |
| OPS-04 | Phase 15 (Analytics + Observability) | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 — traceability updated for Beta Polish roadmap (Phases 8-15)*
