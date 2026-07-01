# backend/ — NestJS API

NestJS 11 + Prisma + PostgreSQL + JWT. Read the root CLAUDE.md first; the locked v1 scope applies
to everything here.

## Module layout (`src/`)

- `auth/` — phone + PIN login → JWT; role guard (PARENT | DRIVER | ADMIN). Accounts are
  admin-created; there is **no signup and no OTP**.
- `users/`, `schools/`, `vans/`, `students/` — CRUD + mappings (StudentParent, VanStudent with
  stopOrder).
- `trips/` — trip lifecycle (start/end/abort), TripEvents (BOARDED/DROPPED/ABSENT), batched
  LocationPing ingestion, geofence derivation (REACHED_SCHOOL / REACHED_HOME), overspeed
  SafetyEvents.
- `alerts/` — the alert pipeline (below). The product's spine.
- `billing/` — Subscription, PaymentRecord (manual CASH/TRANSFER only), DriverPayout
  (activeDays server-computed).
- `demo/` — demo-mode trigger + scripted Lahore route replay.
- `prisma/` — schema, migrations, seed.

Controllers stay thin: validate with zod schemas from `@carevan/shared` (zod validation pipe),
delegate to services. class-validator may back Nest's built-in pipes, but the contract of record
is always the shared zod schema.

## Prisma workflow

- Schema change → `pnpm prisma migrate dev --name <change>`. **Never `prisma db push`** on shared
  branches — migrations are the history.
- Extend the locked data model **additively only**: new columns nullable or defaulted; never
  repurpose an enum value.
- Seed: `pnpm prisma db seed` — realistic Lahore data (schools, vans, students, parents, demo
  route) so the founder's demo works from a fresh database.

## Auth pattern

- `POST /auth/login` `{ phone, pin }` → verify against `pinHash` (argon2id) → JWT `{ sub, role }`.
- Global `JwtAuthGuard` + `@Roles()` decorator; every route declares its roles explicitly.
- PINs are 4–6 digits — always hashed, and login is rate-limited per phone to compensate for the
  small keyspace.

## Alert pipeline (never bypass)

TripEvent (or geofence/overspeed derivation) → AlertService:

1. Create an `AlertLog` row (status `CREATED`) for **each** parent recipient — **before any
   dispatch. No AlertLog row, no push. Ever.**
2. Dispatch via the Expo Push API (batched) → status `SENT` (store the push ticket id).
3. A scheduled job polls Expo receipts → `DELIVERED` or `FAILED` (+ error detail).
4. `FAILED` alerts surface in the admin audit log. The `SMS_FALLBACK` channel exists in the enum
   for later — **do not build SMS in v1**.

Alert types: BOARDED, DROPPED, REACHED_SCHOOL, REACHED_HOME (geofence around school/home
coordinates during an ACTIVE trip; fire once per trip per target), OVERSPEED, SOS.

Idempotency: trip events carry client-generated ids; ingestion dedupes so offline-queue retries
never double-alert a parent.

## Location ingestion

- `POST /trips/:id/pings` accepts **batches** (arrays) — never build a single-ping endpoint.
- Insert with `createMany`; the `(tripId, at)` index exists — keep hot queries on it.
- Overspeed: compare `speedKmh` against the limit; record a SafetyEvent and emit a **throttled**
  OVERSPEED alert (max one per few minutes per trip — don't spam parents).

## Demo mode (first-class — the founder's sales demo)

- Admin triggers `POST /demo/start` → creates a **real** Trip on seeded demo entities (demo van /
  school / student / parent), then a replay scheduler emits the scripted Lahore route pings +
  BOARDED event, with REACHED_SCHOOL derived by the **real geofence logic**, all through the
  **same ingestion/alert pipeline** as production traffic. No parallel code path, no hardcoded
  pushes, no timers that bypass geofencing.
- Script shape: realistic Lahore coordinates and speeds; BOARDED early in the run; REACHED_SCHOOL
  ~60 s after BOARDED; whole demo lasts a few minutes.
- Demo trips are **excluded** from safety scores, activeDays/payouts, and billing.
- The `demo-master` agent re-verifies the demo path after any trips/alerts change.

## Derived logic rules

- `DriverPayout.activeDays` = count of days with a COMPLETED trip having more than N pings —
  computed **server-side** from LocationPing. Never trust a client-sent counter.
- REACHED_* alerts derive from a geofence radius around school/home coordinates during an active
  trip — they are never client-declared.
