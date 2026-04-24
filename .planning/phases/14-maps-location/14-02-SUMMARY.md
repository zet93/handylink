---
phase: 14-maps-location
plan: "02"
subsystem: frontend
tags: [location, maps, leaflet, react-leaflet, leaflet-geosearch, nominatim, jobs, workers]
dependency_graph:
  requires:
    - location fields on jobs table (from 14-01)
    - PUT /api/users/me/location endpoint (from 14-01)
    - GET /api/jobs response includes latitude/longitude/address (from 14-01)
  provides:
    - JobMap component — read-only Leaflet map with OSM tiles and single pin
    - LocationPicker component — Nominatim address search with Romanian filter, draggable confirmation map
    - PostJobPage sends optional latitude/longitude/address in POST /api/jobs
    - JobDetailPage renders embedded map when job has coordinates
    - EditProfilePage service area section for workers with radius selector
  affects:
    - PostJobPage.jsx
    - JobDetailPage.jsx
    - EditProfilePage.jsx
tech_stack:
  added:
    - react-leaflet@5.0.0
    - leaflet@1.9.4
    - leaflet-geosearch@4.4.0
  patterns:
    - Leaflet icon fix (delete _getIconUrl + mergeOptions) for Vite bundler compatibility
    - Nominatim address geocoding via OpenStreetMapProvider with countrycodes:ro
    - 400ms debounce on address search input
    - Draggable Marker via react-leaflet eventHandlers.dragend
key_files:
  created:
    - frontend/src/components/JobMap.jsx
    - frontend/src/components/LocationPicker.jsx
  modified:
    - frontend/src/pages/PostJobPage.jsx
    - frontend/src/pages/JobDetailPage.jsx
    - frontend/src/pages/EditProfilePage.jsx
    - frontend/package.json
decisions:
  - Location state in PostJobPage managed via useState (not react-hook-form) — compound field with lat/lng/address does not map cleanly to zod schema
  - RadiusSelector defined inline in EditProfilePage — small enough component, no need for separate file
  - Service area PUT /api/users/me/location fired in parallel with profile PUT /api/users/me using Promise.all
  - DraggableMarker sub-component defined inline in LocationPicker — used only in that file
metrics:
  duration: "~10 minutes"
  completed: "2026-04-20"
  tasks_completed: 2
  files_changed: 6
---

# Phase 14 Plan 02: Web Frontend Maps & Location Summary

React-Leaflet map display and Nominatim address search integrated into PostJobPage, JobDetailPage, and EditProfilePage using react-leaflet 5.0.0, leaflet 1.9.4, and leaflet-geosearch 4.4.0.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install packages + create JobMap and LocationPicker | 025f318 | package.json, package-lock.json, JobMap.jsx, LocationPicker.jsx |
| 2 | Integrate into PostJobPage, JobDetailPage, EditProfilePage | fe07044 | PostJobPage.jsx, JobDetailPage.jsx, EditProfilePage.jsx |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all location data flows from real API responses (backend Plan 01 wired lat/lng/address to real DB columns). When job has no coordinates, JobDetailPage hides the map section entirely (no stub/placeholder rendered).

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes. LocationPicker makes outbound requests to Nominatim (public OSM service) — this is read-only geocoding with no user PII sent beyond the address search query.

## Self-Check: PASSED

- [x] `frontend/src/components/JobMap.jsx` exists (contains `MapContainer`, `delete L.Icon.Default.prototype._getIconUrl`, `tile.openstreetmap.org`)
- [x] `frontend/src/components/LocationPicker.jsx` exists (contains `OpenStreetMapProvider`, `countrycodes: 'ro'`, `400`, `Remove location`, `Job Location (optional)`, `Search address, e.g. Strada Florilor, Cluj`)
- [x] `frontend/src/pages/PostJobPage.jsx` contains `LocationPicker` import and `location.latitude` in payload
- [x] `frontend/src/pages/JobDetailPage.jsx` contains `JobMap` import and `job.latitude && job.longitude` conditional
- [x] `frontend/src/pages/EditProfilePage.jsx` contains `Service Area (optional)`, `RadiusSelector`, `api/users/me/location`, radius options 10/20/50/100
- [x] `npx vite build` exits 0 (315 modules, no errors)
- [x] Commit 025f318 exists
- [x] Commit fe07044 exists
