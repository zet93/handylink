# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `backend/`:

```bash
dotnet build                          # build all projects
dotnet run --project HandyLink.API    # run the API (http://localhost:5272)
dotnet test                           # run all tests
dotnet test --filter "FullyQualifiedName~SomeTest"  # run a single test
```

EF Core migrations (run from `backend/`):

```bash
dotnet ef migrations add <Name> --project HandyLink.Infrastructure --startup-project HandyLink.API
dotnet ef database update --project HandyLink.Infrastructure --startup-project HandyLink.API
```

## Architecture

Three-project solution targeting **net10.0**, with PostgreSQL via EF Core and Supabase for auth.

```
HandyLink.API          → entry point (controllers, middleware, Program.cs)
  ↓ references
HandyLink.Infrastructure  → DbContext, EF Core, repository implementations
  ↓ references
HandyLink.Core         → entities, interfaces, DTOs, service contracts
```

**Request pipeline order** (defined in [Program.cs](backend/HandyLink.API/Program.cs)):
`GlobalExceptionMiddleware → Swagger → CORS → Authentication → Authorization → Controllers`

**Auth:** JWT Bearer using the Supabase JWT secret (`Supabase:JwtSecret` config key). Tokens are HS256-signed by Supabase; `ValidateIssuer` and `ValidateAudience` are both `false`.

**Error handling:** [GlobalExceptionMiddleware](backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs) catches all unhandled exceptions and returns `{ "error": "...", "statusCode": 500 }`.

**Configuration keys** (set in `appsettings.json` or user secrets):
- `ConnectionStrings:DefaultConnection` — PostgreSQL connection string
- `Supabase:JwtSecret` — required at startup; app throws if missing
- `Supabase:Url`
- `Stripe:SecretKey`, `Stripe:WebhookSecret`

**CORS:** `AllowAll` policy (any origin/method/header) — intentionally permissive for now, to be restricted before production.

# HandyLink — Project Context for Claude Code

## What This App Is
A two-sided marketplace where Clients post jobs (painting, electrical, plumbing, etc.)
and Workers bid on them. Review-based trust system. Global from day 1.

## Tech Stack
- Backend:  ASP.NET Core 10 Web API, C#
- Frontend: React + Vite + Tailwind CSS
- Mobile:   React Native + Expo Router (TypeScript)
- Database: Supabase (PostgreSQL) — managed via SQL scripts, NOT EF migrations
- Auth:     Supabase Auth (JWT, HS256 algorithm)
- Payments: Stripe + Stripe Connect
- Hosting:  Render (backend), Vercel (frontend), EAS (mobile)

## Architecture Pattern (CRITICAL)
Phase 3:    Clean Architecture — Controllers → Services → Repositories → EF Core
Phase 3.5+: VSA + CQRS via MediatR — Controllers → MediatR → Feature Handlers → EF Core
After Phase 3.5, NEVER create a Service class. Use Handlers only.

## Current phase: Phase 7 — Stripe Payments

## Feature Folder Structure (Phase 3.5+)
Path: backend/HandyLink.API/Features/{Domain}/{Action}/
Required files per slice:
  {Action}Command.cs   — input record, implements IRequest<{Action}Response>
  {Action}Handler.cs   — does the work, implements IRequestHandler
  {Action}Validator.cs — FluentValidation rules (auto-runs via pipeline)
  {Action}Response.cs  — output record

## Non-Negotiable Rules
1. NEVER run dotnet ef migrations add or dotnet ef database update
   Use SQL scripts in Data/Migrations/ run via the Supabase SQL editor
2. NEVER put business logic in a Controller — only _mediator.Send()
3. NEVER create a Service class after Phase 3.5
4. NEVER read user ID from request body — always GetUserId() from JWT
5. NEVER hardcode secrets — use environment variables only
6. NEVER git add .env or appsettings.json with real values

