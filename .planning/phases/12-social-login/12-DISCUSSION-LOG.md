# Phase 12: Social Login - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 12-social-login
**Areas discussed:** Provider scope, Role selection UX, Account linking, UI placement

---

## Provider scope

| Option | Description | Selected |
|--------|-------------|----------|
| Google-only | MVP social login provider, simplest path | ✓ |
| Google + Facebook | Both providers in phase 12 |  |
| Google now, Facebook later | MVP now, prepare for add-on |  |

**User's choice:** Google-only for phase 12 (Facebook deferred).
**Notes:** Keep Facebook option ready for phase 13 with same codepath design.

---

## Post-OAuth role selection

| Option | Description | Selected |
|--------|-------------|----------|
| Required role selector after first Google sign-in | Block access until role is picked | ✓ |
| Default client role if none selected | Minimal friction, may mis-role users |  |
| Skip role step for all | Use existing profile if any, fallback to profile editing page |  |

**User's choice:** Show role selection screen if no existing profile.
**Notes:** Reuse web register’s role radio cards; mobile can use row cards.

---

## Existing account linking

| Option | Description | Selected |
|--------|-------------|----------|
| Merge by same email on Google sign-in | Avoid duplicate accounts, reuse profile row | ✓ |
| Create separate OAuth account always | Easier but causes duplicates |  |
| Prompt on duplicate email detected | Ask user to confirm merge/unlink, more complex |  |

**User's choice:** Merge by same email; dedupe in logic and upsert profile.
**Notes:** Might require Supabase setting plus app-side check to avoid two profile records.

---

## UI placement

| Option | Description | Selected |
|--------|-------------|----------|
| Login/Register button + gated action sheet | Web & mobile flow complete | ✓ |
| Auth prompt only (deferred in action sheet) | Quick but consistent less |  |
| Keep separate path for new users only | Avoid sign-in UI noise |  |

**User's choice:** Add Google button to login/register and auth gating.
**Notes:** Keep browse-first behavior intact.

---

## the agent's Discretion

- Button visual specifics (icon, text) and device breakpoints.
- Exact callback wiring details (use of redirect vs popup) per platform best practice.

## Deferred Ideas

- Facebook OAuth (AUTH-02) as later phase.
- Social profile picture and common profile merging UX.
