# Phase 16: Add Address Nomenclators - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace freeform `city` text inputs across the app with structured Romanian nomenclator data (county + city dropdowns), applied to:
- Job post creation (web + mobile)
- Worker profile city field (web + mobile)

Scope does NOT include: proximity-based search/filtering by county/city, backfilling existing data, or replacing the Nominatim lat/lng map pin feature from Phase 14.

</domain>

<decisions>
## Implementation Decisions

### UX Selector Pattern
- **D-01:** Cascading dropdowns — county selected first, city list filters to that county. Two separate selectors per form. Matches Romanian user expectations (government forms use the same pattern).
- **D-02:** Mobile: tap field → full-screen modal with a scrollable list. Consistent with existing modal patterns in the app (bottom sheets, modals). Applies to both county and city pickers.
- **D-03:** Web: standard styled select elements (Tailwind-styled dropdowns). County → City cascading, city select disabled until county chosen.

### Nominatim Coexistence (PostJobPage)
- **D-04:** Complementary — Nominatim stays for lat/lng map pin (location accuracy). Nomenclator replaces the freeform city text field only. They serve different purposes and coexist in the same form.
- **D-05:** Auto-center map on city selection — when the user picks a city from the nomenclator, geocode that city name via Nominatim and move the map pin to it as a starting point. User can then refine the exact pin location. This makes the two inputs feel connected rather than redundant.

### Schema Change
- **D-06:** Add `county TEXT` column to both `jobs` and `profiles` (users) tables. Keep existing `city TEXT` column unchanged. Both `county` and `city` are populated from the nomenclator on new submissions.
- **D-07:** Old records left as-is — no backfill. Existing freeform `city` values remain; `county` column is NULL for old records. Migration adds the column only, no data transformation.

### Data Source
- **D-08:** Hardcoded JSON bundle — a static JSON file bundled with both the web and mobile apps. Loaded once at startup. Zero network dependency on form load. Works offline.
- **D-09:** SIRUTA (Sistemul Informatic de Referință al Unității Administrativ-Teritoriale) as the source dataset — Romania's official administrative units registry from INSSE. Covers all 41 counties + Bucharest sectors + all cities/communes.

### Claude's Discretion
- Exact structure of the SIRUTA-derived JSON (flat list with county reference vs nested county→cities)
- Whether county and city are displayed in Romanian diacritics or ASCII-normalized form
- Loading/disabled state styling for the city dropdown while county is unselected
- Error messaging when county is selected but city is not (validation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing address integration points
- `frontend/src/pages/PostJobPage.jsx` — Current post-job form; has `city` freeform text + Nominatim LocationPicker component. County+city dropdowns replace the city text field; LocationPicker stays.
- `frontend/src/components/LocationPicker.jsx` — Nominatim address search + map pin component from Phase 14. Auto-center on city selection (D-05) triggers a geocode call here or via callback to it.
- `mobile/app/(client)/post-job.tsx` — Mobile post-job form; has `city` text input + LocationPicker equivalent. County+city modal pickers replace the city text field.
- `mobile/app/(worker)/profile.tsx` — Worker profile; has `city` text input. County+city modal pickers replace it.
- `frontend/src/pages/EditProfilePage.jsx` — Web worker profile edit; has `city` field. County+city dropdowns replace it.

### Schema (Supabase SQL migrations)
- `backend/HandyLink.Infrastructure/Data/Migrations/001_initial_schema.sql` — `city TEXT NOT NULL` on `jobs`, `city TEXT` on `profiles`. Phase 16 adds `county TEXT` to both via a new migration file (004_add_county_field.sql).
- `backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql` — Phase 14 location columns; county column goes alongside these, same pattern.

### Prior phase context
- `.planning/phases/14-maps-location/14-CONTEXT.md` — Phase 14 decisions on Nominatim, LocationPicker, and platform parity (web + mobile). D-04 and D-05 build on this.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/LocationPicker.jsx` — Nominatim-based address search + map pin. Phase 16 adds a geocode call to it when a city is selected from the nomenclator (D-05 auto-center).
- `mobile/app/(client)/post-job.tsx` → `city` state and `setCity` — the nomenclator picker replaces the TextInput but writes to the same `city` state field.
- React Hook Form already used in PostJobPage (web) — county + city selectors integrate as controlled fields with the existing `register` / `setValue` pattern.
- Zod schema in PostJobPage already validates `city: z.string().min(1)` — extend to add `county: z.string().min(1)`.

### Established Patterns
- Web forms use React Hook Form + Zod for validation. New county/city fields follow the same pattern.
- Mobile forms use `useState` + inline validation before `api.post`. County/city state added alongside existing `city` state.
- Modal/picker pattern on mobile: existing modals in the app use `Modal` from React Native or `@gorhom/bottom-sheet`.
- Backend handlers accept job creation payload via `CreateJobCommand` — add `county` field there.

### Integration Points
- `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs` — add `County` property
- `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs` — map `County` to job entity
- `backend/HandyLink.Core/Entities/Job.cs` — add `County` string property
- `backend/HandyLink.API/Features/Users/UpdateProfile/` (or equivalent) — add `County` to profile update

</code_context>

<specifics>
## Specific Ideas

- SIRUTA JSON should be bundled as a static asset (e.g., `frontend/src/data/ro-nomenclator.json`, `mobile/assets/ro-nomenclator.json`) rather than imported as a JS module, to keep bundle analysis clean.
- Bucharest sectors (Sector 1–6) should appear as "cities" under county "Ilfov" or handled as a special case since Bucharest is both a county and a municipality.

</specifics>

<deferred>
## Deferred Ideas

- Proximity-based job search/filtering by county/city — belongs in a future phase (was already deferred from Phase 15)
- Best-effort backfill of existing freeform city values against nomenclator — out of scope for beta
- Auto-detect user's county/city from device GPS — future enhancement

</deferred>

---

*Phase: 16-address-nomenclators*
*Context gathered: 2026-04-24*
