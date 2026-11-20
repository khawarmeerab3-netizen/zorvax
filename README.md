# ✦ Zorvax — Astrology App with Lyra AI

Zorvax gives every user a personal AI astrologer ("Lyra") grounded in their real
birth chart, numerology and daily transits. Built as a Turborepo monorepo:

| App / Package       | What it is                                              |
| ------------------- | ------------------------------------------------------- |
| `apps/web`          | Next.js 14 frontend (landing, auth, dashboard, chart)   |
| `apps/api`          | Fastify REST API (auth, charts, numerology, Lyra chat)  |
| `packages/shared`   | Shared TypeScript types                                 |
| `supabase/`         | PostgreSQL schema, migrations, RLS policies, seed data  |

## Quick start

```bash
# 1. Install
pnpm install

# 2. Configure (Supabase project + one AI key is enough to start)
cp .env.example .env
# edit .env — at minimum: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, JWT_SECRET

# 3. Database — paste supabase/schema.sql into the Supabase SQL editor
#    (or run the files in supabase/migrations/ in order)

# 4. Optional: local Redis for AI rate limiting / caching
docker compose up -d redis

# 5. Run everything
pnpm dev
# web → http://localhost:3000   api → http://localhost:3001
```

## Useful commands

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `pnpm build`      | Build all apps                        |
| `pnpm dev`        | Dev servers (web + api)               |
| `pnpm typecheck`  | TypeScript strict check across repo   |
| `pnpm test`       | Run all unit tests                    |
| `pnpm lint`       | Lint all apps                         |

## Lyra AI — free multi-provider system

`apps/api/src/lib/ai-provider.ts` implements the free-API design:

```
request → cache → Groq → Gemini → Mistral → Cohere → static fallback
```

Each provider has Redis-backed per-minute rate limiting, a circuit breaker
(5 failures opens the circuit for 60s), and 24h response caching, so the app
never blocks the user even when every provider is exhausted. Model IDs and
limits are environment-driven — update them in `.env` as providers change.

## Deploy

- Web → Vercel (`apps/web`)
- API → Railway (`apps/api`) — `backend` style start: `pnpm --filter api start`
- DB → Supabase (run `supabase/schema.sql`)

See `.github/workflows/` for the CI test and deploy pipelines.
