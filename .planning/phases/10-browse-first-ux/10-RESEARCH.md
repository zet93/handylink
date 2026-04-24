# Phase 10: Browse-First UX - Research

**Researched:** 2026-03-31
**Domain:** React Router v7, Expo Router v3, ASP.NET Core authorization, @gorhom/bottom-sheet v5
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Both web and mobile are in scope for Phase 10. Mobile currently hard-redirects to `/(auth)/login` — this phase adds anonymous browsing on mobile too.
- **D-02:** Mobile needs a structural change to `mobile/app/_layout.tsx` to allow entry without auth. A new `(public)` route group (or equivalent) should expose job list and worker browse screens to unauthenticated users.
- **D-03:** When a visitor attempts a gated action (post job, submit bid), show a **modal overlay on web** and a **bottom sheet on mobile** (using `@gorhom/bottom-sheet`, already installed). The prompt says "Log in to continue" with login/register buttons.
- **D-04:** The current URL / page is preserved as the return destination behind the modal — no full-page navigation away from the current content.
- **D-05:** After login, users are returned to the **exact page they were on** when they triggered the auth prompt. Return URL must be threaded through the login flow (`/login?return=/jobs/123`).
- **D-06:** No auto-trigger of the action — user lands back on the page and decides whether to proceed. Keeps the implementation simple.
- **D-07:** The landing page fetches and displays **6 recent open jobs** in a card grid using the existing `JobCard` component.
- **D-08:** A "Browse all jobs →" link below the grid navigates to `/jobs` (now a public route). This replaces the current category links that redirect to the protected `/jobs` route.
- **D-09:** The existing category grid, headline, and how-it-works sections remain unchanged.
- **D-10:** `JobsController` and `WorkersController` currently have `[Authorize]` at the class level. GET endpoints (list and detail) must be made publicly accessible. Approach: move `[Authorize]` to individual write actions and add `[AllowAnonymous]` to read actions, OR remove the class-level `[Authorize]` and annotate each write action individually. Claude's discretion on the exact mechanism — the outcome must be that anonymous GET calls return 200.

### Claude's Discretion

- Backend auth attribute restructuring approach (class-level vs action-level)
- Exact mobile route structure for public browsing (new `(public)` group vs conditional rendering in root layout)
- Loading/empty state for the 6-job landing section

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | Visitor can browse all open jobs without logging in | Backend: remove `[Authorize]` from GET /api/jobs; Web: move `/jobs` out of ProtectedRoute; Mobile: public route group |
| UX-02 | Visitor can view individual job details without logging in | Backend: remove `[Authorize]` from GET /api/jobs/{id}; Web: move `/jobs/:id` out of ProtectedRoute |
| UX-03 | Visitor can browse worker profiles without logging in | Backend: remove `[Authorize]` from GET /api/workers and GET /api/workers/{id}; Web: move `/worker/browse` and `/worker/:id` out of ProtectedRoute |
| UX-04 | Login prompt appears only when visitor attempts to post a job or submit a bid | Web: AuthPromptModal triggered by gated action buttons; Mobile: AuthPromptBottomSheet; both thread return URL |
| UX-05 | Anonymous landing experience communicates the app's value clearly | Landing page: add 6-job grid section with GET /api/jobs?status=Open&pageSize=6; update hero CTAs to link to public routes |
</phase_requirements>

---

## Summary

Phase 10 removes the authentication gate from browsing. Currently, every route except `/`, `/login`, and `/register` is wrapped in `ProtectedRoute` on web and blocked by a hard `router.replace('/(auth)/login')` redirect on mobile. Three categories of change are needed: (1) backend controller `[Authorize]` restructuring so GET endpoints return 200 to anonymous callers, (2) web route tree restructuring to split public from protected routes, and (3) mobile layout restructuring to allow anonymous entry into a new public route group.

The auth prompt pattern (modal on web, bottom sheet on mobile) is a deliberate UX choice that preserves page context while gating write actions. The return URL thread (`/login?return=/jobs/123`) requires changes to both `ProtectedRoute` (or its replacement) and `LoginPage` to read and honor the `return` query param. Both the existing `useAuth()` hook (`user` + `loading` fields) and the existing `@gorhom/bottom-sheet` installation give everything needed for mobile.

