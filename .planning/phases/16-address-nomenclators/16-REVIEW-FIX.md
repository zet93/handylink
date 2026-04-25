---
phase: 16-address-nomenclators
fixed_at: 2026-04-25T00:00:00Z
review_path: .planning/phases/16-address-nomenclators/16-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2026-04-25
**Source review:** .planning/phases/16-address-nomenclators/16-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: `County` dropped from `UserResponseDto` — county saved but never returned to callers

**Files modified:** `backend/HandyLink.Core/DTOs/UserResponseDto.cs`, `backend/HandyLink.Core/Services/UserService.cs`
**Commit:** 1304985
**Applied fix:** Added `string? County` parameter after `string? City` in the `UserResponseDto` positional record. Updated `ToDto` in `UserService` to pass `p.County` in the corresponding positional argument between `p.City` and `p.Country`.

### WR-02: Nominatim fetch in `PostJobPage` has no error handling — unhandled rejection on network failure

**Files modified:** `frontend/src/pages/PostJobPage.jsx`
**Commit:** 63d9485
**Applied fix:** Wrapped the entire Nominatim fetch chain in a try/catch block. Added `if (!res.ok) return;` guard before calling `res.json()`. Catch block silently swallows errors since geocode is best-effort.

### WR-03: `handleCitySelect` in mobile `post-job.tsx` also has no error handling — unhandled promise rejection

**Files modified:** `mobile/app/(client)/post-job.tsx`
**Commit:** e2b5552
**Applied fix:** Wrapped the Nominatim fetch chain in try/catch. Added `if (!res.ok) return;` guard before calling `res.json()`. Catch block silently swallows errors. `User-Agent` header was already present and preserved.

### WR-04: `saveProfile` in worker profile sends wrong field name — county never persisted from mobile edit

**Files modified:** `mobile/app/(worker)/profile.tsx`
**Commit:** 11571ae
**Applied fix:** Changed `full_name: name` to `fullName: name` in the `api.put('/api/users/me', ...)` payload so the field name matches the camelCase `FullName` property expected by `UpdateUserDto`.

---

_Fixed: 2026-04-25_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
