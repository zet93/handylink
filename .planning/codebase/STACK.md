# Technology Stack
_Last updated: 2026-03-29_

## Summary
HandyLink is a three-platform marketplace (backend API, web frontend, mobile app) targeting .NET 10, React 19, and React Native 0.83 via Expo 55. The backend uses a VSA + CQRS pattern via MediatR with PostgreSQL through EF Core; the frontend and mobile apps share the same API contract via Axios with Supabase JWT tokens.

## Languages

**Primary:**
- C# — backend API (`backend/`)
- JavaScript (JSX) — web frontend (`frontend/src/`)
- TypeScript — mobile app (`mobile/`) and E2E tests (`e2e/`)

## Runtime

**Environment:**
- .NET 10.0 — backend runtime
- Node.js 20 — frontend and mobile build/dev (pinned in CI)

**Package Managers:**
- NuGet — backend (`backend/**/*.csproj`)
- npm — frontend (`frontend/package-lock.json`), mobile (`mobile/package-lock.json`), e2e (`e2e/package-lock.json`)

## Frameworks

**Backend:**
- ASP.NET Core 10 Web API (`Microsoft.NET.Sdk.Web`, `net10.0`) — HTTP layer
- MediatR 12.4.1 — CQRS handler dispatch, registered in `backend/HandyLink.API/Program.cs`
- FluentValidation 11.x — request validation via pipeline behavior `backend/HandyLink.API/Behaviours/ValidationBehaviour.cs`
- EF Core 10.0.4 — ORM for PostgreSQL queries
- Npgsql.EntityFrameworkCore.PostgreSQL 10.0.1 — EF Core provider
- Microsoft.AspNetCore.Authentication.JwtBearer 10.0.5 — JWT auth middleware
- Swashbuckle.AspNetCore 10.1.5 — Swagger/OpenAPI docs

**Frontend:**
- React 19.2.4 — UI framework (`frontend/`)
- React Router DOM 7.13.1 — client-side routing
- Vite 8.0.0 — dev server and build tool (`frontend/vite.config.js`)
- Tailwind CSS 4.2.1 — utility-first styling (via `@tailwindcss/postcss`)
- TanStack React Query 5.90.21 — server state management
- React Hook Form 7.71.2 — form handling
- Zod 4.3.6 — schema validation
- Axios 1.13.6 — HTTP client (`frontend/src/api/axiosClient.js`)

**Mobile:**
- React Native 0.83.2 — cross-platform native UI
- Expo 55.0.6 + Expo Router 55.0.5 — managed workflow and file-based routing (`mobile/app.json`)
- TypeScript 5.9.2 — type checking
- TanStack React Query 5.90.21 — server state management
- React Hook Form 7.71.2 — form handling
- Zod 4.3.6 — schema validation
- Axios 1.13.6 — HTTP client (`mobile/services/api.ts`)
- React Native Reanimated 4.2.2 — animations
- React Native Gesture Handler 2.30.0 — gesture system
- @gorhom/bottom-sheet 5.2.8 — bottom sheet UI

**Testing:**
- xUnit 2.9.3 — backend unit/integration test runner (`backend/HandyLink.Tests/`)
- Moq 4.20.72 — backend mocking
- FluentAssertions 8.x — backend assertion library
- Microsoft.AspNetCore.Mvc.Testing 10.x — integration test web app factory
- Microsoft.EntityFrameworkCore.InMemory 10.0.4 — in-memory DB for backend tests
- Vitest 4.1.0 — frontend unit test runner
- @testing-library/react 16.3.2 — frontend component testing
- Playwright 1.58.2 — E2E tests (`e2e/playwright.config.ts`)

## Key Dependencies

**Critical:**
- `Stripe.net` 50.4.1 — payment processing; initialized in `backend/HandyLink.API/Program.cs` via `Stripe.StripeConfiguration.ApiKey`
- `@supabase/supabase-js` 2.99.1 — auth client; used in `frontend/src/lib/supabase.js` and `mobile/services/supabase.ts`
- `@stripe/react-stripe-js` 5.6.1 + `@stripe/stripe-js` 8.9.0 — Stripe Elements for frontend payments
- `@stripe/stripe-react-native` 0.58.0 — Stripe SDK for mobile payments
- `expo-secure-store` 55.0.8 — secure token storage for mobile Supabase sessions
- `expo-notifications` 55.0.12 — push notification token registration and handling

**Infrastructure:**
- `coverlet.collector` 6.0.4 — backend code coverage collection
- `dotenv` 17.3.1 — E2E test environment variable loading

## Configuration

**Environment (Backend):**
- `ConnectionStrings:DefaultConnection` — PostgreSQL connection string
- `Supabase:JwtSecret` — required at startup; throws `InvalidOperationException` if absent
- `Supabase:Url` — required at startup; used to construct JWT issuer (`{url}/auth/v1`)
- `Stripe:SecretKey` — set immediately on startup via `Stripe.StripeConfiguration.ApiKey`
- `Stripe:WebhookSecret` — used for webhook signature verification
- Values go in user secrets (`UserSecretsId: handylink-api`) or environment variables; `backend/HandyLink.API/appsettings.json` contains only placeholder values

**Environment (Frontend):**
- `VITE_API_URL` — base URL for Axios client (`frontend/src/api/axiosClient.js`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key

**Environment (Mobile):**
- `EXPO_PUBLIC_API_URL` — base URL for Axios client (`mobile/services/api.ts`)
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

**Build:**
- `frontend/vite.config.js` — Vite config with jsdom test environment
- `mobile/tsconfig.json` — TypeScript config for mobile
- `mobile/babel.config.js` — Babel with `babel-preset-expo`
- `frontend/postcss.config.js` — PostCSS with Tailwind v4

## Platform Requirements

**Development:**
- .NET 10 SDK
- Node.js 20
- Expo Go or simulator for mobile

**Production:**
- Backend: Render (deploy hook in GitHub Actions `backend-ci.yml`)
- Frontend: Vercel (SPA rewrite rule in `frontend/vercel.json`)
- Mobile: EAS (Expo Application Services), bundle IDs `com.handylink.app`

---

*Stack analysis: 2026-03-29*