A critical implementation note: the UI spec references `GET /api/jobs?status=open&limit=6&sort=createdAt:desc` but the actual backend uses `pageSize` (not `limit`) and always sorts by `CreatedAt` descending — no `sort` param exists. The correct landing page call is `GET /api/jobs?status=Open&pageSize=6`. The `axiosClient` already conditionally attaches the JWT, so anonymous calls will simply send no Authorization header, which is correct once the backend permits anonymous access.

**Primary recommendation:** Remove class-level `[Authorize]` from `JobsController` and `WorkersController`, add it to each write action individually, and add `[AllowAnonymous]` to the GET actions. Split `App.jsx` route tree into a public layout (without ProtectedRoute) and a protected layout. For mobile, restructure `_layout.tsx` to route to public screens when no session is detected.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Router DOM | 7.13.1 | Route tree restructuring, `useLocation`/`useSearchParams` for return URL | Already installed, nested route pattern well-established |
| @gorhom/bottom-sheet | 5.2.8 | Mobile auth prompt bottom sheet | Already installed, already used in `(worker)/browse.tsx` |
| Expo Router | 55.0.5 | Mobile file-based routing, new `(public)` route group | Already installed, route group convention documented |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.90.21 | Fetching 6 jobs on landing page, loading states | Landing page 6-job section |
| axiosClient (existing) | — | Anonymous HTTP calls to public endpoints | Already sends no Authorization header when no session |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Restructuring route tree | `useAuth` check in each page | More code duplication; route-level is cleaner |
| AuthPromptModal (custom) | Existing modal library | No modal library is installed; custom is 20 lines and fits existing Tailwind patterns |

**Installation:** No new packages needed. All required libraries are already installed.

---

## Architecture Patterns

### Web: Route Tree Split

Current structure: all pages wrapped in a single `<ProtectedRoute><AuthLayout /></ProtectedRoute>`.

Required structure: two sibling route groups.

```
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* Public routes — no auth required */}
  <Route element={<AuthLayout />}>
    <Route path="/jobs" element={<JobsPage />} />
    <Route path="/jobs/:id" element={<JobDetailPage />} />
    <Route path="/worker/browse" element={<WorkerBrowsePage />} />
    <Route path="/worker/:id" element={<WorkerProfilePage />} />
  </Route>

  {/* Protected routes — ProtectedRoute wraps AuthLayout */}
  <Route element={<ProtectedRoute><AuthLayout /></ProtectedRoute>}>
    <Route path="/post-job" element={<PostJobPage />} />
    <Route path="/my-jobs" element={<MyJobsPage />} />
    <Route path="/profile" element={<EditProfilePage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
  </Route>
</Routes>
```

### Web: ProtectedRoute Return URL

`ProtectedRoute` currently redirects to `/login` with no return URL. It must pass the current path:

```jsx
// frontend/src/components/ProtectedRoute.jsx — updated
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to={`/login?return=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}
```

### Web: LoginPage Return URL Redirect

`LoginPage` currently hardcodes `navigate('/jobs')` after sign-in. Must read `?return` param:

```jsx
// Inside LoginPage onSubmit
const [searchParams] = useSearchParams();
const returnTo = searchParams.get('return') || '/jobs';
// after successful signIn:
navigate(returnTo);
```

### Web: AuthPromptModal

New component — fixed overlay, centered card, preserves page content behind it. State held in parent (the page that contains a gated action). Pass `currentPath` down from the page:

```jsx
// Minimal contract
function AuthPromptModal({ isOpen, onClose, returnPath }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-2xl font-semibold mb-2">Log in to continue</h2>
        <p className="text-sm text-gray-500 mb-6">
          Create a free account or log in to post a job or submit a bid.
        </p>
        <Link to={`/login?return=${encodeURIComponent(returnPath)}`} className="...">Log in</Link>
        <Link to={`/register?return=${encodeURIComponent(returnPath)}`} className="...">Create account</Link>
        <button onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}
