---
phase: 9
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.9.3 + FluentAssertions 8.x |
| **Config file** | `backend/HandyLink.Tests/HandyLink.Tests.csproj` |
| **Quick run command** | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests"` |
| **Full suite command** | `dotnet test backend/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests"`
- **After every plan wave:** Run `dotnet test backend/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | SEC-01, SEC-02, SEC-03, SEC-04, SEC-05 | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests"` | ❌ Wave 0 | ⬜ pending |
| 09-02-01 | 02 | 1 | SEC-03, SEC-04, SEC-05 | Integration | `dotnet test backend/ --filter "FullyQualifiedName~SecurityTests"` | ❌ Wave 0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `backend/HandyLink.Tests/Integration/Controllers/SecurityTests.cs` — integration tests covering SEC-01 through SEC-05
- [ ] `CustomWebAppFactory` must expose `Cors:AllowedOrigins` config for CORS tests

*Wave 0 stub file is created in the first plan task before implementation code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CORS headers verified in browser DevTools | SEC-05 | Browser-specific Origin header behavior | Open app in Chrome DevTools → Network tab → verify CORS headers on API responses |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
