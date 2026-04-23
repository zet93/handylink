---
status: partial
phase: 15-analytics-observability
source: [15-VERIFICATION.md]
started: 2026-04-23T19:00:00Z
updated: 2026-04-23T19:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Web consent banner renders for first-time visitors
expected: Cookie consent banner appears fixed at bottom of page
result: [pending]

### 2. Accept consent flow
expected: Banner disappears; PostHog capture becomes active; persists on reload
result: [pending]

### 3. Decline consent flow
expected: Banner disappears permanently; re-opening the app does not show the banner again
result: [pending]

### 4. Sign up as a new user (web)
expected: PostHog receives account_created event with role property
result: [pending]

### 5. Log in as existing user (web)
expected: PostHog receives login event; posthog.identify fires with UUID and role (no email)
result: [pending]

### 6. Post a job on web
expected: PostHog receives job_posted event with category property after redirect
result: [pending]

### 7. Submit a bid on web (worker account)
expected: PostHog receives bid_submitted event with job_id property
result: [pending]

### 8. Mobile consent modal — first app launch
expected: Consent bottom sheet modal appears; cannot be dismissed by swiping down
result: [pending]

### 9. Mobile analytics — accept consent then post job + bid
expected: PostHog receives job_posted with category (client); bid_submitted with job_id (worker)
result: [pending]

### 10. Sentry frontend — trigger JS exception
expected: Error appears in Sentry project (once VITE_SENTRY_DSN is set in Vercel)
result: [pending]

### 11. Sentry backend — trigger unhandled exception
expected: Error appears in Sentry backend project (once Sentry:Dsn is set on Render)
result: [pending]

### 12. GitHub Actions backup workflow (manual trigger)
expected: backup.sql artifact appears under the workflow run with 30-day retention (requires SUPABASE_DB_URL secret in repo settings)
result: [pending]

### 13. ANLX-02: PostHog funnel analysis
expected: Funnel from landing → job_posted / bid_submitted can be built in PostHog
result: [pending]

### 14. ANLX-03: PostHog usage dashboard
expected: Insights show event trends for account_created, login, job_posted, bid_submitted
result: [pending]

## Summary

total: 14
passed: 0
issues: 0
pending: 14
skipped: 0
blocked: 0

## Gaps
