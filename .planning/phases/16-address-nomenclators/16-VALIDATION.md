---
phase: 16
slug: address-nomenclators
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-24
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.9.3 + FluentAssertions 8.x (backend) / Vitest 4.1.0 (frontend) |
| **Config file** | `backend/HandyLink.Tests/HandyLink.Tests.csproj` / `frontend/vite.config.js` |
| **Quick run command** | `dotnet test backend/ --filter "FullyQualifiedName~CreateJob"` |
| **Full suite command** | `dotnet test backend/` and `npm run test` in `frontend/` |
| **Estimated runtime** | ~30 seconds (backend), ~10 seconds (frontend) |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test backend/ --filter "FullyQualifiedName~CreateJob"`
- **After every plan wave:** Run `dotnet test backend/` + `npm run test` in `frontend/`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~40 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-xx-01 | backend | 1 | NOM-01 | — | County persisted as parameterized string, no SQL injection | unit | `dotnet test backend/ --filter "FullyQualifiedName~CreateJobHandlerTests"` | Update existing | ⬜ pending |
| 16-xx-02 | backend | 1 | NOM-02 | — | CreateJobCommand accepts null County (backward compat) | unit | `dotnet test backend/ --filter "FullyQualifiedName~CreateJobHandlerTests"` | Update existing | ⬜ pending |
| 16-xx-03 | backend | 1 | NOM-03 | — | UpdateProfile saves County to profile | unit | `dotnet test backend/ --filter "FullyQualifiedName~UserServiceTests"` | Update existing | ⬜ pending |
| 16-xx-04 | backend | 1 | NOM-04 | — | GetJobByIdResponse includes County field | unit | `dotnet test backend/ --filter "FullyQualifiedName~GetJobByIdHandlerTests"` | Update existing | ⬜ pending |
| 16-xx-05 | data | 1 | NOM-05 | — | ro-nomenclator.json has 42 county entries | unit (JS) | `npm run test` in `frontend/` | ❌ Wave 0 gap | ⬜ pending |
| 16-xx-06 | data | 1 | NOM-06 | — | București county has exactly 6 sector cities | unit (JS) | `npm run test` in `frontend/` | ❌ Wave 0 gap | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `frontend/src/data/__tests__/ro-nomenclator.test.js` — stubs for NOM-05, NOM-06 (validate JSON structure: 42 counties, București has 6 sectors)
- Existing `backend/` test files updated in-place — no new test files needed for backend

*Backend: extend existing CreateJobHandlerTests, UserServiceTests, GetJobByIdHandlerTests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Web: county → city cascade works visually in PostJobPage | D-01, D-03 | UI interaction, no automated E2E | Open PostJobPage, pick a county, verify city dropdown populates and is enabled |
| Web: map auto-centers when city is selected (D-05) | D-05 | Visual map behavior | Pick county+city on PostJobPage, verify map pan to that city |
| Mobile: county modal slides up, city modal filters correctly | D-01, D-02 | React Native UI | Run on device/simulator, post-job screen, tap county field, verify modal appears |
| Mobile: disabled city picker (opacity 0.5) before county chosen | D-02 | Visual disabled state | Open post-job, verify city field is visually muted until county selected |
| EditProfilePage: save button enables after county/city change | RHF shouldDirty | RHF isDirty behavior | Edit profile, change county, verify Save button becomes active |
| Bucharest sectors in city list | D-09 | Data correctness | Select "București" county, verify city list shows Sector 1–6 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 40s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
