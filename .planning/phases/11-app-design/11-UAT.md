---
status: testing
phase: 11-app-design
source: [11-01-SUMMARY.md, 11-02-SUMMARY.md, 11-03-SUMMARY.md]
started: 2026-04-01T07:40:00Z
updated: 2026-04-01T07:40:00Z
---

## Current Test

number: 2
name: Verify JobCard includes trust signals
expected: |
  Each job card in job listing includes rating (e.g. "⭐ 4.8"), review count, job count, and featured label if applicable.
awaiting: user response

## Tests

### 1. Verify web design tokens and landing page reflects them
expected: |
  `:root` block in `frontend/src/App.css` has shared token definitions, and `/` renders using those values (accent background, text color, button style).
result: pass

### 2. Verify JobCard includes trust signals
expected: |
  Each job card in job listing includes rating (e.g. "⭐ 4.8"), review count, job count, and featured label if applicable.
result: pending

### 3. Verify WorkerCard shows trust indicators
expected: |
  WorkerCard component renders worker name, verification label, rating, review count, and job count.
result: pending

### 4. Verify JobDetail UX guidance and action note
expected: |
  Job detail page includes a guidance message about bid workflow, and a sticky submit/accept action appears on mobile-size viewport.
result: pending

### 5. Verify mobile design tokens are used in client screens
expected: |
  `mobile/app/constants/design.ts` exports `palette` and `typography`.  `browse-workers.tsx`, `job-detail.tsx`, and `post-job.tsx` import these and apply token colors/font sizes.
result: pending

### 6. Verify mobile post-job layout guardrails
expected: |
  `post-job.tsx` uses token-based `backgroundColor` and has responsive form fields and no overflow in narrow width.
result: pending

### 7. Verify e2e mobile layout test existence
expected: |
  File `e2e/tests/mobile-layout.spec.ts` exists and contains viewport checks for 390x844 with assertions around scrollHeight and visibility of "Submit bid".
result: pending

## Summary

total: 7
passed: 1
issues: 0
pending: 6
skipped: 0

## Gaps

- none yet
