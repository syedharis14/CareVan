# CareVan

School-van child-safety platform for Pakistan. Parents get live van
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
pnpm prisma migrate deploy
pnpm prisma db seed    # realistic Lahore demo data — prints dev login credentials
pnpm start:dev         # API on http://localhost:3005
```

Then, in separate terminals:

```bash
# Admin panel (Next.js) — http://localhost:3002
cd admin && cp .env.example .env && pnpm dev

# Mobile app (Expo dev-client — NOT Expo Go; needs an EAS dev build on a device)
cd mobile && pnpm start
# set EXPO_PUBLIC_API_URL to the machine's LAN IP for a real device
```

## Seeded logins (dev only)

| Role   | Phone           | PIN  |
| ------ | --------------- | ---- |
| Admin  | `+923214000001` | 7788 |
| Driver | `+923004561122` | 1122 |
| Parent | `+923331234501` | 3344 |
| Demo   | `+923000000001` | 1234 |

## Demo mode

Admin → **Demo mode** → **Start demo** runs a scripted Gulberg-route trip through the real
pipeline; sign the phone in as the Demo parent (`+923000000001` / 1234) to receive the live
BOARDED and REACHED-SCHOOL pushes. Runbook: [docs/field-tests/2026-07-02-demo-day.md](docs/field-tests/2026-07-02-demo-day.md).
