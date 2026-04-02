---
status: partial
phase: 12-social-login
source: [12-VERIFICATION.md]
started: 2026-04-02T10:00:00Z
updated: 2026-04-02T10:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Web Google OAuth end-to-end (new user)
expected: New Google user redirects /auth-callback → /select-role → picks role → lands on /jobs or /worker/browse. No error.
result: [pending]

### 2. Mobile Google OAuth end-to-end (new user)
expected: After completing Google sign-in in OS browser, deep-link fires SIGNED_IN in _layout.tsx, GET /api/users/me returns 404, app navigates to /(auth)/select-role, user picks role, lands in correct section.
result: [pending]

### 3. Account linking — same email, Google + existing password account
expected: Sign in via Google with email matching an existing email/password account → same user ID, same profile row, no duplicate, role selection skipped (profile exists).
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
