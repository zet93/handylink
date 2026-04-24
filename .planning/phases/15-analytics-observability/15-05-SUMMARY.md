---
phase: 15-analytics-observability
plan: "05"
subsystem: mobile
tags: [analytics, posthog, sentry, gdpr, consent]
dependency_graph:
  requires: []
  provides: [mobile-posthog-init, mobile-sentry-init, mobile-consent-modal]
  affects: [mobile/app/_layout.tsx]
tech_stack:
  added:
    - posthog-react-native 4.43.1
    - "@sentry/react-native (latest)"
    - "@react-native-async-storage/async-storage"
    - expo-file-system
    - expo-application
    - expo-device
    - expo-localization
  patterns:
    - PostHogProvider wrapping with defaultOptIn=false for GDPR compliance
    - Sentry.wrap at the outermost component for render-time error capture
    - AsyncStorage guard prevents consent modal from re-appearing after decision
key_files:
  created:
    - mobile/services/posthog.ts
    - mobile/components/ConsentModal.tsx
  modified:
    - mobile/app/_layout.tsx
    - mobile/app.json
    - mobile/package.json
    - mobile/package-lock.json
decisions:
  - PostHog initialized with defaultOptIn=false — no events fire until user opts in (GDPR)
  - Sentry initialized unconditionally — no consent required for error capture
  - ConsentModal sheetIndex defaults to -1 to prevent flicker on cold start
  - AsyncStorage key 'consent_decided' guards modal display only; PostHog RN tracks opt state internally
  - expo-localization added by npx expo install side effect; kept as-is
metrics:
  duration: "~15 minutes"
  completed: "2026-04-23"
  tasks_completed: 2
  files_changed: 6
---

# Phase 15 Plan 05: Mobile PostHog + Sentry Init Summary

PostHog initialized with defaultOptIn=false and GDPR consent bottom sheet using @gorhom/bottom-sheet; Sentry.wrap added unconditionally at root layout.

## What Was Built

### Task 1: Install packages and create posthog.ts + ConsentModal (commit 88b1db3)

Installed `posthog-react-native`, `@sentry/react-native`, `@react-native-async-storage/async-storage`, and Expo peer deps.

Created `mobile/services/posthog.ts` exporting `posthogOptions` with `defaultOptIn: false` and EU host (`https://eu.i.posthog.com`).

Created `mobile/components/ConsentModal.tsx`:
- Uses `@gorhom/bottom-sheet` matching the `AuthPromptSheet` pattern
- Initializes `sheetIndex` to `-1` (hidden) to prevent cold-start flicker
- On mount, checks `AsyncStorage.getItem('consent_decided')` — shows sheet only if no prior decision
- Accept button calls `posthog?.optIn()` + stores `'granted'`; Decline calls `posthog?.optOut()` + stores `'denied'`
- `enablePanDownToClose={false}` forces explicit choice

### Task 2: Update _layout.tsx with PostHogProvider, Sentry.wrap, posthog.reset (commit 63d1b9f)

Updated `mobile/app/_layout.tsx`:
- Added `Sentry.init()` at module level (before QueryClient, unconditional)
- Replaced `export default function RootLayout()` with `export default Sentry.wrap(function RootLayout())`
- Wrapped provider tree with `PostHogProvider` (outermost inside Sentry.wrap) using `posthogOptions`
- Added `<ConsentModal />` inside `QueryClientProvider` so it renders in the full provider tree
- Added `usePostHog()` hook in `AppRoot`; `posthog?.reset()` fires in `SIGNED_OUT` branch

Added `"@sentry/react-native/expo"` to `mobile/app.json` plugins array for source map upload during EAS builds.

## Deviations from Plan

### Auto-noted: expo-localization plugin side effect

**Found during:** Task 1 package install
**Issue:** `npx expo install expo-localization` automatically added `"expo-localization"` to the `plugins` array in `mobile/app.json` as a side effect of the install command.
**Fix:** Left as-is — this is correct Expo managed workflow behavior; the plugin was already a peer dep of posthog-react-native.
**Files modified:** mobile/app.json (also modified in Task 2 to add Sentry plugin)

None — plan executed exactly as written except the expo-localization auto-plugin side effect above.

## Pre-existing TypeScript Issues (Out of Scope)

The following pre-existing TS errors exist in unrelated files and are not caused by this plan:
- `app/(client)/_layout.tsx`, `app/(client)/profile.tsx`, `app/(worker)/` — `@expo/vector-icons` module not found, implicit any types
- `services/notifications.ts` — `NotificationBehavior` type mismatch

These are deferred per deviation scope rules.

## Known Stubs

None — no data is stubbed. `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_SENTRY_DSN` are env vars to be set in EAS secrets; the app will initialize with undefined keys in dev (PostHog and Sentry are graceful with undefined DSN/key).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information_disclosure | mobile/app/_layout.tsx | Sentry captures all React Native exceptions unconditionally — no PII scrubbing configured. Mitigated by Sentry RN defaults (no PII by default) and tracesSampleRate: 0.1 per T-15-14. |

## Self-Check: PASSED

All created files verified present. Both task commits (88b1db3, 63d1b9f) verified in git log.
