---
phase: 8
slug: critical-bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.9.3 |
| **Config file** | `backend/HandyLink.Tests/HandyLink.Tests.csproj` |
| **Quick run command** | `dotnet test backend/ --filter "FullyQualifiedName~GetBidsForJob\|FullyQualifiedName~UpdateJobStatus\|FullyQualifiedName~RejectBid\|FullyQualifiedName~WorkerDI"` |
| **Full suite command** | `dotnet test backend/` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run feature-scoped filter command
- **After every plan wave:** Run `dotnet test backend/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | BUG-01 | unit+integration | `dotnet test backend/ --filter "FullyQualifiedName~GetBidsForJobHandler"` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | BUG-01 | unit | `dotnet test backend/ --filter "FullyQualifiedName~GetBidsForJobHandler"` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | BUG-02 | unit+integration | `dotnet test backend/ --filter "FullyQualifiedName~UpdateJobStatusHandler"` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | BUG-02 | unit | `dotnet test backend/ --filter "FullyQualifiedName~UpdateJobStatusHandler"` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 1 | BUG-03 | integration | `dotnet test backend/ --filter "FullyQualifiedName~WorkersController"` | ❌ W0 | ⬜ pending |
| 08-04-01 | 04 | 1 | BUG-04 | unit+integration | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandler"` | ❌ W0 | ⬜ pending |
| 08-04-02 | 04 | 1 | BUG-04 | unit | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandler"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/HandyLink.Tests/Unit/Features/Bids/GetBidsForJobHandlerTests.cs` — stubs for BUG-01
- [ ] `backend/HandyLink.Tests/Unit/Features/Jobs/UpdateJobStatusHandlerTests.cs` — stubs for BUG-02
- [ ] `backend/HandyLink.Tests/Unit/Features/Bids/RejectBidHandlerTests.cs` — stubs for BUG-04
- [ ] `backend/HandyLink.Tests/Integration/Controllers/WorkersControllerTests.cs` — covers BUG-03
- [ ] `TestDbSeeder` needs a `SeedBidAsync` helper for integration tests involving bids

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bid list renders in UI after fix | BUG-01 | Frontend rendering | Open job detail page as client, verify bids appear |
| Job status button advances correctly | BUG-02 | UI flow | Accept bid, click "Mark In Progress", verify status changes |
| Reject bid removes bid from UI | BUG-04 | UI flow | Open job detail, reject a bid, verify it disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