```

Focus trap and Escape-to-close are specified in the UI spec. Use a `useEffect` that adds a `keydown` listener for `Escape`.

### Web: NavBar Unauthenticated State

`NavBar` currently assumes auth context always has a user — it renders `NotificationBell`, profile name, and sign-out unconditionally. The `useAuth()` hook exposes `user` and `userProfile`. Unauthenticated state: `user` is `null`, `loading` is `false`.

NavBar must branch on `user`:
- When `user` is null: show "Log in" and "Register" links; hide notification bell, "My Jobs", "Post a Job", profile, sign-out
- When `user` is set: existing behavior unchanged

`NotificationBell` currently fires `GET /api/notifications` unconditionally on mount, which will return 401 for anonymous users and potentially redirect. The `axiosClient` 401 interceptor does `window.location.href = '/login'`. This is a **critical pitfall** — NavBar must not mount `NotificationBell` when unauthenticated.

### Web: Landing Page 6-Job Section

Add a new section between the hero and category grid (or after category grid per D-09 which keeps existing sections unchanged). Uses React Query:

```jsx
const { data, isLoading, isError } = useQuery({
  queryKey: ['landing-jobs'],
  queryFn: () => axiosClient.get('/api/jobs', { params: { status: 'Open', pageSize: 6 } })
    .then(r => r.data.items ?? r.data),
  staleTime: 60_000,
});
```

Note: `status` value must match the enum string the backend serializes — `GetJobsHandler` filters by `JobStatus.Open`, and the query receives `JobStatus?` parsed from the query string. The controller binding maps the string `"Open"` to `JobStatus.Open`. Use `status=Open` (capital O) or verify the casing the backend accepts.

Loading state: 6 skeleton cards. Empty state: heading "No open jobs yet" + body + "Post a Job" CTA (triggers auth modal if unauthenticated). Error state: "Couldn't load jobs. Try refreshing the page."

### Backend: Auth Attribute Restructuring

**Recommended approach (Claude's discretion):** Remove `[Authorize]` from the class level, add `[AllowAnonymous]` to read actions, keep `[Authorize]` on write actions explicitly. This is the most explicit and least surprising pattern. The `[AllowAnonymous]` precedent already exists in `PaymentsController` (webhook endpoint).

`JobsController`:
- `GET /api/jobs` → `[AllowAnonymous]`
- `GET /api/jobs/{id}` → `[AllowAnonymous]`
- `POST /api/jobs` → `[Authorize]`
- `PATCH /api/jobs/{id}/status` → `[Authorize]`

`WorkersController`:
- `GET /api/workers` → `[AllowAnonymous]`
- `GET /api/workers/{id}` → `[AllowAnonymous]`
- (No write actions in current WorkersController)

Class-level `[Authorize]` is removed in both cases. Alternative: keep class-level `[Authorize]` and override GET actions with `[AllowAnonymous]`. Both work identically in ASP.NET Core — `[AllowAnonymous]` always wins over any `[Authorize]`. The recommended approach (no class-level, explicit per action) is clearer to read.

### Mobile: Root Layout Restructuring

The current `_layout.tsx` `AppRoot` immediately redirects to `/(auth)/login` when no session. The required change: allow the app to proceed to a public entry screen when unauthenticated.

**Recommended approach (Claude's discretion):** Keep the session check but route to a new `(public)/index` screen (a browse/landing screen) instead of always forcing login. Then use the `onAuthStateChange` listener's `if (!session)` branch to only redirect from auth-required screens.

The simplest implementation is to change the no-session branch from `router.replace('/(auth)/login')` to `router.replace('/(public)/browse')`, and create `mobile/app/(public)/` as a new route group containing job browse and worker browse screens. This mirrors the web pattern exactly.

```typescript
// Revised AppRoot session check
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    router.replace('/(public)/browse');
  } else {
    const role = session.user.user_metadata?.role;
    router.replace(role === 'worker' ? '/(worker)/browse' : '/(client)');
    registerForPushNotifications();
    setUpNotificationHandlers(router);
  }
  setLoading(false);
});
```

The `onAuthStateChange` listener's `if (!session)` branch must also be changed — currently it redirects to `/(auth)/login` on any session loss. This should redirect to `/(public)/browse` to stay in the public space.

`(public)` route group needs a `_layout.tsx` (minimal stack layout) and at minimum a `browse.tsx` screen (public job list).

### Mobile: Auth Prompt Bottom Sheet

The existing `(worker)/browse.tsx` already uses `@gorhom/bottom-sheet` v5 with `index={-1}` and `snapPoints={['55%']}`. The auth prompt bottom sheet follows the same pattern but with `snapPoints={['35%']}` per the UI spec.

The auth prompt triggers when an unauthenticated user attempts a gated action. On the public browse screen, the "Submit a Bid" tap path must check auth status before opening the bid sheet — if no session, open the auth prompt sheet instead. The return destination is threaded via navigation params.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in modal | Custom DOM event loops | A `useEffect` + `keydown` listener for Escape is sufficient; full focus trap needed only for accessibility compliance which is deferred to Phase 11 | Simple enough inline; A11y library deferred |
| Route-level auth guard | Complex HOC or context provider | React Router `<Route element={<ProtectedRoute>...}>` wrapping pattern (already in the codebase) | Already established; just restructure the tree |
| Parameterized login redirect | Custom history stack | `useLocation` + `useSearchParams` from react-router-dom | Standard React Router pattern |

---

## Common Pitfalls

### Pitfall 1: axiosClient 401 Interceptor Redirects Anonymous Users

**What goes wrong:** `axiosClient` has a 401 response interceptor that does `window.location.href = '/login'`. When `NavBar` mounts `NotificationBell` for an unauthenticated visitor, it fires `GET /api/notifications` (still protected). The backend returns 401, the interceptor fires, and the user is hard-redirected to `/login` even though they're on a public page.

**Why it happens:** `NotificationBell` unconditionally fires on mount inside `NavBar`, and `NavBar` is rendered on all public routes via `AuthLayout`.

**How to avoid:** Conditionally render `NotificationBell` only when `user` is non-null. The `useAuth()` hook is available in `NavBar`.

**Warning signs:** Anonymous visitor on `/jobs` immediately lands on `/login`. Check network tab for 401 from `/api/notifications`.

### Pitfall 2: `status` Query Param Casing Mismatch

**What goes wrong:** The UI spec says `status=open` (lowercase). The backend's `GetJobsQuery` uses `JobStatus?` which is an enum. ASP.NET Core's default enum binding is case-insensitive for query strings, but the `GetJobsHandler` filters by `JobStatus.Open`. The `GetJobsResponse` serializes status as `j.Status.ToString()` which produces `"Open"`. Sending `status=open` should work (case-insensitive binding), but `status=Open` is safer.

**How to avoid:** Use `status=Open` in the landing page query. Verify by testing `GET /api/jobs?status=Open&pageSize=6` without an Authorization header after the backend change is applied.

### Pitfall 3: Landing Page `limit` vs `pageSize`

**What goes wrong:** The UI spec references `?status=open&limit=6&sort=createdAt:desc`. Neither `limit` nor `sort` are params the backend recognizes. `JobFilter` uses `PageSize`, and `GetJobsHandler` always sorts by `CreatedAt` descending.

**How to avoid:** Use `?status=Open&pageSize=6` (no `sort` param needed — the handler always sorts newest first).

### Pitfall 4: `onAuthStateChange` Listener Redirects Anonymous Users from Public Pages

**What goes wrong:** `_layout.tsx` has `supabase.auth.onAuthStateChange((_event, session) => { if (!session) { router.replace('/(auth)/login'); } })`. On initial mount when there is no session, this fires and redirects away from any public screen.

**Why it happens:** The listener fires on initial subscription with the current session state (null for anonymous users). Combined with the `getSession()` call in the same effect, this can double-redirect.

**How to avoid:** Change the `onAuthStateChange` no-session branch to only redirect to `/(auth)/login` from auth-required screens, OR only act on `SIGNED_OUT` events. Pattern:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    router.replace('/(public)/browse');
  }
});
```

