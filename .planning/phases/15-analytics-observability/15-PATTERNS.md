# Phase 15: Analytics + Observability - Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 10 new/modified files
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/src/lib/posthog.js` | config/init | request-response | `frontend/src/lib/supabase.js` | role-match |
| `frontend/src/components/CookieBanner.jsx` | component | event-driven | `frontend/src/components/AuthPromptModal.jsx` | exact |
| `frontend/src/main.jsx` (modified) | config/provider | request-response | `frontend/src/main.jsx` (current) | exact |
| `frontend/src/context/AuthContext.jsx` (modified) | provider/context | event-driven | `frontend/src/context/AuthContext.jsx` (current) | exact |
| `frontend/src/pages/PostJobPage.jsx` (modified) | page | request-response | `frontend/src/pages/PostJobPage.jsx` (current) | exact |
| `frontend/src/pages/JobDetailPage.jsx` (modified) | page | request-response | `frontend/src/pages/JobDetailPage.jsx` (current) | exact |
| `mobile/services/posthog.ts` | config/init | request-response | `mobile/services/supabase.ts` | role-match |
| `mobile/components/ConsentModal.tsx` | component | event-driven | `mobile/components/AuthPromptSheet.tsx` | exact |
| `mobile/app/_layout.tsx` (modified) | provider/layout | request-response | `mobile/app/_layout.tsx` (current) | exact |
| `.github/workflows/backup.yml` | CI/config | batch | `.github/workflows/backend-ci.yml` | role-match |

---

## Pattern Assignments

### `frontend/src/lib/posthog.js` (config/init, request-response)

**Analog:** `frontend/src/lib/supabase.js`

**Imports + init pattern** (`frontend/src/lib/supabase.js` lines 1-6):
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Apply:** Exact same module shape — single named/default export initialized from `import.meta.env.VITE_*` keys. New file:
```javascript
import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  cookieless_mode: 'on_reject',
})

