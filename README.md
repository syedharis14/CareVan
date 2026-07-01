# CareVan

School-van child-safety platform for Pakistan, by Aamir Technologies. Parents get live van
tracking, proactive boarded/dropped/reached push alerts, a daily driver safety score, and SOS —
as a monthly subscription on top of their existing van arrangement.

- Product source of truth: [docs/PRD.md](docs/PRD.md)
- Decision log: [docs/DECISIONS.md](docs/DECISIONS.md)
- Working conventions: [CLAUDE.md](CLAUDE.md) (root) + per-package CLAUDE.md files

## Layout

| Path               | What                                           |
| ------------------ | ---------------------------------------------- |
| `backend/`         | NestJS 11 + Prisma + PostgreSQL API            |
| `mobile/`          | Expo app (one app, DRIVER + PARENT roles)      |
| `admin/`           | Next.js internal admin panel                   |
| `packages/shared/` | zod API contracts, shared types, design tokens |

## Getting started

```bash
corepack enable pnpm   # pnpm 10.x
pnpm install
pnpm db:up             # local Postgres 16 via docker compose (host port 5433)
pnpm --filter @carevan/shared build

cd backend
cp .env.example .env   # then set a real JWT_SECRET: openssl rand -hex 32
pnpm prisma migrate dev
pnpm prisma db seed    # realistic Lahore demo data — prints dev login credentials
pnpm start:dev         # API on http://localhost:3005
```
