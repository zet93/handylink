# 🔧 HandyLink — Project Plan v2
### A Marketplace for Local Tradespeople (Electricians, Plumbers, Painters, etc.)

> **Stack at a glance:** ASP.NET Core 10 API · React.js (Web) · React Native/Expo (iOS & Android) · Supabase (PostgreSQL + Auth + Storage) · Stripe (Payments) · Vercel (Frontend) · Render (Backend) · GitHub Actions (CI/CD)
> **Claude Code tooling:** CLAUDE.md · Skills · Hooks · Context7 MCP · GitHub MCP · PostgreSQL MCP · VS Code Extension

---

## 📋 Table of Contents

0. [Phase 0 — Claude Code Tooling Setup](#phase-0--claude-code-tooling-setup) ← **Do this before anything else**
1. [App Vision & Feature Scope](#1-app-vision--feature-scope)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack Decisions](#3-technology-stack-decisions)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Phase 1 — Repository & Project Setup](#phase-1--repository--project-setup)
6. [Phase 2 — Database Design (Supabase)](#phase-2--database-design-supabase)
7. [Phase 3 — Backend API: Clean Architecture](#phase-3--backend-api-clean-architecture)
8. [Phase 3.5 — Migration to VSA + CQRS](#phase-35--migration-to-vsa--cqrs)
9. [Phase 4 — Authentication (Supabase Auth)](#phase-4--authentication-supabase-auth)
10. [Phase 5 — Web Frontend (React + Vite)](#phase-5--web-frontend-react--vite)
11. [Phase 6 — Mobile App (React Native / Expo)](#phase-6--mobile-app-react-native--expo)
12. [Phase 7 — Payment Integration (Stripe)](#phase-7--payment-integration-stripe)
13. [Phase 8 — Automated Testing](#phase-8--automated-testing)
14. [Phase 9 — CI/CD (GitHub Actions)](#phase-9--cicd-github-actions)
15. [Phase 10 — Deployment](#phase-10--deployment)
16. [Postman Collection Guide](#postman-collection-guide)
17. [Security Checklist](#security-checklist)
18. [Free Tier Limits Reference](#free-tier-limits-reference)

---

## Phase 0 — Claude Code Tooling Setup

> ⚠️ **Do this before writing a single line of code.** This phase takes ~30 minutes and saves hours of rework. Without it, Claude Code doesn't know your architecture rules, your forbidden patterns, or your project structure — and will make decisions that contradict everything in the rest of this plan.

### Why Day 1?

Think of Claude Code like a new contractor. If you only explain your building standards on week 3, three walls are already built wrong. CLAUDE.md and hooks are that onboarding conversation — the earlier it happens, the less rework. Specifically for HandyLink, without early setup Claude will:
- Try to run `dotnet ef migrations` instead of using SQL scripts in Supabase
- Create `Service` classes instead of CQRS `Handler` classes
- Put business logic in controllers
- Not know that `GetUserId()` must come from JWT, never from the request body

Each of these mistakes compounds across sessions.

---

### 0.1 — Install Claude Code and VS Code Extension

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Sign in
claude login
```

Then in VS Code: `Ctrl+Shift+X` → search "Claude Code" → Install (Anthropic, verified publisher).

The VS Code extension gives you:
- **Inline diffs** — see exactly what Claude wants to change before accepting
- **Plan mode** — Claude explains its plan, you approve before any code is written
- **@-mention syntax** — reference specific files and line ranges: `@Handler.cs#45-60`

---

### 0.2 — Install Plugins

Install the three core plugins for this stack. Keep it to three — every active MCP server consumes context tokens and too many degrades Claude's output quality.

```bash
# 1. Context7 — live docs for ASP.NET Core 10, React, Expo, Supabase, Stripe
#    Stops Claude guessing at APIs that changed since its training cutoff
claude mcp add context7 -- npx -y @context7/mcp-server

# 2. GitHub MCP — read issues, create PRs, link commits, without leaving Claude
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# 3. PostgreSQL MCP — query Supabase directly in natural language
claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres
```

Set the required environment variables (add to your shell profile `~/.zshrc` or `~/.bashrc`):

```bash
export GITHUB_TOKEN="your_github_personal_access_token"
export SUPABASE_DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

**What each plugin unlocks:**

| Plugin | Example prompt it enables |
|---|---|
| **Context7** | "Use Context7 to check the correct ASP.NET Core 10 minimal API syntax for JWT Bearer validation" |
| **GitHub MCP** | "Read issue #12, implement the feature, run tests, and open a PR linked to that issue" |
| **PostgreSQL MCP** | "Show me all jobs posted in the last 7 days that have zero bids" |

**Optional plugins to add later** (not at the start — keep context lean):

| Plugin | When to add it |
|---|---|
| TypeScript LSP | Phase 5 — when you start writing React/Expo code (real-time type checking) |
| Chrome DevTools MCP | Phase 5 — for debugging the web UI live in your browser |
| Local-Review | Phase 8 — runs 5 parallel agents reviewing code before each commit |

---

### 0.3 — Create CLAUDE.md (Project Memory)

Create `handylink/CLAUDE.md` at the repo root. This file loads automatically at the start of **every** Claude Code session — you never have to re-explain your project.

```markdown
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

## Current phase: [UPDATE THIS LINE as you progress]

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
```

Also create `~/.claude/CLAUDE.md` (global — applies to all your projects):

```markdown
# Global Developer Preferences

## My Background
- C# .NET developer, beginner-to-intermediate level
- Comfortable with React web, learning React Native
- Prefer real-world analogies when a new pattern is introduced, then the code

## How I Like Explanations
- Analogy first, then code
- Code comments should explain WHY, not just WHAT
- XML doc comments on all public C# methods please
```

---

### 0.4 — Create Skills

Skills are reusable `.md` instruction sets that Claude reads when relevant. Two essential ones for HandyLink:

**`.claude/skills/create-feature/SKILL.md`**

```markdown
---
name: create-feature
description: Creates a complete VSA + CQRS feature slice for HandyLink.
             Trigger when asked to add a new API endpoint or backend feature.
allowed-tools: Read, Write, Edit, Bash
---

# HandyLink Feature Slice Template

When asked to create a new feature for domain {Domain}, action {Action}:

ALWAYS create ALL of these files in one response:

1. Features/{Domain}/{Action}/{Action}Command.cs
   public record {Action}Command(...) : IRequest<{Action}Response>;
   - Commands for writes, Queries for reads
   - User IDs come as parameters set by controller from JWT — never from body

2. Features/{Domain}/{Action}/{Action}Handler.cs
   public class {Action}Handler : IRequestHandler<{Action}Command, {Action}Response>
   - Inject HandyLinkDbContext (direct for reads, through handler for writes)
   - Throw: NotFoundException (404), ForbiddenException (403), ConflictException (409)

3. Features/{Domain}/{Action}/{Action}Validator.cs
   public class {Action}Validator : AbstractValidator<{Action}Command>
   - Runs automatically via ValidationBehaviour pipeline — do not call manually

4. Features/{Domain}/{Action}/{Action}Response.cs
   - Only the fields the client actually needs

5. Update controller — add one thin action:
   return Ok(await _mediator.Send(command));

6. HandyLink.Tests/Unit/Features/{Domain}/{Action}HandlerTests.cs
   - In-memory EF Core (UseInMemoryDatabase)
   - Test: happy path + NotFoundException + ForbiddenException + any validators

After generating, run: dotnet build backend/ && dotnet test backend/
```

**`.claude/skills/write-migration/SKILL.md`**

```markdown
---
name: write-migration
description: Creates a PostgreSQL migration SQL script for HandyLink.
             Trigger when asked to change the database schema.
allowed-tools: Write, Read
---

# HandyLink Migration Script

NEVER use dotnet ef migrations. All schema changes are plain SQL.

Steps:
1. Create: backend/HandyLink.Infrastructure/Data/Migrations/00{N}_{description}.sql
   (N = next number in sequence)

2. Write idempotent SQL:
   ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT FALSE;
   CREATE INDEX IF NOT EXISTS idx_jobs_urgent ON public.jobs(urgent);

3. Add header comment:
   -- Migration {N}: {description}
   -- Run in: Supabase Dashboard → SQL Editor → New Query
   -- Date: {today}

4. Remind the developer to copy and run it in the Supabase SQL editor.
```

---

### 0.5 — Create Custom Commands

Commands are invoked manually with `/command-name` in a Claude Code session.

**`.claude/commands/add-feature.md`**

```markdown
You are adding a new feature to HandyLink following the VSA + CQRS pattern.

Ask me:
1. Which domain? (Jobs / Bids / Reviews / Payments / Users / Notifications)
2. What is the action name? (e.g. CancelJob, GetJobById, MarkJobComplete)
3. Command (writes data) or Query (reads only)?

Then use the create-feature skill to generate all required files.

Finish by telling me:
- The files created (list them)
- The controller line to add
- The test cases you wrote (one-line summaries)
```

**`.claude/commands/fix-issue.md`**

```markdown
Read GitHub issue #$ARGUMENTS using the GitHub MCP server.

Then:
1. Summarise the issue in 2 sentences
2. Identify which files need to change
3. Implement the fix following HandyLink VSA + CQRS pattern
4. Run: dotnet build backend/ && dotnet test backend/
5. If tests pass: create a PR titled with the issue title,
   body explaining what changed and why, linked to issue #$ARGUMENTS
6. If tests fail: fix them first
```

Usage: `/fix-issue 23` during a session.

---

### 0.6 — Configure Hooks

Hooks fire automatically at lifecycle events — no manual invocation needed.

```bash
mkdir -p .claude/hooks
```

**`.claude/hooks/pre-bash-guard.sh`** — blocks forbidden commands:

```bash
#!/bin/bash
INPUT=$(cat)

# Block EF Core migrations
if echo "$INPUT" | grep -qE "dotnet ef (migrations add|database update)"; then
  echo '{
    "decision": "block",
    "message": "EF Core migrations are disabled on HandyLink. Write a SQL script in Data/Migrations/ and run it in the Supabase SQL editor. See .claude/skills/write-migration/SKILL.md."
  }'
  exit 0
fi

# Block committing secrets
if echo "$INPUT" | grep -qE "git add.*(appsettings|\.env)"; then
  echo '{
    "decision": "block",
    "message": "Do not git add appsettings.json or .env files — they may contain real secrets."
  }'
  exit 0
fi

echo '"{"decision": "allow"}'
```

**`.claude/hooks/post-write-format.sh`** — auto-formats .cs files after every write:

```bash
#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('path', ''))
except:
    print('')
")

if [[ "$FILE" == *.cs ]]; then
  dotnet format --include "$FILE" --verbosity quiet 2>&1
  echo '{"feedback": "C# file auto-formatted."}' 
fi
```

**`.claude/hooks/stop-check.sh`** — nudges Claude if it created a handler without a test:

```bash
#!/bin/bash
INPUT=$(cat)
RESPONSE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    print(json.load(sys.stdin).get('response', ''))
except:
    print('')
")

if echo "$RESPONSE" | grep -qi "Handler\.cs"; then
  if ! echo "$RESPONSE" | grep -qi "HandlerTests\|test"; then
    echo '{"continue": true, "feedback": "Handler was created — did you also create HandlerTests.cs in HandyLink.Tests/Unit/Features/?"}' 
    exit 0
  fi
fi
exit 0
```

Wire hooks in **`.claude/settings.json`**:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/pre-bash-guard.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/post-write-format.sh" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/stop-check.sh" }]
      }
    ]
  }
}
```

```bash
chmod +x .claude/hooks/*.sh
```

---

### 0.7 — Folder Structure After Phase 0

```
handylink/
├── CLAUDE.md                          ← Project memory       (commit to git)
├── CLAUDE.local.md                    ← Personal notes       (gitignore)
├── .mcp.json                          ← MCP server config    (commit to git)
│
└── .claude/
    ├── settings.json                  ← Hooks wiring         (commit to git)
    ├── settings.local.json            ← Personal overrides   (gitignore)
    ├── commands/
    │   ├── add-feature.md             ← /add-feature
    │   └── fix-issue.md               ← /fix-issue 42
    ├── skills/
    │   ├── create-feature/SKILL.md    ← auto-triggered for new endpoints
    │   └── write-migration/SKILL.md   ← auto-triggered for schema changes
    └── hooks/
        ├── pre-bash-guard.sh          ← blocks forbidden commands
        ├── post-write-format.sh       ← auto-formats .cs files
        └── stop-check.sh             ← checks tests exist
```

Add to `.gitignore`:
```
CLAUDE.local.md
.claude/settings.local.json
```

---

### Phase 0 Checklist

```
□ Claude Code CLI installed and signed in
□ VS Code extension installed (Anthropic, verified publisher)
□ Context7 MCP added
□ GitHub MCP added + GITHUB_TOKEN env var set
□ PostgreSQL MCP added + SUPABASE_DATABASE_URL env var set
□ handylink/CLAUDE.md created
□ ~/.claude/CLAUDE.md created (global preferences)
□ .claude/skills/create-feature/SKILL.md created
□ .claude/skills/write-migration/SKILL.md created
□ .claude/commands/add-feature.md created
□ .claude/commands/fix-issue.md created
□ .claude/hooks/ scripts created + chmod +x applied
□ .claude/settings.json created with hook wiring
□ CLAUDE.local.md + settings.local.json added to .gitignore
□ CLAUDE.md, .mcp.json, settings.json committed to git

Estimated time: ~30 minutes. Estimated time saved: 10-20 hours across the project.
```

---

## 1. App Vision & Feature Scope

### Core Concept
HandyLink is a two-sided marketplace where **Clients** post small jobs ("I need my wall painted") and **Workers** (electricians, plumbers, painters, carpenters, etc.) browse and bid on those jobs. The platform handles trust through a verified review system.

### User Roles
| Role | Capabilities |
|---|---|
| **Client** | Post jobs, view bids, accept/reject offers, pay, leave reviews |
| **Worker** | Browse jobs, submit bids with price estimate, complete jobs, receive reviews |
| **Admin** | Manage users, resolve disputes, moderate listings |

### Core Features (MVP)
- User registration + profile (both roles; a user can have both roles)
- Job posting with category (Electrical, Plumbing, Painting, Carpentry, Furniture Assembly, General)
- Geo-location tagging on jobs (city/country — global from day 1)
- Worker browsing & filtering of jobs by category and location
- Bidding system (Worker submits estimate + message)
- Bid acceptance/rejection by Client
- Job status lifecycle: `Open → Bidding → Accepted → In Progress → Completed → Reviewed`
- Star rating + text review for Workers
- Worker profile with aggregate rating, bio, portfolio photos
- Push notifications (job accepted, new bid received, etc.)
- Stripe payment flow (Client pays on job completion; Worker receives payout minus platform fee)
- Responsive web + native iOS/Android app

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│   React Web (Vercel)          React Native / Expo (App Store)    │
└─────────────────┬───────────────────────────┬────────────────────┘
                  │ HTTPS / REST              │ HTTPS / REST
                  ▼                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              ASP.NET Core 10 Web API  (Render)                   │
│                                                                  │
│  Phase 3:   Controllers → Services → Repositories → EF Core     │
│  Phase 3.5: Controllers → MediatR → Feature Handlers → EF Core  │
│                                                                  │
│  JWT validation (Supabase public key)                            │
│  Stripe webhooks endpoint                                        │
└─────────────────┬──────────────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
┌──────────────┐    ┌──────────────────────┐
│  Supabase    │    │  Stripe (Payments)   │
│  PostgreSQL  │    │  Payment Intents     │
│  Auth (JWT)  │    │  Connect (payouts)   │
│  Storage     │    └──────────────────────┘
│  Realtime    │
└──────────────┘
```

### How the JWT Flow Works (Analogy)
Think of Supabase as a **nightclub bouncer**. When a user logs in on the frontend, Supabase gives them a **wristband (JWT token)**. When that user calls your .NET API, the API checks the wristband — it doesn't need to call Supabase again, it just verifies the wristband's signature using Supabase's **public key**. This is fast, stateless, and secure.

---

## 3. Technology Stack Decisions

### Why Each Choice

| Layer | Choice | Why |
|---|---|---|
| **Backend** | ASP.NET Core 10 | You know C#; LTS until Nov 2028; best performance of any .NET release |
| **Web Frontend** | React + Vite | You know React; Vite is faster than CRA |
| **Mobile** | React Native + Expo | You already know React — same mental model; cross-platform iOS + Android |
| **Database** | Supabase (PostgreSQL) | Free 500MB, built-in auth, real-time, file storage, global CDN |
| **Auth** | Supabase Auth | Bundled with DB; 50K free MAU; handles JWT, social logins, email verification |
| **Backend Host** | Render | Free tier for web services; supports Docker; ASP.NET Core 10 works perfectly |
| **Frontend Host** | Vercel | Best free React hosting; automatic preview deploys on PR |
| **Payments** | Stripe | Industry standard; test mode is completely free; Connect for worker payouts |
| **CI/CD** | GitHub Actions | Free for public repos; integrates perfectly with GitHub |
| **Backend Pattern** | Clean Architecture → VSA + CQRS | Learn layers first, then migrate when complexity demands it |
| **CQRS Dispatcher** | MediatR | Industry standard for CQRS in .NET; zero boilerplate routing |
| **Backend Testing** | xUnit + Moq | Standard .NET testing stack |
| **Frontend Testing** | Jest + React Testing Library | Standard React testing stack |
| **E2E Testing** | Playwright | Cross-browser; works with Vercel preview URLs |
| **API Collections** | Postman | Industry standard; free for small teams |

### .NET 10 vs Previous Versions

| Version | Type | End of Support | Use it? |
|---|---|---|---|
| .NET 8 | LTS | November 2026 | ❌ Only 8 months left |
| .NET 9 | STS | November 2026 | ❌ Same deadline as 8 |
| **.NET 10** | **LTS** | **November 2028** | ✅ **Use this** |

.NET 10 is LTS (Long Term Support) — it gets security patches and bug fixes for 3 years. It also has the best JIT performance, better EF Core 10 with native JSON type support, and C# 14 improvements. There are no fundamental breaking changes from .NET 8 architecture-wise, so all patterns in this plan work identically.

### ⚠️ Render Free Tier Note
Render's free web service instances **sleep after 15 minutes of inactivity** and take 10–30 seconds to wake up. This is fine for a test app with friends. When you're ready to go public, upgrade to the $7/month plan which stays always-on.

---

## 4. Project Folder Structure

### Phase 3 Structure (Clean Architecture — starting point)

```
handylink/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── mobile-ci.yml
│
├── CLAUDE.md                          ← Project memory for Claude Code (commit to git)
├── CLAUDE.local.md                    ← Personal Claude notes (gitignored)
├── .mcp.json                          ← MCP servers config (commit to git)
│
├── .claude/
│   ├── settings.json                  ← Hooks wiring (commit to git)
│   ├── commands/
│   │   ├── add-feature.md             ← /add-feature command
│   │   └── fix-issue.md               ← /fix-issue {N} command
│   ├── skills/
│   │   ├── create-feature/SKILL.md    ← auto-triggered for new endpoints
│   │   └── write-migration/SKILL.md   ← auto-triggered for schema changes
│   └── hooks/
│       ├── pre-bash-guard.sh
│       ├── post-write-format.sh
│       └── stop-check.sh
│
├── backend/
│   ├── HandyLink.API/                    ← Entry point, controllers, middleware
│   │   ├── Controllers/
│   │   │   ├── JobsController.cs
│   │   │   ├── BidsController.cs
│   │   │   ├── ReviewsController.cs
│   │   │   ├── UsersController.cs
│   │   │   └── PaymentsController.cs
│   │   ├── Middleware/
│   │   │   └── ExceptionHandlingMiddleware.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   ├── HandyLink.Core/                   ← Business logic (no dependencies on infra)
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── WorkerProfile.cs
│   │   │   ├── Job.cs
│   │   │   ├── Bid.cs
│   │   │   └── Review.cs
│   │   ├── Interfaces/
│   │   │   ├── IJobRepository.cs
│   │   │   └── IBidRepository.cs
│   │   ├── Services/
│   │   │   ├── JobService.cs
│   │   │   ├── BidService.cs
│   │   │   └── ReviewService.cs
│   │   └── DTOs/
│   │
│   ├── HandyLink.Infrastructure/         ← DB, EF Core, external services
│   │   ├── Data/
│   │   │   ├── HandyLinkDbContext.cs
│   │   │   └── Migrations/
│   │   └── Repositories/
│   │
│   └── HandyLink.Tests/
│       ├── Unit/
│       └── Integration/
```

### Phase 3.5+ Structure (VSA + CQRS — target state)

After the migration, the backend folder transforms into feature-based slices. The old `Services/` folder disappears. Each feature owns everything it needs:

```
backend/
├── HandyLink.API/
│   ├── Features/                         ← Everything lives here now
│   │   ├── Jobs/
│   │   │   ├── CreateJob/
│   │   │   │   ├── CreateJobCommand.cs       ← "What to do + input data"
│   │   │   │   ├── CreateJobHandler.cs       ← "How to do it"
│   │   │   │   ├── CreateJobValidator.cs     ← "Is the input valid?"
│   │   │   │   └── CreateJobResponse.cs      ← "What comes back"
│   │   │   ├── GetJobs/
│   │   │   │   ├── GetJobsQuery.cs
│   │   │   │   └── GetJobsHandler.cs
│   │   │   ├── GetJobById/
│   │   │   │   ├── GetJobByIdQuery.cs
│   │   │   │   └── GetJobByIdHandler.cs
│   │   │   └── UpdateJobStatus/
│   │   │       ├── UpdateJobStatusCommand.cs
│   │   │       └── UpdateJobStatusHandler.cs
│   │   ├── Bids/
│   │   │   ├── SubmitBid/
│   │   │   │   ├── SubmitBidCommand.cs
│   │   │   │   ├── SubmitBidHandler.cs
│   │   │   │   └── SubmitBidValidator.cs
│   │   │   ├── AcceptBid/
│   │   │   │   ├── AcceptBidCommand.cs
│   │   │   │   └── AcceptBidHandler.cs
│   │   │   └── RejectBid/
│   │   │       ├── RejectBidCommand.cs
│   │   │       └── RejectBidHandler.cs
│   │   ├── Reviews/
│   │   │   └── CreateReview/
│   │   │       ├── CreateReviewCommand.cs
│   │   │       ├── CreateReviewHandler.cs
│   │   │       └── CreateReviewValidator.cs
│   │   ├── Payments/
│   │   │   ├── CreatePaymentIntent/
│   │   │   └── HandleStripeWebhook/
│   │   └── Users/
│   │       ├── GetCurrentUser/
│   │       └── UpdateProfile/
│   │
│   ├── Controllers/                      ← Thin controllers, only dispatch to MediatR
│   │   ├── JobsController.cs
│   │   ├── BidsController.cs
│   │   └── ...
│   │
│   ├── Common/                           ← Shared pipeline behaviours
│   │   ├── Behaviours/
│   │   │   ├── ValidationBehaviour.cs    ← Auto-validates every command
│   │   │   ├── LoggingBehaviour.cs       ← Auto-logs every command/query
│   │   │   └── ExceptionBehaviour.cs     ← Centralised error handling
│   │   └── Exceptions/
│   │       ├── NotFoundException.cs
│   │       ├── ForbiddenException.cs
│   │       └── ValidationException.cs
│   │
│   ├── Program.cs
│   └── appsettings.json
│
├── HandyLink.Core/                       ← Entities only (no services anymore)
│   └── Entities/
│
└── HandyLink.Infrastructure/             ← DbContext + EF Core (unchanged)
```

---

## Phase 1 — Repository & Project Setup

### Goal
Bootstrap the monorepo, create all three projects (backend, web, mobile), and wire up GitHub.

---

### 1.1 — Create GitHub Repository

**Manual steps (do these yourself):**
1. Go to github.com → New Repository → name it `handylink`
2. Set to **Public** (required for free GitHub Actions minutes)
3. Add `.gitignore` for `VisualStudio` template
4. Clone it locally: `git clone https://github.com/YOUR_USERNAME/handylink.git`

---

### 1.2 — Bootstrap the Backend (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (verify ASP.NET Core 10 syntax) · pre-bash-guard hook (auto-active) · post-write-format hook (auto-formats .cs files on save)
> 📝 **Before starting:** Update the `Current phase:` line in `CLAUDE.md` to `Phase 1 — Project Bootstrap`

```
Create an ASP.NET Core 10 Web API solution in a folder called `backend/`.

The solution should have three projects:
1. HandyLink.API — the Web API entry point
2. HandyLink.Core — class library for entities, interfaces, DTOs, and services
3. HandyLink.Infrastructure — class library for DbContext, EF Core, and repositories

Setup requirements:
- Target framework: net10.0 on all projects
- If unsure about any .NET 10 or NuGet package syntax, say: "Use Context7 to look up [topic]" before writing the code
- Add project references: API → Core, API → Infrastructure, Infrastructure → Core
- Install these NuGet packages in the appropriate projects:
  - HandyLink.API: Microsoft.AspNetCore.Authentication.JwtBearer, 
    Swashbuckle.AspNetCore, Stripe.net
  - HandyLink.Infrastructure: Microsoft.EntityFrameworkCore, 
    Npgsql.EntityFrameworkCore.PostgreSQL, Microsoft.EntityFrameworkCore.Design
- Configure Program.cs with:
  - Swagger/OpenAPI
  - CORS (allow all origins for now, we'll restrict later)
  - JWT Bearer authentication reading the Supabase JWT secret from config
  - A health check endpoint at GET /health that returns 200 OK
- Add an appsettings.json with placeholder keys for: 
  ConnectionStrings:DefaultConnection, Supabase:JwtSecret, Supabase:Url,
  Stripe:SecretKey, Stripe:WebhookSecret
- Add a global exception handling middleware that returns 
  { "error": "message", "statusCode": 500 } JSON on unhandled exceptions
- Make sure the solution builds with: dotnet build
```

---

### 1.3 — Bootstrap the Web Frontend (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (verify Supabase JS v2 + React Query v5 syntax) · TypeScript LSP plugin *(add this now if you haven't: `claude plugin install typescript-lsp`)*

```
In the `frontend/` folder, create a React + Vite project with the following setup:

1. Initialize with: npm create vite@latest . -- --template react
2. Install these dependencies:
   - @supabase/supabase-js   ← if unsure about v2 API, say "Use Context7 to look up supabase-js v2 createClient"
   - axios
   - react-router-dom
   - @tanstack/react-query   ← v5 API differs significantly from v4; if unsure say "Use Context7 to look up react-query v5 useQuery"
   - react-hook-form + zod
   - @stripe/stripe-js + @stripe/react-stripe-js
   - tailwindcss + postcss + autoprefixer
3. Configure Tailwind CSS
4. Create a .env.example with: 
   VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLIC_KEY
5. Set up folder structure: src/api/, src/components/, src/pages/, src/hooks/, src/context/
6. Create App.jsx with react-router-dom routes:
   - / → LandingPage
   - /login → LoginPage
   - /register → RegisterPage
   - /jobs → JobsPage (protected)
   - /jobs/:id → JobDetailPage (protected)
   - /post-job → PostJobPage (protected, client only)
   - /worker/browse → WorkerBrowsePage (protected, worker only)
7. Create an AuthContext that wraps the Supabase client and exposes: 
   user, session, signIn, signOut, loading
8. Create a ProtectedRoute component that redirects to /login if not authenticated
9. Make sure `npm run dev` starts without errors
```

---

### 1.4 — Bootstrap the Mobile App (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (verify Expo Router v3+ and Expo SDK 52+ conventions — these change between SDK versions)

```
In the `mobile/` folder, create a React Native project using Expo with the following setup:

1. Initialize with: npx create-expo-app@latest . --template blank-typescript
2. Install Expo Router: npx expo install expo-router
   (Use Context7 to verify the current Expo Router setup if the file-based routing docs seem unclear)
3. Install these dependencies:
   - @supabase/supabase-js
   - axios
   - @tanstack/react-query
   - react-hook-form + zod
   - @stripe/stripe-react-native
   - expo-secure-store (encrypted storage for tokens)
   - expo-notifications
4. Update app.json scheme to "handylink"
5. Create folder structure under app/:
   - app/(auth)/login.tsx
   - app/(auth)/register.tsx
   - app/(client)/index.tsx
   - app/(client)/post-job.tsx
   - app/(worker)/browse.tsx
   - app/(worker)/my-bids.tsx
   - app/_layout.tsx
6. Create services/supabase.ts initializing the Supabase client with AsyncStorage
7. Create services/api.ts wrapping Axios with automatic JWT attachment
8. Create hooks/useAuth.ts reading Supabase auth state

Key concept for the developer: Expo is React for phones. The mental model 
is identical — hooks, components, props, state — just different primitives:
  <div>  →  <View>
  <p>    →  <Text>
  CSS    →  StyleSheet.create({})
  onClick → onPress
Everything else (useEffect, useState, react-query, axios) works identically.
```

---

### 1.5 — Add .gitignore and README (Claude Code Prompt)

```
Create a comprehensive .gitignore at the repo root covering:
- .NET build artifacts: bin/, obj/, *.user, .vs/
- Node.js: node_modules/, dist/, .env, .env.local
- Expo/React Native: .expo/, ios/ and android/ build artifacts
- OS files: .DS_Store, Thumbs.db

Create a README.md with:
- Project description
- Architecture overview (ASCII diagram)
- Prerequisites: Node 20+, .NET 10 SDK, Expo CLI
- Local setup instructions for all three parts
- Environment variable documentation
- Link to this project plan
```

---

## Phase 2 — Database Design (Supabase)

### Goal
Design the PostgreSQL schema in Supabase, set up Row Level Security (RLS), and connect EF Core.

### 2.1 — Create Supabase Project

**Manual steps:**
1. Go to supabase.com → New Project → choose EU West region
2. Copy to your `.env` files:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (backend only — never expose to frontend)
   - `DATABASE_URL` (direct PostgreSQL connection string)

---

### 2.2 — Database Schema (Claude Code Prompt)

> 🔧 **Tools active:** write-migration skill (auto-triggers — enforces the SQL-only, no-EF-migrations rule) · pre-bash-guard hook (blocks any `dotnet ef` command) · PostgreSQL MCP (use after running the SQL to verify tables were created)
> 💡 **After running the SQL in Supabase**, verify with: *"Use the PostgreSQL MCP to list all tables in the public schema"*

```
Create SQL migration scripts for the HandyLink schema.
Save as: backend/HandyLink.Infrastructure/Data/Migrations/001_initial_schema.sql

-- Profiles (extends Supabase's built-in auth.users table)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  country TEXT DEFAULT 'RO',
  bio TEXT,
  role TEXT CHECK (role IN ('client', 'worker', 'both')) DEFAULT 'client',
  expo_push_token TEXT,        -- for mobile push notifications
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker-specific details
CREATE TABLE public.worker_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  portfolio_urls TEXT[] DEFAULT '{}',
  stripe_account_id TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enums
CREATE TYPE job_category AS ENUM (
  'electrical', 'plumbing', 'painting', 'carpentry',
  'furniture_assembly', 'cleaning', 'general', 'other'
);
CREATE TYPE job_status AS ENUM (
  'open', 'bidding', 'accepted', 'in_progress', 
  'completed', 'cancelled', 'disputed'
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category job_category NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'RO',
  photos TEXT[] DEFAULT '{}',
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status job_status DEFAULT 'open',
  accepted_bid_id UUID,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price_estimate DECIMAL(10,2) NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending','accepted','rejected','withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.jobs ADD CONSTRAINT fk_accepted_bid 
  FOREIGN KEY (accepted_bid_id) REFERENCES public.bids(id);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  worker_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewer_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX idx_bids_job_id ON public.bids(job_id);
CREATE INDEX idx_bids_worker_id ON public.bids(worker_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bids_updated_at BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-recalculate worker average rating on new review
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.worker_profiles SET
    average_rating = (SELECT AVG(rating) FROM public.reviews WHERE worker_id = NEW.worker_id),
    total_reviews  = (SELECT COUNT(*)    FROM public.reviews WHERE worker_id = NEW.worker_id)
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_worker_rating AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_worker_rating();
```

---

### 2.3 — Row Level Security (Claude Code Prompt)

> 🔧 **Tools active:** PostgreSQL MCP · write-migration skill
> 💡 **After applying RLS**, test it with: *"Use the PostgreSQL MCP to check RLS policies on the jobs table"*

```
Save as: backend/HandyLink.Infrastructure/Data/Migrations/002_rls_policies.sql

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "profiles_select_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Worker profiles: public read, owner write
CREATE POLICY "worker_select_all"     ON public.worker_profiles FOR SELECT USING (true);
CREATE POLICY "worker_manage_own"     ON public.worker_profiles FOR ALL USING (auth.uid() = id);

-- Jobs: authenticated users read all open jobs; clients manage their own
CREATE POLICY "jobs_select_auth"      ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "jobs_insert_client"    ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "jobs_update_client"    ON public.jobs FOR UPDATE USING (auth.uid() = client_id);

-- Bids: workers see their own + client sees bids on their jobs
CREATE POLICY "bids_select"           ON public.bids FOR SELECT USING (
  auth.uid() = worker_id OR
  EXISTS (SELECT 1 FROM public.jobs WHERE id = bids.job_id AND client_id = auth.uid())
);
CREATE POLICY "bids_insert_worker"    ON public.bids FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "bids_update_worker"    ON public.bids FOR UPDATE USING (auth.uid() = worker_id);

-- Reviews: public read, reviewer write
CREATE POLICY "reviews_select_all"    ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"    ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications: owner only
CREATE POLICY "notifications_own"     ON public.notifications FOR ALL USING (auth.uid() = user_id);
```

---

### 2.4 — Connect EF Core to Supabase (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (verify Npgsql.EntityFrameworkCore.PostgreSQL config for .NET 10) · post-write-format hook (auto-formats .cs files) · pre-bash-guard hook (prevents accidental EF migration commands)

```
In HandyLink.Infrastructure, configure Entity Framework Core 10 with Npgsql:

1. Create HandyLinkDbContext.cs with DbSets for:
   Profile, WorkerProfile, Job, Bid, Review, Notification

2. Use HasDefaultSchema("public") and Fluent API to map to exact PostgreSQL table names.

3. Map the job_category and job_status PostgreSQL enums to C# enums.

4. Register the DbContext in Program.cs:
   builder.Services.AddDbContext<HandyLinkDbContext>(options =>
     options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

5. Create entity classes in HandyLink.Core/Entities/ matching the SQL schema.

6. Write a DataSeeder.cs (Development only) that creates:
   - 2 users (1 client, 1 worker)
   - 3 open jobs across different categories
   - 2 bids on one of those jobs

7. Add a README comment: EF Core is used for querying; schema migrations are 
   run manually via the SQL scripts in Supabase's SQL editor. This avoids 
   conflicts with Supabase's internal auth schema tables.
```

---

## Phase 3 — Backend API: Clean Architecture

### Goal
Build all REST endpoints using Clean Architecture (layered). The code you write here will be directly refactored in Phase 3.5, so you will see exactly what problem VSA solves.

> **Developer Note:** The purpose of building in Clean Architecture first is intentional. By the time you reach Phase 3.5, you will have felt the friction — `JobService.cs` growing large, having to touch four files for every feature, hunting across layers. That experience makes the migration to VSA feel like a relief rather than an arbitrary change.

### API Endpoints Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /health | None | Health check |
| GET | /api/jobs | JWT | List open jobs (filter by category, city) |
| POST | /api/jobs | JWT | Create a new job |
| GET | /api/jobs/:id | JWT | Get job details + bids |
| PATCH | /api/jobs/:id/status | JWT | Update job status |
| POST | /api/jobs/:id/bids | JWT | Submit a bid |
| PATCH | /api/bids/:id/accept | JWT | Accept a bid |
| PATCH | /api/bids/:id/reject | JWT | Reject a bid |
| GET | /api/workers | JWT | Browse worker profiles |
| GET | /api/workers/:id | JWT | Get worker profile + reviews |
| GET | /api/users/me | JWT | Get current user |
| PUT | /api/users/me | JWT | Update current user |
| POST | /api/reviews | JWT | Leave a review |
| POST | /api/payments/create-intent | JWT | Create Stripe payment intent |
| POST | /api/payments/webhook | None | Stripe webhook |
| GET | /api/notifications | JWT | Get user notifications |
| PATCH | /api/notifications/:id/read | JWT | Mark notification as read |

---

### 3.1 — Base Controller + Auth Helper (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (verify ASP.NET Core 10 JWT Bearer configuration) · post-write-format hook · pre-bash-guard hook
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 3 — Clean Architecture`

```
Create a BaseController.cs in HandyLink.API/Controllers/ that all controllers inherit from:

[ApiController]
[Authorize]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    // Extracts the authenticated user's UUID from the JWT 'sub' claim.
    // Supabase sets sub = the user's profile ID (UUID).
    // Analogy: this is like reading the name off the wristband.
    protected Guid GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (sub is null) throw new UnauthorizedException("User ID not found in token");
        return Guid.Parse(sub);
    }
}

Create custom exception classes in HandyLink.Core/Exceptions/:
- NotFoundException(string message) : Exception
- ForbiddenException(string message) : Exception  
- ConflictException(string message) : Exception
- ValidationException(string message) : Exception

Update ExceptionHandlingMiddleware to map these to correct HTTP status codes:
- NotFoundException        → 404
- ForbiddenException       → 403
- ConflictException        → 409
- ValidationException      → 400
- any other Exception      → 500
```

---

### 3.2 — Jobs Feature (Claude Code Prompt)

> 🔧 **Tools active:** post-write-format hook (auto-formats on each file write) · stop-check hook (verifies tests exist when done) · Context7 MCP (EF Core 10 LINQ queries if needed)
> 💡 **When you finish this prompt**, the stop-check hook will remind you if tests are missing.

```
Implement the Jobs feature in Clean Architecture style.

In HandyLink.Core/Interfaces/, create IJobRepository.cs:
  Task<Job?> GetByIdAsync(Guid id);
  Task<PagedResult<Job>> GetPagedAsync(JobFilter filter, int page, int pageSize);
  Task<Job> AddAsync(Job job);
  Task UpdateAsync(Job job);

In HandyLink.Core/Services/, create JobService.cs:
  - CreateJobAsync(CreateJobDto dto, Guid clientId): validates, creates job, returns JobResponseDto
  - GetJobsAsync(JobFilter filter, int page, int pageSize): returns paged jobs
  - GetJobByIdAsync(Guid id): returns job with bid count; throws NotFoundException if missing
  - UpdateJobStatusAsync(Guid jobId, string newStatus, Guid requesterId): validates 
    the requester is the owner and the status transition is legal (state machine below)

Legal status transitions:
  open        → bidding (auto, when first bid is received)
  bidding     → accepted (when client accepts a bid)
  accepted    → in_progress (client confirms work started)
  in_progress → completed (client confirms work done)
  open/bidding/accepted → cancelled (client cancels)

In HandyLink.Infrastructure/Repositories/, create JobRepository.cs implementing IJobRepository.

In HandyLink.API/Controllers/, create JobsController.cs:
  GET  /api/jobs               → calls jobService.GetJobsAsync
  POST /api/jobs               → calls jobService.CreateJobAsync
  GET  /api/jobs/{id}          → calls jobService.GetJobByIdAsync
  PATCH /api/jobs/{id}/status  → calls jobService.UpdateJobStatusAsync

Register IJobRepository and JobService in Program.cs DI container.
Add XML documentation comments on all public methods.
```

---

### 3.3 — Bids Feature (Claude Code Prompt)

> 🔧 **Tools active:** post-write-format hook · stop-check hook · PostgreSQL MCP (verify bid data after testing: *"Use PostgreSQL MCP to show all bids in the bids table"*)

```
Implement the Bids feature.

In HandyLink.Core/Services/, create BidService.cs:

SubmitBidAsync(Guid jobId, SubmitBidDto dto, Guid workerId):
  1. Load job; throw NotFoundException if missing
  2. Throw ForbiddenException if job.status not in ('open', 'bidding')
  3. Check for duplicate bid (same worker + same job); throw ConflictException if found
  4. Create Bid entity, status = 'pending'
  5. If job.status == 'open', update to 'bidding'
  6. Create notification for client: "New bid received on {job.title}"
  7. Return created bid DTO

AcceptBidAsync(Guid bidId, Guid clientId):
  1. Load bid + its associated job; throw NotFoundException if missing
  2. Throw ForbiddenException if job.client_id != clientId
  3. Set this bid.status = 'accepted', job.accepted_bid_id = bidId
  4. Set all OTHER bids on the same job to 'rejected'
  5. Notify the winning worker: "Your bid was accepted for {job.title}!"
  6. Notify rejected workers: "A different bid was selected for {job.title}"
  7. Return updated bid DTO

RejectBidAsync(Guid bidId, Guid clientId): simpler version — reject single bid, notify worker.

Create NotificationService.cs in HandyLink.Core/Services/:
  CreateAsync(Guid userId, string title, string body, string type, Guid? referenceId)
  This inserts into the notifications table only. Push delivery is added in Phase 6.

Create BidsController.cs:
  POST /api/jobs/{jobId}/bids       → SubmitBidAsync
  PATCH /api/bids/{bidId}/accept    → AcceptBidAsync  
  PATCH /api/bids/{bidId}/reject    → RejectBidAsync
```

---

### 3.4 — Reviews, Workers & Users (Claude Code Prompt)

> 🔧 **Tools active:** post-write-format hook · stop-check hook · PostgreSQL MCP (verify review data and worker ratings after testing)

```
Implement remaining controllers and services.

ReviewService.CreateReviewAsync(CreateReviewDto dto, Guid reviewerId):
  1. Load job; verify it's 'completed' and reviewer is the client
  2. Check no duplicate review exists; throw ConflictException if found
  3. Insert review — the DB trigger auto-updates worker average_rating
  4. Return created review DTO

WorkersController:
  GET /api/workers           → paginated worker list with filters (category, city, minRating)
  GET /api/workers/{id}      → full worker profile + last 10 reviews

UsersController:
  GET /api/users/me          → returns profile + worker_profile if role includes 'worker'
  PUT /api/users/me          → updates profile; if worker, also updates worker_profile
    Accept: { full_name, bio, phone, city, country, avatar_url }
    If worker also accept: { categories[], years_experience, portfolio_urls[] }

NotificationsController:
  GET /api/notifications                → returns user's notifications, newest first
  PATCH /api/notifications/{id}/read   → marks one as read
  PATCH /api/notifications/read-all    → marks all as read
```

---

## Phase 3.5 — Migration to VSA + CQRS

### Why We Do This Now

By this point you have working endpoints. You have also noticed:
- `JobService.cs` has methods for creating, querying, updating, status changes — it is growing
- Adding "get jobs for a specific client" means adding another method to the same service file
- Two different concerns (reading a list vs. writing a new job) share the same class
- Testing requires mocking the entire service even for one small behaviour

VSA + CQRS solves all of this by making each operation a **self-contained unit**.

### The Core Idea: Commands and Queries

CQRS stands for **Command Query Responsibility Segregation**. The rule is simple:

- **Command** = something that **changes state** → Create, Update, Delete, Accept
- **Query** = something that **reads state** → Get, List, Search

They live in separate classes and can be optimised independently. A Query doesn't need to go through the same code path as a Command.

**Analogy:** In a restaurant, the waiter who takes your order (command) and the chef who prepares it (handler) are different people. The process for reading the menu (query) is completely separate from placing the order (command). CQRS formalises this separation in code.

### How MediatR Works

MediatR is the **dispatcher**. You send it a Command or Query object, and it automatically finds and calls the right Handler. You never instantiate handlers yourself.

```
Controller          MediatR              Handler
    │                   │                   │
    │── Send(command) ──▶│                   │
    │                   │── dispatch ───────▶│
    │                   │                   │── does the work
    │◀──────────────────│◀── returns result─│
```

The controller has no idea how the work is done — it just sends a message and gets a result back.

---

### 3.5.1 — Install MediatR and FluentValidation (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (verify MediatR v12+ registration syntax for .NET 10) · post-write-format hook
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 3.5 — VSA + CQRS Migration`

```
Add the following NuGet packages to HandyLink.API:
  - MediatR
  - FluentValidation
  - FluentValidation.AspNetCore

In Program.cs, register MediatR to scan the API assembly for all handlers:
  builder.Services.AddMediatR(cfg => 
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

Register FluentValidation:
  builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

Create a ValidationBehaviour.cs in HandyLink.API/Common/Behaviours/:

// This is a MediatR Pipeline Behaviour — it runs BEFORE every handler automatically.
// Analogy: like airport security before every flight. You define it once; 
// every passenger (command) goes through it without the pilot (handler) caring.
public class ValidationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehaviour(IEnumerable<IValidator<TRequest>> validators)
        => _validators = validators;

    public async Task<TResponse> Handle(
        TRequest request, 
        RequestHandlerDelegate<TResponse> next, 
        CancellationToken cancellationToken)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}

Register the pipeline behaviour in Program.cs:
  builder.Services.AddTransient(
    typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));

Also create a LoggingBehaviour<TRequest, TResponse> that logs the name of every 
command/query before and after execution using ILogger. Register it in the pipeline 
BEFORE ValidationBehaviour so logging always fires.
```

---

### 3.5.2 — Migrate the Jobs Feature (Claude Code Prompt)

This is the most important prompt — it shows the full before/after transformation. Once you complete this, the `create-feature` skill and `/add-feature` command will use this pattern as their template for all future features.

```
Migrate the Jobs feature from Clean Architecture service methods to VSA + CQRS handlers.

The goal: delete JobService.cs and replace it with individual feature folders.
The controller stays but becomes much thinner.

═══════════════════════════════════════════════
STEP 1: Create the CreateJob slice
═══════════════════════════════════════════════
Create folder: HandyLink.API/Features/Jobs/CreateJob/

CreateJobCommand.cs:
// A Command is just a data bag — it holds the input and implements IRequest<T>
// T is what the handler will return
public record CreateJobCommand(
    string Title,
    string Description,
    string Category,
    string City,
    string Country,
    decimal? BudgetMin,
    decimal? BudgetMax,
    List<string> Photos,
    Guid ClientId          // set by the controller from JWT, not from request body
) : IRequest<CreateJobResponse>;

CreateJobResponse.cs:
public record CreateJobResponse(Guid Id, string Title, string Status, DateTime CreatedAt);

CreateJobValidator.cs:
// FluentValidation — called automatically by ValidationBehaviour before the handler runs
public class CreateJobValidator : AbstractValidator<CreateJobCommand>
{
    public CreateJobValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Category).NotEmpty()
            .Must(c => Enum.TryParse<JobCategory>(c, true, out _))
            .WithMessage("Invalid category");
        RuleFor(x => x.City).NotEmpty();
        RuleFor(x => x.BudgetMax).GreaterThan(x => x.BudgetMin)
            .When(x => x.BudgetMin.HasValue && x.BudgetMax.HasValue);
    }
}

CreateJobHandler.cs:
// The Handler does the actual work — equivalent to what was in JobService.CreateJobAsync
// It only knows how to create a job. Nothing else.
public class CreateJobHandler : IRequestHandler<CreateJobCommand, CreateJobResponse>
{
    private readonly HandyLinkDbContext _db;

    public CreateJobHandler(HandyLinkDbContext db) => _db = db;

    public async Task<CreateJobResponse> Handle(
        CreateJobCommand command, CancellationToken cancellationToken)
    {
        var job = new Job
        {
            Id          = Guid.NewGuid(),
            ClientId    = command.ClientId,
            Title       = command.Title,
            Description = command.Description,
            Category    = Enum.Parse<JobCategory>(command.Category, true),
            City        = command.City,
            Country     = command.Country,
            BudgetMin   = command.BudgetMin,
            BudgetMax   = command.BudgetMax,
            Photos      = command.Photos,
            Status      = JobStatus.Open,
            CreatedAt   = DateTime.UtcNow
        };

        _db.Jobs.Add(job);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateJobResponse(job.Id, job.Title, job.Status.ToString(), job.CreatedAt);
    }
}

═══════════════════════════════════════════════
STEP 2: Create the GetJobs slice (Query example)
═══════════════════════════════════════════════
Create folder: HandyLink.API/Features/Jobs/GetJobs/

GetJobsQuery.cs:
// A Query returns data without changing anything
public record GetJobsQuery(
    string? Category,
    string? City,
    string? Country,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<JobSummaryDto>>;

GetJobsHandler.cs:
// Queries can be optimised independently from commands.
// Notice this handler goes directly to the DbContext — no repository needed for simple reads.
// Analogy: for a read-only report, you go straight to the filing cabinet yourself 
// rather than asking someone else to retrieve it.
public class GetJobsHandler : IRequestHandler<GetJobsQuery, PagedResult<JobSummaryDto>>
{
    private readonly HandyLinkDbContext _db;
    public GetJobsHandler(HandyLinkDbContext db) => _db = db;

    public async Task<PagedResult<JobSummaryDto>> Handle(
        GetJobsQuery query, CancellationToken cancellationToken)
    {
        var q = _db.Jobs
            .Where(j => j.Status == JobStatus.Open || j.Status == JobStatus.Bidding);

        if (!string.IsNullOrEmpty(query.Category))
            q = q.Where(j => j.Category.ToString() == query.Category);
        if (!string.IsNullOrEmpty(query.City))
            q = q.Where(j => j.City == query.City);

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(j => j.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(j => new JobSummaryDto(
                j.Id, j.Title, j.Category.ToString(),
                j.City, j.BudgetMin, j.BudgetMax, j.Status.ToString(),
                j.Bids.Count, j.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<JobSummaryDto>(items, total, query.Page, query.PageSize);
    }
}

═══════════════════════════════════════════════
STEP 3: Update the controller to use MediatR
═══════════════════════════════════════════════
Update JobsController.cs:

// Notice how thin this is now. The controller only:
// 1. Reads HTTP input
// 2. Builds the Command/Query
// 3. Sends it to MediatR
// 4. Returns the result
// It has ZERO business logic.
[ApiController]
[Authorize]
[Route("api/jobs")]
public class JobsController : BaseController
{
    private readonly IMediator _mediator;
    public JobsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetJobs([FromQuery] GetJobsQuery query)
        => Ok(await _mediator.Send(query));

    [HttpPost]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request)
    {
        // ClientId comes from JWT, not from the request body — security requirement
        var command = request with { ClientId = GetUserId() };
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetJobById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJobById(Guid id)
        => Ok(await _mediator.Send(new GetJobByIdQuery(id, GetUserId())));

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateJobStatusRequest req)
        => Ok(await _mediator.Send(new UpdateJobStatusCommand(id, req.Status, GetUserId())));
}

═══════════════════════════════════════════════
STEP 4: Clean up
═══════════════════════════════════════════════
- Delete HandyLink.Core/Services/JobService.cs
- Delete HandyLink.Core/Interfaces/IJobService.cs  
- Remove JobService registration from Program.cs
- Keep IJobRepository and JobRepository (the handler uses them for writes if needed,
  or accesses DbContext directly for simple reads)
- Run: dotnet build — must compile with 0 errors
- Run: dotnet test — all existing tests must still pass
```

---

### 3.5.3 — Migrate Bids and Reviews Features (Claude Code Prompt)

> 💡 **Shortcut available:** Now that the Jobs slice is done and the `create-feature` skill exists, you can use the `/add-feature` command for new slices instead of writing them from scratch. Type `/add-feature` in Claude Code, answer the prompts (domain, action, command vs query), and the skill generates all files automatically.

```
Migrate the Bids and Reviews features to VSA + CQRS, following the same pattern 
established in 3.5.2.

For Bids, create these slices in Features/Bids/:
  SubmitBid/
    SubmitBidCommand.cs       — record with JobId, PriceEstimate, Message, WorkerId
    SubmitBidHandler.cs       — contains the logic that was in BidService.SubmitBidAsync
    SubmitBidValidator.cs     — PriceEstimate > 0, Message not empty
    SubmitBidResponse.cs
  AcceptBid/
    AcceptBidCommand.cs       — record with BidId, ClientId
    AcceptBidHandler.cs       — accepts bid, rejects others, sends notifications
  RejectBid/
    RejectBidCommand.cs
    RejectBidHandler.cs

For Reviews, create these slices in Features/Reviews/:
  CreateReview/
    CreateReviewCommand.cs
    CreateReviewHandler.cs
    CreateReviewValidator.cs  — Rating must be 1-5, Comment max 1000 chars

For Notifications, create these slices in Features/Notifications/:
  GetNotifications/
    GetNotificationsQuery.cs
    GetNotificationsHandler.cs
  MarkAsRead/
    MarkAsReadCommand.cs
    MarkAsReadHandler.cs

For Users, create these slices in Features/Users/:
  GetCurrentUser/
    GetCurrentUserQuery.cs
    GetCurrentUserHandler.cs
  UpdateProfile/
    UpdateProfileCommand.cs
    UpdateProfileHandler.cs
    UpdateProfileValidator.cs

After migration:
- Delete BidService.cs, ReviewService.cs, NotificationService.cs from HandyLink.Core/Services/
- Keep HandyLink.Core/ for Entities only
- All controllers should be thin dispatchers like the example in 3.5.2
- Run: dotnet build && dotnet test — must pass completely
```

---

### 3.5.4 — Update Tests for VSA + CQRS (Claude Code Prompt)

> 🔧 **Tools active:** stop-check hook (will automatically remind you if any handler is created without a corresponding test file) · PostgreSQL MCP (cross-check test results against real DB data)

```
Update the test project to work with the VSA + CQRS structure.

The key insight: testing VSA handlers is EASIER than testing services because 
each handler is isolated and has a single responsibility.

In HandyLink.Tests/Unit/Features/Jobs/:
Create CreateJobHandlerTests.cs:

public class CreateJobHandlerTests
{
    // Instead of mocking a whole service, we just mock the DbContext
    // or use an in-memory database — much simpler
    
    [Fact]
    public async Task Handle_WithValidCommand_ShouldCreateJob()
    {
        // Arrange — set up in-memory EF Core database
        var options = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var db = new HandyLinkDbContext(options);
        var handler = new CreateJobHandler(db);
        
        var command = new CreateJobCommand(
            Title: "Paint 3 rooms",
            Description: "Need interior painting",
            Category: "painting",
            City: "Bucharest",
            Country: "RO",
            BudgetMin: 100,
            BudgetMax: 300,
            Photos: [],
            ClientId: Guid.NewGuid()
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Paint 3 rooms");
        db.Jobs.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_CreatesJobWithOpenStatus() { ... }
}

Create SubmitBidHandlerTests.cs:
  - Test: submitting a valid bid creates it and changes job status to 'bidding'
  - Test: submitting a second bid from the same worker throws ConflictException
  - Test: submitting a bid on a non-open job throws ForbiddenException

Create AcceptBidHandlerTests.cs:
  - Test: accepting a bid sets it to 'accepted' and rejects all other bids
  - Test: accepting from wrong client throws ForbiddenException

Create CreateJobValidatorTests.cs:
  - Test that empty title fails validation
  - Test that invalid category fails validation
  - Test that budget_max < budget_min fails validation

Note the pattern: each test file maps 1:1 to a single handler class.
Tests are short, focused, and require minimal setup.
```

---

## Phase 4 — Authentication (Supabase Auth)

### Goal
Set up Supabase Auth on frontend/mobile and validate JWT tokens in the .NET backend.

### How It Works (Analogy)
Supabase Auth is like a **hotel key card system**. Supabase is the front desk — it issues key cards (JWTs) to guests. Your .NET API is the hotel room door — it reads the key card signature without calling the front desk every time. This is fast and stateless.

---

### 4.1 — Supabase Auth in React Frontend (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (critical here — Supabase JS v2 auth API differs significantly from v1: `signInWithPassword` not `signIn`, `onAuthStateChange` callback shape changed)
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 4 — Authentication`
> 💡 If any Supabase auth method looks unfamiliar, say: *"Use Context7 to look up supabase-js v2 auth [method name]"*

```
Set up Supabase Authentication in the React frontend:

1. In src/lib/supabase.ts:
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )

2. Create src/context/AuthContext.tsx:
   State: user, session, loading, userProfile
   - On mount: supabase.auth.getSession() + subscribe to onAuthStateChange
   - signInWithEmail(email, password)
   - signInWithGoogle(): supabase.auth.signInWithOAuth({ provider: 'google' })
   - signUp(email, password, fullName, role):
       a. supabase.auth.signUp
       b. Insert into public.profiles with id = user.id, role = role
       c. If role is 'worker' or 'both', insert into public.worker_profiles
   - signOut()

3. Create src/api/axiosClient.ts:
   - Axios instance with baseURL from VITE_API_URL
   - Request interceptor: attaches Authorization: Bearer {supabase_access_token}
   - Response interceptor: on 401, redirect to /login

4. Create LoginPage and RegisterPage components.
   RegisterPage includes a role selector: "I need work done" | "I offer services" | "Both"

5. In Supabase dashboard:
   - Enable Google OAuth provider
   - Enable email confirmations
   - Enable "Auto-confirm users" for development only
```

---

### 4.2 — JWT Validation in .NET 10 Backend (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (verify AddJwtBearer configuration for ASP.NET Core 10 — the minimal API style changed in .NET 8+) · post-write-format hook

```
Configure Supabase JWT validation in Program.cs:

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
    options.TokenValidationParameters = new TokenValidationParameters
    {
      ValidateIssuerSigningKey = true,
      IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(builder.Configuration["Supabase:JwtSecret"]!)
      ),
      ValidateIssuer    = true,
      ValidIssuer       = builder.Configuration["Supabase:Url"] + "/auth/v1",
      ValidateAudience  = true,
      ValidAudience     = "authenticated",  // Supabase sets this for all logged-in users
      ClockSkew         = TimeSpan.Zero
    };
  });

The JWT Secret is in Supabase Dashboard → Settings → API → JWT Secret.
Supabase uses the HS256 algorithm (symmetric key, not RSA public/private).

Add a GetSupabaseUserId(this ClaimsPrincipal user) extension method in a 
ClaimsPrincipalExtensions.cs helper class.

If unsure about ClaimsPrincipal or JWT claim names in .NET 10, say:
"Use Context7 to look up ClaimsPrincipal FindFirst in ASP.NET Core 10" This reads the 'sub' claim as Guid.
The 'sub' claim in Supabase JWTs equals the user's UUID — matching profiles.id.

Test the flow:
1. Login via frontend → get JWT
2. Call GET /api/users/me in Swagger with Bearer {token}
3. Verify it returns the user profile
```

---

## Phase 5 — Web Frontend (React + Vite)

### Page Map

```
/               Landing page (hero, categories, how it works)
/login          Login
/register       Register (with role selection)
/jobs           Job listing with filters
/jobs/:id       Job detail (different view for client vs worker)
/post-job       Post a job (client only)
/my-jobs        Client's job management dashboard
/worker/browse  Worker job browsing + quick bid panel
/worker/profile Worker's public profile
/profile        Edit own profile
/notifications  Notification center
```

---

### 5.1 — Core Pages (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (react-query v5 hooks, Tailwind CSS v4 classes, react-hook-form v7)
> 🔌 **Add plugin now:** `claude plugin install typescript-lsp` — TypeScript LSP gives real-time type checking in .tsx files during this phase
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 5 — Web Frontend`

```
Build these React pages using Tailwind CSS, react-query, and react-hook-form:

1. LandingPage:
   - Hero: "Find trusted tradespeople near you"
   - 6 category cards with icons: Electrical, Plumbing, Painting, Carpentry, Furniture, General
   - "How it works" — 3 steps for clients, 3 steps for workers
   - CTAs: "Post a Job" and "Find Work"

2. JobsPage:
   - Filter sidebar: category, city, country, max budget
   - Job card grid with: title, category badge, city, budget range, bid count, time ago
   - Pagination controls
   - Each card links to /jobs/:id

3. JobDetailPage — two views based on who is looking:
   CLIENT VIEW (owns the job):
   - Job info header
   - Bid list: worker name, rating, estimate, message
   - Accept / Reject buttons per bid
   - "Mark as In Progress" button (after accepting)
   - "Mark as Completed" button → triggers payment flow
   
   WORKER VIEW:
   - Job info only
   - Bid form if not yet bid (price estimate + message)
   - Their bid status badge if already bid

4. PostJobPage:
   - Form: title, description, category select, city, country, budget min/max
   - Photo upload via Supabase Storage (drag-and-drop)
   - Preview section
   - On submit: POST to /api/jobs via axiosClient → redirect to /jobs/:newId
```

---

### 5.2 — Worker & Profile Pages (Claude Code Prompt)

> 🔧 **Tools active:** TypeScript LSP plugin (type-checks JSX) · Context7 MCP (Supabase Storage upload API if needed) · PostgreSQL MCP (verify worker data: *"Use PostgreSQL MCP to show workers with rating above 4"*)

```
5. WorkerBrowsePage:
   - Same filter UI as JobsPage
   - "Quick bid" slide-out panel (opens without page navigation)
   - Shows open + bidding jobs only

6. WorkerProfilePage (public):
   - Avatar, name, star rating, category badges, bio
   - Portfolio photos grid
   - Reviews list: stars, comment, job category, date

7. EditProfilePage:
   - Tab 1 (all users): name, bio, city, country, phone, avatar upload
   - Tab 2 (workers): categories multi-select, years experience, portfolio photos

8. NotificationsPage:
   - Grouped: Today / Earlier
   - Per notification: icon, title, body, time, read indicator
   - "Mark all read" button
   - Click navigates to relevant job

9. NotificationBell (header component):
   - Shows unread count badge
   - Uses react-query with 30-second polling interval
   - Dropdown preview of last 5 notifications
```

---

## Phase 6 — Mobile App (React Native / Expo)

### Key React Native Differences (Quick Reference)

| React Web | React Native | Notes |
|---|---|---|
| `<div>` | `<View>` | All layout containers |
| `<p>`, `<h1>` | `<Text>` | All text must be in Text |
| CSS / Tailwind | `StyleSheet.create({})` | Native styling system |
| `onClick` | `onPress` | Touch events |
| `<img>` | `<Image>` | Expo's Image component |
| `localStorage` | `expo-secure-store` | Encrypted hardware storage |
| Browser `fetch` | Axios (same) | Works identically |
| React Router | Expo Router | Same file-based concept |

---

### 6.1 — Auth Screens (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (Expo Router v3 `_layout.tsx` conventions, `expo-secure-store` API) · TypeScript LSP plugin
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 6 — Mobile App`
> 💡 Expo Router file-based routing evolves with each SDK. If folder structure looks wrong, say: *"Use Context7 to check Expo Router v3 auth group conventions"*

```
Build mobile/app/(auth)/login.tsx and register.tsx:

login.tsx:
- Logo at top
- Email + password inputs with KeyboardAvoidingView 
  (KeyboardAvoidingView pushes content up when keyboard appears — 
   analogy: the keyboard is like a rising tide, the view is a boat that floats)
- "Sign In" button with loading state
- Error alert on failure using Alert.alert()
- On success: router.replace('/(client)') or '/(worker)' based on profile.role
- SafeAreaView wrapping everything (keeps content below the iPhone notch)

register.tsx:
- Inputs: full name, email, password, city
- Role selector: two pressable cards — "I need work done" and "I'm a tradesperson"
- TouchableOpacity with visual feedback on press
- Same signUp logic as web (Supabase + insert into profiles)

mobile/app/_layout.tsx:
- On mount, check Supabase session
- Authenticated + role known → redirect to correct tab group
- Not authenticated → redirect to /(auth)/login
- Loading state → show splash screen
```

---

### 6.2 — Main App Screens (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (react-native-bottom-sheet API, expo-image-picker API) · TypeScript LSP plugin

```
CLIENT SCREENS — mobile/app/(client)/:

index.tsx (My Jobs):
- FlatList of client's jobs
- Each item: title, status badge (colour-coded), bid count, date
- Tap → navigate to job detail screen
- FloatingActionButton (bottom-right "+" button) → navigate to post-job

post-job.tsx:
- ScrollView form: title, description, category Picker, city, budget range
- expo-image-picker for photo selection
- Upload selected photos to Supabase Storage, get public URLs
- Submit → POST /api/jobs → navigate back

job-detail.tsx:
- Shows job info + bid list (same dual-view logic as web)
- Accept / Reject bid buttons
- Completed → navigates to payment screen

WORKER SCREENS — mobile/app/(worker)/:

browse.tsx:
- FlatList with infinite scroll (onEndReached for pagination)
- Category filter chips scrollable at top
- Tap job card → open BottomSheet (react-native-bottom-sheet) for bid form
- The BottomSheet slides up from the bottom — no page navigation needed

my-bids.tsx:
- FlatList of submitted bids
- Status indicator: pending (grey), accepted (green), rejected (red)
- Tap → view the related job details

SHARED — Tab navigation in _layout.tsx:
- Clients: My Jobs | Browse Workers | Profile | Notifications
- Workers: Browse Jobs | My Bids | Profile | Notifications
- Use Expo Router's (tabs) group with bottom tab bar
```

---

### 6.3 — Push Notifications (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (expo-notifications API — changed significantly in SDK 50+) · PostgreSQL MCP (verify `expo_push_token` is saved: *"Use PostgreSQL MCP to show the expo_push_token column for a test user"*)
> 💡 Expo Notifications API changes between SDK versions. Say *"Use Context7 to check expo-notifications SDK 52 requestPermissionsAsync"* before writing the token registration code.

```
Add push notification support:

1. Install: npx expo install expo-notifications expo-device

2. Create mobile/services/notifications.ts:

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;  // won't work in simulator
  
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Save to backend — adds token to profiles.expo_push_token
  await api.put('/api/users/me', { expo_push_token: token });
  
  return token;
}

3. In the .NET backend, create Features/Notifications/SendPushNotification/:
   SendPushNotificationHandler.cs — sends HTTP POST to Expo's push API:
   https://exp.host/--/api/v2/push/send
   Body: { to: token, title, body, data: { type, reference_id } }
   
   Call this handler from AcceptBidHandler, SubmitBidHandler, etc. — 
   after inserting the DB notification record, also fire the push.
   
   Expo's push service is free and handles both iOS (APNs) and Android (FCM).
   You write one HTTP call; Expo routes it to the right platform automatically.

4. In mobile/app/_layout.tsx:
   - Call registerForPushNotifications() after successful login
   - Set up Notifications.addNotificationResponseReceivedListener to navigate 
     when user taps a notification (use data.type + data.reference_id to route)
```

---

## Phase 7 — Payment Integration (Stripe)

### Goal
Clients pay when marking a job complete; Workers receive payouts via Stripe Connect.

### Payment Flow

```
1. Client accepts a bid               → job status = 'accepted'
2. Worker completes the job           → client marks 'in_progress' → 'completed'
3. Client taps "Pay Now"              → frontend calls POST /api/payments/create-intent
4. Backend creates PaymentIntent      → returns { client_secret }
5. Client enters card in Stripe UI    → Stripe processes payment
6. Stripe calls your webhook          → backend confirms payment, releases to worker
7. Worker receives funds              → minus 10% platform fee (automatic via Stripe Connect)
```

**Analogy:** Stripe Connect is like a **trust account** used by lawyers. The money goes into a neutral holding account (Stripe), then distributed to the right party (worker) after conditions are met. You never touch the money.

---

### 7.1 — Create Payment Intent Feature (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (Stripe.net v47+ PaymentIntent and Connect API) · create-feature skill (auto-triggers for the VSA slice) · `/add-feature` command available
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 7 — Stripe Payments`
> 💡 Stripe.net API changes between major versions. Say *"Use Context7 to check Stripe.net PaymentIntentCreateOptions"* if the options class looks different.

```
Create the payment feature as a VSA slice in Features/Payments/:

CreatePaymentIntent/
  CreatePaymentIntentCommand.cs   — record with JobId, ClientId
  CreatePaymentIntentHandler.cs
  CreatePaymentIntentResponse.cs  — record with ClientSecret

CreatePaymentIntentHandler.cs logic:
1. Load job + accepted bid + worker profile
2. Verify requesting user is the client for this job
3. Verify job status is 'in_progress'
4. Calculate amount in cents: bid.price_estimate * 100
5. Calculate platform fee: amount * 0.10
6. Create Stripe PaymentIntent:

  StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
  var options = new PaymentIntentCreateOptions
  {
    Amount              = (long)amountInCents,
    Currency            = "usd",
    ApplicationFeeAmount = (long)feeInCents,
    TransferData = new PaymentIntentTransferDataOptions
    {
      Destination = workerProfile.StripeAccountId  // worker's Stripe Connect account
    },
    Metadata = new Dictionary<string, string>
    {
      ["job_id"]    = command.JobId.ToString(),
      ["client_id"] = command.ClientId.ToString()
    }
  };
  var intent = await new PaymentIntentService().CreateAsync(options);

7. Save intent.Id to jobs.stripe_payment_intent_id
8. Return new CreatePaymentIntentResponse(intent.ClientSecret)

HandleStripeWebhook/
  HandleStripeWebhookCommand.cs   — record with RawBody (string), StripeSignature (string)
  HandleStripeWebhookHandler.cs
  
HandleStripeWebhookHandler.cs logic:
1. Verify Stripe signature: StripeClient.ConstructEvent(rawBody, sig, webhookSecret)
   If verification fails → throw an exception (returns 400 to Stripe, which retries)
2. Switch on event.Type:
   "payment_intent.succeeded" →
     a. Extract job_id from event.Data.Object metadata
     b. Update job status to 'completed' 
     c. Create notifications for both client and worker

PaymentsController.cs:
  [HttpPost("create-intent")]  
  public async Task<IActionResult> CreateIntent([FromBody] CreatePaymentIntentRequest req)
    → dispatch CreatePaymentIntentCommand

  [HttpPost("webhook")]
  [AllowAnonymous]  // Stripe doesn't send JWT
  public async Task<IActionResult> Webhook()
  {
    var body = await new StreamReader(Request.Body).ReadToEndAsync();
    var sig  = Request.Headers["Stripe-Signature"];
    return Ok(await _mediator.Send(new HandleStripeWebhookCommand(body, sig!)));
  }

Worker Stripe Connect onboarding:
  WorkerConnectOnboard/
    WorkerConnectOnboardHandler.cs — creates Stripe Express account, returns onboarding URL
    
Test using: Stripe test card 4242 4242 4242 4242, any future date, any CVC
```

---

### 7.2 — Frontend Payment UI (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (@stripe/react-stripe-js and @stripe/stripe-react-native current API) · TypeScript LSP plugin (type-checks Stripe hook usage)
> 💡 Say *"Use Context7 to check @stripe/react-stripe-js v3 useStripe and CardElement"* before writing the payment form — Stripe's React SDK has had breaking changes between major versions.

```
Integrate Stripe Elements in React web:

1. Wrap app root with:
   <Elements stripe={loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)}>

2. Create src/components/PaymentForm.jsx:
   - useStripe() + useElements() hooks from @stripe/react-stripe-js
   - <CardElement> for secure card input (card data never touches your server)
   - On submit:
     a. POST /api/payments/create-intent with { job_id }
     b. Receive { client_secret }
     c. stripe.confirmCardPayment(clientSecret, { payment_method: { card: elements.getElement(CardElement) } })
     d. On success → show confirmation + update job status in UI via react-query invalidation
     e. On failure → show Stripe's error message

3. Show PaymentForm on JobDetailPage when:
   - Job status is 'in_progress'
   - Current user is the client

4. For mobile (React Native), use @stripe/stripe-react-native:
   - <StripeProvider publishableKey={STRIPE_KEY}>
   - initPaymentSheet() + presentPaymentSheet() — native bottom sheet
   - Same create-intent backend call, then present sheet with client_secret
```

---

## Phase 8 — Automated Testing

### 8.1 — Backend Unit Tests (Claude Code Prompt)

> 🔧 **Tools active:** stop-check hook (reminds when handlers lack tests) · Local-Review plugin *(add now: `claude plugin install local-review` — runs 5 parallel agents reviewing your code before commits)*
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 8 — Testing`
> 💡 **Local-Review tip:** After writing a set of tests, run a local review: `claude review` — it rates issues and only flags those scored 80+, so noise is low.

```
Write xUnit unit tests for VSA handlers in HandyLink.Tests/Unit/Features/:

Setup:
- Install: xunit, Moq, FluentAssertions, Microsoft.EntityFrameworkCore.InMemory

Jobs/CreateJobHandlerTests.cs:
  ✓ Valid command creates job and returns response
  ✓ Created job has 'Open' status
  ✓ Created job has correct ClientId from command

Jobs/GetJobsHandlerTests.cs:
  ✓ Returns only Open and Bidding jobs (not Completed or Cancelled)
  ✓ Filters by category correctly
  ✓ Paginates correctly (page 2 returns second set)

Bids/SubmitBidHandlerTests.cs:
  ✓ Valid bid creates bid record
  ✓ First bid on Open job changes job status to Bidding
  ✓ Second bid from same worker throws ConflictException
  ✓ Bid on Completed job throws ForbiddenException

Bids/AcceptBidHandlerTests.cs:
  ✓ Accepting bid sets it to Accepted
  ✓ Accepting bid rejects all other bids on the same job
  ✓ Wrong client throws ForbiddenException
  ✓ Non-existent bid throws NotFoundException

Reviews/CreateReviewHandlerTests.cs:
  ✓ Valid review saves to DB
  ✓ Duplicate review throws ConflictException
  ✓ Review on non-completed job throws ForbiddenException

Run: dotnet test
Target: 100% coverage on all Handler classes
```

---

### 8.2 — Backend Integration Tests (Claude Code Prompt)

```
Create integration tests using WebApplicationFactory:

Setup in HandyLink.Tests/Integration/CustomWebAppFactory.cs:
- Override database with in-memory PostgreSQL (or SQLite for simplicity)
- Override JWT validation with a TestJwtGenerator that creates valid test tokens
- Seed test data (users, jobs, bids) on startup

JobsControllerIntegrationTests.cs:
  GET /api/jobs returns 200 with job list
  GET /api/jobs without auth returns 401
  POST /api/jobs with valid body returns 201
  POST /api/jobs with missing title returns 400 (caught by ValidationBehaviour)
  GET /api/jobs/{nonexistentId} returns 404

BidsControllerIntegrationTests.cs:
  POST /api/jobs/{id}/bids with valid body returns 201
  POST /api/jobs/{id}/bids from wrong role returns 403
  PATCH /api/bids/{id}/accept from wrong client returns 403

Run: dotnet test HandyLink.Tests --filter Category=Integration
```

---

### 8.3 — Frontend Tests (Claude Code Prompt)

```
Setup: install jest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom

Write tests in frontend/tests/unit/:

JobCard.test.jsx:
  ✓ Renders job title, category badge, and city
  ✓ Shows "No bids yet" when bid_count is 0
  ✓ Shows bid count when > 0
  ✓ Clicking card fires onClick

LoginPage.test.jsx:
  ✓ Renders email and password inputs
  ✓ Shows error on failed login
  ✓ Submit button disabled while loading

PostJobForm.test.jsx:
  ✓ Shows validation error on empty title submit
  ✓ Shows validation error on missing category
  ✓ Calls onSubmit with correct data on valid form

Run: npm test
```

---

### 8.4 — E2E Tests with Playwright (Claude Code Prompt)

> 🔧 **Tools active:** Chrome DevTools MCP *(add now: enables Claude to inspect the running app during E2E debugging)* · Context7 MCP (@playwright/test v1.40+ API)
> 💡 Add Chrome DevTools MCP: `claude mcp add chrome-devtools -- npx @browsermcp/mcp@latest`
> Once active, you can say: *"Use Chrome DevTools MCP to check why the login button isn't responding"* while Playwright tests are running.

```
Setup: install @playwright/test, run npx playwright install

Create playwright.config.ts targeting http://localhost:5173

tests/e2e/auth.spec.ts:
  ✓ User can register as client (fills form, verifies redirect)
  ✓ User can log in and see dashboard
  ✓ Unauthenticated user redirected to /login

tests/e2e/jobs.spec.ts:
  ✓ Client can post a new job (form → submit → appears in list)
  ✓ Worker can see open jobs
  ✓ Worker can submit a bid
  ✓ Client can accept a bid (bid status changes in UI)

tests/e2e/review.spec.ts:
  ✓ Client can leave a review after job completion

Pattern for each test:
  1. Set up test data via API (don't click through UI for setup)
  2. Perform the user action via UI interactions
  3. Assert the expected UI state

Run: npx playwright test
Run with UI mode: npx playwright test --ui
```

---

## Phase 9 — CI/CD (GitHub Actions)

### 9.1 — Backend CI (Claude Code Prompt)

> 🔧 **Tools active:** GitHub MCP (creates the workflow file directly in the repo and verifies it appears under Actions) · Context7 MCP (GitHub Actions .NET 10 setup-dotnet syntax)
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 9 — CI/CD`
> 💡 After creating the workflow file, say: *"Use GitHub MCP to check if the workflow appeared in the Actions tab"*

```
Create .github/workflows/backend-ci.yml:

name: Backend CI
on:
  push:
    branches: [main, develop]
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

---

### 9.2 — Frontend CI (Claude Code Prompt)

> 🔧 **Tools active:** GitHub MCP · Context7 MCP (GitHub Actions Node.js setup syntax)

```
Create .github/workflows/frontend-ci.yml:

name: Frontend CI
on:
  push:
    branches: [main, develop]
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

      - run: npm ci
        working-directory: frontend

      - run: npm test -- --passWithNoTests
        working-directory: frontend

      - name: Build check
        run: npm run build
        working-directory: frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.VITE_STRIPE_PUBLIC_KEY }}
      
      # Vercel deploys automatically from GitHub — no extra step needed here

  e2e:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright install --with-deps
        working-directory: frontend
      - run: npx playwright test
        working-directory: frontend
```

---

### 9.3 — Mobile CI (Claude Code Prompt)

```
Create .github/workflows/mobile-ci.yml:

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

      - run: npm install -g eas-cli
      - run: npm ci
        working-directory: mobile

      - name: TypeScript check
        run: npx tsc --noEmit
        working-directory: mobile

      - name: EAS Preview Build
        run: eas build --platform all --profile preview --non-interactive
        working-directory: mobile
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        # EAS Build = Expo's free cloud build service
        # Produces an APK (Android) for direct install by testers
        # Expo Go app = fastest option during development (no build needed)
```

---

## Phase 10 — Deployment

### 10.1 — Deploy Backend to Render (Claude Code Prompt)

> 🔧 **Tools active:** Context7 MCP (.NET 10 Docker base image names) · GitHub MCP (add `RENDER_DEPLOY_HOOK_URL` as a repository secret directly: *"Use GitHub MCP to add a secret named RENDER_DEPLOY_HOOK_URL with value [your hook URL]"*)
> 📝 **Update CLAUDE.md:** Change `Current phase:` to `Phase 10 — Deployment`

```
Create backend/HandyLink.API/Dockerfile for .NET 10:

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["HandyLink.API/HandyLink.API.csproj",         "HandyLink.API/"]
COPY ["HandyLink.Core/HandyLink.Core.csproj",       "HandyLink.Core/"]
COPY ["HandyLink.Infrastructure/HandyLink.Infrastructure.csproj", "HandyLink.Infrastructure/"]
RUN dotnet restore "HandyLink.API/HandyLink.API.csproj"
COPY . .
RUN dotnet publish "HandyLink.API/HandyLink.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HandyLink.API.dll"]

In Program.cs, read Render's injected PORT environment variable:
builder.WebHost.UseUrls(
  $"http://0.0.0.0:{Environment.GetEnvironmentVariable("PORT") ?? "8080"}");

Render dashboard setup:
- New → Web Service → Connect GitHub repo
- Root Directory: backend/HandyLink.API
- Runtime: Docker
- Add env vars: ConnectionStrings__DefaultConnection, Supabase__Url, 
  Supabase__JwtSecret, Stripe__SecretKey, Stripe__WebhookSecret
- Copy Deploy Hook URL → add as RENDER_DEPLOY_HOOK_URL in GitHub Secrets
```

---

### 10.2 — Deploy Frontend to Vercel

**Manual steps:**
1. vercel.com → Add New → Project → Import GitHub repo
2. Root Directory: `frontend`
3. Add environment variables in Vercel dashboard
4. Vercel auto-deploys on every push to `main`
5. Every PR gets a unique preview URL — useful for E2E testing

---

### 10.3 — Deploy Mobile with EAS (Claude Code Prompt)

```
Set up Expo Application Services (EAS) for distributing to friends:

1. npm install -g eas-cli
2. In mobile/: eas login
3. eas build:configure  →  creates eas.json

Update eas.json:
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }  // APK = direct install, no store needed
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "simulator": false }
    }
  }
}

