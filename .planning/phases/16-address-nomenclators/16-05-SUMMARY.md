---
phase: 16-address-nomenclators
plan: 05
subsystem: frontend-web
tags: [county, city, picker, react-hook-form, nominatim, d-05]
key-files:
  created:
    - frontend/src/components/CountyCityPicker.jsx
  modified:
    - frontend/src/pages/PostJobPage.jsx
    - frontend/src/pages/EditProfilePage.jsx
metrics:
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Plan 16-05 Summary: Web CountyCityPicker Integration

## What Was Built

### Task 1: CountyCityPicker.jsx
Reusable RHF-integrated cascading select component:
- `useWatch` on `county` field drives reactive city filtering from `ro-nomenclator.json`
- County `<select>` value = county ID (e.g. `"AB"`) for filtering; city `<select>` value = city name (stored in DB)
- Both `setValue` calls pass `{ shouldDirty: true }` — fixes EditProfilePage Save button always-disabled bug (Pitfall 5)
- `onCitySelect` callback (optional) — only PostJobPage passes it for D-05 auto-center
- Disabled city state: `bg-gray-100 text-gray-400 cursor-not-allowed` with placeholder "Selectează județul întâi"

### Task 2: PostJobPage.jsx and EditProfilePage.jsx
| Change | PostJobPage | EditProfilePage |
|--------|-------------|-----------------|
| Import CountyCityPicker | ✓ | ✓ |
| Zod schema county field | `z.string().min(1)` required | `z.string().optional()` |
| `control` + `setValue` in useForm | ✓ | ✓ |
| `handleCitySelect` (D-05) | ✓ (Nominatim geocode → setLocation) | — |
| `county` in API payload | `county: data.county` | `county: data.county \|\| null` |
| City/country grid replaced | ✓ (with `<CountyCityPicker onCitySelect={handleCitySelect}>`) | ✓ (without onCitySelect) |
| `reset()` includes county | — | `county: userProfile.county ?? ''` |

## Commits

| Commit | Description |
|--------|-------------|
| 9c2f12b | feat(16-05): create CountyCityPicker.jsx with RHF integration and shouldDirty |
| 45f81b5 | feat(16-05): integrate CountyCityPicker into PostJobPage and EditProfilePage with D-05 auto-center |

## Deviations

- `country` field removed from Zod schema in PostJobPage (hardcoded `'RO'` in payload instead) — matches D-09 Romania-only scope and avoids exposing a field the user can no longer see.
- EditProfilePage retains `country` in PUT payload via `userProfile?.country` (not from form data) to avoid breaking existing profiles.

## Self-Check: PASSED

- CountyCityPicker.jsx contains `shouldDirty: true` (2×) ✓
- CountyCityPicker.jsx imports `../data/ro-nomenclator.json` ✓
- CountyCityPicker.jsx contains `Selectează județul întâi` + `cursor-not-allowed` ✓
- PostJobPage.jsx imports CountyCityPicker ✓
- PostJobPage.jsx Zod schema contains `county: z.string().min(1` ✓
- PostJobPage.jsx contains `handleCitySelect` with `nominatim.openstreetmap.org` ✓
- PostJobPage.jsx payload contains `county: data.county` ✓
- EditProfilePage.jsx reset() contains `county: userProfile.county` ✓
- EditProfilePage.jsx payload contains `county: data.county` ✓
- `npm run build` in frontend/ exits 0 ✓ (626 modules, built in 639ms)
