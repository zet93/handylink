# Phase 17: AI Slop Frontend Improvements - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix AI-generated slop patterns across the web (and mobile for category labels) frontend:
- Landing page copy rewritten for Romanian market
- Raw category enum values replaced with Romanian labels everywhere user-visible
- Emoji icons on landing page replaced with Lucide React SVG icons
- Web page polish: remove country filter, add empty/loading states, NavBar review

Scope does NOT include: new features, backend changes, authentication flows, payment flows, or mobile UI overhaul beyond category label fixes.

</domain>

<decisions>
## Implementation Decisions

### Landing Page Copy & Tone
- **D-01:** Romanian-specific tone — drop "globally", reference Romania explicitly. Hero headline and supporting copy should feel local and direct, not generic SaaS template. Example direction: "Găsești meșteșugari de încredere în orașul tău" (or equivalent quality English variant localized for Romania).
- **D-02:** Both hero CTAs ("Post a Job" / "Find Work") keep the same `/register` destination — role selection happens on the next screen. No change to routing needed.
- **D-03:** Keep the recent jobs section (shows live product, social proof). Position stays below how-it-works.

### Category Labels
- **D-04:** Display Romanian labels for all categories, replacing raw enum values everywhere user-visible. Mapping:
  - `electrical` → Electrician
  - `plumbing` → Instalator
  - `painting` → Zugrav
  - `carpentry` → Tâmplărie
  - `furniture_assembly` → Mobilă
  - `cleaning` → Curățenie
  - `general` → General
  - `other` → Altele
- **D-05:** Apply to ALL user-visible surfaces: job browse filters (web + mobile), job cards (web + mobile), post job form category select (web + mobile), job detail page (web + mobile).
- **D-06:** Implementation: create a shared `CATEGORY_LABELS` lookup constant (one source of truth) importable in both web and mobile. Do NOT hardcode in each component separately.

### Icons
- **D-07:** Replace emoji icons in the landing page category grid with **Lucide React** SVG icons. Lucide has appropriate icons for each trade category and is the standard for Tailwind projects.
- **D-08:** Icon scope: landing page category grid ONLY. No nav icons, no other surfaces in this phase.
- **D-09:** Install `lucide-react` as a dependency if not already present.

### Web Page Polish
- **D-10:** Remove the "Country" filter field from JobsPage — app is Romania-only, the filter is noise and confusing.
- **D-11:** Add empty states: when the jobs list returns 0 results (filtered or unfiltered), show a proper empty state UI instead of blank space.
- **D-12:** Add loading states: skeleton loaders or a spinner while jobs/profiles are loading. Use the existing TanStack Query `isLoading` flags already in components.
- **D-13:** NavBar polish: review active state indicators, link labels, and mobile responsiveness. Fix any jarring issues found.

### Claude's Discretion
- Exact Romanian copy wording (beyond the direction given in D-01)
- Which Lucide icon maps to each trade category
- Empty state design (icon + message text)
- Skeleton loader style (block placeholders vs spinner)
- NavBar specific changes (whatever looks most jarring when reviewed)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing pages to modify
- `frontend/src/pages/LandingPage.jsx` — Category grid with emojis, hero copy, how-it-works sections
- `frontend/src/pages/JobsPage.jsx` — Filter sidebar with country field and raw category values
- `frontend/src/pages/JobDetailPage.jsx` — Category display in job detail
- `frontend/src/pages/PostJobPage.jsx` — Category select in post job form
- `frontend/src/components/JobCard.jsx` — Category badge on job cards (web)
- `mobile/app/(public)/browse.tsx` — Mobile browse with category filter
- `mobile/app/(client)/post-job.tsx` — Category select in mobile post job
- `mobile/app/(public)/job-detail.tsx` — Category in mobile job detail
- `mobile/app/(worker)/browse.tsx` — Mobile worker browse with category

### Design reference
- `.planning/phases/11-app-design/11-CONTEXT.md` — App design decisions (neutral palette, typography, component patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useQuery` with `isLoading` flag — already used in JobsPage, LandingPage, WorkerBrowsePage; adding skeleton/spinner is additive
- `JobCard.jsx` — category shown as raw value; needs label lookup added
- `CATEGORIES` constant in PostJobPage.jsx and JobsPage.jsx — currently separate; should be unified with the Romanian label map

### Established Patterns
- Tailwind CSS v4 utility classes for web
- React Hook Form + Zod for forms
- TanStack Query for server state (isLoading, isError, data)
- Mobile uses `StyleSheet` from React Native + `palette`/`typography` from `mobile/app/constants/design.ts`

### Integration Points
- Category labels must stay consistent with the backend enum values (API still receives/returns the raw value like `"electrical"`) — only the DISPLAY label changes
- The shared constant should live in `frontend/src/constants/categories.js` (web) and `mobile/constants/categories.ts` (mobile), not in page files

</code_context>

<specifics>
## Specific Ideas

- The CATEGORY_LABELS map should be the canonical source: `{ electrical: 'Electrician', plumbing: 'Instalator', ... }` used via a helper like `getCategoryLabel(raw)` returning the Romanian label or the raw value if unknown.
- Lucide icon candidates: Zap (electrical), Wrench (plumbing), Paintbrush (painting), Hammer (carpentry), Armchair (furniture), Sparkles (cleaning), Home (general), MoreHorizontal (other).

</specifics>

<deferred>
## Deferred Ideas

- Mobile UI overhaul beyond category labels — separate phase
- Nav icons on mobile bottom tab bar — separate phase
- Dark mode — out of scope
- Internationalization (i18n) framework — the Romanian labels in this phase are hardcoded, not a full i18n system

</deferred>

---

*Phase: 17-ai-slop-frontend-improvements*
*Context gathered: 2026-04-26*
