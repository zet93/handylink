# Phase 16: Add Address Nomenclators - Research

**Researched:** 2026-04-24
**Domain:** Romanian administrative nomenclator data, cascading dropdowns, form integration (web + mobile), backend schema extension
**Confidence:** HIGH

## Summary

This phase replaces freeform `city` text inputs with structured county+city cascading dropdowns backed by a bundled SIRUTA-derived JSON file. The change touches four forms (PostJobPage web, post-job mobile, EditProfilePage web, worker profile mobile) and three backend layers (entity, DTO, handler for job creation; DTO and service for profile update).

The key data question — whether a clean, usable JSON of Romanian counties+cities is available — has a clear answer: `github.com/virgil-av/judet-oras-localitati-romania` provides a county-keyed JSON (42 entries, each with `auto`, `nume`, and `localitati` array). It includes all settlements including villages; the planner must specify filtering to only municipal-level entries for the dropdown. Bucharest is listed as `{ "auto": "B", "nume": "București" }` alongside the 41 counties, making it entry 42 rather than a special sub-object — its sectors must be hand-authored into the derived JSON as city entries under the "București" county.

The D-05 auto-center callback is straightforward: `LocationPicker.jsx` already accepts an `onChange` prop that writes `{ latitude, longitude, address }`. A parent-level `onCitySelect` callback can trigger a Nominatim geocode call and call `onChange` on the LocationPicker. On mobile, `LocationPickerMobile.tsx` has the same shape.

**Primary recommendation:** Derive `ro-nomenclator.json` from the virgil-av dataset (filtering to cities/municipalities only, plus hand-authored Bucharest sectors), bundle as a static asset in both `frontend/src/data/` and `mobile/assets/`, and integrate via thin picker components that use React Hook Form `setValue` on web and `useState` on mobile.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Cascading dropdowns — county selected first, city list filters to that county.
- **D-02:** Mobile: tap field → full-screen modal with scrollable list.
- **D-03:** Web: standard styled `<select>` elements (Tailwind-styled). City select disabled until county chosen.
- **D-04:** Nominatim LocationPicker stays for lat/lng pin. Nomenclator replaces freeform city field only.
- **D-05:** Auto-center map on city selection — geocode via Nominatim, move pin to city as starting point.
- **D-06:** Add `county TEXT` column to `jobs` and `profiles`. Keep existing `city TEXT` column.
- **D-07:** No backfill of old records. `county` is NULL for old records.
- **D-08:** Hardcoded JSON bundle — static asset, loaded once, works offline.
- **D-09:** SIRUTA dataset as source.

### Claude's Discretion
- Exact structure of the SIRUTA-derived JSON (flat list with county reference vs nested county→cities)
- Whether county and city displayed in Romanian diacritics or ASCII-normalized form
- Loading/disabled state styling for the city dropdown while county is unselected
- Error messaging when county is selected but city is not

### Deferred Ideas (OUT OF SCOPE)
- Proximity-based job search/filtering by county/city
- Best-effort backfill of existing freeform city values
- Auto-detect user's county/city from device GPS
</user_constraints>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Nomenclator JSON bundle | Frontend/Mobile static asset | — | Client-side lookup, offline-capable |
| County dropdown | Browser/Client | — | Pure UI state machine |
| City dropdown (filtered) | Browser/Client | — | Derives from county selection |
| Auto-center map (D-05) | Browser/Client | — | Nominatim geocode call from client |
| County column (jobs) | Database + API | — | Persisted via existing CreateJob flow |
| County column (profiles) | Database + API | — | Persisted via existing PUT /api/users/me |
| SQL migration | Database | — | `004_add_county_field.sql`, no EF |

---

## Standard Stack

### Core — No new packages required

All required libraries are already present in the project. This phase adds no new npm or NuGet dependencies.

| Already present | Version | Used for |
|-----------------|---------|---------|
| React Hook Form | 7.71.2 | Web form county/city selects via `register`/`setValue` |
| Zod | 4.3.6 | Extend schema to add `county: z.string().min(1)` |
| React Native `Modal` | built-in | Full-screen mobile picker modal (D-02) |
| `@react-native-picker/picker` | in mobile | Already used for category in post-job.tsx |
| TanStack React Query | 5.90.21 | No new queries; existing mutation updated |
| Nominatim (direct fetch) | — | D-05 geocode call uses same pattern as LocationPickerMobile |

