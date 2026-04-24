# Phase 14: Maps & Location - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Add location data to jobs and worker profiles so that workers can see where a job is located and clients can mark their job's location. Scope: location input on job creation, location display on job detail, and a location field on worker profiles. Proximity-based job search/filtering is Phase 15+.

</domain>

<decisions>
## Implementation Decisions

### Location input method (job creation)
- **D-01:** Address search + auto-pin. Client types an address into a search field, Nominatim geocodes it (countrycodes=ro for Romanian addresses), a pin appears on a small confirmation map. Lat/lng saved to the job record alongside the existing `city` field.
- **D-02:** Location is optional — job creation must still work without a location.

### Map display on job detail
- **D-03:** Embedded map with a pin on the job detail screen/page — both web and mobile. Workers see location at a glance without leaving the page.
- **D-04:** Only shown when the job has lat/lng — gracefully hidden when no location set.

### Worker service area (profile)
- **D-05:** City + radius text entry. Worker types a city name (geocoded to lat/lng) and selects a radius from a preset list (10 km, 20 km, 50 km, 100 km). Stored as `latitude`, `longitude`, `service_radius_km` on `worker_profiles`. Enables future proximity search (Phase 15, MATCH-01).
- **D-06:** Optional — existing worker profiles without a location remain valid.

### Platform parity
- **D-07:** Full parity — both web and mobile get the same feature set. Web uses react-leaflet + OpenStreetMap. Mobile uses react-native-maps (pinned to 1.27.2 for Expo 55). Address search uses Nominatim on both platforms.

### Claude's Discretion
- Exact map height/dimensions on job detail
- Radius selector UI (picker vs segmented control vs dropdown)
- Address search debounce timing
- Map zoom level for pin display

</decisions>

<specifics>
## Specific Ideas

No specific references or "I want it like X" moments — standard map patterns apply.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing integration points
- `frontend/src/pages/JobsPage.jsx` — Current job listing with `city` text filter; map display goes on detail not list
- `mobile/app/(client)/post-job.tsx` — Current post-job form with `city` text field; location input added here
- `mobile/app/(client)/job-detail.tsx` — Where embedded map goes on mobile
- `frontend/src/pages/JobDetailPage.jsx` — Where embedded map goes on web
- `mobile/app/(worker)/profile.tsx` — Where worker service area entry goes on mobile
- `frontend/src/pages/EditProfilePage.jsx` — Where worker service area entry goes on web

### Research (verified library versions and known pitfalls)
- `.planning/phases/14-maps-location/14-RESEARCH.md` — Standard stack, Expo 55 compatibility notes, Leaflet icon bug fix, Romanian geocoding approach

### Requirements
- `.planning/REQUIREMENTS.md` §MAP-01, MAP-02, MAP-03 — Acceptance criteria for all three map requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `palette`, `typography` from `mobile/app/constants/design.ts` — use for map container styling on mobile
- `axiosClient` (frontend) / `api` (mobile) — existing HTTP clients; Nominatim calls go directly from the client, not through the backend
- React Query (`useQuery`, `useMutation`) — already used everywhere; geocoding results can be cached with useQuery

### Established Patterns
- Mobile screens use `SafeAreaView + ScrollView + StyleSheet` — map component embeds inside this
- Web pages use Tailwind utility classes — map container gets `h-64 rounded-lg overflow-hidden`
- Optional fields on forms already handled (budgetMin/budgetMax in post-job.tsx are optional by checking before sending)

### Integration Points
- Job creation: POST `/api/jobs` body gets `latitude` and `longitude` nullable decimal fields
- Job detail: GET `/api/jobs/{id}` response needs to include `latitude`, `longitude`, `address`
- Worker profile: PUT `/api/users/me` body gets `latitude`, `longitude`, `service_radius_km`
- Schema: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6)` etc. via SQL script in `Data/Migrations/`

</code_context>

<deferred>
## Deferred Ideas

- Proximity-based job search ("show jobs within X km of me") — Phase 15, MATCH-01
- Map view of all job listings (replace list view with map) — backlog, not needed for beta

</deferred>

---

*Phase: 14-maps-location*
*Context gathered: 2026-04-19*