For sharing with friends right now (fastest):
  Option A — Expo Go (zero setup):
    npx expo start → share QR code → friends install Expo Go → scan and run instantly
    
  Option B — Preview APK (Android, no store):
    eas build --platform android --profile preview
    EAS emails you a download link for the APK
    Friends install it directly (enable "install from unknown sources" in Android settings)
    
  Option C — TestFlight (iOS, requires Apple Developer $99/year):
    eas build --platform ios --profile preview
    eas submit --platform ios → upload to TestFlight
    Friends get invite email from TestFlight app
```

---

## Postman Collection Guide (Claude Code Prompt)

```
Create postman/HandyLink.postman_collection.json with:

Environment variables: 
  base_url = http://localhost:5000 (dev) / https://handylink.onrender.com (prod)
  jwt_token = (populated automatically by a pre-request script)
  job_id, bid_id = (populated by test scripts after creation)

Collection structure:

📁 Auth
  POST {{base_url}}/api/auth/dev-token    ← dev-only endpoint returning a test JWT
  Test script: pm.environment.set("jwt_token", pm.response.json().token)
  
📁 Jobs
  GET  {{base_url}}/api/jobs              ← list with ?category=painting&city=Bucharest
  POST {{base_url}}/api/jobs              ← body: { title, description, category, city, budget_min, budget_max }
  GET  {{base_url}}/api/jobs/{{job_id}}
  PATCH {{base_url}}/api/jobs/{{job_id}}/status  ← body: { status: "in_progress" }
  
