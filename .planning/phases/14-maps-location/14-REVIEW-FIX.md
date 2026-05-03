---
phase: 14-maps-location
iteration: 1
fix_scope: critical_warning
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
fixed_at: 2026-04-23T00:00:00Z
review_path: .planning/phases/14-maps-location/14-REVIEW.md
---

# Phase 14 Code Review Fix Report

**Fixed at:** 2026-04-23
**Source review:** .planning/phases/14-maps-location/14-REVIEW.md
**Iteration:** 1

## Summary

- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixes Applied

### CR-001 · FIXED · UpdateWorkerLocationHandler.cs

**Files modified:** `backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationHandler.cs`
**Commit:** b4b9732
**Applied fix:** Added explicit ownership assertion after the worker lookup — `if (worker.Id != command.WorkerId) throw new ForbiddenException(...)`. This makes the security invariant visible in the handler and protects against any future call site that might supply an arbitrary WorkerId. Note: since the current controller always passes `GetUserId()` as `WorkerId` and the EF query already scopes to that ID, this guard is currently tautologically safe but documents intent and enforces the pattern used elsewhere in the project.

---

### CR-002 · FIXED · JobMap.jsx

**Files modified:** `frontend/src/components/JobMap.jsx`
**Commit:** fdc6611
**Applied fix:** Added `if (!latitude || !longitude) return null;` as the first line of the component body, before any Leaflet rendering. The component now safely returns nothing when called with null/undefined coordinates regardless of call site.

---

### WR-001 · FIXED · UpdateWorkerLocationValidator.cs

**Files modified:** `backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationValidator.cs`
**Commit:** 9e1fb44
**Applied fix:** Added a cross-field `RuleFor(x => x)` rule that requires latitude and longitude to both be present or both be absent. Rejects payloads with only one coordinate, preventing partial location rows in the database.

---

### WR-002 · FIXED · EditProfilePage.jsx

**Files modified:** `frontend/src/pages/EditProfilePage.jsx`
**Commit:** fe18f94
**Applied fix:** Moved the `const isWorker = ...` declaration from line 88 (after `onSubmit`) to line 60 (before `onSubmit`). Eliminates the `ReferenceError: Cannot access 'isWorker' before initialization` that would crash the submit handler on every save attempt.

---

### WR-003 · FIXED · mobile/app/(worker)/profile.tsx

**Files modified:** `mobile/app/(worker)/profile.tsx`
**Commit:** f983d91
**Applied fix:** Replaced the inline `.then()/.catch()` promise in `onPress` with a `useMutation` hook (`saveLocation` / `savingLocation`). The button is now disabled and shows an `ActivityIndicator` while the request is in flight, preventing concurrent saves from multiple rapid taps.

---

### WR-004 · FIXED · mobile/app/(client)/post-job.tsx

**Files modified:** `mobile/app/(client)/post-job.tsx`
**Commit:** c8fab6f
**Applied fix:** Renamed `budget_min`/`budget_max` to `budgetMin`/`budgetMax` (camelCase) to match the backend `CreateJobDto` field names. Also changed `undefined` to `null` for absent budget values (consistent with other nullable fields), and added `country: 'RO'` to the payload.

---

## Skipped

None.

---

_Fixed: 2026-04-23_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
