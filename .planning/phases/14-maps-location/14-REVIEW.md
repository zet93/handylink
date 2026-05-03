---
phase: 14-maps-location
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 33
files_reviewed_list:
  - backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql
  - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationCommand.cs
  - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationHandler.cs
  - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationValidator.cs
  - backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationResponse.cs
  - backend/HandyLink.Tests/Unit/Features/Workers/UpdateWorkerLocationHandlerTests.cs
  - backend/HandyLink.Core/Entities/Job.cs
  - backend/HandyLink.Core/Entities/WorkerProfile.cs
  - backend/HandyLink.Infrastructure/Data/HandyLinkDbContext.cs
  - backend/HandyLink.Core/DTOs/CreateJobDto.cs
  - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs
  - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs
  - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs
  - backend/HandyLink.API/Controllers/JobsController.cs
  - backend/HandyLink.API/Features/Jobs/GetJobs/GetJobsResponse.cs
  - backend/HandyLink.API/Features/Jobs/GetJobs/GetJobsHandler.cs
  - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs
  - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdHandler.cs
  - backend/HandyLink.API/Controllers/UsersController.cs
  - backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs
  - backend/HandyLink.Tests/Unit/Services/JobServiceTests.cs
  - frontend/src/components/JobMap.jsx
  - frontend/src/components/LocationPicker.jsx
  - frontend/src/pages/PostJobPage.jsx
  - frontend/src/pages/JobDetailPage.jsx
  - frontend/src/pages/EditProfilePage.jsx
  - frontend/package.json
  - mobile/components/JobMapMobile.tsx
  - mobile/components/LocationPickerMobile.tsx
  - mobile/package.json
  - mobile/app.json
  - mobile/app/(client)/post-job.tsx
  - mobile/app/(client)/job-detail.tsx
  - mobile/app/(worker)/profile.tsx
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 14 Code Review

## Summary

Phase 14 adds optional location fields (latitude, longitude, address) to jobs and a service area (lat/lng + radius) to worker profiles. The backend slice is clean VSA/CQRS — the handler, validator, and response are all correct. The frontend Leaflet integration and mobile react-native-maps integration are both functionally sound.

