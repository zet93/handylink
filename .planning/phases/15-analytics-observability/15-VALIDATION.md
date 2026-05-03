---
phase: 15
slug: analytics-observability
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-21
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.9.3 (backend) + Vitest 4.1.0 (frontend) |
| **Config file** | `frontend/vite.config.js` (jsdom environment set) |
| **Quick run command (backend)** | `dotnet test backend/ --filter "FullyQualifiedName~Analytics"` |
| **Quick run command (frontend)** | `npm run test` (from `frontend/`) |
| **Full suite command** | `dotnet test backend/ && npm run test --prefix frontend` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --prefix frontend`
- **After every plan wave:** Run `dotnet test backend/ && npm run test --prefix frontend`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 02 | 1 | ANLX-01 | T-15-01 | `posthog.capture` not called before consent granted | unit (component) | `npm run test --prefix frontend -- --grep "analytics"` | ✓ created in Plan 02 T1 | ⬜ pending |
| 15-01-02 | 02 | 1 | ANLX-01 | T-15-02 | `posthog.identify` only passes UUID, not email | unit (component) | `npm run test --prefix frontend -- --grep "identify"` | ✓ created in Plan 02 T1 | ⬜ pending |
| 15-02-01 | 02 | 2 | OPS-02 | — | N/A | CI smoke | GitHub Actions run log review | ❌ Wave 0 | ⬜ pending |
| 15-01-03 | 01 | 1 | ANLX-02 | — | N/A | manual-only | N/A — PostHog dashboard config | manual | ⬜ pending |
| 15-01-04 | 01 | 1 | ANLX-03 | — | N/A | manual-only | N/A — PostHog dashboard config | manual | ⬜ pending |
| 15-02-02 | 02 | 2 | OPS-01 | — | N/A | manual-only | N/A — UptimeRobot external config | manual | ⬜ pending |
| 15-02-03 | 02 | 2 | OPS-03 | — | N/A | manual review | N/A — doc review | manual | ⬜ pending |
| 15-02-04 | 02 | 2 | OPS-04 | — | N/A | deferred | — | deferred | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/components/__tests__/CookieBanner.test.jsx` — stubs for ANLX-01 consent gate behavior (PostHog capture blocked before consent)
- [ ] `.github/workflows/backup.yml` — covers OPS-02; verify syntax via `act` or first push

*Existing xUnit and Vitest infrastructure covers the runner setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Funnel report visible in PostHog dashboard | ANLX-02 | External SaaS dashboard configuration, not code | Log in to PostHog EU, verify funnel from landing → bid/post job exists |
| Usage trends dashboard visible | ANLX-03 | External SaaS — dashboard config only | Log in to PostHog EU, verify events appear in Insights |
| UptimeRobot monitor created and alerting | OPS-01 | External service setup, no code | Log in to UptimeRobot, verify monitor exists and alert email set |
| Dependency update process documented | OPS-03 | Documentation review | Read OPERATIONS.md at repo root, verify checklist is present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
