# CareVan — root context

CareVan is a child-safety subscription layer on top of Pakistan's
existing school-van arrangements: live van tracking, proactive boarded/dropped/reached push alerts,
a daily speed-based driver safety score, and SOS. Parents pay monthly; drivers run a dead-simple
app and are paid by us for verified active usage in Phase 1.

**The hero feature is the proactive alert, not the map.** A missed BOARDED alert is a critical
failure, not a bug. Alert delivery reliability outranks every other concern in every trade-off.

Brand: use "CareVan" in all app names, package ids (`com.aamirtech.carevan`), repo naming, and UI
copy. (The name is a triple pun: Care+Van in English; spoken "caravan"; Urdu کارواں "karwan" —
travelers grouping for safety.)

## Locked v1 scope — DO NOT EXPAND

1. **ONE Expo app** with two roles (DRIVER | PARENT) decided at login. Not two apps.
2. Auth = **phone + PIN**; accounts created by admin. **NO OTP / SMS infrastructure.**
3. **NO payment gateway**: admin records cash/transfer payments manually. Schema must stay
   gateway-ready, but no integration is built.
4. Safety score v1 = **GPS overspeed only**. No accelerometer / harsh-braking detection.
5. **No** route optimization, **no** chat, **no** marketplace, **no** search/booking.
6. **DEMO MODE is required and first-class**: admin-triggered scripted fake trip on a real Lahore
   route — van moves, BOARDED push fires live on the parent phone, REACHED SCHOOL fires ~60 s
   later. This is the founder's sales demo at school gates.

Anything not on this list is Phase 2+. Flag it (record as "deferred" in `docs/DECISIONS.md`);
do not build it. The `scope-guard` agent reviews all plans/diffs against this list.

## Monorepo map

| Path               | What                                            | Stack                                                 |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------- |
| `backend/`         | API, alert pipeline, demo engine                | NestJS 11, Prisma, PostgreSQL, JWT                    |
| `mobile/`          | ONE app, DRIVER + PARENT roles                  | Expo + expo-dev-client, TS, zustand, React Navigation |
| `admin/`           | Founder's internal desktop web tool             | Next.js App Router, Tailwind                          |
| `packages/shared/` | API contract (zod), shared types, design tokens | TypeScript + zod                                      |
| `docs/`            | `PRD.md` (product truth), `DECISIONS.md` (ADRs) | —                                                     |

Each of `backend/`, `mobile/`, `admin/` has its own CLAUDE.md with subsystem rules — read it
before working there.

## Stack & tooling

- pnpm workspaces (`pnpm-workspace.yaml`); Node >= 20; TypeScript strict everywhere.
- `tsconfig.base.json` is the shared TS base — extend it, don't fork it.
- Local Postgres: `docker compose up -d` (root `docker-compose.yml`).
- ESLint (flat config, root-level) + Prettier: `pnpm lint`, `pnpm format`.

## Design tokens

Single source: `packages/shared/src/tokens.ts`. Never hardcode a hex value in `mobile/` or
`admin/` — consume the tokens.

- primary `#0F4C81` (deep trust blue), primary-light `#E8F1F8`, safe `#1B873F` (the emotional
  hero — "child is safe"), transit `#E8A13D` (en route / ETA), danger `#D64541`,
  ink `#1A2430` / ink-soft `#5A6B7C`, surface `#FFFFFF`, bg `#F5F7FA`.
- **Red (`#D64541`) is EXCLUSIVELY for SOS and overspeed.** Not form errors, not delete buttons.
- Radii: 12 px cards, 10 px buttons. Subtle single shadow, no glassmorphism.
- Type: Inter; body 16; driver-app primary actions 18–20 semibold; touch targets >= 56 px.
- Accessibility: text contrast >= 4.5:1; status is never color-only — always icon + label.

## Coding conventions

- TypeScript strict; `any` is banned (lint enforces `@typescript-eslint/no-explicit-any`).
- zod at every boundary: API requests/responses, offline-queue payloads, env parsing.
- **Every API change updates `packages/shared` first, then both consumers.** Backend and mobile
  must never drift — the `api-contract-keeper` agent verifies.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:` …).
- Prisma migrations only via `prisma migrate dev`; **never `db push`** on shared branches.
- Every significant decision gets an ADR appended to `docs/DECISIONS.md`.
- Offline-first driver app: every event/ping is written to the local queue before any network call.
- No alert is ever dispatched without an `AlertLog` row created first.

## Sub-agents (`.claude/agents/`)

- `scope-guard` — run before starting any feature work; blocks scope creep.
- `code-reviewer` — run on significant diffs; checks queue/alert/zod/battery correctness.
- `api-contract-keeper` — run whenever an endpoint or DTO changes.
- `mobile-field-tester` — generates real-device checklists before founder field tests.
- `demo-master` — re-verifies the demo path after any change to trips/alerts/pings/push.

## Execution discipline

Build proceeds in phases 0–6 (see `docs/PRD.md` → Build phases). Exactly ONE phase per founder
instruction; stop for review between phases.
