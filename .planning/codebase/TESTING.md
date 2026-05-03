# Testing Patterns
_Last updated: 2026-03-29_

## Summary
HandyLink has three test layers: xUnit backend tests (unit + integration), Vitest frontend component tests, and Playwright end-to-end tests. Backend coverage is the deepest, with handler-level unit tests and HTTP-level integration tests. Frontend has spot coverage for key pages and components. E2E tests cover auth and job flows against live servers.

---

## Backend Tests (xUnit / C#)

### Framework

- **Runner:** xUnit 2.9.3
- **Assertions:** FluentAssertions 8.x (used in Feature handler tests) and xUnit built-ins `Assert.*` (used in legacy Service tests)
- **Mocking:** Moq 4.20.72
- **HTTP integration:** `Microsoft.AspNetCore.Mvc.Testing` 10.x
- **In-memory DB:** `Microsoft.EntityFrameworkCore.InMemory` 10.x
- **Coverage collector:** `coverlet.collector` 6.0.4 (no enforced threshold)
- **Project file:** `backend/HandyLink.Tests/HandyLink.Tests.csproj`

### Run Commands

```bash
dotnet test backend/                                              # Run all tests
dotnet test --filter "FullyQualifiedName~CreateJobHandlerTests"  # Run single test class
```

### Test File Organization

Tests mirror the source structure:

```
backend/HandyLink.Tests/
├── Unit/
│   ├── Entities/
│   │   └── EnumTests.cs                        — enum value smoke tests
│   ├── Features/
│   │   ├── Bids/
│   │   │   ├── AcceptBidHandlerTests.cs
│   │   │   └── SubmitBidHandlerTests.cs
│   │   ├── Jobs/
│   │   │   ├── CreateJobHandlerTests.cs
│   │   │   ├── GetJobByIdHandlerTests.cs
│   │   │   └── GetJobsHandlerTests.cs
│   │   └── Reviews/
│   │       └── CreateReviewHandlerTests.cs
│   └── Services/                               — Phase 3 legacy service tests
│       ├── BidServiceTests.cs
│       ├── JobServiceTests.cs
│       ├── ReviewServiceTests.cs
│       └── UserServiceTests.cs
└── Integration/
    ├── Controllers/
    │   ├── BidsControllerTests.cs
    │   └── JobsControllerTests.cs
    ├── Data/
    │   └── HandyLinkDbContextTests.cs
    ├── CustomWebAppFactory.cs                  — WebApplicationFactory<Program>
    ├── TestDbSeeder.cs                         — static seeding helpers
    └── TestJwtHelper.cs                        — JWT generation for auth
```

### Unit Test Pattern (Handler Tests)

Each handler test class uses a private `Build()` factory and optional `Seed()` helper:

```csharp
public class CreateJobHandlerTests
{
    private static (HandyLinkDbContext ctx, CreateJobHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new CreateJobHandler(ctx));
    }

    [Fact]
    public async Task Handle_CreatesJob_WithOpenStatus()
    {
        var (ctx, handler) = Build();
        // ... seed data, call handler, assert with FluentAssertions
        result.Status.Should().Be(JobStatus.Open);
    }
}
```

- Each test gets a fresh in-memory DB (unique `Guid.NewGuid().ToString()` name)
- Handlers with `IMediator` dependency receive a `new Mock<IMediator>().Object`
- Seed helpers (`Seed()`) are private static methods within the test class

### Unit Test Naming Convention

`{Method}_{Outcome}_{Condition}`:
- `Handle_CreatesJob_WithOpenStatus`
- `Handle_ThrowsNotFoundException_WhenJobMissing`
- `Handle_ThrowsConflictException_WhenDuplicateBid`
- `Handle_TransitionsJobToBidding_WhenJobWasOpen`

### Integration Test Pattern (Controller Tests)

Controllers are tested via `WebApplicationFactory` with the real DI container and an in-memory database substituted:

```csharp
public class JobsControllerTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return client;
    }

    [Fact]
    public async Task PostJob_Returns201_WithValidBody()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var http = AuthClient(client.Id);
        var response = await http.PostAsJsonAsync("/api/jobs", body);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
```

**Infrastructure helpers:**
- `CustomWebAppFactory` (`backend/HandyLink.Tests/Integration/CustomWebAppFactory.cs`) — replaces DB with in-memory, injects test config values for Supabase/Stripe keys
- `TestDbSeeder` (`backend/HandyLink.Tests/Integration/TestDbSeeder.cs`) — static methods `SeedUsersAsync(sp)` and `SeedJobAsync(sp, clientId)` for seeding via `IServiceProvider`
- `TestJwtHelper` (`backend/HandyLink.Tests/Integration/TestJwtHelper.cs`) — generates HS256 JWT tokens with a test secret that matches factory config

### What Backend Tests Cover

| Area | Coverage |
|------|----------|
| `CreateJob` handler | Full (status, persistence) |
| `GetJobs` handler | Pagination, category filter |
| `GetJobById` handler | 200 exists, 404 missing |
| `SubmitBid` handler | Not-found, completed job, duplicate, status transitions |
| `AcceptBid` handler | Not-found, forbidden, status transitions, other bids rejected |
| `CreateReview` handler | Not-found, wrong status, forbidden, duplicate, rating calculation |
| `JobsController` (HTTP) | GET 200/401, POST 201/401, GET by ID 200/404 |
| `BidsController` (HTTP) | POST 201, 404, 409 |
| `HandyLinkDbContext` (integration) | Profile CRUD, Job linked to Profile |
| Enums | Smoke tests for `JobCategory` and `JobStatus` values |
| Legacy Services | `JobService`, `BidService`, `ReviewService`, `UserService` |

