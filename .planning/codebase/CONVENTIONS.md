# Coding Conventions
_Last updated: 2026-03-29_

## Summary
HandyLink is a multi-layer, multi-platform project spanning a C# ASP.NET Core backend (VSA + CQRS via MediatR), a React/Vite frontend (JavaScript/JSX), and a React Native/Expo mobile app (TypeScript). Each layer has distinct conventions. The backend is the most convention-bound; the frontend is lighter with minimal tooling config.

---

## Backend (C# / ASP.NET Core)

### Naming Patterns

**Projects:**
- `PascalCase` with `HandyLink.` prefix: `HandyLink.API`, `HandyLink.Core`, `HandyLink.Infrastructure`, `HandyLink.Tests`

**Namespaces:**
- Mirror folder structure: `HandyLink.API.Features.Jobs.CreateJob`, `HandyLink.Core.Entities`, `HandyLink.Infrastructure.Repositories`

**Classes:**
- `PascalCase`: `CreateJobHandler`, `GlobalExceptionMiddleware`, `ValidationBehaviour`
- Feature slice classes: `{Action}{Artifact}` — e.g., `CreateJobCommand`, `CreateJobHandler`, `CreateJobValidator`, `CreateJobResponse`

**Records (Commands/Queries/Responses):**
- Commands: `{Action}Command` (mutating) — `CreateJobCommand`, `SubmitBidCommand`
- Queries: `{Action}Query` (read-only) — `GetJobsQuery`, `GetJobByIdQuery`
- Responses: `{Action}Response` — `CreateJobResponse`, `AcceptBidResponse`
- All implemented as C# `record` types with positional parameters

**Methods:**
- `PascalCase` with descriptive async suffix: `Handle`, `InvokeAsync`, `SeedUsersAsync`

**Properties:**
- `PascalCase` on all entity and DTO properties: `ClientId`, `BudgetMin`, `CreatedAt`

**Variables:**
- `camelCase` for locals: `opts`, `ctx`, `failures`, `otherBids`

### Feature Slice Structure (VSA + CQRS — mandatory for Phase 3.5+)

Every feature lives under `backend/HandyLink.API/Features/{Domain}/{Action}/` with exactly four files:

```
Features/
└── Jobs/
    └── CreateJob/
        ├── CreateJobCommand.cs    — input record implements IRequest<CreateJobResponse>
        ├── CreateJobHandler.cs    — implements IRequestHandler<CreateJobCommand, CreateJobResponse>
        ├── CreateJobValidator.cs  — extends AbstractValidator<CreateJobCommand>
        └── CreateJobResponse.cs  — output record (positional parameters)
```

- Query slices use `{Action}Query.cs` instead of `{Action}Command.cs`
- Some slices omit `{Action}Validator.cs` when no validation rules are needed (e.g., `GetJobById` has a validator; `Payments/CreatePaymentIntent` omits one)
- `Response` records use positional constructor syntax throughout

### Controller Pattern

Controllers are thin — they only call `mediator.Send()`:

```csharp
// backend/HandyLink.API/Controllers/JobsController.cs
[Route("api/jobs")]
[Authorize]
public class JobsController(IMediator mediator) : BaseController
{
    [HttpPost]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobDto dto, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateJobCommand(
            GetUserId(), dto.Title, ...
        ), ct);
        return CreatedAtAction(nameof(GetJobById), new { id = result.Id }, result);
    }
}
```

- All controllers extend `BaseController` (`backend/HandyLink.API/Controllers/BaseController.cs`)
- User identity always extracted via `GetUserId()` (never from request body)
- Route pattern: `[Route("api/{resource}")]` on the class, HTTP verb attributes on methods

### Error Handling Pattern

Domain errors are thrown as typed exceptions from `HandyLink.Core.Exceptions`:
- `NotFoundException` → 404
- `ForbiddenException` → 403
- `ConflictException` → 409
- `ValidationException` → 400 (also auto-thrown by `ValidationBehaviour`)

`GlobalExceptionMiddleware` (`backend/HandyLink.API/Middleware/GlobalExceptionMiddleware.cs`) catches all and returns `{ "error": "...", "statusCode": N }`.

Inline throw pattern used in handlers:
```csharp
var bid = await context.Bids.FirstOrDefaultAsync(...)
    ?? throw new NotFoundException("Bid not found.");
```

### Validation Pattern

FluentValidation validators wired via MediatR pipeline (`ValidationBehaviour.cs`). Validators run automatically before handlers:

```csharp
public class CreateJobValidator : AbstractValidator<CreateJobCommand>
{
    public CreateJobValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MinimumLength(5).MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MinimumLength(10);
    }
}
```

### Entity Design

- Plain C# classes in `backend/HandyLink.Core/Entities/`
- All entities use `Guid Id`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
- Navigation properties initialized to `null!` or empty collections (`[]`)
- Enums in `backend/HandyLink.Core/Entities/Enums/` (one file per enum)

### Legacy Services (Phase 3 remnants)

`backend/HandyLink.Core/Services/` still contains service classes (`JobService`, `BidService`, etc.) from Phase 3. These are NOT to be used for new features. After Phase 3.5, use Handlers only.

---

## Frontend (React / Vite / JavaScript)

### Naming Patterns

**Files:**
- Pages: `PascalCase` with `Page` suffix — `JobsPage.jsx`, `LoginPage.jsx`, `PostJobPage.jsx`
- Components: `PascalCase` — `JobCard.jsx`, `NavBar.jsx`, `ProtectedRoute.jsx`
- Context: `PascalCase` with `Context` suffix — `AuthContext.jsx`
- API/utilities: `camelCase` — `axiosClient.js`

**Functions/Components:**
- React components: `PascalCase` default exports — `export default function JobCard({ job })`
- Hooks/helpers: `camelCase` — `useAuth`, `loadProfile`, `timeAgo`

### ESLint Config

`frontend/eslint.config.js` uses flat config (ESLint 9):
- `js.configs.recommended`
- `reactHooks.configs.flat.recommended`
- `reactRefresh.configs.vite`
- Custom rule: `no-unused-vars` errors unless variable matches `^[A-Z_]`
- Target files: `**/*.{js,jsx}` (no TypeScript)

### Import Style

No path aliases configured. Relative imports used throughout:
```js
import { useAuth } from '../context/AuthContext'
import axiosClient from '../api/axiosClient'
```

### State Management

- Local state: `useState`
- Server state: `@tanstack/react-query` (present in `package.json`, not confirmed in all pages)
- Auth state: `AuthContext` via `useAuth()` hook
- Forms: `react-hook-form` + `zod` for validation

---

## Mobile (React Native / Expo Router / TypeScript)

### Naming Patterns

**Files:**
- Expo Router screens: `kebab-case` — `job-detail.tsx`, `post-job.tsx`, `browse-workers.tsx`
- Layout files: `_layout.tsx` (Expo Router convention)
- Route groups: `(auth)`, `(client)`, `(worker)` — parentheses denote Expo Router groups

### TypeScript

TypeScript is used throughout the mobile app (`.tsx` files). No `tsconfig.json` customizations confirmed beyond defaults.

---

## Cross-Cutting Rules

1. Never add Service classes after Phase 3.5 — use MediatR Handlers only
2. Never read `userId` from request body — always from JWT via `GetUserId()`
3. Never hardcode secrets — environment variables only
4. Database schema is managed via SQL scripts in `backend/Data/Migrations/` — never via EF migrations
5. CORS is intentionally permissive (`AllowAll`) pending production restriction
