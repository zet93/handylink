---
phase: 14-maps-location
verified: 2026-04-20T00:00:00Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
human_verification:
  - test: "PostJobPage — submit a job with an address selected via LocationPicker"
    expected: "Job is saved with latitude/longitude/address; re-opening the job detail shows a map pin at the correct location"
    why_human: "Requires browser interaction with Nominatim geocoding, form submission, and Leaflet map render — not verifiable via grep"
  - test: "JobDetailPage — open a job that has coordinates"
    expected: "Leaflet map is visible with a pin; jobs without coordinates show no map section at all"
    why_human: "Conditional rendering of the Leaflet map component requires a running browser to verify"
  - test: "EditProfilePage (worker) — set service area and save"
    expected: "PUT /api/users/me/location is called with correct lat/lng/serviceRadiusKm; page reflects saved values"
    why_human: "Requires auth context for worker role, API call fire, and response verification in a live browser"
  - test: "Mobile post-job screen — search an address and submit a job"
    expected: "MapView renders with a pin on the confirmation map; POST payload includes latitude/longitude/address"
    why_human: "Requires Expo Go or simulator; MapView rendering and network call can only be observed at runtime"
  - test: "Mobile job-detail screen — open job with coordinates"
    expected: "JobMapMobile renders at 250px height with a visible pin; job without coordinates shows no map"
    why_human: "MapView render on mobile requires physical device or simulator"
  - test: "Mobile worker profile — set service area and save"
    expected: "RadiusSelector highlights selected radius; PUT /api/users/me/location fires on save with correct values"
    why_human: "Requires authenticated worker session on mobile + live API"
---

# Phase 14: Maps & Location — Verification Report