No new packages to install.

---

## Data Source: SIRUTA-Derived JSON

### Recommended source

`github.com/virgil-av/judet-oras-localitati-romania` [VERIFIED: WebFetch]

Structure of `judete.json`:
```json
[
  {
    "auto": "AB",
    "nume": "Alba",
    "localitati": [
      { "nume": "Alba Iulia" },
      { "nume": "Aiud" },
      { "nume": "Abrud-Sat", "comuna": "Abrud" }
    ]
  },
  ...
  { "auto": "B", "nume": "București", "localitati": [...] }
]
```

- 42 entries (41 counties + București as its own entry) [VERIFIED: WebFetch of danielturus gist confirming 42 entries]
- `localitati` contains cities, communes, AND villages
- Villages have a `"comuna"` field; cities do not
- Entries have a `"simplu"` field when diacritics exist (alternate ASCII form)

### Derivation strategy

The planner should include a Wave 0 task to build `ro-nomenclator.json` by:
1. Fetching `judete.json` from the virgil-av repo
2. Filtering each county's `localitati` to entries **without** a `"comuna"` field (these are city/town level, not villages)
3. Hand-authoring Bucharest sectors (Sector 1–Sector 6) under the "București" county entry
4. Outputting as nested JSON:
```json
[
  { "auto": "AB", "nume": "Alba", "cities": ["Alba Iulia", "Aiud", "Blaj", ...] },
  ...
  { "auto": "B",  "nume": "București", "cities": ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"] }
]
```

Estimated filtered count: ~3,000–4,000 city-level entries (the 13,756 figure includes all villages; filtering to non-`comuna` entries yields the city/town tier only). [ASSUMED — exact count after filtering not verified]

### Bundle size estimate

A JSON file with ~3,000 string entries, nested under 42 county objects, will be roughly 100–150 KB uncompressed, ~30–40 KB gzipped. [ASSUMED — based on typical data density for this record type] This is within acceptable range for a static asset bundled with both web and mobile builds. No lazy loading needed for the web build; Expo bundles assets at build time so the mobile bundle size increase is equivalent.

### Official source fallback

`data.gov.ro/en/dataset/siruta-2025` provides `SIRUTA_S1_2025.csv` (official, updated January 2026). This is the authoritative source if the virgil-av dataset is found to be stale, but requires CSV parsing and more complex filtering logic. The virgil-av repo is sufficient for beta.

---

## Bucharest Special Case

Bucharest (`"auto": "B", "nume": "București"`) is the only administrative unit that is both a municipality and acts as its own "county" equivalent. [VERIFIED: Wikipedia via WebSearch]

- It is NOT part of Ilfov county (Ilfov is a separate surrounding county)
- Its 6 sectors (`Sector 1` through `Sector 6`) are its sub-units, analogous to cities in other counties
- For the dropdown: Bucharest appears as county "București" with cities ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"]
- No special branching code is needed — it is just another entry in the county array

---

## Architecture Patterns

### System Architecture Diagram

```
User selects county
     │
     ▼
CountyCityPicker component
     │
     ├─ reads ro-nomenclator.json (bundled static asset, loaded at import)
     │
     ├─ filters cities by selected county
     │
     ├─ calls setValue('county', ...) + setValue('city', ...)  [web: RHF]
     │  or setCounty(...) + setCity(...)                       [mobile: useState]
     │
     └─ calls onCitySelect(cityName)  [D-05 callback]
               │
               ▼
         Nominatim geocode
         "cityName, Romania"
               │
               ▼
         onChange({ latitude, longitude, address })
         ──► LocationPicker / LocationPickerMobile
         (moves map pin to city center)
```

### Recommended project structure additions

```
frontend/src/
├── data/
│   └── ro-nomenclator.json       # bundled static asset
├── components/
│   └── CountyCityPicker.jsx      # web: two <select> elements, RHF-integrated
mobile/
├── assets/
│   └── ro-nomenclator.json       # same file, Expo static asset
├── components/
│   └── CountyCityPickerMobile.tsx # two TouchableOpacity fields → Modal lists
backend/HandyLink.Infrastructure/Data/Migrations/
└── 004_add_county_field.sql      # ADD COLUMN IF NOT EXISTS county TEXT
```

