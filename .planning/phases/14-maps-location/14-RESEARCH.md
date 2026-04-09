# Phase 14: Maps & Location - Research

**Researched:** 2026-04-09
**Domain:** Maps, geocoding, location storage — React/Vite (web) + React Native/Expo (mobile) + ASP.NET Core + Supabase PostgreSQL
**Confidence:** HIGH (core stack verified against Expo SDK 55 bundled versions and official docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-01 | Job creation includes an optional location (address or map pin) | Schema migration adds `latitude`, `longitude`, `address` to `jobs`; CreateJob command/handler extended; PostJob frontend/mobile screens updated |
| MAP-02 | Job listings show location visually (map or address display) | react-leaflet on web; react-native-maps on mobile; address text fallback when coordinates absent |
| MAP-03 | Worker profile can include a service area or location | Schema migration adds `latitude`, `longitude`, `city` columns to `worker_profiles`; WorkerProfile entity + DbContext updated; worker profile screens updated |
</phase_requirements>

---

## Summary

Phase 14 adds location data to jobs and worker profiles, then surfaces that data visually on maps. The stack splits cleanly: React Leaflet + OpenStreetMap on the web frontend (no API key, no cost, no rate limit at beta scale), and react-native-maps 1.27.2 on mobile (Apple Maps on iOS, Google Maps on Android — requires Google Maps API key for Android EAS builds).

The database layer needs two additive SQL migrations: `jobs` gets `latitude`, `longitude`, `address` (all nullable), and `worker_profiles` gets `latitude`, `longitude`. No EF migrations — SQL scripts in `Data/Migrations/` only.

Backend changes are a CQRS extension: `CreateJobCommand` gains optional lat/lng/address fields; `GetJobsHandler` includes them in `JobSummary`; a new `UpdateWorkerLocationCommand` slice handles worker location saves. Neither PostGIS nor any advanced spatial queries are needed for beta — plain `DECIMAL(9,6)` columns are sufficient because v1 only displays pins, not proximity search.

**Primary recommendation:** Store coordinates as plain decimal columns (no PostGIS for beta). Use OpenStreetMap/Nominatim for geocoding (free, no key). Use react-leaflet on web and react-native-maps on mobile. Add Google Maps API key as environment variable for Android EAS builds.

---

## Project Constraints (from CLAUDE.md)

- Schema changes via SQL scripts in `Data/Migrations/` — NEVER EF migrations
- NEVER create a Service class — use MediatR Handlers only
- NEVER read user ID from request body — always `GetUserId()` from JWT
- VSA + CQRS feature slice structure: `{Action}Command.cs`, `{Action}Handler.cs`, `{Action}Validator.cs`, `{Action}Response.cs`
- ASP.NET Core 10 / React 19 / Expo 55 / TypeScript — no framework changes
- Secrets in environment variables only; no hardcoded keys
- CORS is permissive for now

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-leaflet | 5.0.0 | Interactive maps in React | No API key, free OSM tiles, React 19 compatible |
| leaflet | 1.9.4 | Underlying map engine for react-leaflet | Peer dependency |
| react-native-maps | 1.27.2 | Maps on iOS/Android in Expo | Expo SDK 55 bundled pin; v1.27.2 fixes the Expo 55 iOS AppDelegate regex bug |
| expo-location | ~55.1.8 | Device GPS in mobile app | Expo SDK 55 bundled pin; foreground permissions, `getCurrentPositionAsync` |
| leaflet-geosearch | 4.4.0 | Address autocomplete + geocoding for web | OpenStreetMapProvider works with Nominatim, no key required |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PostGIS | (Supabase extension) | Spatial queries | Skip for beta — plain DECIMAL columns suffice; enable in v2 for proximity search (MATCH-01) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-leaflet | Google Maps JS API | Google Maps requires billing account; Leaflet is free, lighter, sufficient for pin display |
| Nominatim (free) | Google Places Autocomplete | Google charges per request; Nominatim is free but 1 req/s rate limit — fine for one user at a time |
| react-native-maps | expo-maps | `expo-maps` is alpha, unavailable in Expo Go, breaks frequently — too unstable for beta |
| plain DECIMAL columns | PostGIS geography type | PostGIS needed only for spatial queries (distance sort); beta only shows pins so plain columns are correct |

**Installation (web):**
```bash
npm install react-leaflet leaflet leaflet-geosearch
```

**Installation (mobile — run from `mobile/`):**
```bash
npx expo install react-native-maps expo-location
```

**Version verification:**
```bash
npm view react-leaflet version        # 5.0.0
npm view react-native-maps version    # 1.27.2
npm view expo-location version        # 55.1.7 (55.1.8 when installed via Expo)
```

---

## Architecture Patterns

### Schema Changes (SQL Migrations)

Create `003_add_location_fields.sql` in `backend/HandyLink.Infrastructure/Data/Migrations/`:

```sql
-- Migration 003: Add location fields to jobs and worker_profiles
-- Run in: Supabase Dashboard → SQL Editor → New Query

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address   TEXT;

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
```

All columns are nullable — location is optional for both jobs and worker profiles.

### Backend Feature Slices

**Pattern:** Extend existing slices and add one new slice. Do not create service classes.

Affected slices:
- `Features/Jobs/CreateJob/` — add optional `Latitude?`, `Longitude?`, `Address?` to command and propagate to entity/response
- `Features/Jobs/GetJobs/` — include `Latitude`, `Longitude`, `Address` in `JobSummary` record
- `Features/Jobs/GetJobById/` — include location fields in response
- New: `Features/Workers/UpdateWorkerLocation/` — `UpdateWorkerLocationCommand` + handler

**Entity changes:**

```csharp
// Job.cs — add to existing properties
public decimal? Latitude { get; set; }
public decimal? Longitude { get; set; }
public string? Address { get; set; }
```

```csharp
// WorkerProfile.cs — add to existing properties
public decimal? Latitude { get; set; }
public decimal? Longitude { get; set; }
```

**DbContext — EF Core column mapping (no migration needed, just property recognition):**
EF Core will pick up the new properties automatically via convention. The SQL migration adds the columns to the DB.

### Web Frontend Pattern (react-leaflet)

Leaflet requires a CSS import and has a known icon path bug in bundlers — both must be fixed.

```jsx
// In your component or main entry — import leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix default icon paths broken by Vite/webpack bundlers
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
```

**Map display component:**
```jsx
// Source: https://react-leaflet.js.org/docs/start-introduction/
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function JobMap({ latitude, longitude, address }) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={14} style={{ height: '300px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[latitude, longitude]}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
}
```

**Address search with geocoding:**
```jsx
// Source: https://github.com/smeijer/leaflet-geosearch
import { OpenStreetMapProvider } from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider({
  params: { countrycodes: 'ro' }  // Restrict to Romania
});

const results = await provider.search({ query: inputValue });
// results[0].x = longitude, results[0].y = latitude, results[0].label = address string
```

### Mobile Pattern (react-native-maps)

```tsx
// Source: https://docs.expo.dev/versions/latest/sdk/map-view/
import MapView, { Marker } from 'react-native-maps';

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: 44.4268,     // Bucharest default
    longitude: 26.1025,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
>
  {latitude && longitude && (
    <Marker coordinate={{ latitude, longitude }} title={title} />
  )}
</MapView>
```

**Device location (Expo):**
```tsx
// Source: https://docs.expo.dev/versions/latest/sdk/location/
import * as Location from 'expo-location';

const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') return;
const location = await Location.getCurrentPositionAsync({});
// location.coords.latitude, location.coords.longitude
```

**app.json config plugin (required for Google Maps on Android EAS builds):**
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-notifications",
      [
        "react-native-maps",
        {
          "androidGoogleMapsApiKey": "$GOOGLE_MAPS_API_KEY"
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Show current location on map"
        }
      ]
    ]
  }
}
```

Note: `iosGoogleMapsApiKey` is intentionally omitted — iOS uses Apple Maps by default which requires no key.

### Recommended Project Structure Additions

```
backend/
├── HandyLink.API/Features/Jobs/
│   ├── CreateJob/         # extend command + handler + response
│   ├── GetJobs/           # extend JobSummary + response
│   └── GetJobById/        # extend response
├── HandyLink.API/Features/Workers/
│   └── UpdateWorkerLocation/   # NEW: command + handler + validator + response
│       ├── UpdateWorkerLocationCommand.cs
│       ├── UpdateWorkerLocationHandler.cs
│       ├── UpdateWorkerLocationValidator.cs
│       └── UpdateWorkerLocationResponse.cs
└── HandyLink.Infrastructure/Data/Migrations/
    └── 003_add_location_fields.sql   # NEW