Two critical issues stand out: the `UpdateWorkerLocationHandler` does not verify the caller owns the profile it is updating (any authenticated worker can overwrite any other worker's location by passing a different WorkerId), and the `JobMap` web component will crash if rendered with null/undefined coordinates. Four warnings cover missing validation on job location coordinates, a silent location-save failure on mobile, an `isWorker` usage-before-declaration bug in `EditProfilePage`, and the mobile `post-job` screen omitting required fields. Three info items note minor quality points.

## Findings

### CR-001 · CRITICAL · backend/HandyLink.API/Controllers/UsersController.cs:28-29

**Issue:** `UpdateLocation` passes `GetUserId()` directly as `WorkerId` to the command, which is correct. However, `UpdateWorkerLocationHandler` uses `command.WorkerId` as a lookup key without verifying it equals the authenticated caller. Because `WorkerId` is injected from the controller via `GetUserId()` now, this is safe today — but the command record is public and the handler has no ownership assertion. If any other call site passes an arbitrary `WorkerId`, any authenticated user can overwrite another worker's location. The handler must not rely solely on the caller to supply the right ID.

**Risk:** Authorization bypass — a malicious client that constructs a raw HTTP request (bypassing the controller) could target any worker profile ID. More concretely, the handler is unit-tested with an arbitrary `WorkerId` in the test fixture, confirming there is no identity check inside the handler itself.

**Fix:** Add an ownership check inside the handler, consistent with the project's auth pattern:
```csharp
// In UpdateWorkerLocationHandler.Handle, after fetching the worker:
if (worker.Id != command.WorkerId)
    throw new ForbiddenException("You can only update your own location.");
```
Alternatively, remove `WorkerId` from the command entirely and resolve it exclusively inside the handler via a caller-identity parameter, making the boundary explicit.

---

### CR-002 · CRITICAL · frontend/src/components/JobMap.jsx:16 and :25

**Issue:** `JobMap` is called only when `job.latitude && job.longitude` is truthy in `JobDetailPage` and `LocationPicker`, but the component itself accepts the props with no null guard. `MapContainer center={[latitude, longitude]}` and `Marker position={[latitude, longitude]}` will pass `[null, null]` or `[undefined, undefined]` to Leaflet if the parent guard is ever removed or bypassed, causing a runtime crash (Leaflet throws when given non-numeric coordinates).

**Risk:** Unhandled crash on the job detail page; no error boundary present.

**Fix:** Add a null guard inside the component so it is safe regardless of call site:
```jsx
export default function JobMap({ latitude, longitude, address }) {
  if (!latitude || !longitude) return null;
  return ( /* existing JSX */ );
}
```

---

### WR-001 · WARNING · backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationValidator.cs:11-17

**Issue:** The validator enforces lat/lng ranges independently but does not enforce that latitude and longitude must either both be present or both be absent. A caller can send `{ latitude: 44.4, longitude: null, serviceRadiusKm: 20 }` which passes validation and produces a partially-populated location row.

**Risk:** Data inconsistency — a worker row with a non-null latitude and a null longitude is meaningless and will cause `null` to be passed as the longitude to map components, resulting in broken map rendering.

**Fix:**
```csharp
RuleFor(x => x)
    .Must(x => (x.Latitude.HasValue && x.Longitude.HasValue)
               || (!x.Latitude.HasValue && !x.Longitude.HasValue))
    .WithMessage("Latitude and longitude must both be provided or both omitted.");
```

---

### WR-002 · WARNING · frontend/src/pages/EditProfilePage.jsx:72

**Issue:** `isWorker` is referenced on line 72 inside `onSubmit`, but it is defined on line 88 — below the function. In JavaScript, `const` declarations are not hoisted; referencing `isWorker` before its declaration will throw a `ReferenceError` at runtime whenever a user tries to save their profile.

**Risk:** The submit handler always crashes with `ReferenceError: Cannot access 'isWorker' before initialization`.

**Fix:** Move the `isWorker` declaration above `onSubmit`:
```jsx
const isWorker = userProfile?.role === 'worker' || userProfile?.role === 'both';

async function onSubmit(data) {
  // ...
  if (isWorker) { ... }
}
```

---

### WR-003 · WARNING · mobile/app/(worker)/profile.tsx:205-209

**Issue:** The "Save Service Area" button fires an inline `.then()/.catch()` promise directly in the `onPress` prop. There is no loading state, no disabled state during the request, and the button is always interactive. A user can tap it multiple times rapidly, firing multiple concurrent PUT requests.

**Risk:** Race condition producing out-of-order writes; also no feedback that the save is in progress, which degrades UX to the point of appearing broken.

**Fix:** Extract the save into a `useMutation` hook (matching the pattern used for `saveProfile` in the same file) and disable the button while `isPending` is true.

---

### WR-004 · WARNING · mobile/app/(client)/post-job.tsx:36-46

**Issue:** The mobile post-job mutation omits `country` from the payload entirely, and the API field is named `budget_min`/`budget_max` (snake_case) while the backend `CreateJobDto` expects `budgetMin`/`budgetMax` (camelCase). The `country` field defaults server-side to `"RO"` in the entity, but the budget fields will be silently ignored.

**Risk:** Budget values are never persisted from the mobile client because the field names don't match the DTO, causing silent data loss with no error shown to the user.

**Fix:**
```typescript
api.post('/api/jobs', {
  title,
  description,
  city,
  country: 'RO',
  category,
  budgetMin: budgetMin ? Number(budgetMin) : null,
  budgetMax: budgetMax ? Number(budgetMax) : null,
  latitude: location.latitude ?? null,
  longitude: location.longitude ?? null,
  address: location.address ?? null,
})
```

---

### IR-001 · INFO · backend/HandyLink.Infrastructure/Data/HandyLinkDbContext.cs:33-47

**Issue:** The `WorkerProfile` EF configuration maps `ServiceRadiusKm` to `service_radius_km` but does not map `Latitude` and `Longitude` properties to explicit column names. EF Core will default to `latitude` and `longitude` (lowercase), which matches the SQL migration column names, so this works — but it is inconsistent with every other property in the same entity which all have explicit `HasColumnName` mappings.

**Fix:** Add explicit column name mappings for consistency:
```csharp
e.Property(w => w.Latitude).HasColumnName("latitude");
e.Property(w => w.Longitude).HasColumnName("longitude");
```
Same applies to `Job.Latitude` and `Job.Longitude` in the `Job` entity configuration (lines 49-64).

---

### IR-002 · INFO · mobile/components/LocationPickerMobile.tsx:54

**Issue:** The Nominatim response items are typed as `any` in the `.map()` call: `data.map((r: any) => ...)`. Since the shape is known, this suppresses type checking on the fields being accessed (`r.display_name`, `r.lat`, `r.lon`).

**Fix:** Define an inline interface for the Nominatim result:
```typescript
interface NominatimResult { display_name: string; lat: string; lon: string; }
const mapped: Result[] = (data as NominatimResult[]).map(r => ({
  label: r.display_name,
  lat: parseFloat(r.lat),
  lng: parseFloat(r.lon),
}));
```

---

### IR-003 · INFO · mobile/app/(client)/post-job.tsx:57-61

**Issue:** Client-side validation only checks that `title` is non-empty. `description` and `city` are required by the backend (`CreateJobDto` maps to a validator that presumably requires these) but are submitted with empty strings with no client-side feedback. The user gets a generic error alert from the server rather than inline field errors.

**Fix:** Add minimum-length checks for `description` and `city` before calling `mutate()`, consistent with how the web `PostJobPage` uses Zod schema validation.

---

_Reviewed: 2026-04-23T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
