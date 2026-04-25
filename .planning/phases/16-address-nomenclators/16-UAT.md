---
status: testing
phase: 16-address-nomenclators
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md, 16-05-SUMMARY.md, 16-06-SUMMARY.md]
started: 2026-04-25T00:00:00Z
updated: 2026-04-25T00:00:00Z
---

## Current Test

number: 1
name: Web Post Job — County and city dropdowns replace freeform input
expected: |
  Open the Post Job page on the web app. Where the "City" text field used to be, you
  should now see two dropdowns side by side: "Județ" (county) and "Oraș / Comună" (city).
  The city dropdown should be greyed out with the text "Selectează județul întâi" until
  a county is chosen.
awaiting: user response

## Tests

### 1. Web Post Job — County and city dropdowns replace freeform input
expected: Open Post Job page on web. Two dropdowns side-by-side — "Județ" (county) and "Oraș / Comună" (city). City dropdown is grey/disabled showing "Selectează județul întâi" until county is chosen.
result: [pending]

### 2. Web Post Job — County → city cascade
expected: Select a county from the first dropdown (e.g. "Cluj"). The city dropdown becomes enabled and shows only cities in that county (e.g. "Cluj-Napoca", "Dej", "Turda"). Selecting a different county replaces the city list.
result: [pending]

### 3. Web Post Job — D-05 map auto-centers on city selection
expected: After selecting a county and then a city, the map on the Post Job page automatically pans/zooms to that city as a starting location. The pin can still be moved manually after the auto-center.
result: [pending]

### 4. Web Edit Profile — County and city dropdowns replace freeform input
expected: Open the Edit Profile / worker profile page on web. The "City" text field is replaced by "Județ" and "Oraș / Comună" dropdowns. If you had a county/city saved previously, the dropdowns should be pre-populated.
result: [pending]

### 5. Web Edit Profile — Save button activates after county change
expected: On the Edit Profile page, change the selected county. The Save button should become enabled/active. Submit the form — the county and city are saved and visible when you return to the profile.
result: [pending]

### 6. Mobile Post Job — County picker opens as full-screen modal
expected: On the mobile Post Job screen, tap the "Județ" field. A full-screen modal slides up with a scrollable list of all 42 Romanian counties. Tapping a county closes the modal and shows the selected county name in the field.
result: [pending]

### 7. Mobile Post Job — City modal filters to selected county
expected: After selecting a county on mobile Post Job, tap the "Oraș / Comună" field. A full-screen modal slides up showing only cities for the selected county. Tapping a city closes the modal and shows the city name in the field.
result: [pending]

### 8. Mobile Post Job — D-05 map auto-centers on city selection
expected: After selecting both county and city on mobile Post Job, the map automatically moves to center on that city. The pin is then adjustable for the exact location.
result: [pending]

### 9. Mobile Worker Profile — County picker visible in edit mode
expected: On the mobile worker profile, tap "Edit Profile". The "Județ" and "Oraș / Comună" picker fields appear. Tapping either opens a full-screen modal. After selecting county and city, saving the profile persists the values.
result: [pending]

### 10. Mobile Worker Profile — County displayed in read-only view
expected: After saving a county+city to the worker profile on mobile, the profile read-only view shows a "Județ" row displaying the selected county name.
result: [pending]

### 11. Job detail includes county in API response
expected: Post a job with a county+city selected. View the job detail — the county field is visible alongside city. (Can also verify via dev tools: GET /api/jobs/{id} response includes a "county" field with the selected value.)
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps

[none yet]
