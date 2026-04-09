# Phase 10: Browse-First UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 10-browse-first-ux
**Areas discussed:** Platform scope, Login prompt style, Post-auth redirect, Landing page scope

---

## Platform Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Web + mobile | Anonymous browsing on both; mobile needs new public route group in Expo Router | ✓ |
| Web only | Mobile still redirects to login; mobile UX deferred | |

**User's choice:** Web + mobile
**Notes:** Mobile currently hard-redirects to `/(auth)/login` — structural change required.

---

## Login Prompt Style

| Option | Description | Selected |
|--------|-------------|----------|
| Modal overlay | Dialog on current page; return URL preserved; no full redirect | ✓ |
| Full-page redirect | Navigate to /login?return=... immediately | |
| Inline prompt | Action button transforms into "Sign in to bid →" link | |

**Follow-up — modal on mobile:**

| Option | Description | Selected |
|--------|-------------|----------|
| Modal web, bottom sheet mobile | Platform-appropriate; @gorhom/bottom-sheet already installed | ✓ |
| Same behavior on both | Web modal style on mobile too | |

**User's choice:** Modal on web, bottom sheet on mobile
**Notes:** `@gorhom/bottom-sheet` v5.2.8 already installed — no new dependency needed.

---

## Post-Auth Redirect

| Option | Description | Selected |
|--------|-------------|----------|
| Back to exact page | Return URL preserved through login flow | ✓ |
| Back to page + auto-action | Return AND auto-trigger the gated action | |
| Dashboard/home | Always land on default home after login | |

**User's choice:** Back to exact page
**Notes:** No auto-trigger — user decides whether to proceed after being returned to the page.

---

## Landing Page Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Show real jobs inline | Fetch and display recent open jobs on landing | ✓ |
| Existing landing is sufficient | Fix category links; no live data | |
| Featured jobs section only | 2-3 cards teaser | |

**Follow-up — job count:**

| Option | Description | Selected |
|--------|-------------|----------|
| 6 jobs + See all | 6-card grid + "Browse all jobs →" link | ✓ |
| 3 jobs + See all | Smaller teaser | |
| You decide | Claude picks count and layout | |

**User's choice:** 6 recent open jobs + "Browse all jobs →" link leading to /jobs
**Notes:** Use existing `JobCard.jsx` component — no new card design needed.

---

## Claude's Discretion

- Backend auth attribute approach (class-level removal vs action-level [AllowAnonymous])
- Mobile public route structure (new `(public)` group vs conditional root layout)
- Loading and empty state for the 6-job landing section
