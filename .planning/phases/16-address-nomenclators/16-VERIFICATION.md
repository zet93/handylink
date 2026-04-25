---
phase: 16-address-nomenclators
verified: 2026-04-25T14:00:00Z
status: gaps_found
score: 3/5 success criteria verified
overrides_applied: 0
gaps:
  - truth: "Stored addresses are normalized and consistent across job posts and worker profiles"
    status: failed
    reason: "UserResponseDto has no County field and UserService.ToDto omits p.County. GET /api/users/me returns no county. Web EditProfilePage resets with userProfile.county which is always undefined. Mobile profile.tsx onSuccess sets county from data.county which is always undefined. County written via UpdateUserDto is accepted by the backend but can never be read back — profile edit forms cannot pre-populate the county picker on load."
    artifacts:
      - path: "backend/HandyLink.Core/DTOs/UserResponseDto.cs"
        issue: "Record has no County field — missing string? County parameter"
      - path: "backend/HandyLink.Core/Services/UserService.cs"
        issue: "ToDto method maps Profile to UserResponseDto without including p.County (line 62)"
      - path: "frontend/src/pages/EditProfilePage.jsx"
        issue: "reset() on line 54 sets county: userProfile.county ?? '' — will always be '' because userProfile.county is undefined"
      - path: "mobile/app/(worker)/profile.tsx"
        issue: "onSuccess sets setCounty(data.county ?? '') — data.county is always undefined because API omits county from response"
    missing:
      - "Add string? County to UserResponseDto after string? City"
      - "Add p.County to UserService.ToDto call positionally after p.City"
  - truth: "Backend persists county through all layers (entity, handler, response)"
    status: failed
    reason: "County flows correctly through the Jobs layer (CreateJobCommand → CreateJobHandler → CreateJobResponse → GetJobByIdResponse). However the Users layer is incomplete: UserResponseDto and UserService.ToDto omit County so the profile response layer does not include county. Additionally, mobile profile.tsx PUT /api/users/me sends full_name (snake_case) instead of fullName (camelCase) — the ASP.NET Core JSON deserializer expects camelCase for UpdateUserDto.FullName, so the FullName update is silently discarded on every save from the mobile profile screen."
    artifacts:
      - path: "backend/HandyLink.Core/DTOs/UserResponseDto.cs"
        issue: "Missing string? County — profile response never carries county back to callers"
      - path: "backend/HandyLink.Core/Services/UserService.cs"
        issue: "ToDto omits p.County from UserResponseDto construction"
      - path: "mobile/app/(worker)/profile.tsx"
        issue: "Line 76: mutationFn sends full_name: name (snake_case). UpdateUserDto.FullName binds from fullName (camelCase). The FullName update is silently ignored."
    missing:
      - "Add string? County to UserResponseDto"
      - "Add p.County to UserService.ToDto"
      - "Change mobile profile.tsx line 76: full_name → fullName in the PUT payload"
human_verification:
  - test: "County picker pre-population on profile edit"
    expected: "After fixing UserResponseDto + ToDto, reloading the Edit Profile page (web) or tapping Edit Profile (mobile) should show the previously saved county pre-selected in the picker"
    why_human: "Requires a live profile with a saved county value and a running API to verify round-trip"
  - test: "D-05 auto-center under network failure"
    expected: "If Nominatim is unreachable, selecting a city should fail gracefully — no crash, map stays at previous position"
    why_human: "Nominatim handleCitySelect has no try/catch; WR-02/WR-03 warnings; behavior under network failure needs manual smoke test"
---

# Phase 16: Add Address Nomenclators — Verification Report

**Phase Goal:** Address fields across the app use structured nomenclator data (counties, cities) instead of freeform text inputs
**Verified:** 2026-04-25T14:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Address inputs on web and mobile present selectable county/city dropdowns backed by Romanian nomenclator data | VERIFIED | CountyCityPicker.jsx and CountyCityPickerMobile.tsx both exist, import ro-nomenclator.json, render cascading county+city selects/modals. Both integrated into PostJobPage, EditProfilePage, post-job.tsx, profile.tsx |
| 2 | Stored addresses are normalized and consistent across job posts and worker profiles | FAILED | UserResponseDto missing County field; UserService.ToDto omits p.County; county written via UpdateUserDto can never be read back — profile forms cannot pre-populate county picker |
| 3 | County column exists in public.jobs and public.profiles tables | VERIFIED | Plan 04 human checkpoint completed; 004_add_county_field.sql executed in Supabase SQL editor; developer confirmed both columns present |
| 4 | Backend persists county through all layers (entity, handler, response) | FAILED | Jobs layer complete; Users layer incomplete — UserResponseDto/ToDto omit county; additionally mobile profile.tsx sends full_name (snake_case) where UpdateUserDto expects fullName (camelCase) |
| 5 | D-05 auto-center: selecting a city in PostJobPage/post-job.tsx geocodes via Nominatim and moves the map pin | VERIFIED | handleCitySelect present in both PostJobPage.jsx (line 32-43) and post-job.tsx (line 64-75), both fetch Nominatim and call setLocation — no error handling but flow is wired |