export default posthog
```

---

### `frontend/src/components/CookieBanner.jsx` (component, event-driven)

**Analog:** `frontend/src/components/AuthPromptModal.jsx`

**Component structure** (lines 1-46):
```jsx
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function AuthPromptModal({ isOpen, onClose, returnPath }) {
  useEffect(() => {
    if (!isOpen) return;
    // event listener cleanup pattern
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  // JSX with fixed positioning
}
```

**Tailwind fixed-bar pattern** (lines 17, 24-40): The modal uses `fixed inset-0` overlay. CookieBanner uses `fixed bottom-0 w-full` instead (non-blocking). Button styles to copy: `bg-blue-600 text-white ... rounded-lg py-2 font-medium hover:bg-blue-700` for Accept, `border border-gray-300 ... rounded-lg py-2 font-medium hover:bg-gray-50` for Decline.

**Named export convention:** `AuthPromptModal` is a default export. `CookieBanner` should use a named export (`export function CookieBanner`) to match RESEARCH.md Pattern 1.

**Hook-driven early return:** `if (status !== 'pending') return null` — same early-return pattern as `if (!isOpen) return null`.

---

### `frontend/src/main.jsx` (modified — provider wrapping)

**Analog:** `frontend/src/main.jsx` (current, lines 1-10):
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Apply:** Wrap `<App />` with `<PostHogProvider client={posthog}>`. Add `Sentry.init(...)` call before `createRoot`. Add `<CookieBanner />` as sibling inside `PostHogProvider`:
```jsx
import posthog from './lib/posthog'
import { PostHogProvider } from '@posthog/react'
import * as Sentry from '@sentry/react'
import { CookieBanner } from './components/CookieBanner'

Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.1 })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
      <CookieBanner />
    </PostHogProvider>
  </StrictMode>,
)
```

---

### `frontend/src/context/AuthContext.jsx` (modified — analytics event hooks)

**Analog:** `frontend/src/context/AuthContext.jsx` (current)

**signUp hook point** (lines 62-78): After `supabase.auth.signUp` succeeds and `profileError` is falsy, fire `posthog?.capture('account_created', { role })`.

**signIn hook point** (lines 39-40): `signIn` returns the Supabase promise directly — caller handles the result. Event must be fired at the call site (LoginPage) after successful response, not inside AuthContext. Pattern: caller does `const { error } = await signIn(...); if (!error) posthog?.capture('login')`.

**posthog.identify hook point** (lines 21-26 — `onAuthStateChange`): After `loadProfile` resolves and consent is in granted state, call `posthog?.identify(user.id, { role: profile.role })`. Use `posthog?.reset()` in the `SIGNED_OUT` branch (analogous to `setUserProfile(null)` on line 33).

**Import addition:** Add `import { usePostHog } from '@posthog/react'` and call `const posthog = usePostHog()` inside `AuthProvider`.

---

### `frontend/src/pages/PostJobPage.jsx` (modified — `job_posted` event)

**Analog:** `frontend/src/pages/PostJobPage.jsx` (current)

**Mutation success point** (lines 43-48):
```javascript
try {
  const res = await axiosClient.post('/api/jobs', payload);
  navigate(`/jobs/${res.data.id}`);
} catch (err) {
  setError('root', { message: err.response?.data?.error ?? 'Failed to post job' });
}
```

**Apply:** After `navigate(...)` on line 45, add:
```javascript
posthog?.capture('job_posted', { category: payload.category })
```
Add `const posthog = usePostHog()` at the top of the component. Import `usePostHog` from `@posthog/react`.

---

### `frontend/src/pages/JobDetailPage.jsx` (modified — `bid_submitted` event)

**Analog:** `frontend/src/pages/JobDetailPage.jsx` (current)

**useMutation pattern** (lines 30-33):
```javascript
const accept = useMutation({
  mutationFn: id => axiosClient.patch(`/api/bids/${id}/accept`),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', job.id] }),
});
```

**Bid submit mutation** (pattern to locate): Find the `mutationFn` that POSTs to `/api/jobs/{id}/bids`. Add `onSuccess` callback (or extend existing one):
```javascript
onSuccess: () => {
  posthog?.capture('bid_submitted', { job_id: job.id })
  queryClient.invalidateQueries(...)
}
```
Add `const posthog = usePostHog()` at component top. Same import as PostJobPage.

---

### `mobile/services/posthog.ts` (config/init, request-response)

**Analog:** `mobile/services/supabase.ts` (lines 1-21)

**Module init pattern:**
```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { ... });
```

**Apply:** Same shape — read key from `process.env.EXPO_PUBLIC_POSTHOG_KEY!`, export a `posthog` client instance. Note: PostHog RN is initialized via the `PostHogProvider` in `_layout.tsx`, not a standalone client singleton. This file can export a shared `posthogOptions` config object instead:
```typescript
export const posthogOptions = {
  host: 'https://eu.i.posthog.com',
  defaultOptIn: false,
}
```

---

### `mobile/components/ConsentModal.tsx` (component, event-driven)

**Analog:** `mobile/components/AuthPromptSheet.tsx` (lines 1-109)

**BottomSheet pattern** (lines 11-63):
```typescript
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const AuthPromptSheet = forwardRef<BottomSheet, AuthPromptSheetProps>(({ returnTo }, ref) => {
  return (
    <BottomSheet ref={ref} index={-1} snapPoints={['35%']} enablePanDownToClose>
      <BottomSheetView style={styles.container}>
        {/* content */}
      </BottomSheetView>
    </BottomSheet>
  );
});
```

**Styling pattern** (lines 69-109): Copy `StyleSheet.create` block. Reuse `container`, `heading`, `body`, `primaryButton`, `primaryButtonText`, `secondaryButton`, `secondaryButtonText`, `dismissText` style keys — only button labels change.

**AsyncStorage guard** (RESEARCH.md Pattern 2): `ConsentModal` uses `AsyncStorage.getItem('consent_decided')` to determine initial visibility, defaulting `visible` to `false` (not `true`) to avoid flicker on restart.

**Difference from AuthPromptSheet:** ConsentModal is not a ref-forwarded bottom sheet controlled externally — it manages its own `visible` state via `useState(false)` and the AsyncStorage check. Use `@gorhom/bottom-sheet` `index` prop (0 = open, -1 = closed) driven by `visible`.

---

### `mobile/app/_layout.tsx` (modified — provider wrapping)

**Analog:** `mobile/app/_layout.tsx` (current, lines 68-76)

**Provider nesting pattern** (lines 68-76):
```typescript
export default function RootLayout() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY ?? ''}>
      <QueryClientProvider client={queryClient}>
        <AppRoot />
      </QueryClientProvider>
    </StripeProvider>
  );
}
```

**Apply:** Wrap the outermost provider with `PostHogProvider`; wrap the default export function with `Sentry.wrap(...)`:
```typescript
import { PostHogProvider } from 'posthog-react-native'
import * as Sentry from '@sentry/react-native'
import { posthogOptions } from '../services/posthog'
import { ConsentModal } from '../components/ConsentModal'

Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1 })

