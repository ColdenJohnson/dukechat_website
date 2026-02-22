# DukeChat Portal

Simplified Next.js portal for:

- Landing + auth funnel
- Tiered credit purchases (`$10`, `$50`, `$100`)
- Neon/Postgres credit ledger with Prisma
- LiteLLM admin budget sync (`/budget/*`, `/customer/*`)
- Redirect handoff to OpenWebUI (DukeChat)

## Implemented product flow

1. User lands on `/`.
2. User logs in/signs up via Descope.
3. User buys a fixed tier from landing or `/subscription`.
4. Purchase is written to Postgres (`portal_users` + `credit_transactions`).
5. Portal syncs cumulative budget to LiteLLM admin APIs.
6. User continues to DukeChat via `NEXT_PUBLIC_OPENWEBUI_URL`.

## Core routes

Public pages:

- `/`
- `/login`
- `/signup`

Protected pages:

- `/dashboard`
- `/subscription`
- `/account`

API endpoints:

- `GET /api/plans` (public)
- `GET /api/me` (protected)
- `GET /api/dashboard` (protected)
- `GET /api/subscription` (protected)
- `POST /api/credits/buy` (protected, accepts `planId` only)
- `POST /api/budget/sync` (protected, manual budget/customer resync)

## Tech stack

- Next.js App Router
- Descope Next.js SDK
- Prisma ORM
- Neon Postgres
- LiteLLM Admin API

## Environment variables

Copy `.env.example` to `.env.local`, then copy to `.env` for Prisma CLI.

```bash
cp .env.example .env.local
cp .env.local .env
```

Required:

- `NEXT_PUBLIC_DESCOPE_PROJECT_ID`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `LITELLM_ADMIN_URL`
- `LITELLM_MASTER_KEY`

Optional:

- `NEXT_PUBLIC_OPENWEBUI_URL`

## Local setup

```bash
npm install
cp .env.local .env
npm run db:generate
npm run db:deploy
npm run dev -- --port 3001
```

Then test:

- `http://localhost:3001`
- `http://localhost:3001/login`
- `http://localhost:3001/subscription`
- `http://localhost:3001/dashboard`

## Notes

- Email identity is normalized as `trim().toLowerCase()` before DB/LiteLLM operations.
- Portal DB is source of truth for purchased cumulative credits.
- LiteLLM is source of truth for spend (`/customer/info`).
- Unknown users remain blocked by default in LiteLLM until budget sync unblocks them.