### Pattern 1: Web CountyCityPicker (React Hook Form integration)

```jsx
// CountyCityPicker.jsx — accepts { control, setValue, errors } from RHF
// Source: [VERIFIED: PostJobPage.jsx existing pattern]

import nomenclator from '../data/ro-nomenclator.json';

export default function CountyCityPicker({ control, setValue, errors }) {
  const [counties] = useState(nomenclator);
  const county = useWatch({ control, name: 'county' });
  const cities = county
    ? (counties.find(c => c.auto === county)?.cities ?? [])
    : [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Județ</label>
        <select
          {...register('county')}  // passed via props or context
          className="w-full border rounded-lg px-3 py-2 text-sm ..."
          onChange={e => {
            setValue('county', e.target.value);
            setValue('city', '');
          }}
        >
          <option value="">Selectați județul</option>
          {counties.map(c => <option key={c.auto} value={c.auto}>{c.nume}</option>)}
        </select>
        {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Localitate</label>
        <select
          {...register('city')}
          disabled={!county}
          className="w-full border rounded-lg px-3 py-2 text-sm ... disabled:opacity-50"
        >
          <option value="">Selectați localitatea</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
      </div>
    </div>
  );
}
```

### Pattern 2: Mobile CountyCityPickerMobile (Modal full-screen)

```tsx
// CountyCityPickerMobile.tsx
// D-02: tap field → full-screen Modal with FlatList
// Source: [ASSUMED — based on existing modal patterns in the app]

export default function CountyCityPickerMobile({ county, city, onCountyChange, onCityChange }) {
  const [countyModalVisible, setCountyModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const cities = county
    ? (nomenclator.find(c => c.auto === county)?.cities ?? [])
    : [];

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setCountyModalVisible(true)}>
        <Text>{county || 'Selectați județul'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.field, !county && styles.disabled]}
        disabled={!county}
        onPress={() => setCityModalVisible(true)}
      >
        <Text>{city || 'Selectați localitatea'}</Text>
      </TouchableOpacity>

      <Modal visible={countyModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <FlatList
            data={nomenclator}
            keyExtractor={item => item.auto}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                onCountyChange(item.auto, item.nume);
                onCityChange('');
                setCountyModalVisible(false);
              }}>
                <Text>{item.nume}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
      {/* similar Modal for city */}
    </>
  );
}
```

### Pattern 3: D-05 Auto-center (Nominatim geocode on city select)

The existing `LocationPicker.jsx` already accepts `onChange({ latitude, longitude, address })`. The auto-center wires a geocode call in `PostJobPage` itself:

```jsx
// In PostJobPage.jsx — no change to LocationPicker.jsx needed
async function handleCitySelect(cityName) {
  // cityName = e.g. "Cluj-Napoca" from nomenclator
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=1&q=${encodeURIComponent(cityName + ', Romania')}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data[0]) {
    setLocation({
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      address: cityName,
    });
  }
}
```

`LocationPicker` re-renders when `latitude`/`longitude` props change — this is the existing pattern. No changes to `LocationPicker.jsx` itself are needed; the geocode call lives in the parent.

### Pattern 4: SQL migration (consistent with 003)

```sql
-- 004_add_county_field.sql
-- Run in: Supabase Dashboard > SQL Editor > New Query

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS county TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS county TEXT;
```

### Pattern 5: Backend — adding County to CreateJobCommand

```csharp
// CreateJobCommand.cs — add County parameter
public record CreateJobCommand(
    Guid ClientId,
    string Title,
    string Description,
    JobCategory Category,
    string City,
    string Country,
    string? County,       // add here
    string[]? Photos,
    decimal? BudgetMin,
    decimal? BudgetMax,
    decimal? Latitude,
    decimal? Longitude,
    string? Address
) : IRequest<CreateJobResponse>;
```

Handler maps `command.County` → `job.County`. CreateJobResponse and GetJobByIdResponse gain `County?` parameter. CreateJobDto and UpdateUserDto gain `County?` field.

### Anti-Patterns to Avoid

