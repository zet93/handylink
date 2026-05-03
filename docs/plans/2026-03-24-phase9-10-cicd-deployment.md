# Phase 9 + 10: CI/CD & Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GitHub Actions CI pipelines for backend, frontend, and mobile; add a Dockerfile for Render deployment; wire Render's PORT env var; and create a Postman collection.

**Architecture:** Three independent workflow files (one per layer) under `.github/workflows/`. The backend workflow runs unit tests then triggers a Render deploy hook on merge to main. The frontend workflow runs Vitest + Vite build. The mobile workflow type-checks TypeScript and triggers an EAS preview build. The Dockerfile is a standard multi-stage .NET 10 build. No E2E tests in CI.

**Tech Stack:** GitHub Actions, .NET 10 SDK, Node.js 20, EAS CLI, Docker (mcr.microsoft.com/dotnet), Postman JSON format.

---

## Task 1: Backend CI workflow

**Files:**
- Create: `.github/workflows/backend-ci.yml`

**Step 1: Create the workflow file**

```yaml
name: Backend CI

on:
  push:
    branches: [main, development]
    paths: ['backend/**']
  pull_request:
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET 10
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Restore
        run: dotnet restore
        working-directory: backend

      - name: Build
        run: dotnet build --no-restore -c Release
        working-directory: backend

      - name: Unit tests
        run: dotnet test --no-build -c Release --filter "Category!=Integration" --verbosity normal
        working-directory: backend

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: backend/**/*.trx

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deploy
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

**Step 2: Verify file exists**

```bash
ls .github/workflows/backend-ci.yml
```

Expected: file listed.

**Step 3: Commit**

```bash
git add .github/workflows/backend-ci.yml
git commit -m "ci: add backend CI workflow with unit tests and Render deploy trigger"
```

---

## Task 2: Frontend CI workflow

**Files:**
- Create: `.github/workflows/frontend-ci.yml`

**Step 1: Create the workflow file**

```yaml
name: Frontend CI

on:
  push:
    branches: [main, development]
    paths: ['frontend/**']
  pull_request:
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: Run tests
        run: npm test -- --passWithNoTests
        working-directory: frontend

      - name: Build check
        run: npm run build
        working-directory: frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.VITE_STRIPE_PUBLIC_KEY }}
```

**Step 2: Commit**

```bash
git add .github/workflows/frontend-ci.yml
git commit -m "ci: add frontend CI workflow with Vitest and Vite build check"
```

---

## Task 3: Mobile CI workflow

**Files:**
- Create: `.github/workflows/mobile-ci.yml`

**Step 1: Create the workflow file**

```yaml
name: Mobile CI

on:
  push:
    branches: [main]
    paths: ['mobile/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json

      - name: Install EAS CLI
        run: npm install -g eas-cli

      - name: Install dependencies
        run: npm ci
        working-directory: mobile

      - name: TypeScript check
        run: npx tsc --noEmit
        working-directory: mobile

      - name: EAS Preview Build
        run: eas build --platform all --profile preview --non-interactive
        working-directory: mobile
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

**Step 2: Commit**

```bash
git add .github/workflows/mobile-ci.yml
git commit -m "ci: add mobile CI workflow with TypeScript check and EAS preview build"
```

---

## Task 4: Backend Dockerfile

**Files:**
- Create: `backend/HandyLink.API/Dockerfile`

**Step 1: Create the Dockerfile**

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["HandyLink.API/HandyLink.API.csproj", "HandyLink.API/"]
COPY ["HandyLink.Core/HandyLink.Core.csproj", "HandyLink.Core/"]
COPY ["HandyLink.Infrastructure/HandyLink.Infrastructure.csproj", "HandyLink.Infrastructure/"]
RUN dotnet restore "HandyLink.API/HandyLink.API.csproj"
COPY . .
RUN dotnet publish "HandyLink.API/HandyLink.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HandyLink.API.dll"]
```

**Step 2: Commit**

```bash
git add backend/HandyLink.API/Dockerfile
git commit -m "chore: add Dockerfile for Render deployment"
```

---

## Task 5: Wire Render PORT env var in Program.cs

**Files:**
- Modify: `backend/HandyLink.API/Program.cs`

**Step 1: Add PORT wiring**

In `Program.cs`, add this line immediately after `var builder = WebApplication.CreateBuilder(args);` (line 15):

```csharp
builder.WebHost.UseUrls(
    $"http://0.0.0.0:{Environment.GetEnvironmentVariable("PORT") ?? "8080"}");