**Score:** 3/5 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/data/ro-nomenclator.json` | 42 counties + cities, flat shape | VERIFIED | Exists; 42 counties AB-VN+B; București has 6 sectors; diacritics present (Timișoara, Argeș, etc.) |
| `mobile/assets/ro-nomenclator.json` | Identical copy | VERIFIED | Exists |
| `frontend/src/data/__tests__/ro-nomenclator.test.js` | 5 structural tests (NOM-05, NOM-06) | VERIFIED | Exists; all 5 tests present; tests not run due to environment restriction |
| `backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql` | 2x ADD COLUMN IF NOT EXISTS county TEXT | VERIFIED | Exists; correct content; both jobs and profiles; no NOT NULL/DEFAULT |
| `backend/HandyLink.Core/Entities/Job.cs` | County property | VERIFIED | `public string? County { get; set; }` present (line 20) |
| `backend/HandyLink.Core/Entities/Profile.cs` | County property | VERIFIED | `public string? County { get; set; }` present (line 10) |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs` | string? County | VERIFIED | Present at position 7 after Country |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs` | string? County | VERIFIED | Present at position 8 after Country |
| `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs` | string? County | VERIFIED | Present at position 8 after Country |
| `backend/HandyLink.Core/DTOs/UpdateUserDto.cs` | string? County | VERIFIED | Present at position 5 after City |
| `backend/HandyLink.Core/DTOs/UserResponseDto.cs` | string? County | STUB/MISSING | No County field — omitted from record; this is the root cause of WR-01 |
| `frontend/src/components/CountyCityPicker.jsx` | shouldDirty, useWatch, ro-nomenclator, disabled state | VERIFIED | All required patterns present |
| `frontend/src/pages/PostJobPage.jsx` | CountyCityPicker, handleCitySelect, county in payload | VERIFIED | All present |
| `frontend/src/pages/EditProfilePage.jsx` | CountyCityPicker, county in reset(), county in payload | PARTIAL | Component integrated and county in payload; reset sets county: userProfile.county which is always undefined due to WR-01 |
| `mobile/components/CountyCityPickerMobile.tsx` | initialNumToRender=20, modals, minHeight: 44 | VERIFIED | All required patterns present |
| `mobile/app/(client)/post-job.tsx` | CountyCityPickerMobile, handleCitySelect, county in payload | VERIFIED | All present |
| `mobile/app/(worker)/profile.tsx` | CountyCityPickerMobile, county in payload, Județ display row | PARTIAL | Component integrated, Județ display row present; county never pre-populates due to WR-01; full_name key bug (WR-04) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| CountyCityPicker.jsx | ro-nomenclator.json | import nomenclator from '../data/ro-nomenclator.json' | WIRED | Line 2 |
| CountyCityPickerMobile.tsx | ro-nomenclator.json | import nomenclator from '../assets/ro-nomenclator.json' | WIRED | Line 6 |
| PostJobPage.jsx | CountyCityPicker.jsx | `<CountyCityPicker onCitySelect={handleCitySelect}>` | WIRED | Line 104-110 |
| PostJobPage.jsx handleCitySelect | Nominatim API | fetch nominatim.openstreetmap.org | WIRED | Lines 33-42; no error handling (WR-02) |
| EditProfilePage.jsx | CountyCityPicker.jsx | `<CountyCityPicker>` without onCitySelect | WIRED | Line 115-120 |
| post-job.tsx | CountyCityPickerMobile.tsx | `<CountyCityPickerMobile>` | WIRED | Line 114-120 |
| post-job.tsx handleCitySelect | Nominatim API | fetch nominatim.openstreetmap.org | WIRED | Lines 65-75; no error handling (WR-03) |
| profile.tsx | CountyCityPickerMobile.tsx | `<CountyCityPickerMobile>` in editing block | WIRED | Lines 144-150 |
| JobsController.cs | CreateJobCommand | dto.County passed as 7th arg | WIRED | Line 25 |
| CreateJobHandler.cs | Job entity | County = command.County | WIRED | Line 22 |
| CreateJobHandler.cs | CreateJobResponse | job.County in response | WIRED | Line 38 |
| GetJobByIdHandler.cs | GetJobByIdResponse | job.County in response | WIRED | Line 18 |
| UserService.UpdateCurrentUserAsync | Profile.County | if (dto.County is not null) profile.County = dto.County | WIRED | Line 52 |
| UserService.ToDto | UserResponseDto | p.County NOT included | NOT_WIRED | ToDto line 62 omits county — root cause of WR-01 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| EditProfilePage.jsx | county (from reset) | userProfile.county from AuthContext → GET /api/users/me | No — UserResponseDto.County absent | HOLLOW — county picker never pre-populates from saved data |
| profile.tsx (worker) | county state | data.county from useQuery → GET /api/users/me | No — UserResponseDto.County absent | HOLLOW — county picker never pre-populates from saved data |
| post-job.tsx | county state | local state only (user input) | Yes — user selects; county written to API | FLOWING |
| PostJobPage.jsx | county form field | local RHF state (user selects) | Yes — submitted to /api/jobs | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — these artifacts require a running Expo/Vite dev server. Static checks run instead.

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Nomenclator has 42 counties | Count `{ "id":` entries in counties array before `"cities":` | 42 entries (AB,AR,AG,BC,BH,BN,BT,BV,BR,B,BZ,CS,CL,CJ,CT,CV,DB,DJ,GL,GR,GJ,HR,HD,IL,IS,IF,MM,MH,MS,NT,OT,PH,SM,SJ,SB,SV,TR,TM,TL,VS,VL,VN) | PASS |
| București has 6 sectors | grep `county_id.*B` in nomenclator | 6 entries B-S1 through B-S6 | PASS |
| Diacritics preserved | grep `Timișoara` in nomenclator | Found at TM-009 | PASS |
| 004 migration has 2 ADD COLUMN statements | grep `ADD COLUMN IF NOT EXISTS county TEXT` | 2 matches | PASS |
| UserResponseDto missing County | Read file | No County field — confirmed | FAIL |
| mobile profile.tsx sends full_name | grep `full_name` in mutation | Line 76: `full_name: name` — wrong key | FAIL |

### Requirements Coverage

NOM-01 through NOM-06 are phase-internal requirements defined in plan frontmatter. They are not tracked in REQUIREMENTS.md (which covers v1 Beta requirements BUG-, UX-, DSG-, SEC-, MOB-, AUTH-, MAP-, NOTF-, ANLX-, OPS- only). Phase 16 is listed in ROADMAP.md as an additional phase beyond the Beta Polish milestone. No requirement IDs from REQUIREMENTS.md are claimed by this phase — no orphaned requirements.

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| NOM-01 | 02, 03, 04, 05, 06 | County column + backend persistence | PARTIAL | Column exists; Jobs layer complete; Users layer missing County in response DTO |
| NOM-02 | 03, 05, 06 | County in create/update payloads | PARTIAL | CreateJob payload complete; UpdateUser payload accepted but never returned in response |
| NOM-03 | 02, 03, 04, 05, 06 | Profiles county stored | PARTIAL | Update path works; read path broken (WR-01) |
| NOM-04 | 03 | All C# positional records updated | VERIFIED | All records updated; build compiles; tests pass |
| NOM-05 | 01, 05 | 42 county entries in nomenclator | VERIFIED | 42 counties in ro-nomenclator.json; Zod schema in web forms |
| NOM-06 | 01, 05 | București has 6 sector cities | VERIFIED | B-S1 through B-S6 confirmed; structural test present |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mobile/app/(worker)/profile.tsx` | 76 | `full_name: name` in PUT payload (snake_case) | Blocker | UpdateUserDto.FullName expects camelCase (`fullName`); name update silently discarded on every mobile profile save |
| `frontend/src/pages/PostJobPage.jsx` | 32-43 | `handleCitySelect` async function with no try/catch | Warning | Nominatim network failure causes unhandled promise rejection; city selection silently fails, map stays centered; no user feedback |
| `mobile/app/(client)/post-job.tsx` | 64-75 | `handleCitySelect` async function with no try/catch | Warning | Same as above for mobile |

### Human Verification Required

#### 1. County Pre-population After Fix

**Test:** After fixing `UserResponseDto` and `UserService.ToDto`, log in as a worker, save a county via Edit Profile, then reload the page. Tap Edit Profile again.
**Expected:** The county picker should show the previously saved county pre-selected; city picker should be enabled.
**Why human:** Round-trip requires live API + Supabase database with a real user session.

#### 2. Nominatim Error Handling (WR-02/WR-03)

**Test:** Temporarily disable network or use browser DevTools to block requests to nominatim.openstreetmap.org. Select a city in Post Job.
**Expected:** The form should not crash; an error boundary or silent fallback should prevent the unhandled rejection from breaking the form.
**Why human:** Requires network manipulation; behavior under failure is a graceful degradation check.

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — UserResponseDto missing County (WR-01):** The phase added County to `UpdateUserDto` so it can be written, and to all job-related DTOs so job county round-trips correctly. However `UserResponseDto` (the response DTO for `GET /api/users/me`) was never updated to include County. `UserService.ToDto` builds this DTO without `p.County`. The result: county is persisted to the database when a user saves their profile, but the API response never carries it back. Both the web `EditProfilePage` and mobile `profile.tsx` pre-populate their county pickers from `userProfile.county` / `data.county` respectively — which is always `undefined`. The county picker will always start empty even for users who have saved a county.

**Gap 2 — Mobile profile sends wrong JSON key for FullName (WR-04):** `profile.tsx` mutation (line 76) sends `{ full_name: name, city, county }`. ASP.NET Core's default JSON deserializer binds `full_name` to nothing in `UpdateUserDto` — the DTO property `FullName` binds from `fullName` (camelCase). Every time a worker saves their profile from the mobile app, the name change is silently discarded. This is unrelated to the nomenclator feature but was introduced alongside it and affects the same file.

These two gaps share a single root area: the Users API response layer was not fully updated as part of Plan 03. Both are small changes: add `string? County` to `UserResponseDto`, add `p.County` to `ToDto`, and fix the `full_name` key in profile.tsx.

---

_Verified: 2026-04-25T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