- **Fetching the nomenclator from a URL at runtime:** D-08 is explicit — static JSON bundle, not a network call. No API route for nomenclator data.
- **Filtering villages client-side from the full 13,756-entry dataset:** Pre-filter during the Wave 0 bundle-build step to keep the runtime JSON small.
- **Calling Nominatim for every city picker render:** D-05 fires a single geocode call only when a city is _selected_ (not on every keystroke or dropdown open).
- **Putting Bucharest sectors under Ilfov:** București is its own top-level county in the dropdown, not under Ilfov.
- **Using EF migrations:** SQL script only (`004_add_county_field.sql`), never `dotnet ef migrations add`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| County-to-cities mapping | Custom API endpoint | Bundled JSON static asset | D-08 locked; no backend needed |
| Full-screen modal on mobile | Custom overlay/portal | React Native `Modal` (built-in) | Already used in app; zero new deps |
| Form validation for county/city | Custom validation hook | Zod schema extension + RHF | Existing validation pipeline handles it |
| Nominatim geocoding | Custom geocode service | Direct `fetch` to Nominatim (existing pattern) | `LocationPickerMobile.tsx` already does this identically |

---

## Common Pitfalls

### Pitfall 1: Country field removal
**What goes wrong:** `PostJobPage` and `EditProfilePage` have a freeform `country` text input. D-09 implies Romania-only; developers may remove the `country` field entirely. But `Job.Country` and `Profile.Country` exist in the DB schema and backend.
**Why it happens:** Confusion between "add county" and "remove country."
**How to avoid:** Phase 16 adds `county`, leaves `country` unchanged. The `country` input on web forms can be hidden (hardcoded "RO") or left as-is; the field persists in schema and backend.
**Warning signs:** A PR that removes `Country` from `CreateJobDto` or `UpdateUserDto`.

### Pitfall 2: CreateJobCommand positional record breakage
**What goes wrong:** `CreateJobCommand` is a positional C# `record`. Inserting `County` in the wrong position breaks all callers that use positional construction (tests, handlers, controller).
**Why it happens:** Positional records require exact parameter order matches at all call sites.
**How to avoid:** Add `County` as the last optional parameter, or update all call sites in the same commit. The test `CreateJobHandlerTests.cs` uses positional construction — it must be updated.
**Warning signs:** Compiler errors like "no overload takes 12 arguments."

### Pitfall 3: iOS Modal scrolling performance with large city list
**What goes wrong:** A `FlatList` inside a `Modal` with 3,000+ items can jank on first render on iOS.
**Why it happens:** iOS Modal animation + FlatList initialRender costs.
**How to avoid:** Use `initialNumToRender={20}`, `maxToRenderPerBatch={20}`, `windowSize={5}` on FlatList. County list (42 items) doesn't need these. City list does.
**Warning signs:** Noticeable jank when opening the city modal.

### Pitfall 4: Diacritics vs ASCII in stored city names
**What goes wrong:** SIRUTA data contains diacritics (e.g., "Cluj-Napoca" vs "Iași" with special ș, ă, î). If stored with diacritics, D-05 Nominatim geocode works fine (Nominatim handles Romanian diacritics). If stored ASCII-normalized, display looks wrong.
**Why it happens:** Inconsistency between bundle generation and display.
**How to avoid:** Store and display Romanian names with full diacritics (use the `"nume"` field, not `"simplu"` from the source JSON). The `"simplu"` field is for search fallback, not storage.

### Pitfall 5: Web form isDirty broken after setValue
**What goes wrong:** `EditProfilePage` uses `disabled={!isDirty}` on the Save button. RHF `setValue` called from `CountyCityPicker` does not set `isDirty` unless `{ shouldDirty: true }` is passed.
**Why it happens:** RHF's `setValue` has an optional `shouldDirty` flag that defaults to false.
**How to avoid:** Call `setValue('county', value, { shouldDirty: true })` and `setValue('city', value, { shouldDirty: true })`.

---

## Code Examples

### Existing SQL migration pattern (verified)
```sql
-- Source: VERIFIED: backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address   TEXT;
```
Phase 16 follows identical pattern with `ADD COLUMN IF NOT EXISTS county TEXT`.

