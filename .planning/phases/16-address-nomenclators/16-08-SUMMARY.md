---
phase: 16-address-nomenclators
plan: "08"
subsystem: frontend
tags: [bug-fix, leaflet, react-hook-form, uat-fix]
dependency_graph:
  requires: []
  provides: [map-recenter-on-city-change, isdirty-on-county-change]
  affects: [PostJobPage, EditProfilePage]
tech_stack:
  added: []
  patterns: [react-leaflet-useMap, rhf-shouldTouch]
key_files:
  created: []
  modified:
    - frontend/src/components/LocationPicker.jsx
    - frontend/src/components/CountyCityPicker.jsx
decisions:
  - "Option A chosen for map fix: inline MapContainer in LocationPicker rather than modifying shared JobMap component"
  - "shouldTouch: true added alongside shouldDirty: true to trigger isDirty computation path after reset()"
metrics:
  duration: 64s
  completed: "2026-04-26T07:17:19Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 16 Plan 08: UAT Bug Fixes — Map Re-center and Save Button Summary

Fix two UAT failures: Leaflet map does not re-center on second city selection; Save button stays disabled after county dropdown change in EditProfilePage.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix map re-center on subsequent city selection | e3dbbab | LocationPicker.jsx |
| 2 | Fix isDirty not activating on county dropdown change | ee76b30 | CountyCityPicker.jsx |

## What Was Built

**Task 1 — MapRecenter in LocationPicker.jsx:**
Replaced the `<JobMap>` child with an inline `MapContainer` containing a new `MapRecenter` inner component. `MapRecenter` uses `useMap()` from react-leaflet and calls `map.flyTo([lat, lng], 14)` inside a `useEffect` whenever `lat` or `lng` props change. The leaflet CSS import and icon fix (previously only in JobMap.jsx) were copied into LocationPicker.jsx to maintain correct marker rendering.

**Task 2 — shouldTouch in CountyCityPicker.jsx:**
Added `shouldTouch: true` to all three `setValue` calls in `handleCountyChange` (2 calls) and `handleCityChange` (1 call). React Hook Form v7 does not reliably compute `isDirty` from `shouldDirty` alone when the field was initially populated via `reset()` — adding `shouldTouch` forces the dirty state computation path to run correctly.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `grep MapRecenter LocationPicker.jsx` — 2 hits (definition + usage)
- `grep flyTo LocationPicker.jsx` — 1 hit
- `grep "import JobMap" LocationPicker.jsx` — no result (correct)
- `grep shouldTouch CountyCityPicker.jsx` — 3 hits
- Frontend vitest: 28/28 tests passed

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `frontend/src/components/LocationPicker.jsx` — exists, contains MapRecenter + flyTo
- `frontend/src/components/CountyCityPicker.jsx` — exists, contains shouldTouch: true (3x)
- Commit e3dbbab — present in git log
- Commit ee76b30 — present in git log
