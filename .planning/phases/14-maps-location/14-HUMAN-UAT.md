---
status: partial
phase: 14-maps-location
source: [14-VERIFICATION.md]
started: 2026-04-20T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. PostJobPage — location search and display
expected: Nominatim search returns Romanian address suggestions; selecting one auto-pins the map; submitting the job causes the pin to appear on the job detail map
result: [pending]

### 2. JobDetailPage — conditional map display (web)
expected: Jobs with lat/lng show an embedded Leaflet map with a pin at the correct location; jobs without coordinates show no map component
result: [pending]

### 3. EditProfilePage — worker service area save
expected: Worker selects a location via LocationPicker and a radius (10/20/50/100 km), saves profile, and PUT /api/users/me/location is called with correct latitude/longitude/service_radius_km values
result: [pending]

### 4. Mobile post-job — LocationPickerMobile + MapView
expected: LocationPickerMobile shows Nominatim suggestions (Romania-restricted), selecting one renders a confirmation MapView; location data is included in the POST payload on submit
result: [pending]

### 5. Mobile job-detail — JobMapMobile conditional render
expected: Jobs with lat/lng show a MapView with a Marker at the correct location; jobs without coordinates show no map
result: [pending]

### 6. Mobile worker profile — service area save
expected: Worker profile screen shows Service Area section with LocationPickerMobile and radius selector; saving calls PUT /api/users/me/location with correct values
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
