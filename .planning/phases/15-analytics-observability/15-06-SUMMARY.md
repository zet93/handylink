---
phase: 15-analytics-observability
plan: "06"
subsystem: mobile
tags: [analytics, posthog, mobile, react-native]
dependency_graph:
  requires: [15-05]
  provides: [mobile-funnel-events]
  affects: [posthog-eu-dashboard]
tech_stack:
  added: []
  patterns: [posthog-react-native usePostHog hook, optional chaining on posthog capture]
key_files:
  created: []
  modified:
    - mobile/app/(client)/post-job.tsx
    - mobile/app/(worker)/browse.tsx
decisions:
  - "posthog?.capture with optional chaining used on all calls — no crash if PostHog provider is not yet ready"
  - "job_posted sends only { category } (enum string) — no PII per D-10"
  - "bid_submitted sends only { job_id } (UUID) — no price, message, or worker identity per D-10"
metrics:
  duration: 50s
  completed_date: "2026-04-23"
  tasks: 2
  files: 2
---

# Phase 15 Plan 06: Mobile PostHog Funnel Events Summary

Mobile post-job and worker browse screens now fire `job_posted` and `bid_submitted` PostHog events, mirroring the web captures from Plan 04 for complete cross-platform funnel data.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add job_posted capture to post-job.tsx | 115251f | mobile/app/(client)/post-job.tsx |
| 2 | Add bid_submitted capture to browse.tsx | ba2f9e6 | mobile/app/(worker)/browse.tsx |

## What Was Built

### mobile/app/(client)/post-job.tsx
- Added `import { usePostHog } from 'posthog-react-native'`
- Added `const posthog = usePostHog()` inside `PostJobScreen`
- Added `posthog?.capture('job_posted', { category })` in `useMutation.onSuccess` before cache invalidation

### mobile/app/(worker)/browse.tsx
- Added `import { usePostHog } from 'posthog-react-native'`
- Added `const posthog = usePostHog()` inside `WorkerBrowseScreen`
- Added `posthog?.capture('bid_submitted', { job_id: selectedJob.id })` in `submitBid.onSuccess` before sheet close

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-15-17 | job_posted sends only `category` (enum string) — no job title, description, or user data |
| T-15-18 | bid_submitted sends only `job_id` (UUID) — no price, message, or worker identity |

## Known Stubs

None.

## Self-Check: PASSED

- mobile/app/(client)/post-job.tsx: FOUND — contains posthog?.capture('job_posted', { category })
- mobile/app/(worker)/browse.tsx: FOUND — contains posthog?.capture('bid_submitted', { job_id: selectedJob.id })
- Commit 115251f: FOUND
- Commit ba2f9e6: FOUND
