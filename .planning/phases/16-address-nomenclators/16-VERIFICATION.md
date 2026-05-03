---
phase: 16-address-nomenclators
verified: 2026-04-26T08:30:00Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "UserResponseDto missing County — County field added at position 6; UserService.ToDto now passes p.County"
    - "Mobile profile.tsx sent full_name (snake_case) — fixed to fullName (camelCase) on line 76"
    - "City dropdown showed partial localities (11 for Arad) — regenerated to 2898 entries including all communes"
    - "Map did not re-center on second city selection — MapRecenter component with flyTo added to LocationPicker.jsx"
    - "Save button stayed disabled after county change — shouldTouch: true added to all setValue calls"
    - "Android modal did not open on tap — presentationStyle removed from both Modal elements"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Map re-centers on second city selection"
    expected: "After selecting one city (map appears), selecting a different city should visually fly the map to the new city's coordinates"
    why_human: "Requires a running Vite dev server and user interaction with the city dropdown — cannot drive Leaflet flyTo programmatically in a test environment"
  - test: "Save button activates after county change in EditProfilePage"
    expected: "User loads Edit Profile (county already set from API), changes the Județ dropdown to a different county — Save button should become enabled"
    why_human: "Requires a live API with a user that has a previously saved county; isDirty state is RHF runtime behavior not verifiable by static analysis"
  - test: "County picker pre-populates on Edit Profile reload (regression check for WR-01 fix)"
    expected: "Reload EditProfilePage after saving a county — county picker shows the previously saved county pre-selected"
    why_human: "Round-trip requires live API + Supabase database with a real user session"
  - test: "Mobile county modal opens on Android tap"
    expected: "Tapping the Județ field in edit mode on the worker profile opens a full-screen slide-in modal listing all 42 counties"
    why_human: "Modal behavior on Android requires a device/emulator; presentationStyle removal effectiveness cannot be verified by static analysis"
  - test: "Mobile city modal opens after county is selected"
    expected: "After selecting a county in the mobile picker, tapping Oraș / Comună field opens a modal listing communes/cities for that county"
    why_human: "Same as above — requires Android device or emulator"
---

# Phase 16: Address Nomenclators — Re-Verification Report

**Phase Goal:** Close 4 UAT gaps — map re-centers on city change; Edit Profile Save activates after county change; communes in city dropdown; mobile worker profile modal opens on tap.
**Verified:** 2026-04-26T08:30:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (previous status: gaps_found, score 3/5)

## Re-verification Summary

All 6 previously failing items are now closed. The 2 original structural gaps (UserResponseDto County, mobile full_name key) were fixed alongside the 4 new UAT gap fixes from plans 07/08/09. All 7 must-haves now pass static verification. Status is human_needed because 5 behavioral items require a running app or device to confirm.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | City dropdown shows communes (not just municipalities/towns) | VERIFIED | ro-nomenclator.json regenerated: 2898 entries (was 359); AR county: 74 entries (was 11); all entries from SIRUTA source without `comuna` field (top-level localities) |
| 2 | Selecting a second city moves the Leaflet map to the new city | VERIFIED (static) | `MapRecenter` component at LocationPicker.jsx:15-21 uses `useMap().flyTo([lat, lng], 14)` in `useEffect` watching `lat, lng, map`; rendered as `<MapRecenter lat={latitude} lng={longitude} />` inside `MapContainer` at line 118 |
| 3 | Save button in EditProfilePage activates after county dropdown change | VERIFIED (static) | CountyCityPicker.jsx `handleCountyChange` calls `setValue('county', e.target.value, { shouldDirty: true, shouldTouch: true })` and `setValue('city', '', { shouldDirty: true, shouldTouch: true })`; `handleCityChange` also uses `shouldTouch: true` — 3 occurrences confirmed |
| 4 | Tapping Județ/Oraș fields on mobile opens the picker modal | VERIFIED (static) | CountyCityPickerMobile.tsx has zero `presentationStyle` occurrences; both Modal elements retain `animationType="slide"` and `onRequestClose` — 2 occurrences each |
| 5 | Web and mobile use identical nomenclator data | VERIFIED | frontend/src/data/ro-nomenclator.json: 2898 cities; mobile/assets/ro-nomenclator.json: 2898 cities — files confirmed identical by count |
| 6 | County round-trips through backend to profile response | VERIFIED | UserResponseDto.cs line 9: `string? County`; UserService.cs line 62: `p.County` passed to ToDto constructor — gap WR-01 closed |
| 7 | Mobile profile save persists name correctly | VERIFIED | mobile/app/(worker)/profile.tsx line 76: `api.put('/api/users/me', { fullName: name, city, county })` — camelCase key; gap WR-04 closed |

