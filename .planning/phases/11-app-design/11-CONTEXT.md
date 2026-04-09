# Phase 11: App Design - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning
**Source:** ROADMAP.md / REQUIREMENTS.md

## Phase boundary
- Implement consistent visual system across web and mobile for existing browse/job bid flows.
- Enforce design tokens for color, typography, spacing, and elevation.
- Fix layout issues on responsive breakpoints and mobile screen sizes.
- Keep platform feature behavior unchanged (no new endpoints, no auth logic changes).

## Requirements and locked decisions
- DSG-01: Use neutral, consistent color palette (grays, whites, one accent) across web + mobile.
- DSG-02: Typography consistent and readable across web + mobile.
- DSG-03: Browse→bid and post-job→review-bids flows work without extra instructions.
- DSG-04: Mobile layouts correct on Phone sizes (no overflow, alignment OK).
- DSG-05: Web layouts responsive for mobile/tablet/desktop.

### the agent's discretion
- Choose an accessible accent hue (blue or teal) with >=4.5:1 contrast against background.
- Implement CSS custom properties and component-level utility classes for maintainability.
- Prioritize existing UI components that already represent core flows (`JobCard`, `WorkerCard`, `NavBar`, `AuthPromptModal`).

## Deferred ideas
- Not required: full theme switcher (light/dark), animation system, design-system documentation site.