export default Sentry.wrap(function RootLayout() {
  return (
    <PostHogProvider apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!} options={posthogOptions}>
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY ?? ''}>
        <QueryClientProvider client={queryClient}>
          <AppRoot />
          <ConsentModal />
        </QueryClientProvider>
      </StripeProvider>
    </PostHogProvider>
  );
})
```

**`onAuthStateChange` SIGNED_OUT hook point** (lines 38-41): Add `posthog?.reset()` after `router.replace('/(public)/browse')` in the SIGNED_OUT branch. Use `const posthog = usePostHog()` inside `AppRoot`.

---

### `.github/workflows/backup.yml` (CI/config, batch)

**Analog:** `.github/workflows/backend-ci.yml` (lines 1-53)

**Workflow structure pattern** (lines 1-13):
```yaml
name: Backend CI

on:
  push:
    branches: [main, development]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
```

**Artifact upload pattern** (lines 34-40):
```yaml
- name: Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-results
    path: backend/**/*.trx
```

**Apply:** Replace `push` trigger with `schedule` + `workflow_dispatch`. Replace test steps with `supabase/setup-cli@v1` + `supabase db dump`. Use same `actions/upload-artifact@v4` with `retention-days: 30`. Secret reference style: `${{ secrets.SUPABASE_DB_URL }}` matches `${{ secrets.RENDER_DEPLOY_HOOK_URL }}` on line 48.

---

## Shared Patterns

### Environment Variable Convention
**Source:** `frontend/src/lib/supabase.js` (line 3-4), `mobile/services/supabase.ts` (lines 10-11)
**Apply to:** All new init files and env key references

Web uses `import.meta.env.VITE_*`:
```javascript
import.meta.env.VITE_PUBLIC_POSTHOG_KEY
import.meta.env.VITE_SENTRY_DSN
```
Mobile uses `process.env.EXPO_PUBLIC_*`:
```typescript
process.env.EXPO_PUBLIC_POSTHOG_KEY!
process.env.EXPO_PUBLIC_SENTRY_DSN
```
Backend uses `builder.Configuration["Section:Key"]` — same as `builder.Configuration["Stripe:SecretKey"]` in `Program.cs` line 21.

### Null-safe Hook Calls
**Apply to:** All `posthog.capture()` and `posthog.identify()` call sites

PostHog provider may not be mounted on first render. Use optional chaining on every call:
```javascript
posthog?.capture('event_name', { prop: value })
posthog?.identify(userId, { role })
posthog?.reset()
```

### Provider Registration in Program.cs
**Source:** `backend/HandyLink.API/Program.cs` lines 17-19
```csharp
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://0.0.0.0:{...}");
Stripe.StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
```

**Apply:** `builder.WebHost.UseSentry(...)` goes directly after `builder.WebHost.UseUrls(...)`, before any `builder.Services.*` calls. Same `builder.Configuration["Sentry:Dsn"]` access pattern.

### StyleSheet Component Styling (mobile)
**Source:** `mobile/components/AuthPromptSheet.tsx` lines 69-109
**Apply to:** `mobile/components/ConsentModal.tsx`

All React Native components in this project use `StyleSheet.create({...})` at file bottom. Color palette: `#2563eb` primary, `#d1d5db` border, `#6b7280` muted text, `#fff` white. Border radius: `12`. Button `minHeight: 44` for touch target.

### Test File Structure (web components)
**Source:** `frontend/src/components/JobCard.test.jsx` (lines 1-44)
**Apply to:** `frontend/src/components/__tests__/CookieBanner.test.jsx`

```javascript
import { render, screen } from '@testing-library/react'
// No Router wrapper needed for CookieBanner (no Link usage)

test('does not render when consent is not pending', () => { ... })
test('renders banner when consent is pending', () => { ... })
test('calls opt_in_capturing on Accept click', () => { ... })
test('calls opt_out_capturing on Decline click', () => { ... })
```
Mock `usePostHog` to control `get_explicit_consent_status()` return value.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `OPERATIONS.md` (repo root) | documentation | — | No existing operations/runbook docs in the repo; content is pure prose checklist per D-17 |

---

## Metadata

**Analog search scope:** `frontend/src/`, `mobile/`, `backend/HandyLink.API/`, `.github/workflows/`
**Files scanned:** 18 source files read
**Pattern extraction date:** 2026-04-21