📁 Bids  
  POST {{base_url}}/api/jobs/{{job_id}}/bids   ← body: { price_estimate: 200, message: "..." }
  PATCH {{base_url}}/api/bids/{{bid_id}}/accept
  PATCH {{base_url}}/api/bids/{{bid_id}}/reject

📁 Reviews
  POST {{base_url}}/api/reviews            ← body: { job_id, worker_id, rating: 5, comment }

📁 Payments
  POST {{base_url}}/api/payments/create-intent       ← body: { job_id }
  POST {{base_url}}/api/payments/connect-onboard

📁 Workers
  GET {{base_url}}/api/workers
  GET {{base_url}}/api/workers/{{worker_id}}

📁 Users
  GET {{base_url}}/api/users/me
  PUT {{base_url}}/api/users/me

All protected endpoints: Pre-request script adds Authorization: Bearer {{jwt_token}}

After POST /api/jobs: test script sets pm.environment.set("job_id", pm.response.json().id)
After POST bid:       test script sets pm.environment.set("bid_id", pm.response.json().id)

This allows running the collection as a full workflow test (Auth → Create Job → Submit Bid → Accept → Pay).

If any Postman test reveals a bug, use the /fix-issue workflow:
  1. Create a GitHub issue describing the bug
  2. Type: /fix-issue {issue_number} in Claude Code
  3. Claude reads the issue, implements the fix, runs tests, opens a PR
