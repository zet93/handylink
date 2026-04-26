# Phase 17: AI Slop Frontend Improvements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 17-ai-slop-frontend-improvements
**Areas discussed:** Landing page copy & tone, Category labels & raw values, Icons, Web page polish

---

## Landing Page Copy & Tone

| Option | Description | Selected |
|--------|-------------|----------|
| Direct & local Romanian | Romanian market language, Romania-specific, drops "globally" | ✓ |
| Professional & neutral | Clean English, market-agnostic | |
| You decide | Claude picks copy | |

**User's choice:** Direct & local Romanian
**Notes:** Drop "globally", reference Romania explicitly, feel local and direct.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both, different destinations | Post a Job → /register?role=client etc | |
| Keep both, same destination | Both go to /register | ✓ |
| Single CTA | One "Get Started" button | |

**User's choice:** Both CTAs go to /register (same destination)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, keep recent jobs | Shows product is alive | ✓ |
| Remove it | Cleaner, no data dependency | |
| Move it above how-it-works | Higher social proof | |

**User's choice:** Keep recent jobs section in current position

---

## Category Labels & Raw Values

| Option | Description | Selected |
|--------|-------------|----------|
| Romanian labels | Electrician, Instalator, Zugrav, etc. | ✓ |
| English title-case | Electrical, Plumbing, Painting, etc. | |
| Both (Romanian + English in parens) | Electrician (Electrical) | |

**User's choice:** Romanian labels

**Surfaces selected (multi-select):** Job browse filters, Job cards, Post job form, Job detail page

---

## Icons — Emojis vs Proper Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Keep emojis | Playful, no new dependency | |
| Lucide React SVG icons | Clean, consistent, professional | ✓ |
| Text only | No icons, just labels | |

**User's choice:** Lucide React SVG icons

| Option | Description | Selected |
|--------|-------------|----------|
| Landing page only | Fix most visible spot | ✓ |
| Nav icons too | Add to nav bar and buttons | |
| You decide | Claude picks | |

**User's choice:** Landing page category grid only

---

## Web Page Polish

**Targets selected (multi-select):** Remove country filter, Empty states, Loading states, NavBar polish

| Option | Description | Selected |
|--------|-------------|----------|
| Web + mobile together | Category labels on mobile too | ✓ |
| Web only for now | Web first, mobile later | |

**User's choice:** Web + mobile together for category labels

---

## Claude's Discretion

- Exact Romanian copy wording for hero and how-it-works
- Which Lucide icon maps to each trade category
- Empty state design and copy
- Skeleton loader vs spinner approach
- NavBar specific changes to fix
