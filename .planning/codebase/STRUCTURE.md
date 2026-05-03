# Codebase Structure

_Last updated: 2026-03-29_

## Summary

HandyLink is a monorepo with three independent applications (backend, frontend, mobile) plus shared tooling directories. There is no shared package between frontend and mobile — they duplicate patterns independently. The backend is a multi-project .NET solution; the frontend and mobile are separate npm workspaces.

## Directory Layout

```
handylink/
├── backend/                        # ASP.NET Core 10 solution
│   ├── HandyLink.API/              # Entry point, controllers, VSA features, middleware
│   ├── HandyLink.Core/             # Entities, interfaces, exceptions, legacy services
│   ├── HandyLink.Infrastructure/   # EF Core DbContext, repository implementations
│   ├── HandyLink.Tests/            # Unit and integration tests
│   └── Data/
│       └── Migrations/             # SQL scripts run manually via Supabase SQL editor
├── frontend/                       # React + Vite SPA
│   └── src/
│       ├── api/                    # axiosClient.js, supabase.js
│       ├── assets/                 # Static images/icons
│       ├── components/             # Shared UI components
│       ├── context/                # AuthContext (React Context for auth state)
│       ├── hooks/                  # Custom React hooks
│       ├── lib/                    # supabase.js client singleton
│       ├── pages/                  # Route-level page components + page tests
│       └── test/                   # Test utilities/setup
├── mobile/                         # React Native + Expo Router
│   ├── app/
│   │   ├── (auth)/                 # Login, register routes
│   │   ├── (client)/               # Client-role tab routes
│   │   ├── (worker)/               # Worker-role tab routes
│   │   └── _layout.tsx             # Root layout — auth guard + providers
│   ├── assets/                     # Images/fonts
│   ├── hooks/                      # Custom RN hooks
│   └── services/                   # api.ts (axios), supabase.ts, notifications.ts
├── e2e/                            # Playwright end-to-end tests
│   ├── tests/                      # Test spec files
│   ├── fixtures/                   # Test fixtures
│   └── .auth/                      # Saved auth state for test sessions
├── docs/
│   └── plans/                      # Phase planning documents
├── postman/                        # Postman collection for API testing
├── .planning/
│   └── codebase/                   # GSD codebase mapping documents (this dir)
├── .github/
│   └── workflows/                  # CI/CD GitHub Actions
└── .claude/
    ├── commands/                   # Custom Claude slash commands
    ├── hooks/                      # Claude hook scripts
    └── skills/                     # GSD skill definitions
```

## Backend Project Structure

### `backend/HandyLink.API/`

Entry point and web layer. Contains everything needed to handle HTTP requests.

```
HandyLink.API/
├── Program.cs                      # DI registration, middleware pipeline, startup
├── Controllers/
│   ├── BaseController.cs           # Abstract base; exposes GetUserId() from JWT
│   ├── JobsController.cs
│   ├── BidsController.cs
│   ├── ReviewsController.cs
│   ├── PaymentsController.cs
│   ├── NotificationsController.cs
│   ├── UsersController.cs
│   └── WorkersController.cs
├── Features/                       # VSA feature slices (Phase 3.5+)
│   ├── Bids/
│   │   ├── AcceptBid/              # AcceptBidCommand, Handler, Validator, Response
│   │   └── SubmitBid/
│   ├── Jobs/
│   │   ├── CreateJob/
│   │   ├── GetJobById/
│   │   └── GetJobs/
│   ├── Notifications/
│   │   └── SendPushNotification/   # Fires Expo push API; no Validator (internal cmd)
│   ├── Payments/
│   │   ├── CreatePaymentIntent/
│   │   ├── HandleStripeWebhook/
│   │   └── WorkerConnectOnboard/
│   └── Reviews/
│       └── CreateReview/
├── Behaviours/
│   └── ValidationBehaviour.cs      # MediatR pipeline: runs FluentValidation before handler
├── Extensions/
│   └── ClaimsPrincipalExtensions.cs  # GetSupabaseUserId() — reads sub/NameIdentifier claim
└── Middleware/
    └── GlobalExceptionMiddleware.cs  # Maps domain exceptions to HTTP status codes
```

### `backend/HandyLink.Core/`

Domain layer — no dependencies on web or infrastructure projects.

```
HandyLink.Core/
├── Entities/
│   ├── Profile.cs
│   ├── WorkerProfile.cs
│   ├── Job.cs
│   ├── Bid.cs
│   ├── Review.cs
│   ├── Notification.cs
│   └── Enums/
│       ├── JobStatus.cs            # Open/Bidding/Accepted/InProgress/Completed/Cancelled/Disputed
│       ├── JobCategory.cs          # PostgreSQL native enum
│       └── BidStatus.cs            # Pending/Accepted/Rejected
├── Interfaces/
│   ├── IJobRepository.cs
│   ├── IBidRepository.cs
│   ├── IReviewRepository.cs
│   ├── IWorkerRepository.cs
│   ├── IProfileRepository.cs
│   └── INotificationRepository.cs
├── Commands/
│   └── SendPushNotificationCommand.cs  # Cross-cutting MediatR command (used by handlers)
├── Exceptions/
│   ├── NotFoundException.cs
│   ├── ForbiddenException.cs
│   ├── ConflictException.cs
│   └── ValidationException.cs
├── Services/                       # Legacy Phase 3 services (NotificationService, UserService, etc.)
│   ├── NotificationService.cs
│   ├── UserService.cs
│   ├── JobService.cs
│   ├── BidService.cs
│   ├── ReviewService.cs
│   └── WorkerService.cs
└── DTOs/                           # Request/response DTOs used by legacy service layer
```