frontend/src/
├── pages/
│   ├── PostJobPage.jsx      # add address input + map picker
│   └── JobDetailPage.jsx    # add map display
│   └── WorkerProfilePage.jsx # add location display
└── components/
    ├── JobMap.jsx            # NEW: leaflet map component
    └── LocationPicker.jsx    # NEW: address input + geocoding

mobile/app/
├── (client)/
│   ├── post-job.tsx          # add location input
│   └── job-detail.tsx        # add map display
└── (worker)/
    └── profile.tsx           # add location input
```

### Anti-Patterns to Avoid

- **Don't use PostGIS for beta:** Enabling PostGIS for simple lat/lng storage adds complexity with no beta benefit. PostGIS is for spatial queries (proximity search), which is v2 scope (MATCH-01).
- **Don't use expo-maps:** It is alpha, breaks frequently, and not available in Expo Go.
- **Don't request background location:** Foreground-only permission is sufficient; background triggers OS-level privacy prompts that users reject.
- **Don't block job creation on missing location:** MAP-01 says location is optional. Validator must not require it.
- **Don't inline Leaflet CSS in component:** Import once in app entry or PostJobPage; duplicate imports cause flicker.
- **Don't hardcode Google Maps API key:** Must be an environment variable injected via EAS secrets.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Address → coordinates | Custom fetch to Nominatim API | `leaflet-geosearch` with `OpenStreetMapProvider` | Handles debounce, error handling, result normalization |
| Map pin dragging (web) | Custom drag event handlers | react-leaflet `Marker` with `draggable` prop + `dragend` event | Built in to react-leaflet |
| iOS map rendering | Custom native module | react-native-maps (uses Apple MapKit natively) | Built in, no key needed |
| Marker clustering | Custom overlap logic | react-leaflet-cluster (if needed) | Not needed for beta — one pin per job |

**Key insight:** Geocoding has subtle edge cases (partial matches, ambiguous addresses, international formats). Even Nominatim has quirks with Romanian addresses (diacritics, street abbreviations). Use the provider abstraction from `leaflet-geosearch` rather than raw fetch calls — it handles URL encoding and result normalization correctly.

---

## Common Pitfalls

### Pitfall 1: Leaflet Marker Icons Broken in Vite/webpack

**What goes wrong:** Map renders but markers are invisible (404 on icon PNG files).
**Why it happens:** Leaflet uses `_getIconUrl` which assumes file paths that bundlers remap or hash.
**How to avoid:** Delete `L.Icon.Default.prototype._getIconUrl` and call `L.Icon.Default.mergeOptions(...)` with explicit imports of the PNG assets (shown in Code Examples above).
**Warning signs:** Map tiles load but no pin appears; browser devtools shows 404 for `marker-icon.png`.

### Pitfall 2: react-native-maps Expo 55 iOS Crash (FIXED in 1.27.2)

**What goes wrong:** Config plugin throws "Cannot add Google Maps to the project's AppDelegate because it's malformed."
**Why it happens:** Versions 1.26.x–1.27.1 had a regex that couldn't parse Expo 55's AppDelegate format.
**How to avoid:** Use exactly 1.27.2 via `npx expo install react-native-maps` which pins to the Expo 55 bundled version.
**Warning signs:** Build fails during `expo prebuild`; error mentions AppDelegate regex.

### Pitfall 3: Google Maps API Key Not Injected in EAS Build

**What goes wrong:** Android map renders blank/white in production build.
**Why it happens:** `app.json` references `$GOOGLE_MAPS_API_KEY` but EAS doesn't have it in its secrets.
**How to avoid:** Add key to EAS secrets before running a production build. During Expo Go development, no key is needed.
**Warning signs:** Map works in Expo Go but blank in EAS preview build.

### Pitfall 4: Nominatim Rate Limit (1 req/s)

**What goes wrong:** Address searches return 429 or empty results for fast typists.
**Why it happens:** Public Nominatim instance enforces 1 request/second maximum.
**How to avoid:** Debounce the search input (300–500ms). `leaflet-geosearch` does not debounce automatically — add debounce in the input handler.
**Warning signs:** Fast typing returns no results; network tab shows many rapid requests.

### Pitfall 5: MapView Height Must Be Explicit on Mobile

**What goes wrong:** Map renders as 0px height — invisible.
**Why it happens:** React Native flex layout requires an explicit height on `MapView`; `flex: 1` works only when the parent has a defined height.
**How to avoid:** Set `style={{ height: 250, width: '100%' }}` or ensure parent has `flex: 1` with a known height constraint.
**Warning signs:** MapView renders but is invisible; no error thrown.

### Pitfall 6: Romanian Address Geocoding Quality

**What goes wrong:** Nominatim returns no results or wrong coordinates for Romanian addresses.
**Why it happens:** Romanian OSM data quality varies by city. Diacritics (ș, ț, ă) may or may not match depending on input.
**How to avoid:** Use `countrycodes: 'ro'` parameter to restrict results. Accept fuzzy matching — display the label Nominatim returns rather than the user's raw input. Fall back gracefully to address text-only display when no coordinates found.
**Warning signs:** Search for "Strada Florilor, Cluj" returns nothing but "florilor cluj" succeeds.

---

## Code Examples

### CreateJobCommand extension

```csharp
// backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs
public record CreateJobCommand(
    Guid ClientId,
    string Title,
    string Description,
    JobCategory Category,
    string City,
    string Country,
    string[]? Photos,
    decimal? BudgetMin,
    decimal? BudgetMax,
    decimal? Latitude,    // new
    decimal? Longitude,   // new
    string? Address       // new
) : IRequest<CreateJobResponse>;
```

### UpdateWorkerLocationCommand (new slice)

```csharp
// backend/HandyLink.API/Features/Workers/UpdateWorkerLocation/UpdateWorkerLocationCommand.cs
public record UpdateWorkerLocationCommand(
    Guid WorkerId,
    decimal? Latitude,
    decimal? Longitude
) : IRequest<UpdateWorkerLocationResponse>;
```

### JobSummary with location fields

```csharp
// backend/HandyLink.API/Features/Jobs/GetJobs/GetJobsResponse.cs
public record JobSummary(
    Guid Id, Guid ClientId, string Title, string Category,
    string City, string Country,
    decimal? BudgetMin, decimal? BudgetMax,
    string Status, int BidCount, DateTimeOffset CreatedAt,
    decimal? Latitude, decimal? Longitude, string? Address  // new
);
```

### Mobile location permission + current position

```tsx
// mobile/app/(client)/post-job.tsx (excerpt)
import * as Location from 'expo-location';

const useCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced
  });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
};
```

### Web address search with Romania filter

```jsx
// frontend/src/components/LocationPicker.jsx (excerpt)
import { OpenStreetMapProvider } from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider({ params: { countrycodes: 'ro' } });

// Inside debounced handler:
const results = await provider.search({ query: value });
if (results.length > 0) {
  setCoords({ lat: results[0].y, lng: results[0].x });
  setAddress(results[0].label);
}
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Install packages | ✓ | (project default) | — |
| react-native-maps 1.27.2 | Mobile maps | Not yet installed | — | Must install |
| expo-location ~55.1.8 | Device GPS | Not yet installed | — | Must install |
| react-leaflet 5.0.0 | Web maps | Not yet installed | — | Must install |
| leaflet 1.9.4 | Web maps peer dep | Not yet installed | — | Must install |
| leaflet-geosearch 4.4.0 | Address geocoding | Not yet installed | — | Must install |
| Google Maps API Key | Android EAS build | Not verified | — | Expo Go works without it; needed for EAS Android build |

**Missing dependencies with no fallback:**
- Google Maps API key is needed for Android EAS production builds. Without it, the app works in Expo Go but the map is blank in EAS builds. The key must be added to EAS secrets before any EAS build in this phase.

**Missing dependencies with fallback:**
- All npm packages above are installable; none block planning.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | xUnit 2.9.3 (backend), Vitest 4.1.0 (frontend) |
| Config file | `backend/HandyLink.Tests/` (xUnit), `frontend/vite.config.js` (Vitest) |
| Quick run command | `dotnet test backend/ --filter "FullyQualifiedName~Location"` |
| Full suite command | `dotnet test backend/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-01 | CreateJob accepts optional lat/lng/address | unit | `dotnet test backend/ --filter "FullyQualifiedName~CreateJob"` | ✅ |
| MAP-01 | CreateJob stores null when location omitted | unit | `dotnet test backend/ --filter "FullyQualifiedName~CreateJob"` | ✅ |
| MAP-02 | JobSummary includes location fields in GET /jobs response | unit | `dotnet test backend/ --filter "FullyQualifiedName~GetJobs"` | ✅ |
| MAP-03 | UpdateWorkerLocation persists coordinates | unit | `dotnet test backend/ --filter "FullyQualifiedName~UpdateWorkerLocation"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `dotnet test backend/ --filter "FullyQualifiedName~Location OR FullyQualifiedName~CreateJob OR FullyQualifiedName~GetJobs"`
- **Per wave merge:** `dotnet test backend/`
- **Phase gate:** Full backend suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/HandyLink.Tests/Features/Workers/UpdateWorkerLocationHandlerTests.cs` — covers MAP-03

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Maps (paid) | OpenStreetMap + Nominatim (free) | Ongoing | Zero API cost for beta |
| expo-maps (experimental) | react-native-maps (stable) | 2025 | expo-maps not production-ready; stick with react-native-maps |
| PostGIS for all location | Plain DECIMAL columns | N/A | PostGIS needed only for spatial queries, not pin display |
| react-native-maps < 1.27.2 | react-native-maps 1.27.2 | 2025 | Fixes Expo 55 iOS AppDelegate regex crash |

**Deprecated/outdated:**
- `expo-maps`: Alpha, unavailable in Expo Go, frequently breaking — do not use for beta
- `react-native-maps` < 1.27.2: Broken with Expo 55 on iOS when using Google Maps provider

---

## Open Questions

1. **Google Maps API Key availability**
   - What we know: Android EAS builds require a Google Maps API key in the react-native-maps config plugin
   - What's unclear: Whether the developer has a Google Cloud project with Maps SDK for Android enabled
   - Recommendation: Create a Wave 0 task to verify/create the API key and add it to EAS secrets; the rest of mobile development works in Expo Go without it

2. **Worker location — city text vs. coordinates**
   - What we know: `worker_profiles` currently has no location columns; `profiles` has `city TEXT`
   - What's unclear: Whether worker location display should use the existing `profiles.city` text or the new lat/lng columns
   - Recommendation: Add `latitude`/`longitude` to `worker_profiles` for map display; continue using `profiles.city` for text display — they serve different purposes

---

## Sources

### Primary (HIGH confidence)
- Expo SDK 55 bundled native modules manifest (verified via `githubusercontent.com/expo/sdk-55`) — confirmed `react-native-maps: 1.27.2`, `expo-location: ~55.1.8`, `expo-maps: ~55.0.16`
- https://docs.expo.dev/versions/latest/sdk/map-view/ — react-native-maps Expo documentation, config plugin setup, API key requirements
- https://docs.expo.dev/versions/latest/sdk/location/ — expo-location API, `requestForegroundPermissionsAsync`, `getCurrentPositionAsync`
- https://github.com/expo/expo/issues/43288 — confirmed react-native-maps 1.27.2 fixes Expo 55 iOS AppDelegate regex crash
- https://supabase.com/docs/guides/database/extensions/postgis — PostGIS in Supabase; SQL syntax for `geography(POINT)` columns
- `npm view react-leaflet version` → 5.0.0 (verified live)
- `npm view leaflet version` → 1.9.4 (verified live)
- `npm view react-native-maps version` → 1.27.2 (verified live)
- `npm view leaflet-geosearch version` → 4.4.0 (verified live)

### Secondary (MEDIUM confidence)
- https://react-leaflet.js.org/ — react-leaflet docs; MapContainer, TileLayer, Marker components
- https://github.com/smeijer/leaflet-geosearch — OpenStreetMapProvider with countrycodes param
- https://operations.osmfoundation.org/policies/nominatim/ — Nominatim usage policy: 1 req/s rate limit confirmed

### Tertiary (LOW confidence)
- WebSearch results on Nominatim Romania geocoding accuracy — no Romania-specific accuracy data found; general guidance only

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against Expo SDK 55 bundled manifest and npm registry
- Architecture: HIGH — based on existing codebase patterns (CreateJob, GetJobs slice structure confirmed by source read)
- Pitfalls: HIGH — Expo 55 + react-native-maps 1.27.2 fix confirmed via GitHub issue; Leaflet icon bug is well-documented ecosystem knowledge
- Romanian geocoding accuracy: LOW — no authoritative source found; empirical testing needed

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable libraries; expo-maps alpha status may change)
