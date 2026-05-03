---
phase: 16-address-nomenclators
plan: "07"
subsystem: data
tags: [nomenclator, data, json, localities, romania]
dependency_graph:
  requires: []
  provides: [ro-nomenclator-full]
  affects: [frontend/src/data/ro-nomenclator.json, mobile/assets/ro-nomenclator.json]
tech_stack:
  added: []
  patterns: [static-json-asset]
key_files:
  created: []
  modified:
    - frontend/src/data/ro-nomenclator.json
    - mobile/assets/ro-nomenclator.json
    - frontend/src/data/__tests__/ro-nomenclator.test.js
decisions:
  - "Used source locality entries without 'comuna' field as top-level localities (municipalities, towns, communes) — entries WITH 'comuna' are villages/sate subordinate to a commune"
  - "Bucharest source already contains exactly 6 sectors — no override needed"
metrics:
  duration: "5min"
  completed: "2026-04-26"
  tasks_completed: 2
  files_modified: 3
---

# Phase 16 Plan 07: Regenerate Nomenclator with Full Commune Coverage Summary

Regenerated ro-nomenclator.json from the virgil-av SIRUTA source to include all municipalities, towns (orașe), and communes (comune) for every Romanian county — filtering out villages (sate) subordinate to communes.

## What Was Done

### Task 1: Fetch source and generate complete nomenclator JSON (ccd0732)
- Fetched https://raw.githubusercontent.com/virgil-av/judet-oras-localitati-romania/master/judete.json
- Filtered localities: included entries WITHOUT `comuna` field (top-level), excluded entries WITH `comuna` field (villages/sate)
- Generated 2,898 city entries across 42 counties (was 359)
- Arad (AR): 11 → 74 localities
- Bucharest (B): 6 sectors preserved (source already correct)
- Written to both frontend/src/data/ro-nomenclator.json and mobile/assets/ro-nomenclator.json (identical content)

### Task 2: Update nomenclator test to reflect new counts (9b76f51)
- Added NOM-07: AR county >= 50 city entries
- Added NOM-08: total city count > 1000
- All 7 tests pass (5 existing + 2 new)

## Deviations from Plan

None - plan executed exactly as written. The `comuna` field classification rule described in the plan's context matched the actual source data structure.

## Verification Results

| Check | Result |
|-------|--------|
| AR count >= 50 | 74 (PASS) |
| B sectors === 6 | 6 (PASS) |
| Total > 1000 | 2898 (PASS) |
| Mobile matches web | true (PASS) |
| All vitest tests | 7/7 PASS |

## Self-Check: PASSED

- `frontend/src/data/ro-nomenclator.json` — exists, 2898 cities
- `mobile/assets/ro-nomenclator.json` — exists, 2898 cities
- `frontend/src/data/__tests__/ro-nomenclator.test.js` — exists, 7 tests pass
- Commit ccd0732 — exists (feat)
- Commit 9b76f51 — exists (test)