### Pitfall 5: `GetUserId()` Called on Anonymous Request

**What goes wrong:** `JobDetailPage` (web) sends `GET /api/jobs/{id}/bids` when viewing a job. `BidsController` still has `[Authorize]`. If an anonymous user loads a job detail page and the page fires the bids query, it will get 401. The `axiosClient` 401 interceptor then redirects to `/login`.

**How to avoid:** In `JobDetailPage`, only fire the bids query when `user` is non-null. Anonymous visitors see job details but not the bid list. The auth prompt appears when they try to submit a bid.

```jsx
const { data: bids = [] } = useQuery({
  queryKey: ['bids', id],
  queryFn: () => axiosClient.get(`/api/jobs/${id}/bids`).then(r => r.data),
  enabled: !!job && !!user,  // only fetch bids if authenticated
});
```

### Pitfall 6: `WorkerView` Renders Submit Bid Form for Anonymous Users

**What goes wrong:** `JobDetailPage` renders `WorkerView` when `!isOwner`. For an anonymous user, `userProfile` is null, so `isOwner` is false, and the submit-bid form renders. Submitting it fires a POST to `/api/jobs/{id}/bids`, which returns 401.

**How to avoid:** In `JobDetailPage`, check if `user` is null before rendering `WorkerView`. For anonymous users, render a static "Log in to submit a bid" prompt or trigger the auth modal.

