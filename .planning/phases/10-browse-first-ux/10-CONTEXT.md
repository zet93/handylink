# Phase 10: Browse-First UX - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors can browse jobs and worker profiles without logging in — on both web and mobile. Auth is prompted only at the moment of action (post a job, submit a bid), via a modal/bottom sheet with return URL. The landing page shows real live jobs to communicate value immediately.

New capabilities (social login, maps, notifications) belong in later phases.

</domain>

<decisions>
## Implementation Decisions

### Platform Scope
- **D-01:** Both web and mobile are in scope for Phase 10. Mobile currently hard-redirects to `/(auth)/login` — this phase adds anonymous browsing on mobile too.
- **D-02:** Mobile needs a structural change to `mobile/app/_layout.tsx` to allow entry without auth. A new `(public)` route group (or equivalent) should expose job list and worker browse screens to unauthenticated users.

### Login Prompt Style
- **D-03:** When a visitor attempts a gated action (post job, submit bid), show a **modal overlay on web** and a **bottom sheet on mobile** (using `@gorhom/bottom-sheet`, already installed). The prompt says "Log in to continue" with login/register buttons.
- **D-04:** The current URL / page is preserved as the return destination behind the modal — no full-page navigation away from the current content.

### Post-Auth Redirect
- **D-05:** After login, users are returned to the **exact page they were on** when they triggered the auth prompt. Return URL must be threaded through the login flow (`/login?return=/jobs/123`).
- **D-06:** No auto-trigger of the action — user lands back on the page and decides whether to proceed. Keeps the implementation simple.

### Landing Page
- **D-07:** The landing page fetches and displays **6 recent open jobs** in a card grid using the existing `JobCard` component.
- **D-08:** A "Browse all jobs →" link below the grid navigates to `/jobs` (now a public route). This replaces the current category links that redirect to the protected `/jobs` route.
- **D-09:** The existing category grid, headline, and how-it-works sections remain unchanged.

### Backend API
- **D-10:** `JobsController` and `WorkersController` currently have `[Authorize]` at the class level. GET endpoints (list and detail) must be made publicly accessible. Approach: move `[Authorize]` to individual write actions and add `[AllowAnonymous]` to read actions, OR remove the class-level `[Authorize]` and annotate each write action individually. Claude's discretion on the exact mechanism — the outcome must be that anonymous GET calls return 200.

### Claude's Discretion
- Backend auth attribute restructuring approach (class-level vs action-level)
- Exact mobile route structure for public browsing (new `(public)` group vs conditional rendering in root layout)
- Loading/empty state for the 6-job landing section

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Web Frontend
- `frontend/src/App.jsx` — current route structure; all browsable routes are wrapped in ProtectedRoute and must be split out
- `frontend/src/components/ProtectedRoute.jsx` — currently no return URL support; must be extended or replaced
- `frontend/src/pages/LandingPage.jsx` — existing landing page to extend with 6-job grid
- `frontend/src/pages/JobsPage.jsx` — job list page that will become public
- `frontend/src/pages/JobDetailPage.jsx` — job detail page that will become public
- `frontend/src/pages/WorkerBrowsePage.jsx` — worker browse page that will become public
- `frontend/src/pages/WorkerProfilePage.jsx` — worker profile page that will become public
- `frontend/src/components/JobCard.jsx` — reusable job card for the landing page inline jobs

### Mobile
- `mobile/app/_layout.tsx` — root layout with hard auth redirect; must be changed to allow anonymous entry
- `mobile/app/(client)/_layout.tsx` — client tab structure
- `mobile/app/(worker)/_layout.tsx` — worker tab structure

### Backend
- `backend/HandyLink.API/Controllers/JobsController.cs` — [Authorize] at class level; GET endpoints need public access
- `backend/HandyLink.API/Controllers/WorkersController.cs` — same

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/JobCard.jsx` — exists with full job card rendering; can be dropped into the landing page section directly
- `@gorhom/bottom-sheet` (v5.2.8) — already installed in mobile; use for the auth prompt bottom sheet
- `frontend/src/context/AuthContext.jsx` — `useAuth()` hook available everywhere for checking login state before triggering the modal

### Established Patterns
- Web: `ProtectedRoute` wraps entire route groups; restructuring to public/protected split follows existing React Router nested route pattern
- Mobile: Route groups `(auth)`, `(client)`, `(worker)` already established; adding `(public)` follows the same convention
- Backend: `[AllowAnonymous]` already used in `PaymentsController` (webhook endpoint) — same pattern applies here

### Integration Points
- Web: `frontend/src/App.jsx` route tree must be split: public routes (jobs, workers, landing) vs protected routes (post-job, my-jobs, profile, notifications)
- Mobile: `mobile/app/_layout.tsx` auth redirect logic must become conditional — browse routes bypass auth check; action routes remain gated
- Backend: Landing page's "6 recent jobs" call is a standard `GET /api/jobs` — same endpoint used by JobsPage, just made anonymous

</code_context>

<specifics>
## Specific Ideas

- Landing page shows 6 recent open jobs using the existing `JobCard` component — no new card design needed
- Modal on web: "Log in to continue" with Login and Register buttons; Cancel dismisses
- Bottom sheet on mobile: same content, native feel using `@gorhom/bottom-sheet`
- Return URL pattern: `/login?return=/jobs/123` threaded through the modal/prompt

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-browse-first-ux*
*Context gathered: 2026-03-31*
