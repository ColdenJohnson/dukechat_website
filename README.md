# DukeChat Portal

Production-oriented Next.js portal for:

- Landing + SaaS-style funnel
- Descope auth (login/signup)
- Tiered credit purchases (`$10`, `$50`, `$100`)
- Neon/Postgres persistence with Prisma
- Authenticated LiteLLM AI routing from a protected workspace

## Implemented product flow

1. User lands on `/` and sees marketing + tier cards.
2. User logs in/signs up via Descope.
3. User buys one of three fixed tiers from landing or `/subscription`.
4. Purchase is written to Postgres (`portal_users` + `credit_transactions`).
5. User opens `/workspace` and sends prompts routed through LiteLLM with identity headers.

## Core routes

Public pages:

- `/`
- `/login`
- `/signup`

Protected pages:

- `/dashboard`
- `/subscription`
- `/account`
- `/workspace`

API endpoints:

- `GET /api/plans` (public)
- `GET /api/me` (protected)
- `GET /api/dashboard` (protected)
- `GET /api/subscription` (protected)
- `POST /api/credits/buy` (protected, accepts `planId` only)
- `POST /api/budget/sync` (protected, LiteLLM budget sync boundary)
- `GET /api/ai/models` (protected)
- `POST /api/ai/chat` (protected)

## Tech stack

- Next.js App Router
- Descope Next.js SDK
- Prisma ORM
- Neon Postgres
- LiteLLM Proxy (model routing)

## Environment variables

Copy `.env.example` to `.env.local`, then copy to `.env` for Prisma CLI.

```bash
cp .env.example .env.local
cp .env.local .env
```

Required:

- `NEXT_PUBLIC_DESCOPE_PROJECT_ID`
- `NEXT_PUBLIC_DESCOPE_FLOW_ID`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `LITELLM_PROXY_URL`
- `LITELLM_API_KEY`

Optional:

- `LITELLM_ADMIN_URL`
- `LITELLM_MASTER_KEY`
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
- `http://localhost:3001/workspace`

## Database schema highlights

- `portal_users`
  - `email` (primary key)
  - `descope_sub`
  - `current_plan`
  - `available_credits_cents`
  - `lifetime_credits_cents`
  - `monthly_budget_cents`
  - `monthly_spent_cents`
- `credit_transactions`
  - typed transaction history including `plan_tier` and `credits_added_cents`

## Notes

- Credits are currently "top-up style" and immediately applied to stored balances.
- Payment processor checkout/webhook integration is intentionally not added in this pass.
- Rotate credentials if secrets have ever been pasted to logs/chat.

// Note: If there are issues with env variables on vercel deployment but not in local dev, ensure that the env variable is put in vercel

TODO: Should let user log in with just 1 click between applications https://docs.descope.com/identity-federation/applications/oidc-apps?utm_source=chatgpt.com