### Existing Nominatim direct-fetch pattern (mobile)
```typescript
// Source: VERIFIED: mobile/components/LocationPickerMobile.tsx line 51
const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=5&q=${encodeURIComponent(query)}`;
const res = await fetch(url, { headers: { 'User-Agent': 'HandyLink/1.0' } });
const data = await res.json();
```
D-05 geocode for city auto-center uses this same pattern with `limit=1`.

### Existing @react-native-picker/picker usage
```tsx
// Source: VERIFIED: mobile/app/(client)/post-job.tsx lines 113-121
<View style={styles.pickerWrapper}>
  <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
    {CATEGORIES.map(c => (
      <Picker.Item key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} value={c} />
    ))}
  </Picker>
</View>
```
Note: `@react-native-picker/picker` renders an inline scroll picker, not a modal. D-02 specifies a full-screen modal — `Modal` from `react-native` is the correct primitive, not `Picker`.

### Existing RHF + Zod pattern (web)
```jsx
// Source: VERIFIED: frontend/src/pages/PostJobPage.jsx
const schema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  // Phase 16 adds:
  county: z.string().min(1, 'County is required'),
});
// city stays in schema — now populated from nomenclator picker
```

---

## Integration Points (Complete List)

### Backend — files requiring changes

| File | Change |
|------|--------|
| `backend/HandyLink.Core/Entities/Job.cs` | Add `public string? County { get; set; }` |
| `backend/HandyLink.Core/Entities/Profile.cs` | Add `public string? County { get; set; }` |
| `backend/HandyLink.Core/DTOs/CreateJobDto.cs` | Add `string? County` parameter |
| `backend/HandyLink.Core/DTOs/UpdateUserDto.cs` | Add `string? County` parameter |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs` | Add `string? County` parameter |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs` | Map `command.County` → `job.County` |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs` | Add `string? County` parameter |
| `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs` | Add `string? County` parameter |
| `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdHandler.cs` | Include `County` in response construction |
| `backend/HandyLink.Core/Services/UserService.cs` | Map `dto.County` → `profile.County` in `UpdateCurrentUserAsync` |
| `backend/HandyLink.API/Controllers/JobsController.cs` | Pass `dto.County` to `CreateJobCommand` |
| `backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs` | Update positional `CreateJobCommand(...)` calls |
| `backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql` | New file |

### Frontend — files requiring changes

| File | Change |
|------|--------|
| `frontend/src/data/ro-nomenclator.json` | New file — derived SIRUTA bundle |
| `frontend/src/components/CountyCityPicker.jsx` | New component |
| `frontend/src/pages/PostJobPage.jsx` | Replace city TextInput + add county, wire D-05 |
| `frontend/src/pages/EditProfilePage.jsx` | Replace city TextInput + add county |

### Mobile — files requiring changes

