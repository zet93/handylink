# Phase 15: Analytics + Observability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 15 - Analytics + Observability
**Areas discussed:** Consent Banner UX, PostHog Identity Linking

---

## Consent Banner UX

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed bottom bar (web) | Non-blocking — user can browse immediately, bar stays pinned until they decide | ✓ |
| Blocking modal (web) | User must explicitly accept/decline before proceeding | |
| Bottom sheet / modal (mobile) | Matches native mobile patterns, already coded in RESEARCH.md | ✓ |
| Same bottom bar as web (mobile) | Consistent cross-platform, but competes with mobile nav tabs | |
| Stays pending — re-shows next visit (dismiss) | No analytics fire, banner reappears next session | ✓ |
| Treat as decline (dismiss) | Dismiss = opt-out permanently | |

**User's choices:**
- Web: Fixed bottom bar
- Mobile: Bottom sheet / modal
- Dismiss behavior: Stays pending, re-shows next visit

**Notes:** All three choices matched the recommended defaults from RESEARCH.md.

---

## PostHog Identity Linking

| Option | Description | Selected |
|--------|-------------|----------|
| Identify after consent + login | `posthog.identify(user.id, { role })` — only after both consent granted AND logged in | ✓ |
| Stay fully anonymous | Simpler, zero GDPR scope, aggregate trends only | |
| Include role property | Split funnels by client vs worker in PostHog | ✓ |
| Omit role property | Slightly simpler, no role segmentation | |

**User's choices:**
- Identify after consent + login: Yes
- Include role property: Yes

**Notes:** Role property (`client` | `worker`) enables marketplace-specific funnel analysis (workers reaching bid_submitted vs clients reaching job_posted).

---

## Claude's Discretion

- Sentry alert routing (email vs Slack/Discord): not discussed — Claude to default to email-only for beta simplicity
- OPS-03 doc location: not discussed — Claude to use new `OPERATIONS.md` at repo root
- Sentry single vs multi project: not discussed — Claude to use single project per RESEARCH.md recommendation
- Exact Tailwind styling for consent UI: not discussed — Claude to match existing app styles

## Deferred Ideas

- OPS-04 content moderation — future v2/admin phase
- Sentry Slack/Discord alerts — post-beta when team size warrants
- PostHog screen tracking on mobile — nice-to-have, defer if complex
- UptimeRobot SMS alerts — email-only for beta