### `backend/HandyLink.Infrastructure/`

Data access layer.

```
HandyLink.Infrastructure/
├── Data/
│   ├── HandyLinkDbContext.cs        # EF Core DbContext; all entity configurations inline
│   ├── DataSeeder.cs                # Seeds dev data on startup if env is Development
│   └── Migrations/                  # EF migrations folder (not used — see Data/Migrations/)
└── Repositories/
    ├── JobRepository.cs
    ├── BidRepository.cs
    ├── ReviewRepository.cs
    ├── WorkerRepository.cs
    ├── ProfileRepository.cs
    └── NotificationRepository.cs
```

### `backend/HandyLink.Tests/`

```
HandyLink.Tests/
├── Unit/
│   ├── Features/
│   │   ├── Jobs/                   # CreateJobHandlerTests, GetJobsHandlerTests, etc.
│   │   ├── Bids/
│   │   └── Reviews/
│   ├── Entities/                   # Entity-level unit tests
│   └── Services/                   # Legacy service unit tests
└── Integration/
    ├── Controllers/                # HTTP-level integration tests via WebApplicationFactory
    └── Data/                       # Data layer integration tests
```

### `backend/Data/Migrations/`

Plain SQL scripts applied manually via the Supabase SQL editor. Do NOT use `dotnet ef database update`. Current scripts: `add_expo_push_token.sql`.

## Frontend Structure (`frontend/src/`)

| Path | Purpose |
|---|---|
| `api/axiosClient.js` | Axios instance; injects Supabase Bearer token on every request; redirects on 401 |
| `api/supabase.js` | Supabase JS client initialization |
| `lib/supabase.js` | Secondary Supabase client used by AuthContext |
| `context/AuthContext.jsx` | React Context: session, user, userProfile, signIn, signUp, signOut |
| `components/NavBar.jsx` | Site navigation |
| `components/ProtectedRoute.jsx` | Route guard component |
| `components/JobCard.jsx` | Reusable job listing card |
| `components/PaymentForm.jsx` | Stripe Elements payment form |
| `components/PasswordGate.jsx` | Private beta password gate |
| `pages/` | One file per route; some have co-located `.test.jsx` files |
| `hooks/` | Custom React hooks |

## Mobile Structure (`mobile/`)

| Path | Purpose |
|---|---|
| `app/_layout.tsx` | Root layout: Supabase session check, role-based routing, StripeProvider + QueryClientProvider |
| `app/(auth)/login.tsx` | Login screen |
| `app/(auth)/register.tsx` | Registration screen |
| `app/(client)/index.tsx` | Client home |
| `app/(client)/post-job.tsx` | Post a new job |
| `app/(client)/job-detail.tsx` | Job detail + bid management |
| `app/(client)/browse-workers.tsx` | Search workers |
| `app/(client)/notifications.tsx` | In-app notifications |
| `app/(client)/profile.tsx` | Client profile |
| `app/(worker)/browse.tsx` | Worker job browsing |
| `app/(worker)/my-bids.tsx` | Worker bid management |
| `app/(worker)/notifications.tsx` | In-app notifications |
| `app/(worker)/profile.tsx` | Worker profile + Stripe onboarding |
| `services/api.ts` | Axios instance; injects Supabase Bearer token |
| `services/supabase.ts` | Supabase JS client for mobile |
| `services/notifications.ts` | Expo push notification registration + handlers |
| `hooks/` | Custom RN hooks |

## Naming Conventions

**Backend:**
- Feature files: `{Action}{Command|Query|Handler|Validator|Response}.cs` (e.g., `CreateJobHandler.cs`)
- Entities: PascalCase class names matching table names in snake_case (mapped in `OnModelCreating`)
- Controllers: `{Domain}Controller.cs`

**Frontend:**
- Pages: `{Name}Page.jsx` (PascalCase)
- Components: PascalCase JSX files (`JobCard.jsx`)
- Hooks: camelCase with `use` prefix

**Mobile:**
- Route files: kebab-case (`post-job.tsx`, `my-bids.tsx`)
- Layout files: `_layout.tsx`

## Where to Add New Code

**New backend feature (Phase 3.5+ rule):**
- Create folder: `backend/HandyLink.API/Features/{Domain}/{Action}/`
- Add four files: `{Action}Command.cs`, `{Action}Handler.cs`, `{Action}Validator.cs`, `{Action}Response.cs`
- Add route to relevant controller in `backend/HandyLink.API/Controllers/`
- Do NOT create a Service class

**New entity:**
- Entity: `backend/HandyLink.Core/Entities/{Entity}.cs`
- Repository interface: `backend/HandyLink.Core/Interfaces/I{Entity}Repository.cs`
- Repository impl: `backend/HandyLink.Infrastructure/Repositories/{Entity}Repository.cs`
- EF config: inline in `backend/HandyLink.Infrastructure/Data/HandyLinkDbContext.cs` `OnModelCreating`
- Schema change: SQL script in `backend/Data/Migrations/`

**New domain exception:**
- `backend/HandyLink.Core/Exceptions/{Name}Exception.cs`
- Add mapping case to `backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs`

**New frontend page:**
- `frontend/src/pages/{Name}Page.jsx`
- Add route in `frontend/src/App.jsx` (or equivalent router config)

**New mobile route:**
- `mobile/app/(client|worker)/{route-name}.tsx` for role-specific, or `mobile/app/{route-name}.tsx` for shared

**Database schema change:**
- Write SQL script in `backend/Data/Migrations/`
- Apply via Supabase SQL editor
- Never run `dotnet ef migrations add` or `dotnet ef database update`

---

_Structure analysis: 2026-03-29_
