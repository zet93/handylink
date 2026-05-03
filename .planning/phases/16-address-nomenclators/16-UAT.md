---
status: complete
phase: 16-address-nomenclators
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md, 16-05-SUMMARY.md, 16-06-SUMMARY.md]
started: 2026-04-25T00:00:00Z
updated: 2026-04-25T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Web Post Job — County and city dropdowns + cascade
expected: Open Post Job page on web. Two dropdowns side-by-side — "Județ" (county) and "Oraș / Comună" (city). City dropdown is grey/disabled showing "Selectează județul întâi" until county is chosen. Selecting a county populates the city list with only that county's cities.
result: pass

### 2. Web Post Job — D-05 map auto-centers on city selection
expected: After selecting a county and then a city, the map automatically pans/zooms to that city. Changing to a different city should move the map again.
result: issue
reported: "Yes, but after selecting another City from the dropdown, the map does not move to the newly selected city"
severity: major

### 3. Web Edit Profile — County and city dropdowns replace freeform input
expected: Open the Edit Profile page on web. The "City" text field is replaced by "Județ" and "Oraș / Comună" dropdowns. If a county/city was previously saved, the dropdowns are pre-populated.
result: pass

### 4. Web Edit Profile — Save button activates after county change
expected: On the Edit Profile page, change the selected county. The Save button should become enabled/active. Submit the form — the county and city are saved and visible when you return to the profile.
result: issue
reported: "No, and the city dropdown contains only the cities, does not contain all the villages from the county"
severity: major
sub_issues:
  - "Save button does not activate after changing county (shouldDirty not working on county select)"
  - "Communes (comune) missing from city list — dropdown label says 'Oraș / Comună' but only cities/towns are present"

### 5. Mobile Post Job — County picker opens as full-screen modal
expected: On the mobile Post Job screen, tap the "Județ" field. A full-screen modal slides up with a scrollable list of all 42 Romanian counties. Tapping a county closes the modal and shows the selected county name in the field.
result: pass

### 6. Mobile Post Job — City modal filters to selected county
expected: After selecting a county on mobile Post Job, tap the "Oraș / Comună" field. A full-screen modal slides up showing only cities for the selected county. Tapping a city closes the modal and shows the city name in the field.
result: pass
note: "User confirmed cascade works but also wants communes/villages added — same data gap as Test 4"

### 7. Mobile Post Job — D-05 map auto-centers on city selection
expected: After selecting both county and city on mobile Post Job, the map automatically moves to center on that city. The pin is then adjustable for the exact location.
result: pass

### 8. Mobile Worker Profile — County picker visible in edit mode
expected: On the mobile worker profile, tap "Edit Profile". The "Județ" and "Oraș / Comună" picker fields appear. Tapping either opens a full-screen modal. After selecting county and city, saving the profile persists the values.
result: issue
reported: "tapping does nothing"
severity: major

### 9. Mobile Worker Profile — County displayed in read-only view
expected: After saving a county+city to the worker profile on mobile, the profile read-only view shows a "Județ" row displaying the selected county name.
result: pass

### 10. Job detail includes county in API response
expected: Post a job with a county+city selected. View the job detail — the county field is visible alongside city.
result: skipped
reason: "user skipped"

## Summary

total: 10
passed: 6
issues: 3
pending: 0
skipped: 1
blocked: 0

## Gaps

- truth: "Changing to a different city from the dropdown should re-center the map to that city (D-05)"
  status: failed
  reason: "User reported: map auto-centers on first city selection but does not move when a different city is selected from the dropdown"
  severity: major
  test: 2
  artifacts: []
  missing: []

- truth: "Save button on Edit Profile activates when county or city is changed (shouldDirty: true)"
  status: failed
  reason: "User reported: Save button does not activate after changing county"
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "City/Comună dropdown lists both cities/towns AND communes across web and mobile (Oraș / Comună label covers both)"
  status: failed
  reason: "User reported on web (Test 4) and mobile (Test 6): dropdown contains only cities, not communes/villages — SIRUTA data filtered too aggressively"
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "Mobile worker profile county/city picker opens a full-screen modal when tapped in edit mode"
  status: failed
  reason: "User reported: tapping the county/city picker fields does nothing — modal does not open"
  severity: major
  test: 8
  artifacts: []
  missing: []
