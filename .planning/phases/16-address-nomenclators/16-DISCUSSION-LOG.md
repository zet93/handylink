# Phase 16: Add Address Nomenclators - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 16-address-nomenclators
**Areas discussed:** UX Selector Pattern, Nominatim Coexistence, Schema Change, Data Source

---

## UX Selector Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Cascading dropdowns | County first, city filters to county. Two separate selectors. | ✓ |
| Search autocomplete | Single field, type city name, county auto-populated. | |
| You decide | Claude picks based on existing form patterns. | |

**User's choice:** Cascading dropdowns
**Notes:** Matches Romanian user expectations from government forms.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Modal picker | Tap field → full-screen modal with scrollable list. | ✓ |
| Inline ScrollPicker | iOS-style drum roll picker inline in form. | |
| You decide | Claude picks based on what the app already uses. | |

**User's choice:** Modal picker (for mobile)
**Notes:** Consistent with existing modal patterns in the app.

---

## Nominatim Coexistence

| Option | Description | Selected |
|--------|-------------|----------|
| Complementary — keep both | Nominatim for lat/lng, nomenclator for city/county only. | ✓ |
| Consolidate — drop Nominatim city extraction | Nominatim for lat/lng only; never extracts city. | |
| You decide | Claude figures out the cleanest integration. | |

**User's choice:** Complementary — keep both

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — auto-center map on selected city | Geocode city, move pin there as starting point. | ✓ |
| No — keep them independent | Nomenclator and Nominatim co-exist but don't auto-interact. | |

**User's choice:** Yes — auto-center map on selected city
**Notes:** City selection geocodes via Nominatim and centers the map pin. User can refine exact location.

---

## Schema Change

| Option | Description | Selected |
|--------|-------------|----------|
| Add county column, keep city as-is | county TEXT added to jobs and profiles. city unchanged. | ✓ |
| Add county + city_normalized columns | New city_normalized column alongside old city for legacy data. | |
| Structured IDs (county_id, city_id) | Foreign keys to a nomenclator table in Supabase. | |

**User's choice:** Add county column, keep city as-is

---

| Option | Description | Selected |
|--------|-------------|----------|
| Leave as-is | Old records keep freeform city. county = NULL for old records. | ✓ |
| Best-effort backfill | SQL script matches existing city values to nomenclator. | |

**User's choice:** Leave as-is (no backfill)

---

## Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded JSON bundle | Static JSON bundled with app. Works offline, zero latency. | ✓ |
| Supabase table (SIRUTA) | Seeded nomenclator table queried via API. | |
| External API | Call public Romanian geodata API at runtime. | |

**User's choice:** Hardcoded JSON bundle

---

| Option | Description | Selected |
|--------|-------------|----------|
| SIRUTA (official) | Romania's official administrative units registry from INSSE. | ✓ |
| OpenStreetMap / Nominatim extract | Populated places from Romanian OSM data. | |
| You decide | Claude finds the best-maintained dataset. | |

**User's choice:** SIRUTA (official)

---

## Claude's Discretion

- JSON structure (flat vs nested)
- Diacritics vs ASCII-normalized display
- Loading state styling for city dropdown
- Validation error messaging

## Deferred Ideas

- Proximity search by county/city
- Best-effort backfill of existing freeform city values
- Auto-detect county/city from device GPS