| File | Change |
|------|--------|
| `mobile/assets/ro-nomenclator.json` | New file — same bundle |
| `mobile/components/CountyCityPickerMobile.tsx` | New component |
| `mobile/app/(client)/post-job.tsx` | Replace city TextInput + add county state, wire D-05 |
| `mobile/app/(worker)/profile.tsx` | Replace city TextInput + add county state |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | xUnit 2.9.3 + FluentAssertions 8.x |
| Config file | `backend/HandyLink.Tests/HandyLink.Tests.csproj` |
| Quick run command | `dotnet test backend/ --filter "FullyQualifiedName~CreateJob"` |
| Full suite command | `dotnet test backend/` |
| Frontend | Vitest 4.1.0 (`npm run test` in `frontend/`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOM-01 | CreateJobHandler persists County field | unit | `dotnet test backend/ --filter "FullyQualifiedName~CreateJobHandlerTests"` | Update existing |
| NOM-02 | CreateJobCommand accepts null County (old clients compat) | unit | same | Update existing |
| NOM-03 | UserService.UpdateCurrentUserAsync saves County to profile | unit | `dotnet test backend/ --filter "FullyQualifiedName~UserServiceTests"` | Update existing |
| NOM-04 | GetJobByIdResponse includes County | unit | `dotnet test backend/ --filter "FullyQualifiedName~GetJobByIdHandlerTests"` | Update existing |
| NOM-05 | ro-nomenclator.json has 42 county entries | unit (JS) | `npm run test` in `frontend/` | Wave 0 gap |
| NOM-06 | București county has 6 sector cities | unit (JS) | `npm run test` in `frontend/` | Wave 0 gap |

### Sampling Rate
- **Per task commit:** `dotnet test backend/ --filter "FullyQualifiedName~CreateJob"`
- **Per wave merge:** `dotnet test backend/`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/data/__tests__/ro-nomenclator.test.js` — covers NOM-05, NOM-06 (validate JSON structure)
- No new test files needed for backend — extend existing handler/service tests

---

## Environment Availability

Step 2.6: SKIPPED — this phase adds no new external tools, runtimes, or services. All dependencies (dotnet, node, expo) already verified operational in prior phases.

---

## Security Domain

This phase adds no authentication, no new API routes for sensitive data, and no new user-facing input validation gaps beyond what is already covered.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | County and city values validated server-side as non-empty strings; no SQL injection risk (TEXT column, parameterized EF Core) |
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V6 Cryptography | no | — |

No new threat patterns introduced. County/city are display strings with no privilege implications.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Filtered city count ~3,000–4,000 entries (non-village tier of SIRUTA) | Data Source | If much larger, lazy-load or pagination may be needed; low risk given gzip |
| A2 | Bundle size ~30–40 KB gzipped | Data Source | If significantly larger, consider lazy import; revisit before mobile build |
| A3 | `@react-native-picker/picker` is NOT used for D-02 modal — `Modal` + `FlatList` is the correct approach per decision | Architecture Patterns | If team prefers inline Picker, UX differs from D-02 spec |

---

## Open Questions (RESOLVED)

1. **Should `GetJobsResponse` (list endpoint) also include `county`?**
   - **RESOLVED: YES** — Add `County?` to `GetJobsResponse` for consistency with `GetJobByIdResponse`. Low cost, enables future filtering without a migration.

2. **Does the web `CountyCityPicker` need a search/filter input inside the `<select>`?**
   - **RESOLVED: NO** — No search input needed for beta. Native `<select>` scroll is sufficient for 42 counties and up to ~200 cities per county.

---

## Sources

### Primary (HIGH confidence)
- `frontend/src/pages/PostJobPage.jsx` — verified RHF + Zod pattern, existing city/country fields
- `frontend/src/components/LocationPicker.jsx` — verified onChange prop signature for D-05
- `mobile/components/LocationPickerMobile.tsx` — verified Nominatim direct-fetch pattern
- `mobile/app/(client)/post-job.tsx` — verified city state, @react-native-picker/picker usage
- `mobile/app/(worker)/profile.tsx` — verified city field in editing mode
- `frontend/src/pages/EditProfilePage.jsx` — verified city/country fields, RHF schema
- `backend/HandyLink.Core/Entities/Job.cs` — verified entity fields
- `backend/HandyLink.Core/Entities/Profile.cs` — verified entity fields
- `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs` — verified positional record
- `backend/HandyLink.Core/Services/UserService.cs` — verified UpdateCurrentUserAsync mapping
- `backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql` — verified migration pattern
- `backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs` — verified positional constructor call sites

### Secondary (MEDIUM confidence)
- [GitHub: virgil-av/judet-oras-localitati-romania](https://github.com/virgil-av/judet-oras-localitati-romania) — JSON structure verified via WebFetch
- [GitHub Gist: danielturus Romanian counties](https://gist.github.com/danielturus/bb84b16067d54fdb0cb5f04e62d92cf9) — 42-entry county list verified via WebFetch
- [data.gov.ro SIRUTA 2025](https://data.gov.ro/en/dataset/siruta-2025) — official source confirmed available, CSV format
- [Wikipedia: Sectors of Bucharest](https://en.wikipedia.org/wiki/Sectors_of_Bucharest) — special status confirmed

### Tertiary (LOW confidence)
- Bundle size estimates (A1, A2) — derived from data density reasoning, not measured

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in-project, verified in source files
- Architecture: HIGH — integration points verified by reading actual source files
- Data source: MEDIUM-HIGH — virgil-av dataset structure verified via WebFetch; exact filtered count not measured
- Pitfalls: HIGH — drawn from direct code inspection (positional records, isDirty flag, iOS FlatList)

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable domain)