**Score:** 7/7 must-haves verified

### Deferred Items

None.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/data/ro-nomenclator.json` | Full communes — 2898 entries | VERIFIED | 2898 cities; 42 counties; AR=74; B=6 sectors |
| `mobile/assets/ro-nomenclator.json` | Identical copy | VERIFIED | 2898 cities — matches web |
| `frontend/src/data/__tests__/ro-nomenclator.test.js` | NOM-07 (AR>=50) + NOM-08 (total>1000) tests | VERIFIED | Lines 39-47: NOM-07 and NOM-08 present; 7 total tests |
| `frontend/src/components/LocationPicker.jsx` | MapRecenter with useMap().flyTo() | VERIFIED | Lines 15-21: `function MapRecenter({ lat, lng })` using `useMap()` + `useEffect` with `flyTo`; used at line 118 inside `MapContainer` |
| `frontend/src/components/CountyCityPicker.jsx` | shouldTouch: true in all setValue calls | VERIFIED | Lines 11, 12, 16: all 3 setValue calls include `{ shouldDirty: true, shouldTouch: true }` |
| `mobile/components/CountyCityPickerMobile.tsx` | No presentationStyle on either Modal | VERIFIED | Zero occurrences of `presentationStyle`; both Modals retain `animationType="slide"` |
| `backend/HandyLink.Core/DTOs/UserResponseDto.cs` | string? County field | VERIFIED | Line 9: `string? County,` — previously missing, now present |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| LocationPicker.jsx `MapContainer` | MapRecenter | `<MapRecenter lat={latitude} lng={longitude} />` at line 118 | WIRED | Inside MapContainer; receives live latitude/longitude props |
| MapRecenter | Leaflet map | `useMap().flyTo([lat, lng], 14)` in useEffect | WIRED | Triggered on lat/lng change |
| CountyCityPicker.jsx `handleCountyChange` | RHF isDirty | `setValue('county', ..., { shouldDirty: true, shouldTouch: true })` | WIRED | Both county and city cleared with shouldTouch |
| CountyCityPickerMobile.tsx county trigger | County Modal | `onPress={() => setCountyModalVisible(true)}` | WIRED | No presentationStyle blocking; animationType="slide" |
| CountyCityPickerMobile.tsx city trigger | City Modal | `onPress={() => setCityModalVisible(true)}` | WIRED | No presentationStyle blocking; animationType="slide" |
| ro-nomenclator.json | CountyCityPicker.jsx | `import nomenclator from '../data/ro-nomenclator.json'` | WIRED | 2898 cities available to county/city dropdowns |
| ro-nomenclator.json | CountyCityPickerMobile.tsx | `import nomenclator from '../assets/ro-nomenclator.json'` | WIRED | 2898 cities available to mobile modals |
| UserService.ToDto | UserResponseDto | `p.County` at position 6 in constructor call | WIRED | Previously omitted; now included |
| mobile profile.tsx mutation | PUT /api/users/me | `{ fullName: name, city, county }` | WIRED | camelCase key; binds to UpdateUserDto.FullName |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| LocationPicker.jsx MapRecenter | `lat`, `lng` props | `latitude`/`longitude` props from parent (PostJobPage city selection flow) | Yes — geocoded from Nominatim on city select | FLOWING |
| CountyCityPicker.jsx | `cities` | `nomenclator.cities.filter(c => c.county_id === countyId)` | Yes — 2898-entry JSON, up to 74 for Arad | FLOWING |
| CountyCityPickerMobile.tsx | `cities` | `nomenclator.cities.filter(c => c.county_id === county)` | Yes — same 2898-entry JSON | FLOWING |
| EditProfilePage.jsx | `county` (reset) | `userProfile.county` from GET /api/users/me → UserResponseDto.County | Yes — County now in response DTO | FLOWING |
| mobile profile.tsx | `county` state | `data.county` from useQuery → GET /api/users/me | Yes — County now in response DTO | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — all artifacts require a running Vite dev server or Expo app. Static structure checks confirm implementation is in place.

| Behavior | Static Check | Result | Status |
|----------|-------------|--------|--------|
| Nomenclator 2898 entries | `node -e` count on JSON | 2898 | PASS |
| AR county 74 entries | `node -e` filter on JSON | 74 | PASS |
| B sectors 6 | `node -e` filter on JSON | 6 | PASS |
| MapRecenter exists and uses flyTo | grep on LocationPicker.jsx | Lines 15-21 confirmed | PASS |
| JobMap import removed | grep on LocationPicker.jsx | Zero matches | PASS |
| shouldTouch in CountyCityPicker | grep on CountyCityPicker.jsx | 3 matches on lines 11, 12, 16 | PASS |
| presentationStyle absent in mobile picker | grep on CountyCityPickerMobile.tsx | Zero matches | PASS |
| animationType preserved | grep on CountyCityPickerMobile.tsx | 2 matches | PASS |
| UserResponseDto has County | grep on UserResponseDto.cs | Line 9 confirmed | PASS |
| UserService.ToDto passes p.County | grep on UserService.cs | Line 62 confirmed | PASS |
| Mobile profile.tsx uses fullName | grep on profile.tsx | Line 76 confirmed | PASS |
| Mobile nomenclator matches web | `node -e` count | 2898 | PASS |

---

## Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| NOM-DATA | 07 | Full commune coverage in nomenclator | VERIFIED | 2898 entries; AR=74; NOM-07 and NOM-08 tests added |
| D-05 | 08 | Map re-centers on city selection | VERIFIED (static) | MapRecenter flyTo wired in LocationPicker.jsx |
| D-03 | 08 | Save activates on county change | VERIFIED (static) | shouldTouch: true in all setValue calls |
| D-02 | 09 | Mobile picker modal opens on tap | VERIFIED (static) | presentationStyle removed from both modals |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `frontend/src/pages/PostJobPage.jsx` | ~33-43 | `handleCitySelect` has no try/catch around Nominatim fetch | Warning | Pre-existing; unhandled rejection on network failure; not introduced by these plans |
| `mobile/app/(client)/post-job.tsx` | ~65-75 | `handleCitySelect` has no try/catch around Nominatim fetch | Warning | Pre-existing; same risk as above |

No new anti-patterns introduced by plans 07, 08, or 09.

---

## Human Verification Required

### 1. Map Re-center on Second City Selection

**Test:** Open Post Job page, select a county and city — map appears. Without refreshing, change the city dropdown to a different city.
**Expected:** Map visually animates (flyTo) to the new city's coordinates; map pin moves.
**Why human:** Leaflet flyTo is a runtime side-effect triggered by React's useEffect; cannot drive in static test.

### 2. Save Button Activates After County Change

**Test:** Log in as a user with a saved county. Open Edit Profile — county is pre-populated. Change the Județ dropdown to a different county.
**Expected:** Save button becomes enabled (isDirty = true).
**Why human:** isDirty computation depends on RHF runtime state after reset(); requires live form interaction.

### 3. County Pre-population on Edit Profile (WR-01 regression check)

**Test:** Save a county via Edit Profile (web or mobile). Reload the page or re-enter edit mode.
**Expected:** County picker shows the previously saved county pre-selected.
**Why human:** Round-trip requires live API + Supabase database with a real user session.

### 4. Mobile County Modal Opens on Tap (Android)

**Test:** On an Android device or emulator, open the worker profile, tap Edit Profile, tap the Județ field.
**Expected:** Full-screen slide-up modal appears listing all 42 Romanian counties.
**Why human:** Modal render behavior on Android requires a device/emulator; presentationStyle removal cannot be verified by static analysis.

### 5. Mobile City Modal Opens After County Selected

**Test:** After selecting a county in the worker profile edit mode, tap the Oraș / Comună field.
**Expected:** Modal opens with the list of communes/cities for the selected county (up to 74 for Arad).
**Why human:** Same constraint as above — requires Android device or emulator.

---

## Gaps Summary

No gaps. All 7 must-haves pass static verification. The 2 gaps from the previous verification (WR-01 UserResponseDto County, WR-04 mobile full_name key) are confirmed closed. The 4 UAT gap fixes from plans 07/08/09 are confirmed present and wired. Status is human_needed because 5 behavioral tests require a running app or Android device.

---

_Verified: 2026-04-26T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
