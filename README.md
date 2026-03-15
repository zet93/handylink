# HandyLink

A two-sided marketplace where **Clients** post jobs (painting, electrical, plumbing, etc.) and **Workers** bid on them. Review-based trust system, global from day 1.

## Architecture

```
handylink/
├── backend/          ASP.NET Core 10 Web API (C#)
│   ├── HandyLink.API             Entry point, controllers, middleware
│   ├── HandyLink.Infrastructure  DbContext, EF Core, repositories
│   └── HandyLink.Core            Entities, interfaces, DTOs
├── frontend/         React + Vite + Tailwind CSS
└── mobile/           React Native + Expo Router (TypeScript)
```

```
Request flow (backend):
  Client / Mobile App
       │
       ▼
  GlobalExceptionMiddleware
       │
       ▼
  JWT Authentication (Supabase HS256)
       │
       ▼
  Controller → MediatR → Feature Handler → EF Core → PostgreSQL (Supabase)
```

## Prerequisites

- **Node.js** 20+
- **.NET 10 SDK**
- **Expo CLI** — `npm install -g expo-cli` (or use `npx expo`)
- **Supabase** project (free tier works)
- **Stripe** account (for payments, optional during dev)

## Local Setup

### Backend

```bash
cd backend/

# Restore and build
dotnet build

# Set user secrets (one-time)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your-postgres-url>" --project HandyLink.API
dotnet user-secrets set "Supabase:JwtSecret" "<your-supabase-jwt-secret>" --project HandyLink.API
dotnet user-secrets set "Supabase:Url" "<your-supabase-url>" --project HandyLink.API

# Run (http://localhost:5272)
dotnet run --project HandyLink.API
```

### Frontend

```bash
cd frontend/

cp .env.example .env.local   # fill in values
npm install
npm run dev                   # http://localhost:5173
```

### Mobile

```bash
cd mobile/

cp .env.example .env.local   # fill in values
npm install
npx expo start               # scan QR with Expo Go, or press a/i for emulator
```

## Environment Variables

### Backend (`backend/HandyLink.API/appsettings.json` or user secrets)

| Key | Description |
|-----|-------------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string (Supabase direct URL) |
| `Supabase:JwtSecret` | HS256 JWT secret from Supabase project settings |
| `Supabase:Url` | Supabase project URL |
| `Stripe:SecretKey` | Stripe secret key |
| `Stripe:WebhookSecret` | Stripe webhook signing secret |

### Frontend (`frontend/.env.local`)

| Key | Description |
|-----|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_URL` | Backend API base URL |

### Mobile (`mobile/.env.local`)

| Key | Description |
|-----|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_API_URL` | Backend API base URL (use machine IP for device testing, e.g. `http://192.168.x.x:5272`) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | ASP.NET Core 10, C#, MediatR (CQRS) |
| Frontend | React 18, Vite, Tailwind CSS |
| Mobile | React Native, Expo SDK 55, Expo Router |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT HS256) |
| Payments | Stripe + Stripe Connect |
| Hosting | Render (API), Vercel (web), EAS (mobile) |
