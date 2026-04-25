---
phase: 16-address-nomenclators
reviewed: 2026-04-25T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - backend/HandyLink.API/Controllers/JobsController.cs
  - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs
  - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs
  - backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs
  - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdHandler.cs
  - backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs
  - backend/HandyLink.Core/DTOs/CreateJobDto.cs
  - backend/HandyLink.Core/DTOs/UpdateUserDto.cs
  - backend/HandyLink.Core/Entities/Job.cs
  - backend/HandyLink.Core/Entities/Profile.cs
  - backend/HandyLink.Core/Services/UserService.cs
  - backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql
  - backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs
  - backend/HandyLink.Tests/Unit/Services/UserServiceTests.cs
  - frontend/src/components/CountyCityPicker.jsx
  - frontend/src/data/__tests__/ro-nomenclator.test.js
  - frontend/src/data/ro-nomenclator.json
  - frontend/src/pages/EditProfilePage.jsx
  - frontend/src/pages/PostJobPage.jsx
  - mobile/app/(client)/post-job.tsx
  - mobile/app/(worker)/profile.tsx
  - mobile/assets/ro-nomenclator.json
  - mobile/components/CountyCityPickerMobile.tsx
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-04-25
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

This phase adds Romanian county/city picker components to web and mobile, integrates county into the job and profile data models, and ships a SQL migration adding the column. The overall implementation is sound: county flows correctly through all backend layers (DTO → Command → Entity → Response), user ID is always taken from JWT, the SQL migration uses `IF NOT EXISTS` safely, and the nomenclator data passes all structural checks (42 counties, 6 București sectors, no orphaned city references, identical mobile/frontend copies).

Four warnings require fixes before merge, three info items are worth noting.

## Warnings

### WR-01: `County` dropped from `UserResponseDto` — county saved but never returned to callers

**File:** `backend/HandyLink.Core/DTOs/UserResponseDto.cs:1`
**Issue:** `UpdateUserDto` and `Profile` both carry `County`, and `UserService.UpdateCurrentUserAsync` writes it to the database. But `UserResponseDto` — the response record returned by `GetCurrentUserAsync`, `EnsureUserProfileAsync`, and `UpdateCurrentUserAsync` — has no `County` field. The mobile worker profile screen reads `data.county` from the `GET /api/users/me` response and uses it to pre-populate the county picker; that field will always be `undefined`. The county is saved correctly but is silently lost on the way back out.
**Fix:** Add `County` to `UserResponseDto` and populate it in `UserService.ToDto`:
```csharp
public record UserResponseDto(
    Guid Id,
    string FullName,
    string? AvatarUrl,
    string? Phone,
    string? City,
    string? County,   // add this
    string Country,
    string? Bio,
    string Role,
    DateTimeOffset CreatedAt);

// In ToDto:
private static UserResponseDto ToDto(Profile p) => new(
    p.Id, p.FullName, p.AvatarUrl, p.Phone, p.City, p.County,
    p.Country, p.Bio, p.Role, p.CreatedAt);
```

---

### WR-02: Nominatim fetch in `PostJobPage` has no error handling — unhandled rejection on network failure

**File:** `frontend/src/pages/PostJobPage.jsx:33-43`
**Issue:** `handleCitySelect` calls `fetch(url)` and `res.json()` with no `try/catch`. A network error or non-200 response (Nominatim rate-limits aggressively) throws an unhandled promise rejection. The function is called from `onCityChange` in `CountyCityPicker` which fires on every city selection, making this likely to surface in production.
**Fix:**
```js
async function handleCitySelect(cityName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=1&q=${encodeURIComponent(cityName + ', Romania')}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    if (data[0]) {
      setLocation({
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: cityName,
      });
    }
  } catch {
    // geocode is best-effort; location stays null
  }
}
```

---

### WR-03: `handleCitySelect` in mobile `post-job.tsx` also has no error handling — unhandled promise rejection

**File:** `mobile/app/(client)/post-job.tsx:64-75`
**Issue:** Same pattern as WR-02. `handleCitySelect` is `async` but called fire-and-forget from `onCityChange` (`line 119`) without `await` or `.catch()`. The `User-Agent` header is correctly set (unlike the web version), but a network error still produces an unhandled rejection. Additionally, `res.ok` is never checked before calling `res.json()`.
**Fix:**
```ts
async function handleCitySelect(cityName: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=1&q=${encodeURIComponent(cityName + ', Romania')}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HandyLink/1.0' } });
    if (!res.ok) return;
    const data = await res.json();
    if (data[0]) {
      setLocation({
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: cityName,
      });
    }
  } catch {
    // geocode is best-effort
  }
}
```

---

### WR-04: `saveProfile` in worker profile sends wrong field name — county never persisted from mobile edit

**File:** `mobile/app/(worker)/profile.tsx:76`
**Issue:** The `saveProfile` mutation sends `{ full_name: name, city, county }`. The API endpoint `PUT /api/users/me` binds to `UpdateUserDto` which expects `FullName` (camelCase: `fullName` for JSON). The frontend web page sends `fullName` correctly (line 67 of `EditProfilePage.jsx`). The mobile call uses `full_name` (snake_case), so `FullName` will not be updated — and since `UpdateCurrentUserAsync` only patches non-null fields, an existing name is preserved rather than cleared, making the bug silent. The county field itself (`county`) is correctly named and will persist.
**Fix:**
```ts
mutationFn: () => api.put('/api/users/me', { fullName: name, city, county }),
```

---

## Info

### IN-01: `CountyCityPicker` county select registers via both `register` and manual `onChange` — RHF duplicate handler

**File:** `frontend/src/components/CountyCityPicker.jsx:28-29`
**Issue:** The county `<select>` uses `{...register('county')}` which attaches RHF's `onChange`, then also supplies a separate `onChange={handleCountyChange}`. The manual handler wins (it's listed after spread) and calls `setValue` with `shouldDirty: true`. This works correctly but `register`'s `onChange` is dead code on the county select. The city select has the same pattern. No bug, but it's confusing.
**Fix:** Remove `{...register('county')}` from the county select and use only `setValue`; or remove the manual handlers and use `useWatch` + `useEffect` to reset city on county change. The current approach works, so this is low priority.

---

### IN-02: `CreateJobHandlerTests` does not assert `County` field round-trip

**File:** `backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs:32-38`
**Issue:** Both test commands pass `null` for `County`. There is no test asserting that a non-null county value is stored and returned. Given county is the primary deliverable of this phase, a missing round-trip test leaves a gap.
**Fix:** Add a test case:
```csharp
var cmd = new CreateJobCommand(clientId, "Fix sink", "desc",
    JobCategory.Plumbing, "Cluj-Napoca", "RO", "CJ", null, null, null, null, null, null);
var result = await handler.Handle(cmd, CancellationToken.None);
result.County.Should().Be("CJ");
```

---

### IN-03: County FlatList in `CountyCityPickerMobile` lacks `initialNumToRender` / batch props

**File:** `mobile/components/CountyCityPickerMobile.tsx:63-79`
**Issue:** The city `FlatList` (line 97) has `initialNumToRender={20}`, `maxToRenderPerBatch={20}`, and `windowSize={5}`. The county `FlatList` (line 63) has none of these props. With 42 counties this is harmless — all 42 render immediately with no visible cost — but for consistency and future-proofing the props should match.
**Fix:** Add the same perf props to the county `FlatList`, or accept the omission as intentional given the small dataset.

---

_Reviewed: 2026-04-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