```

---

## Security Checklist

> 🔒 **Hook-enforced rules (automatic, no manual check needed):**
> - `pre-bash-guard.sh` blocks EF migrations and secret file commits
> - `post-write-format.sh` ensures consistent .cs file formatting
> - `stop-check.sh` reminds you when handlers lack test coverage
>
> The items below require manual verification — the hooks cannot check them automatically.

### Authentication & Authorization
- [ ] JWT validated on every protected endpoint via `[Authorize]`
- [ ] User ID always extracted from JWT (not from request body)
- [ ] Role checks: only clients post jobs, only workers submit bids
- [ ] Users can only modify their own data (enforced in handlers)
- [ ] RLS enabled on all Supabase tables (second layer of defence)
- [ ] JWT secret stored in environment variables, never in code or repo

### Data & Inputs
- [ ] All commands validated by FluentValidation via pipeline behaviour
- [ ] SQL injection impossible (EF Core parameterised queries)
- [ ] Photo uploads validated for type (image only) and size (max 5MB)
- [ ] HTTPS enforced everywhere (automatic on Render + Vercel + Supabase)

### Payments
- [ ] Stripe webhook signature verified before processing any event
- [ ] Payment amounts calculated server-side (never trust client input)
- [ ] PCI compliance via Stripe Elements (card data never touches your server)
- [ ] Platform fee calculated server-side in handler

### Secrets
- [ ] Stripe secret key: backend only, never in frontend or mobile
- [ ] Supabase service role key: backend only
- [ ] All secrets in environment variables / GitHub Secrets / Render dashboard
- [ ] `.env` files in `.gitignore`

---

## Free Tier Limits Reference

| Service | Free Limit | When Exceeded |
|---|---|---|
| **Supabase DB** | 500 MB storage, 2 GB bandwidth/month | Project paused → upgrade $25/mo |
| **Supabase Auth** | 50,000 MAU | Auth calls fail |
| **Supabase Storage** | 1 GB | Uploads fail |
| **Render (Backend)** | 750 hrs/month; sleeps after 15 min inactive | Instance suspends → $7/mo |
| **Vercel (Frontend)** | 100 GB bandwidth, 100 builds/day | Throttled |
| **GitHub Actions** | Unlimited on public repos | N/A |
| **Expo EAS Build** | 30 builds/month | Blocked → $29/mo |
| **Stripe (test mode)** | Completely free | N/A |
| **Stripe (live)** | 2.9% + 30¢ per transaction | Per-transaction fee |

### Tips to Stay Free
- Use **Expo Go** during development — no EAS builds consumed
- Compress photos client-side before Supabase Storage upload
- Keep GitHub repos **public** for unlimited Actions minutes
- The Render cold start only affects first request after 15 min — fine for a test app

---

## Recommended Development Order

```
Week 0:   Phase 0  — Claude Code tooling setup (CLAUDE.md, hooks, MCP, skills)
Week 1:   Phase 1  — Repo & project bootstrap (.NET 10, React, Expo)
Week 2:   Phase 2  — Supabase database schema + RLS
Week 3:   Phase 3  — Backend: Clean Architecture (Jobs + Bids)
Week 4:   Phase 3  — Backend: Reviews + Notifications + Users
Week 5:   Phase 3.5 — Migrate backend to VSA + CQRS + update tests
Week 6:   Phase 4  — Authentication (Supabase Auth on web + mobile)
Week 7:   Phase 5  — Web frontend: core pages
Week 8:   Phase 5  — Web frontend: worker + profile pages
Week 9:   Phase 6  — Mobile: auth + client screens
Week 10:  Phase 6  — Mobile: worker screens + push notifications
Week 11:  Phase 7  — Stripe payments (backend + frontend + mobile)
Week 12:  Phase 8  — Testing (unit + integration + E2E)
Week 13:  Phase 9 + 10 — CI/CD pipelines + deployment
```

---

*HandyLink Project Plan v2.1 — Updated March 2026*
*Stack: ASP.NET Core 10 · React · React Native/Expo · Supabase · Stripe · Render · Vercel · GitHub Actions*
*Architecture: Clean Architecture (Phase 3) → VSA + CQRS (Phase 3.5+)*
*Claude Code: CLAUDE.md · Skills (create-feature, write-migration) · Hooks (pre-bash-guard, post-write-format, stop-check) · MCP (Context7, GitHub, PostgreSQL) · Commands (/add-feature, /fix-issue)*
