---
phase: 14-maps-location
plan: "03"
subsystem: mobile
tags: [react-native-maps, maps, location, nominatim, expo, mobile]

requires:
  - phase: 14-maps-location/14-01
    provides: PUT /api/users/me/location endpoint and location fields on jobs API
  - phase: 14-maps-location/14-02
    provides: web frontend location components as design reference

provides:
  - react-native-maps installed at Expo SDK 55 compatible version (1.27.2)
  - JobMapMobile component — read-only MapView with Marker for job detail
  - LocationPickerMobile component — Nominatim address search with Romanian filter, confirmation map, clear option
  - post-job screen sends latitude/longitude/address in POST /api/jobs payload
  - job-detail screen shows embedded map when job has coordinates, hides when not
  - worker profile screen has Service Area section with city search and radius selector (10/20/50/100 km)

affects:
  - mobile screens using job or worker location data

tech-stack:
  added:
    - react-native-maps@1.27.2 (Expo SDK 55 pinned)
  patterns:
    - Nominatim HTTP fetch with User-Agent header for address geocoding on mobile
    - Inline component definition (RadiusSelector) within screen file for co-location
    - Conditional map render based on nullable lat/lng (hide section when no coordinates)

key-files:
  created:
    - mobile/components/JobMapMobile.tsx
    - mobile/components/LocationPickerMobile.tsx
  modified:
    - mobile/package.json
    - mobile/app.json
    - mobile/app/(client)/post-job.tsx
    - mobile/app/(client)/job-detail.tsx
    - mobile/app/(worker)/profile.tsx

key-decisions:
  - "expo-location not installed — Nominatim text search only; no device GPS in this phase"
  - "iOS uses Apple Maps natively (no iosGoogleMapsApiKey); Android uses Google Maps via GOOGLE_MAPS_API_KEY env var"
  - "RadiusSelector defined inline in profile.tsx — too small to warrant a separate component file"
  - "Service Area save is chained in the existing saveProfile mutationFn — no separate save button"

patterns-established:
  - "Mobile location picker uses same Nominatim API as web, with countrycodes=ro filter"
  - "Map height always 250px explicit (Expo pitfall — flex height unreliable for MapView)"

requirements-completed: [MAP-01, MAP-02, MAP-03]

duration: ~15min
completed: "2026-04-20"
---

# Phase 14 Plan 03: Mobile Maps & Location Summary

**react-native-maps integrated into Expo app with Nominatim address search on post-job and worker profile, conditional map display on job-detail**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-04-20
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Installed react-native-maps@1.27.2 (Expo SDK 55 compatible) and configured app.json plugin for Android Google Maps
- Created JobMapMobile (read-only 250px MapView with Marker) and LocationPickerMobile (Nominatim search, debounced 400ms, Romanian filter, confirmation map, clear option)
- Integrated LocationPickerMobile into post-job screen; latitude/longitude/address sent in POST /api/jobs payload
- Integrated JobMapMobile into job-detail screen with conditional render (hidden when job has no coordinates)
- Added Service Area section to worker profile with LocationPickerMobile and RadiusSelector (10/20/50/100 km segmented buttons, 44px touch targets); location saved via PUT /api/users/me/location on profile save

## Task Commits

1. **Task 1: Install packages + configure app.json + create JobMapMobile and LocationPickerMobile** - `32f6e6a` (feat)
2. **Task 2: Integrate LocationPickerMobile into post-job + JobMapMobile into job-detail + service area into worker profile** - `1b62791` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `mobile/components/JobMapMobile.tsx` - Read-only MapView with Marker, 250px height, borderRadius 10
- `mobile/components/LocationPickerMobile.tsx` - Nominatim address search with debounce, FlatList results, confirmation map, remove button
- `mobile/package.json` - Added react-native-maps dependency
- `mobile/app.json` - Added react-native-maps plugin with androidGoogleMapsApiKey
- `mobile/app/(client)/post-job.tsx` - Added location state + LocationPickerMobile + lat/lng/address in API payload
- `mobile/app/(client)/job-detail.tsx` - Added JobMapMobile with conditional render
- `mobile/app/(worker)/profile.tsx` - Added serviceLocation state, RadiusSelector, Service Area section, location save call

## Decisions Made

- expo-location not installed — Nominatim text search satisfies MAP-01/03 without requiring location permissions
- iOS omits Google Maps API key (uses Apple Maps natively); Android uses `$GOOGLE_MAPS_API_KEY` environment variable via app.json plugin
- RadiusSelector defined inline in profile.tsx — small enough (15 lines) to not justify a separate component file
- Service area location save is chained into the existing saveProfile mutation rather than adding a separate save button, keeping the UX simple

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

The worktree has no `node_modules` directory, so `npx tsc --noEmit` in the worktree context fails due to missing module type declarations. TypeScript was verified using the main repo's `node_modules/.bin/tsc` — all errors in the output are pre-existing (missing `@expo/vector-icons` types, implicit any on profile data, notifications API mismatch). No new errors introduced by Task 2 changes.

## User Setup Required

None for this plan. The `GOOGLE_MAPS_API_KEY` environment variable is required in EAS build configuration for Android map tiles, but that was documented in Plan 01/02 context and is an EAS build concern, not a local dev concern.

## Next Phase Readiness

- Full mobile location feature set complete (MAP-01, MAP-02, MAP-03)
- Phase 14 maps & location phase is fully implemented across backend (14-01), web (14-02), and mobile (14-03)
- Android Google Maps requires `GOOGLE_MAPS_API_KEY` set in EAS secrets before production build

---

## Self-Check: PASSED

- [x] `mobile/components/JobMapMobile.tsx` exists
- [x] `mobile/components/LocationPickerMobile.tsx` exists
- [x] `mobile/app/(client)/post-job.tsx` contains `LocationPickerMobile` import and `location.latitude` in payload
- [x] `mobile/app/(client)/job-detail.tsx` contains `JobMapMobile` import and `job.latitude && job.longitude` conditional
- [x] `mobile/app/(worker)/profile.tsx` contains `Service Area (optional)`, `RadiusSelector`, `api/users/me/location`
- [x] Commit 32f6e6a exists (Task 1)
- [x] Commit 1b62791 exists (Task 2)

*Phase: 14-maps-location*
*Completed: 2026-04-20*