```

**Step 2: Build to verify no compile errors**

```bash
cd backend && dotnet build
```

Expected: `Build succeeded.`

**Step 3: Commit**

```bash
git add backend/HandyLink.API/Program.cs
git commit -m "chore: read PORT env var for Render hosting"
```

---

## Task 6: Postman collection

**Files:**
- Create: `postman/HandyLink.postman_collection.json`

**Step 1: Create the directory and collection file**

```json
{
  "info": {
    "name": "HandyLink API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "base_url", "value": "http://localhost:5272" },
    { "key": "jwt_token", "value": "" },
    { "key": "job_id", "value": "" },
    { "key": "bid_id", "value": "" },
    { "key": "worker_id", "value": "" }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Dev Token",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/dev-token"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.environment.set('jwt_token', pm.response.json().token);"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "Jobs",
      "item": [
        {
          "name": "List Jobs",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/jobs",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        },
        {
          "name": "Create Job",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/jobs",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Fix leaking pipe\",\n  \"description\": \"Kitchen sink leaks under cabinet\",\n  \"category\": \"Plumbing\",\n  \"city\": \"Bucharest\",\n  \"budgetMin\": 50,\n  \"budgetMax\": 200\n}",
              "options": { "raw": { "language": "json" } }
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) { pm.environment.set('job_id', pm.response.json().id); }"
                ]
              }
            }
          ]
        },
        {
          "name": "Get Job by ID",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/jobs/{{job_id}}",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        },
        {
          "name": "Update Job Status",
          "request": {
            "method": "PATCH",
            "url": "{{base_url}}/api/jobs/{{job_id}}/status",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] },
            "body": {
              "mode": "raw",
              "raw": "{ \"status\": \"InProgress\" }",
              "options": { "raw": { "language": "json" } }
            }
          }
        }
      ]
    },
    {
      "name": "Bids",
      "item": [
        {
          "name": "Submit Bid",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/jobs/{{job_id}}/bids",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"priceEstimate\": 150,\n  \"message\": \"I can fix this within 2 hours.\"\n}",
              "options": { "raw": { "language": "json" } }
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) { pm.environment.set('bid_id', pm.response.json().id); }"
                ]
              }
            }
          ]
        },
        {
          "name": "Accept Bid",
          "request": {
            "method": "PATCH",
            "url": "{{base_url}}/api/bids/{{bid_id}}/accept",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        },
        {
          "name": "Reject Bid",
          "request": {
            "method": "PATCH",
            "url": "{{base_url}}/api/bids/{{bid_id}}/reject",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        }
      ]
    },
    {
      "name": "Reviews",
      "item": [
        {
          "name": "Create Review",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/reviews",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"jobId\": \"{{job_id}}\",\n  \"workerId\": \"{{worker_id}}\",\n  \"rating\": 5,\n  \"comment\": \"Excellent work!\"\n}",
              "options": { "raw": { "language": "json" } }
            }
          }
        }
      ]
    },
    {
      "name": "Payments",
      "item": [
        {
          "name": "Create Payment Intent",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/payments/create-intent",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] },
            "body": {
              "mode": "raw",
              "raw": "{ \"jobId\": \"{{job_id}}\" }",
              "options": { "raw": { "language": "json" } }
            }
          }
        },
        {
          "name": "Connect Onboard",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/payments/connect-onboard",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        }
      ]
    },
    {
      "name": "Workers",
      "item": [
        {
          "name": "List Workers",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/workers",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        },
        {
          "name": "Get Worker by ID",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/workers/{{worker_id}}",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/users/me",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] }
          }
        },
        {
          "name": "Update Profile",
          "request": {
            "method": "PUT",
            "url": "{{base_url}}/api/users/me",
            "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt_token}}" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"displayName\": \"John Doe\",\n  \"bio\": \"Experienced plumber\"\n}",
              "options": { "raw": { "language": "json" } }
            }
          }
        }
      ]
    }
  ]
}
```

**Step 2: Commit**

```bash
git add postman/HandyLink.postman_collection.json
git commit -m "chore: add Postman collection for all API endpoints"
```

---

## GitHub Secrets Required (manual — set in repo Settings → Secrets → Actions)

| Secret | Where used |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | backend-ci.yml deploy job |
| `VITE_API_URL` | frontend-ci.yml build step |
| `VITE_SUPABASE_URL` | frontend-ci.yml build step |
| `VITE_SUPABASE_ANON_KEY` | frontend-ci.yml build step |
| `VITE_STRIPE_PUBLIC_KEY` | frontend-ci.yml build step |
| `EXPO_TOKEN` | mobile-ci.yml EAS build step |

These cannot be automated — set them manually in GitHub repo settings before the workflows will fully succeed.
