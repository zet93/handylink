---
phase: 15-analytics-observability
plan: "03"
subsystem: infrastructure
tags: [backup, operations, github-actions, devops]
dependency_graph:
  requires: []
  provides: [OPS-02, OPS-03]
  affects: []
tech_stack:
  added:
    - supabase/setup-cli@v1 (GitHub Actions)
    - actions/upload-artifact@v4 with 30-day retention
  patterns:
    - GitHub Actions cron schedule for automated backups
    - GitHub encrypted secrets for DB connection string
key_files:
  created:
    - .github/workflows/backup.yml
    - OPERATIONS.md
  modified: []
decisions:
  - workflow_dispatch added alongside cron to allow manual verification runs before first scheduled execution
  - backup.sql uploaded as GitHub artifact (private to repo collaborators) — acceptable for beta solo-dev project (T-15-09 accepted)
  - SUPABASE_DB_URL transmitted exclusively via GitHub encrypted secret, never committed (T-15-08 mitigated)
metrics:
  duration: "~5 minutes"
  completed: "2026-04-23T18:41:08Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 15 Plan 03: Supabase Backup + Dependency Operations Summary

**One-liner:** Daily Supabase DB backup cron workflow with 30-day GitHub artifact retention, plus a monthly dependency update checklist with immediate security patch process.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Supabase backup GitHub Actions workflow | 2493c79 | .github/workflows/backup.yml |
| 2 | Create OPERATIONS.md dependency update process | 2a53399 | OPERATIONS.md |

## What Was Built

**Task 1 — backup.yml**

GitHub Actions workflow that:
- Runs daily at 02:00 UTC via `schedule: cron: '0 2 * * *'`
- Also supports `workflow_dispatch` for manual test runs from the GitHub Actions UI
- Installs Supabase CLI via `supabase/setup-cli@v1` (no `actions/checkout` needed — no source code to check out)
- Dumps the database directly via `supabase db dump --db-url "${{ secrets.SUPABASE_DB_URL }}" -f backup.sql`
- Uploads `backup.sql` as a GitHub artifact named `supabase-backup-{run_id}` with `retention-days: 30`

The developer must add `SUPABASE_DB_URL` as a GitHub repository secret. Value found at: Supabase dashboard → Settings → Database → Connection string (URI format).

**Task 2 — OPERATIONS.md**

Operations runbook at repo root documenting:
- Monthly dependency checks for backend (NuGet), frontend (npm), and mobile (Expo) with exact commands
- Immediate security patch workflow with dedicated branch naming convention (`security/patch-<pkg>-<version>`)
- Full update workflow (branch → update → test → build → smoke → PR)
- Key commands reference table
- External service update notes for Supabase, Stripe, PostHog, and Sentry

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-15-08 | SUPABASE_DB_URL referenced only via `${{ secrets.SUPABASE_DB_URL }}` — GitHub masks in logs, never committed |
| T-15-09 | Accepted — GitHub artifacts are private to repo collaborators; acceptable for beta |
| T-15-10 | Non-issue by design — workflow uses `schedule` + `workflow_dispatch` only, no push trigger |

## Known Stubs

None — both files are complete and self-contained.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. The backup workflow introduces a new trust boundary (GitHub Actions → Supabase DB) which was already modeled in the plan's threat register.

## Self-Check: PASSED

- [x] `.github/workflows/backup.yml` exists and YAML is valid
- [x] `OPERATIONS.md` exists at repo root
- [x] Commit `2493c79` exists
- [x] Commit `2a53399` exists
- [x] backup.yml contains `cron: '0 2 * * *'`, `retention-days: 30`, `SUPABASE_DB_URL`, `supabase db dump`, `workflow_dispatch`
- [x] OPERATIONS.md contains `security patches`, `npm audit`, `dotnet list backend/ package --outdated`, `npx expo install --check`, checklist format (`- [ ]`)
