---
phase: 13
slug: notifications-mobile-testing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.9.3 + FluentAssertions + Moq |
| **Config file** | `backend/HandyLink.Tests/HandyLink.Tests.csproj` |
| **Quick run command** | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandlerTests|FullyQualifiedName~UpdateJobStatusHandlerTests"` |
| **Full suite command** | `dotnet test backend/` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandlerTests|FullyQualifiedName~UpdateJobStatusHandlerTests"`
- **After every plan wave:** Run `dotnet test backend/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | NOTF-03 | unit | `dotnet test backend/ --filter "FullyQualifiedName~RejectBidHandlerTests"` | ✅ (update) | ⬜ pending |
| 13-01-02 | 01 | 1 | NOTF-03 | unit | `dotnet test backend/ --filter "FullyQualifiedName~UpdateJobStatusHandlerTests"` | ✅ (update) | ⬜ pending |
| 13-01-03 | 01 | 2 | NOTF-01, NOTF-02, NOTF-03 | unit | `dotnet test backend/` | ✅ | ⬜ pending |
| 13-02-01 | 02 | 1 | MOB-01 | manual | — | — | ⬜ pending |
| 13-02-02 | 02 | 1 | MOB-02 | manual | — | — | ⬜ pending |
| 13-02-03 | 02 | 1 | MOB-03 | manual | — | — | ⬜ pending |
| 13-02-04 | 02 | 1 | MOB-04 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No new test files need to be created. Existing test classes must be updated before other tasks:

- [ ] `backend/HandyLink.Tests/Features/Bids/RejectBidHandlerTests.cs` — add `IMediator` to `Build()` factory, add test case `Handle_SendsPushNotification_WhenBidRejected`
- [ ] `backend/HandyLink.Tests/Features/Jobs/UpdateJobStatusHandlerTests.cs` — add `IMediator` to `Build()` factory, seed `AcceptedBid` navigation in test data, add test cases for each status notification type

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App launches on Android without crash | MOB-01 | Requires physical device | Open app on Android, tap through all nav flows, confirm no crash/red screen |
| App launches on iOS without crash | MOB-02 | Requires physical device or simulator | Open app on iOS device or simulator, confirm all screens load |
| Navigation flows complete on physical devices | MOB-03 | Device-specific rendering | Client: post job → view bids → accept bid. Worker: browse → bid → my-bids |
| Push notifications delivered and tappable on physical devices | MOB-04 | Requires Expo/EAS push infrastructure | Trigger job event (bid submit, accept, status change) — verify notification appears and tap routes correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