**Phase Goal:** Jobs can have a location, and that location is visible to both clients and workers on a map
**Verified:** 2026-04-20
**Status:** human_needed — all automated checks pass; 6 UI/runtime behaviors require manual confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CreateJob API accepts optional latitude, longitude, address fields and persists them | VERIFIED | `CreateJobCommand`, `CreateJobHandler`, `CreateJobDto`, `JobsController` all include the three nullable fields; handler sets them on the `Job` entity and returns them in `CreateJobResponse` |
| 2 | GetJobs and GetJobById API responses include latitude, longitude, address fields | VERIFIED | `GetJobsResponse.JobSummary` and `GetJobByIdResponse` both declare the three fields; handlers project `j.Latitude, j.Longitude, j.Address` / `job.Latitude, job.Longitude, job.Address` |
| 3 | Worker profile can be updated with lat/lng/service_radius_km via UpdateWorkerLocation endpoint | VERIFIED | `PUT /api/users/me/location` endpoint exists in `UsersController`; dispatches `UpdateWorkerLocationCommand` via IMediator; handler queries `WorkerProfiles` and calls `SaveChangesAsync` |
| 4 | Job creation still works without location fields (optional) | VERIFIED | No validation rules on lat/lng/address in `CreateJobValidator`; fields are nullable on command and DTO |
| 5 | PostJobPage has optional location section with address search and confirmation map | VERIFIED | `LocationPicker` imported and rendered after city fields; `location.latitude/longitude/address` included in POST payload; no zod schema changes |
| 6 | JobDetailPage shows embedded map with pin when job has coordinates | VERIFIED | `{job.latitude && job.longitude && (<div>...<JobMap .../></div>)}` present at line 223 |
| 7 | JobDetailPage hides map section entirely when job has no coordinates | VERIFIED | Conditional render on `job.latitude && job.longitude` — no fallback UI rendered |
| 8 | EditProfilePage (worker) has service area section with city search and radius selector | VERIFIED | `Service Area (optional)` section with `LocationPicker` and `RadiusSelector` present; `PUT /api/users/me/location` fired on save |
| 9 | post-job screen has optional location section with address search and confirmation map | VERIFIED | `LocationPickerMobile` imported; `location.latitude/longitude/address` included in API payload |
| 10 | job-detail screen shows embedded MapView with Marker when job has coordinates | VERIFIED | `{job.latitude && job.longitude && (<View>...<JobMapMobile .../></View>)}` at line 126 |
| 11 | worker profile screen has service area section with city search and radius selector | VERIFIED | `Service Area (optional)` text, `RadiusSelector` with `[10, 20, 50, 100]`, `api/users/me/location` all present in `profile.tsx` |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql` | VERIFIED | Contains `ALTER TABLE public.jobs` with lat/lng/address and `ALTER TABLE public.worker_profiles` with lat/lng/service_radius_km |
| `backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationHandler.cs` | VERIFIED | Full implementation — queries WorkerProfiles, updates fields, saves, returns response |
| `backend/HandyLink.Tests/Unit/Features/Workers/UpdateWorkerLocationHandlerTests.cs` | VERIFIED | 79 lines, 3 tests covering valid update, NotFoundException, and null clearing |
| `frontend/src/components/JobMap.jsx` | VERIFIED | 33 lines; contains MapContainer, icon fix, OSM tile layer |
| `frontend/src/components/LocationPicker.jsx` | VERIFIED | 105 lines; contains OpenStreetMapProvider, countrycodes:'ro', 400ms debounce, Remove location, Job Location (optional) |
| `mobile/components/JobMapMobile.tsx` | VERIFIED | 44 lines; contains MapView from react-native-maps, height:250, borderRadius:10 |
| `mobile/components/LocationPickerMobile.tsx` | VERIFIED | 200 lines; contains nominatim.openstreetmap.org, countrycodes=ro, User-Agent header, Remove location |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `JobsController.cs` | `CreateJobCommand` | MediatR Send with lat/lng/address from DTO | WIRED | Line 26: `dto.Latitude, dto.Longitude, dto.Address` passed to command |
| `GetJobsHandler.cs` | `JobSummary` | projection includes location fields | WIRED | Line 34: `j.Latitude, j.Longitude, j.Address` in `new JobSummary(...)` |
| `UsersController.cs` | `UpdateWorkerLocationCommand` | MediatR Send | WIRED | Lines 27-29: dispatches command with `GetUserId()` as WorkerId |
| `PostJobPage.jsx` | `/api/jobs POST` | axios payload includes latitude, longitude, address | WIRED | Lines 39-41: `latitude: location.latitude \|\| null` etc. in payload |
| `LocationPicker.jsx` | Nominatim | OpenStreetMapProvider | WIRED | Line 2: import; line 6: `new OpenStreetMapProvider({ params: { countrycodes: 'ro' } })` |
| `JobDetailPage.jsx` | `JobMap` | conditional render when lat/lng present | WIRED | Line 223: `{job.latitude && job.longitude && ... <JobMap .../> }` |
| `post-job.tsx` | `/api/jobs POST` | api.post payload includes lat/lng/address | WIRED | Lines 43-45: `latitude: location.latitude \|\| null` etc. |
| `LocationPickerMobile.tsx` | Nominatim | fetch to nominatim.openstreetmap.org | WIRED | Line 51: direct fetch with User-Agent header |
| `job-detail.tsx` | `JobMapMobile` | conditional render when lat/lng present | WIRED | Line 126: `{job.latitude && job.longitude && ... <JobMapMobile .../> }` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `JobDetailPage.jsx → JobMap` | `job.latitude/longitude/address` | GET /api/jobs/{id} → `GetJobByIdHandler` → EF Core projection | Yes — handler queries DB and maps entity fields | FLOWING |
| `GetJobByIdHandler` → response | `job.Latitude, job.Longitude, job.Address` | EF Core `FirstOrDefaultAsync` on `Jobs` DbSet | Yes — real DB query, not static | FLOWING |
| `GetJobsHandler` → JobSummary | `j.Latitude, j.Longitude, j.Address` | EF Core LINQ projection on `Jobs` DbSet | Yes — real DB query | FLOWING |
| `UpdateWorkerLocationHandler` | `worker.Latitude/Longitude/ServiceRadiusKm` | `WorkerProfiles.FirstOrDefaultAsync` → `SaveChangesAsync` | Yes — reads and writes real DB row | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — backend requires a running PostgreSQL connection; frontend/mobile require a browser/device to exercise map rendering. No runnable entry point can be verified in under 10 seconds without external services.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MAP-01 | 14-01, 14-02, 14-03 | Job creation includes optional location (address or map pin) | SATISFIED | Backend: CreateJob accepts lat/lng/address. Web: LocationPicker in PostJobPage. Mobile: LocationPickerMobile in post-job.tsx |
| MAP-02 | 14-01, 14-02, 14-03 | Job listings show location visually (map or address display) | SATISFIED | Backend: GetJobs/GetJobById return lat/lng/address. Web: JobMap in JobDetailPage (conditional). Mobile: JobMapMobile in job-detail.tsx (conditional) |
| MAP-03 | 14-01, 14-02, 14-03 | Worker profile can include service area or location | SATISFIED | Backend: PUT /api/users/me/location with UpdateWorkerLocation slice. Web: Service Area section in EditProfilePage. Mobile: Service Area section in profile.tsx |

No orphaned requirements — MAP-01, MAP-02, MAP-03 are the only Phase 14 requirements in REQUIREMENTS.md.

---

### Anti-Patterns Found

No blockers or warnings found. `placeholder` matches in LocationPicker and LocationPickerMobile are HTML/RN input placeholder attributes, not implementation stubs.

---

### Human Verification Required

#### 1. PostJobPage — address search to job creation

**Test:** Open PostJobPage in browser, type a Romanian address into the location search field, select a suggestion, verify the confirmation map appears with a pin, then submit the job form.
**Expected:** Job is saved; navigating to the job detail page shows a Leaflet map with a pin at the entered location.
**Why human:** Requires Nominatim geocoding network call, Leaflet map DOM rendering, and form submission in a live browser.

#### 2. JobDetailPage — conditional map display

**Test:** Open a job that has latitude/longitude set. Then open a job without coordinates.
**Expected:** First job shows the Location section with a Leaflet map pin. Second job shows no Location section at all.
**Why human:** Leaflet map component mount and conditional DOM render must be verified visually.

#### 3. EditProfilePage — worker service area save

**Test:** Log in as a worker, open EditProfilePage, search an address in the Service Area section, select a radius (e.g. 20 km), and save.
**Expected:** `PUT /api/users/me/location` is called with correct lat/lng/serviceRadiusKm values (verifiable in browser network tab).
**Why human:** Requires authenticated worker session, live API, and browser network inspection.

#### 4. Mobile post-job — location input and submission

**Test:** On Expo Go (Android or iOS), open the post-job screen, search a Romanian address, select a result, verify the confirmation MapView renders, then submit.
**Expected:** POST /api/jobs payload contains latitude/longitude/address; job detail shows map on mobile.
**Why human:** MapView requires a device/simulator; Nominatim call requires live network.

#### 5. Mobile job-detail — conditional map display

**Test:** Open a job with coordinates on the mobile app; open a job without coordinates.
**Expected:** First shows JobMapMobile at 250px height with pin. Second shows no map section.
**Why human:** MapView rendering can only be verified on a physical device or simulator.

#### 6. Mobile worker profile — service area save

**Test:** Log in as a worker on mobile, open the profile screen, search an address, select a radius, and save.
**Expected:** `PUT /api/users/me/location` fires with correct values; no crash or error.
**Why human:** Requires authenticated worker session on a mobile device.

---

### Gaps Summary

No gaps. All 11 must-have truths are verified in the codebase. All artifacts exist with substantive implementations (not stubs). All key links are wired. The 6 human verification items cover runtime UI behavior that cannot be confirmed via static code inspection.

---

_Verified: 2026-04-20_
_Verifier: Claude (gsd-verifier)_
