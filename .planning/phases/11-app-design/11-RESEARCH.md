# Phase 11: App Design - Research

**Found:** 2026-04-01

## Relevant existing implementation
- Web frontend uses React + Tailwind CSS + App.css with CSS variables for accent, border, text.
- Mobile uses Expo Router + React Native components, with inline style objects in `/mobile/app` screens.
- Phase 10 introduced browse-first UX with anonymous pages and auth prompt flows.

## Design system approach
1. Create shared color and typography variables in web (via `frontend/src/App.css` or `frontend/src/styles.css`) and mobile (via `mobile/app/constants/design.ts`).
2. For web: use Tailwind utility classes and global CSS classes to enforce neutral palette and consistent typography; revise key containers and cards (`JobCard`, `WorkerCard`, `LandingPage`).
3. For mobile: introduce `Typography` and `Spacing` constants and use them in `job-detail.tsx`, `browse-workers.tsx`, and `post-job.tsx`.
4. Add responsive breakpoints in web pages via Tailwind responsive class patterns (`sm:`, `md:`, `lg:`) and verify with `npm run build` + manual UI checks.

## Verification metrics
- No UI tests currently for design; use snapshot/storybook not available. We'll implement targeted E2E tests in `/e2e` with Playwright to cover requirements:
  - DSG-01/02: color and typography checks via CSS property assertions on key elements.
  - DSG-03: user ancestor flow checks (browse → bid, post job → bid review).
  - DSG-04/05: viewport resizing assertions for mobile/tablet/desktop.

## Risks
- Mobile and web style systems differ, requiring separate tasks. Keep one plan per platform for parallelism.
- Avoid deep refactor of existing components; apply incremental improvements to existing pages.
