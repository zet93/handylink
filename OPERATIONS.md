# HandyLink Operations

## Dependency Update Process

### Monthly Checks (first Monday of each month)

- [ ] **Backend (.NET / NuGet):** `dotnet list backend/ package --outdated`
  - Review major version bumps for breaking changes
  - Apply minor/patch updates immediately: edit `.csproj` version → `dotnet restore backend/` → `dotnet test backend/`
  - For major bumps: create a branch, test, merge via PR

- [ ] **Frontend (npm):** `npm outdated` (from `frontend/`)
  - Apply minor/patch: `npm update` → `npm run test` → `npm run build`
  - For major bumps (e.g. React, Vite, Tailwind): create a branch, test, merge via PR

- [ ] **Mobile (Expo):** `npx expo install --check` (from `mobile/`)
  - Expo manages SDK peer dependencies — always use `npx expo install <pkg>` not `npm install`
  - For Expo SDK major upgrades: follow the official upgrade guide at https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

### Security Patches (apply immediately on disclosure)

- Monitor **GitHub Dependabot alerts** on the repository
- Monitor **npm audit:** `npm audit --audit-level=high` (frontend + mobile)
- Monitor **NuGet advisories:** https://github.com/advisories (filter: NuGet)
- Apply security patches on a dedicated branch: `git checkout -b security/patch-<pkg>-<version>`
- Run full test suite before merging: `dotnet test backend/ && npm run test --prefix frontend`

### Update Workflow

1. Create a branch: `git checkout -b chore/update-deps-<YYYY-MM>`
2. Apply updates per the checklist above
3. Run full test suite: `dotnet test backend/ && npm run test --prefix frontend`
4. Build frontend: `npm run build --prefix frontend`
5. Smoke-test locally: `dotnet run --project backend/HandyLink.API` + `npm run dev --prefix frontend`
6. Merge via PR with description of what was updated and why

### Key Commands

| Command | Purpose |
|---------|---------|
| `dotnet list backend/ package --outdated` | Show outdated NuGet packages |
| `npm outdated` (from `frontend/`) | Show outdated npm packages |
| `npx expo install --check` (from `mobile/`) | Show Expo SDK dependency mismatches |
| `npm audit --audit-level=high` | Show high-severity npm vulnerabilities |
| `dotnet test backend/` | Run backend test suite |
| `npm run test --prefix frontend` | Run frontend test suite |

### External Service Updates

- **Supabase:** Watch for deprecation notices in the Supabase dashboard. `@supabase/supabase-js` follows Supabase API versions — update together.
- **Stripe:** Breaking changes are announced via the Stripe changelog. Pin the `Stripe.net` and `@stripe/stripe-js` versions; upgrade intentionally.
- **PostHog:** Auto-updates are safe for minor versions. Check the PostHog changelog before major upgrades: https://posthog.com/changelog
- **Sentry:** Follow the Sentry migration guide for SDK major versions.