### What Backend Tests Do NOT Cover

- `PaymentsController` / Stripe webhook handler — no tests exist
- `NotificationsController` / `SendPushNotification` handler — no tests exist
- `WorkerConnectOnboard` handler — no tests exist
- `UsersController`, `WorkersController` — no tests exist
- `ReviewsController` HTTP layer — no controller integration test
- `ValidationBehaviour` pipeline — tested indirectly via integration tests, not directly
- `GlobalExceptionMiddleware` — tested indirectly, not directly

---

## Frontend Tests (Vitest / React Testing Library)

### Framework

- **Runner:** Vitest 4.x
- **DOM environment:** jsdom 29.x (configured in `frontend/vite.config.js`)
- **Assertion library:** `@testing-library/jest-dom` 6.x (imported via `frontend/src/test/setup.js`)
- **Render/query:** `@testing-library/react` 16.x
- **User interactions:** `@testing-library/user-event` 14.x
- **Mocking:** Vitest built-in `vi.mock`, `vi.fn()`

### Config

`frontend/vite.config.js` embeds the test config:
```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.js'],
}
```

Setup file (`frontend/src/test/setup.js`) imports `@testing-library/jest-dom` only.

### Run Commands

```bash
npm run test          # from frontend/ — runs vitest run (single pass)
npm run test:watch    # from frontend/ — runs vitest (watch mode)
```

### Test File Organization

Co-located with source files, `.test.jsx` suffix:

```
frontend/src/
├── components/
│   └── JobCard.test.jsx
└── pages/
    ├── LoginPage.test.jsx
    └── PostJobPage.test.jsx
```

### Frontend Test Pattern

```jsx
// Render helper pattern
const renderCard = (job = mockJob) =>
  render(<MemoryRouter><JobCard job={job} /></MemoryRouter>)

test('renders job title', () => {
  renderCard()
  expect(screen.getByText('Fix leaky sink')).toBeInTheDocument()
})
```

**Mocking pattern for modules:**
```jsx
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}))

beforeEach(() => { vi.clearAllMocks() })
```

**HTTP mocking:** `axiosClient` is mocked as a module: `vi.mock('../api/axiosClient', () => ({ default: { post: vi.fn() } }))`

### What Frontend Tests Cover

| File | What's tested |
|------|--------------|
| `JobCard.test.jsx` | Title render, category badge, city/country, bid count display |
| `LoginPage.test.jsx` | Input rendering, signIn call with credentials, navigation on success, error display |
| `PostJobPage.test.jsx` | Form field render, validation error on empty submit, API call + navigation on valid submit |

### What Frontend Tests Do NOT Cover

- Most pages are untested: `JobsPage`, `JobDetailPage`, `WorkerBrowsePage`, `MyJobsPage`, `RegisterPage`, `EditProfilePage`, `NotificationsPage`, `LandingPage`
- `AuthContext` itself — not tested
- `NavBar`, `ProtectedRoute`, `PaymentForm`, `PasswordGate` components — not tested
- `axiosClient` configuration — not tested
- React Query data-fetching hooks — not tested

---

## E2E Tests (Playwright)

### Framework

- **Runner:** Playwright
- **Config:** `e2e/playwright.config.ts`
- **Browser:** Chromium only
- **Base URL:** `http://localhost:5173`
- **Mode:** headless, `fullyParallel: true`, `retries: 0`

### Config

```ts
// e2e/playwright.config.ts
webServer: [
  { command: 'npm run dev', url: 'http://localhost:5173', cwd: '../frontend' },
  { command: 'dotnet run --project HandyLink.API', url: 'http://localhost:5272/health', cwd: '../backend' },
]
```

Playwright spins up both frontend and backend dev servers before running. Auth state is persisted to `e2e/.auth/client-user.json` via a setup project (`e2e/fixtures/auth.setup.ts`).

### Test Files

```
e2e/
├── fixtures/
│   └── auth.setup.ts        — logs in and saves storageState
└── tests/
    ├── auth.spec.ts          — auth redirect, wrong password error
    └── jobs.spec.ts          — jobs page load, post job form, validation error
```

### E2E Test Pattern

```ts
test('unauthenticated user is redirected to /login', async ({ page }) => {
  await page.goto('/jobs');
  await expect(page).toHaveURL(/\/login/);
});

test('client can post a new job', async ({ page }) => {
  await page.goto('/post-job');
  await page.getByLabel(/title/i).fill('Fix electrical panel');
  // ...
  await page.getByRole('button', { name: /post job/i }).click();
  await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 5000 });
});
```

Auth tests explicitly opt out of stored auth state:
```ts
test.use({ storageState: { cookies: [], origins: [] } });
```

### What E2E Tests Cover

- Unauthenticated redirect to `/login`
- Login form shows error for wrong credentials
- Jobs page loads without error
- Posting a new job form (valid flow)
- Post job validation error for short title

### What E2E Tests Do NOT Cover

- Worker flows (bidding, accepting jobs)
- Payments / Stripe integration
- Mobile app (no mobile E2E)
- Review submission

---

## Coverage Summary

| Layer | Estimated Coverage | Gaps |
|-------|--------------------|------|
| Backend handlers | ~70% of implemented features | Payments, Notifications, Workers |
| Backend services (legacy) | ~60% | UserService edge cases |
| Backend controllers (HTTP) | Jobs, Bids only | Reviews, Payments, Users, Workers |
| Frontend components/pages | ~15% (3 of ~20 files) | Most pages untested |
| E2E | Core happy paths only | Worker flows, payments |

No enforced coverage threshold exists in any configuration.