---

## Code Examples

Verified patterns from existing codebase:

### Existing `[AllowAnonymous]` usage on class with `[Authorize]`

```csharp
// Source: backend/HandyLink.API/Controllers/PaymentsController.cs
[Route("api/payments")]
[Authorize]
public class PaymentsController(IMediator mediator) : BaseController
{
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken ct) { ... }
}
```

This confirms `[AllowAnonymous]` overrides class-level `[Authorize]` in this codebase. Both approaches (class-level override with `[AllowAnonymous]`, or no class-level `[Authorize]` at all) are valid.

### Existing bottom sheet usage in browse.tsx

```typescript
// Source: mobile/app/(worker)/browse.tsx
const sheetRef = useRef<BottomSheet>(null);

// open:
sheetRef.current?.expand();

// close:
sheetRef.current?.close();

// JSX:
<BottomSheet ref={sheetRef} index={-1} snapPoints={['55%']} enablePanDownToClose>
  <BottomSheetView style={styles.sheet}>
    {/* content */}
  </BottomSheetView>
</BottomSheet>
```

For the auth prompt, use `snapPoints={['35%']}` per the UI spec.

### Existing `useAuth` check pattern

```jsx
// Source: frontend/src/components/NavBar.jsx
const { userProfile, signOut } = useAuth();
const isWorker = userProfile?.role === 'worker' || userProfile?.role === 'both';
```

For anonymous checking: `const { user, loading } = useAuth()` — `user` is `null` when not authenticated.

### `GetJobsHandler` default sort (no param needed)

```csharp
// Source: backend/HandyLink.API/Features/Jobs/GetJobs/GetJobsHandler.cs
var items = await q
    .OrderByDescending(j => j.CreatedAt)  // always newest first
    .Skip((query.Page - 1) * query.PageSize)
    .Take(query.PageSize)
    .ToListAsync(cancellationToken);
```

Landing page call: `GET /api/jobs?status=Open&pageSize=6` (no sort param, Page defaults to 1).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `ProtectedRoute` wrapping all routes | Split public/protected route groups | This phase | Public routes get `AuthLayout` without auth guard |
| Hard redirect to `/(auth)/login` on mobile | Route to `/(public)/browse` when no session | This phase | Anonymous mobile browsing enabled |
| `[Authorize]` at class level on JobsController | `[AllowAnonymous]` on GET actions | This phase | Anonymous API access to job/worker reads |

---

## Open Questions

1. **`RegisterPage` return URL**
   - What we know: D-05 specifies return URL threaded through login. Register is also mentioned in the auth modal CTAs.
   - What's unclear: Does `RegisterPage` also need to read and honor `?return` after registration completes?
   - Recommendation: Yes — after sign-up, navigate to `returnTo` the same way as login. Keeps symmetry.

