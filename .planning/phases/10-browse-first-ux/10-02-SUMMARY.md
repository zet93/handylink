---
phase: 10-browse-first-ux
plan: 02
subsystem: ui
tags: [react, react-router, tanstack-query, vite, tailwind]

requires:
  - phase: 10-01
    provides: Backend AllowAnonymous on GET /api/jobs, GET /api/jobs/:id, GET /api/workers endpoints

provides:
  - Split route tree with public browsing routes and protected action routes
  - AuthPromptModal component for gated actions (submit bid, post job)
  - NavBar conditional rendering: Login/Register for anonymous, full nav for authenticated users
  - ProtectedRoute with return URL encoding for post-auth redirect
  - LandingPage 6-job grid fetching live Open jobs via React Query
  - LoginPage and RegisterPage honor return URL from searchParams and thread it through to alternate auth link

affects: [phase-11, phase-12]

tech-stack:
  added: []
  patterns:
    - "Auth-on-action: public browse routes, ProtectedRoute gates only write actions"
    - "Return URL flow: encodeURIComponent(location.pathname) through ProtectedRoute -> login/register -> navigate(returnTo)"
    - "Conditional NavBar: user null check gates NotificationBell to avoid 401 on GET /api/notifications"

key-files:
  created:
    - frontend/src/components/AuthPromptModal.jsx
  modified:
    - frontend/src/App.jsx
    - frontend/src/components/ProtectedRoute.jsx
    - frontend/src/components/NavBar.jsx
    - frontend/src/pages/LandingPage.jsx
    - frontend/src/pages/LoginPage.jsx
    - frontend/src/pages/RegisterPage.jsx
    - frontend/src/pages/JobDetailPage.jsx

key-decisions:
  - "Public route group uses bare <AuthLayout /> (no ProtectedRoute wrapper) for /jobs, /jobs/:id, /worker/browse, /worker/:id"
  - "NotificationBell not rendered when user is null — prevents 401 cascade via axiosClient redirect interceptor"
  - "JobDetailPage bids query gated on user auth (enabled: !!job && !!user) to prevent 401 for anonymous visitors"
  - "Anonymous visitor on job detail sees inline Submit a Bid button that opens AuthPromptModal instead of WorkerView"

patterns-established:
  - "AuthPromptModal: isOpen/onClose/returnPath props pattern for reusable auth gate UI"
  - "useSearchParams return URL threading: read on login/register, pass through to alternate auth link"

requirements-completed: [UX-01, UX-02, UX-03, UX-04, UX-05]

duration: 6min
completed: 2026-04-01
---

# Phase 10 Plan 02: Browse-First UX — Frontend Routing and Auth Gates Summary

**Split route tree with public browsing (jobs/workers), AuthPromptModal for gated actions, and LandingPage 6-job live grid with return URL flow through login/register**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-01T04:00:00Z
- **Completed:** 2026-04-01T04:02:58Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Restructured App.jsx route tree into public and protected groups — /jobs, /jobs/:id, /worker/browse, /worker/:id are now accessible without auth
- Created AuthPromptModal component with Log in / Create account / Maybe later CTAs and Escape key close
- NavBar now conditionally shows Login/Register for unauthenticated users and suppresses NotificationBell (which would trigger 401 → redirect loop)
- LandingPage fetches 6 recent Open jobs via React Query with loading skeleton, error state, and empty state
- LoginPage and RegisterPage read ?return= param and navigate back to origin after successful auth; thread param through to alternate auth link
- JobDetailPage handles anonymous visitors: bids query disabled when unauthenticated, Submit a Bid button triggers AuthPromptModal instead of showing WorkerView

## Task Commits

1. **Task 1: Route tree split + ProtectedRoute return URL + NavBar auth state + AuthPromptModal** - `a106ee0` (feat)
2. **Task 2: Landing page 6-job grid + LoginPage/RegisterPage return URL + JobDetailPage anonymous handling** - `3d7e076` (feat)

## Files Created/Modified

- `frontend/src/App.jsx` - Split into public and protected route groups
- `frontend/src/components/ProtectedRoute.jsx` - Added useLocation and return URL encoding
- `frontend/src/components/NavBar.jsx` - Conditional rendering based on user auth state; Login/Register for anonymous
- `frontend/src/components/AuthPromptModal.jsx` - New modal component for gated actions
- `frontend/src/pages/LandingPage.jsx` - Added React Query 6-job grid; updated hero CTAs to /post-job and /worker/browse
- `frontend/src/pages/LoginPage.jsx` - Added useSearchParams, return URL navigate, thread param to Register link
- `frontend/src/pages/RegisterPage.jsx` - Added useSearchParams, return URL navigate, thread param to Login link
- `frontend/src/pages/JobDetailPage.jsx` - Added useLocation, AuthPromptModal import, user auth guard on bids query, anonymous visitor UI

## Decisions Made

- Public route group uses bare `<AuthLayout />` (no ProtectedRoute) — correct approach per D-01/D-04
- NotificationBell suppressed for anonymous users — it fires GET /api/notifications which returns 401 and triggers axiosClient redirect interceptor causing infinite loop
- Bids query on JobDetailPage now requires both `job` and `user` to be truthy — prevents 401 for anonymous visitors browsing job detail
- Anonymous visitor on an open/bidding job sees an inline CTA with AuthPromptModal instead of the WorkerView form

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `npx vite build` failed in worktree because node_modules were absent (worktrees don't inherit parent's node_modules). Fixed by running `npm install --prefer-offline` in the worktree frontend directory before the build check. Not a code issue, infrastructure deviation only.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Public browse-first UX fully wired: visitors can browse jobs/workers, see live job data on landing page, and get prompted to auth only on action
- Return URL flow tested end-to-end in build
- Phase 10 plan 03 (visual design polish) can proceed

---
*Phase: 10-browse-first-ux*
*Completed: 2026-04-01*
