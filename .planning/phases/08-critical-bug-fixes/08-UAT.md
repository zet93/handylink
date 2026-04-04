---
status: testing
phase: 08-critical-bug-fixes
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md]
started: 2026-03-31T00:00:00Z
updated: 2026-03-31T00:00:00Z
---

## Current Test

number: 1
name: View bids on a job
expected: |
  As the job owner (client), call GET /api/jobs/{jobId}/bids with a valid auth token.
  Response is 200 with a JSON array of bid objects (or empty array if no bids), each containing bidId, workerId, priceEstimate, message, status, and createdAt.
awaiting: user response

## Tests

### 1. View bids on a job
expected: As the job owner (client), call GET /api/jobs/{jobId}/bids with a valid auth token. Response is 200 with a JSON array of bid objects (or empty array if no bids), each containing bidId, workerId, priceEstimate, message, status, and createdAt.
result: [pending]

### 2. Non-owner cannot view bids
expected: As a different user (not the job owner), call GET /api/jobs/{jobId}/bids. Response is 403 Forbidden.
result: [pending]

### 3. Reject a pending bid
expected: As the job owner, call PATCH /api/bids/{bidId}/reject with a valid auth token on a bid that is currently Pending. Response is 200 with the bid's new status as "Rejected".
result: [pending]

### 4. Cannot reject a non-pending bid
expected: Call PATCH /api/bids/{bidId}/reject on a bid that has already been Accepted. Response is 400 Bad Request (validation error).
result: [pending]

### 5. Advance job from Accepted to InProgress
expected: As the job owner, call PATCH /api/jobs/{id}/status with body {"status": "InProgress"} (or "in_progress") on a job currently in Accepted status. Response is 200 with the job's new status.
result: [pending]

### 6. Advance job from InProgress to Completed
expected: Call PATCH /api/jobs/{id}/status with body {"status": "Completed"} on a job currently InProgress. Response is 200.
result: [pending]

### 7. Invalid status transition returns 400
expected: Call PATCH /api/jobs/{id}/status with body {"status": "Completed"} on a job that is still in Open or Bidding status. Response is 400 Bad Request with an error message about the invalid transition.
result: [pending]

### 8. Worker list endpoint no longer crashes
expected: Call GET /api/workers with a valid auth token. Response is 200 with a JSON array (can be empty). No 500 error.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps

