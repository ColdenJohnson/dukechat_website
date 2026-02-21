npm install
cp .env.local .env
npm run db:generate
npm run db:migrate -- --name init
npm run dev -- --port 3001












# DukeChat Portal (Vercel + Next.js)

Minimal portal scaffold for the DukeChat SaaS flow:

- **OpenWebUI** handles chat UI.
- **LiteLLM Proxy** will enforce usage and budget limits.
- This repo is the **portal app** for end users.
- **Email is the primary identity key**.
- `descope_sub` is stored as secondary metadata.

## What is implemented now

- Next.js App Router scaffold for Vercel deployment.
- Descope auth wired end-to-end for login + protected pages.
- Prisma/Postgres real data layer (designed for Neon).
- End-user pages:
  - `/` landing
  - `/login` (Descope)
  - `/dashboard` (protected)
  - `/account` (protected)
  - `/subscription` (protected placeholder)
- API route stubs:
  - `GET /api/me`
  - `GET /api/dashboard`
  - `GET /api/subscription`
  - `POST /api/credits/buy` (mock credit purchase, no payment integration)
  - `POST /api/budget/sync` (stub payload + `lib/litellm.ts` sync boundary for future LiteLLM admin sync)
  - `POST /api/logout`

## What is intentionally not implemented yet

- Real payment processing / subscription billing.
- Outbound LiteLLM admin API calls.
- Background jobs/webhook processing.

## Tech stack

- Next.js 15 (App Router)
- React 19
- Descope Next.js SDK
- Prisma ORM
- Postgres (Neon-ready)

## Environment variables

Copy `.env.example` to `.env.local` and set values.

```bash
cp .env.example .env.local
```

Prisma CLI reads `.env` by default, so also copy DB vars into `.env` for local Prisma commands:

```bash
cp .env.local .env
```

Required for this scaffold:

- `NEXT_PUBLIC_DESCOPE_PROJECT_ID`
- `POSTGRES_PRISMA_URL` (pooled Neon connection; used by Prisma client/runtime)
- `POSTGRES_URL_NON_POOLING` (direct Neon connection; used by Prisma migrations)

Optional (future LiteLLM sync work):

- `LITELLM_ADMIN_URL`
- `LITELLM_MASTER_KEY`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run db:generate
```

3. Create database schema:

```bash
npm run db:migrate -- --name init
```

If you use Neon + Vercel integration, these variables map directly to what Neon/Vercel provide.

4. Start dev server:

```bash
npm run dev
```

## Database model summary

- `portal_users`
  - `email` (**primary key**)
  - `descope_sub` (nullable metadata)
  - `display_name`
  - `monthly_budget_cents`
  - `monthly_spent_cents`
- `credit_transactions`
  - mock ledger entries for budget top-ups in this scaffold

## Notes on identity

- Portal auth is Descope-based.
- Session extraction expects an email claim and treats it as canonical user ID.
- If email is missing from token/session claims, protected routes cannot resolve a portal user.

## Recommended next implementation pass

1. Wire `POST /api/budget/sync` to LiteLLM admin API using secure server-side key handling.
2. Add admin controls for monthly caps.
3. Add real payment provider integration and webhook ingestion.
4. Add monthly spend ingestion from LiteLLM usage into `monthly_spent_cents`.