2. **`JobDetailPage` bid list visibility for anonymous users**
   - What we know: The bids query currently fires unconditionally. `BidsController` is still protected.
   - What's unclear: Should an anonymous visitor see existing bids, or only the job metadata?
   - Recommendation: Hide bid list for anonymous users (don't fire the query). Show the job metadata and a "Log in to submit a bid" prompt instead of the `WorkerView` form. This avoids any 401 from the bids endpoint.

3. **Mobile `(public)` group screen scope**
   - What we know: CONTEXT.md D-02 says a new `(public)` route group should expose "job list and worker browse screens".
   - What's unclear: Does this mean duplicating screens from `(worker)/browse.tsx` into `(public)/`, or sharing them?
   - Recommendation: Create new screens in `(public)/` (job list + worker browse) without tab navigation. These are simpler read-only views. The existing `(worker)/browse.tsx` can be used as a reference but should not be shared directly as it contains the bid submission flow.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 10 is code/config changes only. No new external dependencies, tools, runtimes, or services beyond what is already installed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | xUnit 2.9.3 (backend), Vitest 4.1.0 (frontend) |
| Config file | `backend/HandyLink.Tests/HandyLink.Tests.csproj`, `frontend/vite.config.js` |
| Quick run command | `dotnet test backend/ --filter "FullyQualifiedName~AnonymousAccess"` |
| Full suite command | `dotnet test backend/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | `GET /api/jobs` returns 200 without Authorization header | integration | `dotnet test backend/ --filter "FullyQualifiedName~GetJobs_Returns200_WhenAnonymous"` | ❌ Wave 0 |
| UX-02 | `GET /api/jobs/{id}` returns 200 without Authorization header | integration | `dotnet test backend/ --filter "FullyQualifiedName~GetJobById_Returns200_WhenAnonymous"` | ❌ Wave 0 |
| UX-03 | `GET /api/workers` returns 200 without Authorization header | integration | `dotnet test backend/ --filter "FullyQualifiedName~GetWorkers_Returns200_WhenAnonymous"` | ❌ Wave 0 |
| UX-04 | Auth modal state management (unit) | unit | manual-only (frontend JSX) | ❌ Wave 0 |
| UX-05 | Landing page renders 6-job section | manual-only | visual check in browser | N/A |

Note: Frontend JSX unit tests exist via Vitest but no phase-10 tests are written yet. Backend integration tests follow the pattern in `JobsControllerTests.cs` — a new anonymous-access test class is the Wave 0 gap.

### Sampling Rate

- **Per task commit:** `dotnet test backend/ --filter "FullyQualifiedName~AnonymousAccess"`
- **Per wave merge:** `dotnet test backend/`
- **Phase gate:** Full backend suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/HandyLink.Tests/Integration/Controllers/AnonymousAccessTests.cs` — covers UX-01, UX-02, UX-03
- [ ] Test: `GetJobs_Returns200_WhenAnonymous`
- [ ] Test: `GetJobById_Returns200_WhenAnonymous`
- [ ] Test: `GetWorkers_Returns200_WhenAnonymous`
- [ ] Existing test `GetJobs_Returns401_WhenNoToken` must be **updated or removed** — it will fail after the backend change (anonymous GET becomes 200 not 401)
- [ ] Existing test `GetJobs_Returns200_WhenAuthenticated` remains valid — no change needed

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 10 |
|-----------|-------------------|
| After Phase 3.5, NEVER create a Service class | No new Service classes — no write logic needed here |
| NEVER run `dotnet ef migrations add` | No schema changes in this phase |
| NEVER put business logic in a Controller | No business logic — GET endpoints delegate to MediatR handlers |
| NEVER read user ID from request body — always `GetUserId()` | Not relevant to public GET endpoints; applies to write actions which remain protected |
| NEVER hardcode secrets | No secrets involved |
| Architecture: VSA + CQRS via MediatR | No new handlers needed; existing `GetJobsQuery`/`GetJobByIdQuery`/`WorkerService` are already sufficient |

---

## Sources

### Primary (HIGH confidence)

- Codebase direct read — `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/pages/LoginPage.jsx`, `frontend/src/components/NavBar.jsx`, `frontend/src/pages/LandingPage.jsx`, `frontend/src/pages/JobDetailPage.jsx`, `frontend/src/api/axiosClient.js`
- Codebase direct read — `mobile/app/_layout.tsx`, `mobile/app/(worker)/browse.tsx`, `mobile/app/(auth)/login.tsx`
- Codebase direct read — `backend/HandyLink.API/Controllers/JobsController.cs`, `backend/HandyLink.API/Controllers/WorkersController.cs`, `backend/HandyLink.API/Controllers/PaymentsController.cs`
- Codebase direct read — `backend/HandyLink.API/Features/Jobs/GetJobs/GetJobsHandler.cs`, `GetJobsQuery.cs`, `backend/HandyLink.Core/DTOs/JobFilter.cs`
- Codebase direct read — `backend/HandyLink.Tests/Integration/Controllers/JobsControllerTests.cs`, `CustomWebAppFactory.cs`
- `.planning/phases/10-browse-first-ux/10-CONTEXT.md` — locked decisions
- `.planning/phases/10-browse-first-ux/10-UI-SPEC.md` — UI contracts and copywriting

### Secondary (MEDIUM confidence)

- ASP.NET Core docs (training knowledge, HIGH confidence for `[AllowAnonymous]` override behavior — this is a stable framework feature since .NET Core 1.0)
- Expo Router docs (training knowledge) — route group convention `(name)/` is stable since Expo Router v2

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from codebase package files
- Architecture: HIGH — patterns derived from direct codebase reads
- Pitfalls: HIGH — derived from actual code logic (axiosClient interceptor, onAuthStateChange handler, bids query)
- Test gaps: HIGH — derived from direct test file inventory

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable framework features; no external API dependency)
