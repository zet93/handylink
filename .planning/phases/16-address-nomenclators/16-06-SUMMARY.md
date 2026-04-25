---
phase: 16-address-nomenclators
plan: "06"
subsystem: ui
tags: [react-native, expo, modal, flatlist, nominatim, geocode, nomenclator]

requires:
  - phase: 16-01
    provides: ro-nomenclator.json asset with 42 counties and cities
  - phase: 16-04
    provides: county column on jobs and user_profiles tables
  - phase: 16-05
    provides: web CountyCityPicker reference implementation and D-05 pattern

provides:
  - CountyCityPickerMobile.tsx — reusable full-screen modal county+city picker for React Native
  - post-job.tsx with county/city modal pickers, D-05 Nominatim auto-center, county in API payload
  - profile.tsx (worker) with county/city modal pickers, county in PUT payload, Județ display row

affects: [mobile-post-job, mobile-worker-profile, nominatim-geocode]

tech-stack:
  added: []
  patterns:
    - "Full-screen modal picker with FlatList performance props (initialNumToRender=20, maxToRenderPerBatch=20, windowSize=5)"
    - "D-05: onCityChange triggers Nominatim geocode fetch to auto-center LocationPickerMobile"
    - "countyLabel derived from nomenclator.counties on county id — stored separately from county id"

key-files:
  created:
    - mobile/components/CountyCityPickerMobile.tsx
  modified:
    - mobile/app/(client)/post-job.tsx
    - mobile/app/(worker)/profile.tsx

key-decisions:
  - "profile?.county cast to (profile as any)?.county to match pre-existing untyped useQuery pattern — not a new TS debt"
  - "Edit Profile button re-derives countyLabel from nomenclator on entry — ensures label stays in sync with profile data"

patterns-established:
  - "CountyCityPickerMobile Props: county (id), countyLabel (display name), city, onCountyChange(id, name), onCityChange(name)"
  - "City FlatList always gets initialNumToRender=20 + maxToRenderPerBatch=20 + windowSize=5 (iOS jank prevention)"

requirements-completed: [NOM-01, NOM-02, NOM-03]

duration: 15min
completed: 2026-04-25
---

# Phase 16 Plan 06: Mobile CountyCityPickerMobile Summary

**Full-screen modal county+city pickers for React Native with Nominatim D-05 auto-center on post-job and county display in worker profile**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-25T12:27:00Z
- **Completed:** 2026-04-25T12:42:11Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- CountyCityPickerMobile.tsx built with two full-screen pageSheet modals: county (42 items, no perf props needed) and city (filtered, initialNumToRender=20 + maxToRenderPerBatch=20 + windowSize=5 per Pitfall 3)
- post-job.tsx updated: CountyCityPickerMobile replaces freeform city TextInput, county/countyLabel state added, handleCitySelect implements D-05 Nominatim geocode to auto-center map, county in mutation payload, Alert validation guards both county and city
- profile.tsx updated: CountyCityPickerMobile in edit mode, county in PUT payload, Județ read-only display row above City row, onSuccess and Edit Profile button both initialize countyLabel by looking up id in nomenclator

## Task Commits

1. **Task 1: Create CountyCityPickerMobile.tsx** - `a33e0a9` (feat) — committed prior session
2. **Task 2: Update post-job.tsx and profile.tsx** - `d2586dd` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `mobile/components/CountyCityPickerMobile.tsx` — Reusable modal picker; county FlatList (42 items) + city FlatList with perf props; minHeight 44 touch targets; palette-based styling
- `mobile/app/(client)/post-job.tsx` — Added county state, handleCitySelect (Nominatim D-05), CountyCityPickerMobile integration, county in payload, Alert county+city validation
- `mobile/app/(worker)/profile.tsx` — Added county/countyLabel state, CountyCityPickerMobile in edit section, county in PUT payload, Județ display row in read-only view

## Decisions Made

- `(profile as any)?.county` cast used in Edit Profile button handler — matches the pre-existing untyped `useQuery` pattern already present for `profile?.fullName`, `profile?.city` etc. Not new debt.
- Edit Profile button re-derives `countyLabel` from `nomenclator.counties` rather than relying on component state — ensures the label is always consistent with what the profile returned from the API.

## Deviations from Plan

None — plan executed exactly as written. Task 1 was already committed (a33e0a9) from a prior session. post-job.tsx already contained all Task 2 changes from a prior partial attempt; only profile.tsx required implementation work.

## Issues Encountered

- `npx tsc --noEmit` has 16 pre-existing errors (missing `@expo/vector-icons` types, untyped `useQuery` profile object, `notifications.ts` SDK mismatch). My changes introduced zero new errors — verified by stash/unstash comparison. The one new access (`profile?.county`) was fixed with the same `(profile as any)` cast used throughout the file.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- NOM-01, NOM-02, NOM-03 requirements fulfilled for mobile
- Phase 16 address nomenclators feature complete across web and mobile
- No blockers

---
*Phase: 16-address-nomenclators*
*Completed: 2026-04-25*
