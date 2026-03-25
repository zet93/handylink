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