# Architecture

_Last updated: 2026-03-29_

## Summary

HandyLink is a three-tier monorepo: an ASP.NET Core 10 backend using VSA + CQRS via MediatR, a React/Vite frontend, and a React Native/Expo mobile app. The backend transitioned from Clean Architecture (Phase 3) to Vertical Slice Architecture (Phase 3.5+); all new backend features use MediatR Handlers — no Service classes. Supabase provides auth (JWT HS256) and PostgreSQL; Stripe Connect handles marketplace payments.

## Backend Architectural Pattern

**Vertical Slice Architecture (VSA) + CQRS via MediatR** — every feature lives in its own folder under `backend/HandyLink.API/Features/{Domain}/{Action}/` containing exactly four files: Command/Query, Handler, Validator, Response.

**Residual Clean Architecture layers** (from Phase 3, still present):
- `backend/HandyLink.Core/` — entities, interfaces, exception types, pre-VSA service classes
- `backend/HandyLink.Infrastructure/` — `HandyLinkDbContext`, repository implementations
- `backend/HandyLink.API/` — controllers, features, middleware, behaviours

**Dependency direction:** `HandyLink.API` → `HandyLink.Infrastructure` → `HandyLink.Core`

Handlers bypass repositories and call `HandyLinkDbContext` directly:
```csharp
public class CreateJobHandler(HandyLinkDbContext context)
    : IRequestHandler<CreateJobCommand, CreateJobResponse>
```

Legacy service classes (`NotificationService`, `UserService`) remain in `backend/HandyLink.Core/Services/` and are injected in `Program.cs` for non-feature paths (e.g., the Notifications controller reads/marks notifications via `NotificationService`).

## Request Pipeline

Order defined in `backend/HandyLink.API/Program.cs`:

```
GlobalExceptionMiddleware
  → Swagger
  → CORS (AllowAll — any origin/method/header)
  → Authentication (JWT Bearer, HS256, Supabase secret)
  → Authorization
  → Controllers
```

Within a controller action:
```
Controller.Action()
  → mediator.Send(Command/Query)
  → ValidationBehaviour<TRequest,TResponse>  (MediatR pipeline behavior)
  → Handler.Handle()
  → HandyLinkDbContext (EF Core → PostgreSQL via Supabase)
```

`ValidationBehaviour` auto-runs all `IValidator<TRequest>` registered by `AddValidatorsFromAssembly`. Validation failures throw `Core.Exceptions.ValidationException`, which `GlobalExceptionMiddleware` maps to HTTP 400.

## Auth Pattern

Tokens are issued by Supabase Auth (HS256). The API validates them using `Supabase:JwtSecret`. User identity is always read from the JWT `sub` claim via `ClaimsPrincipalExtensions.GetSupabaseUserId()` at `backend/HandyLink.API/Extensions/ClaimsPrincipalExtensions.cs` — never from request body.

```csharp
protected Guid GetUserId() => User.GetSupabaseUserId();  // BaseController
```

Both frontend and mobile attach the Supabase `access_token` as a Bearer header via Axios interceptors.

## Error Handling

`GlobalExceptionMiddleware` at `backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs` maps domain exceptions to HTTP status codes:

| Exception | HTTP |
|---|---|
| `NotFoundException` | 404 |
| `ForbiddenException` | 403 |
| `ConflictException` | 409 |
| `ValidationException` | 400 |
| Unhandled | 500 (logged) |

Response shape: `{ "error": "...", "statusCode": N }`

## Domain Model

Core entities in `backend/HandyLink.Core/Entities/`:

**Profile** (`profiles` table) — all users. Has `Role` ("client" | "worker" | "both") and optional `ExpoPushToken` for mobile push notifications. One-to-one with `WorkerProfile`.

**WorkerProfile** (`worker_profiles` table) — extends Profile for workers. Holds `Categories` (text[]), `StripeAccountId`, `AverageRating`, `TotalReviews`.

**Job** (`jobs` table) — created by a client. Has `JobStatus` (Open → Bidding → Accepted → InProgress → Completed | Cancelled | Disputed), `JobCategory` enum (PostgreSQL native enum), `StripePaymentIntentId`, and `AcceptedBidId`.

**Bid** (`bids` table) — worker submits against a job. Has `BidStatus` (Pending → Accepted | Rejected). Unique index on `(job_id, worker_id)`.

**Review** (`reviews` table) — client reviews worker after job completion. Unique index on `(job_id, reviewer_id)`. Submitting a review updates `WorkerProfile.AverageRating` inline.

**Notification** (`notifications` table) — in-app notification record. Delivery via Expo Push API (`https://exp.host/--/api/v2/push/send`) using `ExpoPushToken`.

**Enums:** `JobStatus`, `JobCategory` (PostgreSQL native enums), `BidStatus` (stored as lowercase string).

## Key Business Flows

**Job lifecycle:**
1. Client creates job (status: Open)
2. Workers submit bids (status: Bidding)
3. Client accepts bid → job moves to Accepted; other bids rejected; push notification sent to worker
4. Job moves to InProgress; client creates Stripe PaymentIntent (10% platform fee via Stripe Connect)
5. Job completed; client submits review; `WorkerProfile.AverageRating` recalculated

**Stripe Connect onboarding:**
- Worker requests onboard link → API creates Stripe Express account → stores `StripeAccountId` on `WorkerProfile` → returns Stripe hosted onboarding URL

**Push notifications:**
- Triggered as MediatR commands (`SendPushNotificationCommand` in `backend/HandyLink.Core/Commands/`)
- Handler calls Expo Push HTTP API fire-and-forget (errors logged, not propagated)

## Frontend Architecture

React + Vite SPA. Auth state managed in `AuthContext` (`frontend/src/context/AuthContext.jsx`) via Supabase JS SDK. API calls via `axiosClient` (`frontend/src/api/axiosClient.js`) — Supabase session token injected as Bearer header; 401 redirects to `/login`.

## Mobile Architecture

React Native + Expo Router. File-based routing with role-based route groups:
- `mobile/app/(auth)/` — login, register
- `mobile/app/(client)/` — post-job, job-detail, browse-workers, notifications, profile
- `mobile/app/(worker)/` — browse, my-bids, notifications, profile

Root layout (`mobile/app/_layout.tsx`) checks Supabase session on mount and routes to `/(auth)/login` or role-appropriate group. Providers: `StripeProvider`, `QueryClientProvider`. API calls via `mobile/services/api.ts` — same Axios + Supabase token interceptor pattern as frontend.

---

_Architecture analysis: 2026-03-29_
