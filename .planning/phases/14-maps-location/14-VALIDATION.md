---
phase: 14
slug: maps-location
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit (backend) / Vitest (frontend) / Jest via Expo (mobile) |
| **Config file** | backend/HandyLink.Tests / frontend/vite.config.js / mobile/jest.config.js |
| **Quick run command** | `dotnet test backend/ --filter "FullyQualifiedName~Maps"` |
| **Full suite command** | `dotnet test backend/ && npm run test --prefix frontend` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test backend/ --filter "FullyQualifiedName~Maps"`
- **After every plan wave:** Run `dotnet test backend/ && npm run test --prefix frontend`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | MAP-01 | unit | `dotnet test backend/ --filter "FullyQualifiedName~Location"` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | MAP-01 | integration | `dotnet test backend/ --filter "FullyQualifiedName~Job"` | ✅ | ⬜ pending |
| 14-02-01 | 02 | 2 | MAP-02 | manual | see manual table | N/A | ⬜ pending |
| 14-03-01 | 03 | 2 | MAP-03 | manual | see manual table | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/HandyLink.Tests/Features/Maps/` — test stubs for MAP-01 location field validation
- [ ] Existing Job test fixtures extended with Location field

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map renders with job pin on job detail screen | MAP-02 | Requires visual UI + map tile loading | Open job detail in mobile app, verify map shows pinned location |
| Worker profile shows service area on map | MAP-03 | Requires visual UI + geocoding | Open worker profile in mobile app, verify service area is displayed |
| Address autocomplete returns results | MAP-01 | Requires live Google/MapBox API | Type in job location field, verify dropdown suggestions appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