## Key Commands
dotnet build backend/                        — build the solution
dotnet test backend/                         — run all tests
dotnet run --project backend/HandyLink.API   — start API (dev mode)
npm run dev           (from frontend/)       — start web app
npx expo start        (from mobile/)         — start mobile app

<!-- GSD:project-start source:PROJECT.md -->
## Project

**HandyLink**

HandyLink is a two-sided marketplace for manual tradespeople (electricians, plumbers, painters, etc.) and the clients who need them, targeting the Romanian market. Clients post jobs and workers bid on them — a review-based trust system separates quality workers from the rest. Built on the insight that AI will drive a surge in demand for manual labor that can't be automated.

**Core Value:** A client can find a trusted local tradesperson and a worker can find their next job — without friction, without guesswork.

### Constraints

- **Tech stack**: ASP.NET Core 10 + React + Expo — no framework changes
- **Database**: Supabase PostgreSQL — schema changes via SQL scripts in `Data/Migrations/`, never EF migrations
- **Auth**: Supabase JWT — no switching providers; social login must flow through Supabase Auth
- **Architecture**: VSA + CQRS via MediatR for all new backend features — no new Service classes
- **Market**: Romania first — single currency (RON), single language, GDPR compliance required
- **Beta goal**: Functional demo, not production hardening — scope to what friends and family need to see it works
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Summary
## Languages
- C# — backend API (`backend/`)
- JavaScript (JSX) — web frontend (`frontend/src/`)
- TypeScript — mobile app (`mobile/`) and E2E tests (`e2e/`)
## Runtime
- .NET 10.0 — backend runtime
- Node.js 20 — frontend and mobile build/dev (pinned in CI)
- NuGet — backend (`backend/**/*.csproj`)
- npm — frontend (`frontend/package-lock.json`), mobile (`mobile/package-lock.json`), e2e (`e2e/package-lock.json`)
## Frameworks
- ASP.NET Core 10 Web API (`Microsoft.NET.Sdk.Web`, `net10.0`) — HTTP layer
- MediatR 12.4.1 — CQRS handler dispatch, registered in `backend/HandyLink.API/Program.cs`
- FluentValidation 11.x — request validation via pipeline behavior `backend/HandyLink.API/Behaviours/ValidationBehaviour.cs`
- EF Core 10.0.4 — ORM for PostgreSQL queries
- Npgsql.EntityFrameworkCore.PostgreSQL 10.0.1 — EF Core provider
- Microsoft.AspNetCore.Authentication.JwtBearer 10.0.5 — JWT auth middleware
- Swashbuckle.AspNetCore 10.1.5 — Swagger/OpenAPI docs
- React 19.2.4 — UI framework (`frontend/`)
- React Router DOM 7.13.1 — client-side routing
- Vite 8.0.0 — dev server and build tool (`frontend/vite.config.js`)
- Tailwind CSS 4.2.1 — utility-first styling (via `@tailwindcss/postcss`)
- TanStack React Query 5.90.21 — server state management
- React Hook Form 7.71.2 — form handling
- Zod 4.3.6 — schema validation
- Axios 1.13.6 — HTTP client (`frontend/src/api/axiosClient.js`)
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
- xUnit 2.9.3 — backend unit/integration test runner (`backend/HandyLink.Tests/`)
- Moq 4.20.72 — backend mocking
- FluentAssertions 8.x — backend assertion library
- Microsoft.AspNetCore.Mvc.Testing 10.x — integration test web app factory
- Microsoft.EntityFrameworkCore.InMemory 10.0.4 — in-memory DB for backend tests
- Vitest 4.1.0 — frontend unit test runner
- @testing-library/react 16.3.2 — frontend component testing
- Playwright 1.58.2 — E2E tests (`e2e/playwright.config.ts`)
## Key Dependencies
- `Stripe.net` 50.4.1 — payment processing; initialized in `backend/HandyLink.API/Program.cs` via `Stripe.StripeConfiguration.ApiKey`
- `@supabase/supabase-js` 2.99.1 — auth client; used in `frontend/src/lib/supabase.js` and `mobile/services/supabase.ts`
- `@stripe/react-stripe-js` 5.6.1 + `@stripe/stripe-js` 8.9.0 — Stripe Elements for frontend payments
- `@stripe/stripe-react-native` 0.58.0 — Stripe SDK for mobile payments
- `expo-secure-store` 55.0.8 — secure token storage for mobile Supabase sessions
- `expo-notifications` 55.0.12 — push notification token registration and handling
- `coverlet.collector` 6.0.4 — backend code coverage collection
- `dotenv` 17.3.1 — E2E test environment variable loading
## Configuration
- `ConnectionStrings:DefaultConnection` — PostgreSQL connection string
- `Supabase:JwtSecret` — required at startup; throws `InvalidOperationException` if absent
- `Supabase:Url` — required at startup; used to construct JWT issuer (`{url}/auth/v1`)
- `Stripe:SecretKey` — set immediately on startup via `Stripe.StripeConfiguration.ApiKey`
- `Stripe:WebhookSecret` — used for webhook signature verification
- Values go in user secrets (`UserSecretsId: handylink-api`) or environment variables; `backend/HandyLink.API/appsettings.json` contains only placeholder values
- `VITE_API_URL` — base URL for Axios client (`frontend/src/api/axiosClient.js`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key
- `EXPO_PUBLIC_API_URL` — base URL for Axios client (`mobile/services/api.ts`)
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `frontend/vite.config.js` — Vite config with jsdom test environment
- `mobile/tsconfig.json` — TypeScript config for mobile
- `mobile/babel.config.js` — Babel with `babel-preset-expo`
- `frontend/postcss.config.js` — PostCSS with Tailwind v4
## Platform Requirements
- .NET 10 SDK
- Node.js 20
- Expo Go or simulator for mobile
- Backend: Render (deploy hook in GitHub Actions `backend-ci.yml`)
- Frontend: Vercel (SPA rewrite rule in `frontend/vercel.json`)
- Mobile: EAS (Expo Application Services), bundle IDs `com.handylink.app`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Summary
## Backend (C# / ASP.NET Core)
### Naming Patterns
- `PascalCase` with `HandyLink.` prefix: `HandyLink.API`, `HandyLink.Core`, `HandyLink.Infrastructure`, `HandyLink.Tests`
- Mirror folder structure: `HandyLink.API.Features.Jobs.CreateJob`, `HandyLink.Core.Entities`, `HandyLink.Infrastructure.Repositories`
- `PascalCase`: `CreateJobHandler`, `GlobalExceptionMiddleware`, `ValidationBehaviour`
- Feature slice classes: `{Action}{Artifact}` — e.g., `CreateJobCommand`, `CreateJobHandler`, `CreateJobValidator`, `CreateJobResponse`
- Commands: `{Action}Command` (mutating) — `CreateJobCommand`, `SubmitBidCommand`
- Queries: `{Action}Query` (read-only) — `GetJobsQuery`, `GetJobByIdQuery`
- Responses: `{Action}Response` — `CreateJobResponse`, `AcceptBidResponse`
- All implemented as C# `record` types with positional parameters
- `PascalCase` with descriptive async suffix: `Handle`, `InvokeAsync`, `SeedUsersAsync`
- `PascalCase` on all entity and DTO properties: `ClientId`, `BudgetMin`, `CreatedAt`
- `camelCase` for locals: `opts`, `ctx`, `failures`, `otherBids`
### Feature Slice Structure (VSA + CQRS — mandatory for Phase 3.5+)
- Query slices use `{Action}Query.cs` instead of `{Action}Command.cs`
- Some slices omit `{Action}Validator.cs` when no validation rules are needed (e.g., `GetJobById` has a validator; `Payments/CreatePaymentIntent` omits one)
- `Response` records use positional constructor syntax throughout
### Controller Pattern
- All controllers extend `BaseController` (`backend/HandyLink.API/Controllers/BaseController.cs`)
- User identity always extracted via `GetUserId()` (never from request body)
- Route pattern: `[Route("api/{resource}")]` on the class, HTTP verb attributes on methods
### Error Handling Pattern
- `NotFoundException` → 404
- `ForbiddenException` → 403
- `ConflictException` → 409
- `ValidationException` → 400 (also auto-thrown by `ValidationBehaviour`)
### Validation Pattern
### Entity Design
- Plain C# classes in `backend/HandyLink.Core/Entities/`
- All entities use `Guid Id`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
- Navigation properties initialized to `null!` or empty collections (`[]`)
- Enums in `backend/HandyLink.Core/Entities/Enums/` (one file per enum)
### Legacy Services (Phase 3 remnants)
## Frontend (React / Vite / JavaScript)
### Naming Patterns
- Pages: `PascalCase` with `Page` suffix — `JobsPage.jsx`, `LoginPage.jsx`, `PostJobPage.jsx`
- Components: `PascalCase` — `JobCard.jsx`, `NavBar.jsx`, `ProtectedRoute.jsx`
- Context: `PascalCase` with `Context` suffix — `AuthContext.jsx`
- API/utilities: `camelCase` — `axiosClient.js`
- React components: `PascalCase` default exports — `export default function JobCard({ job })`
- Hooks/helpers: `camelCase` — `useAuth`, `loadProfile`, `timeAgo`
### ESLint Config
- `js.configs.recommended`
- `reactHooks.configs.flat.recommended`
- `reactRefresh.configs.vite`
- Custom rule: `no-unused-vars` errors unless variable matches `^[A-Z_]`
- Target files: `**/*.{js,jsx}` (no TypeScript)
### Import Style
### State Management
- Local state: `useState`
- Server state: `@tanstack/react-query` (present in `package.json`, not confirmed in all pages)
- Auth state: `AuthContext` via `useAuth()` hook
- Forms: `react-hook-form` + `zod` for validation
## Mobile (React Native / Expo Router / TypeScript)
### Naming Patterns
- Expo Router screens: `kebab-case` — `job-detail.tsx`, `post-job.tsx`, `browse-workers.tsx`
- Layout files: `_layout.tsx` (Expo Router convention)
- Route groups: `(auth)`, `(client)`, `(worker)` — parentheses denote Expo Router groups
### TypeScript
## Cross-Cutting Rules
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Summary
## Backend Architectural Pattern
- `backend/HandyLink.Core/` — entities, interfaces, exception types, pre-VSA service classes
- `backend/HandyLink.Infrastructure/` — `HandyLinkDbContext`, repository implementations
- `backend/HandyLink.API/` — controllers, features, middleware, behaviours
```csharp
```
## Request Pipeline
```
```
```
```
## Auth Pattern
```csharp
```
## Error Handling
| Exception | HTTP |
|---|---|
| `NotFoundException` | 404 |
| `ForbiddenException` | 403 |
| `ConflictException` | 409 |
| `ValidationException` | 400 |
| Unhandled | 500 (logged) |
## Domain Model
## Key Business Flows
- Worker requests onboard link → API creates Stripe Express account → stores `StripeAccountId` on `WorkerProfile` → returns Stripe hosted onboarding URL
- Triggered as MediatR commands (`SendPushNotificationCommand` in `backend/HandyLink.Core/Commands/`)
- Handler calls Expo Push HTTP API fire-and-forget (errors logged, not propagated)
## Frontend Architecture
## Mobile Architecture
- `mobile/app/(auth)/` — login, register
- `mobile/app/(client)/` — post-job, job-detail, browse-workers, notifications, profile
- `mobile/app/(worker)/` — browse, my-bids, notifications, profile
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
