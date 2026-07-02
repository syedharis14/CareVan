# admin/ — founder's internal tool

Next.js (App Router) + Tailwind. Desktop web, used by exactly one person: the founder. Read the
root CLAUDE.md first; the locked v1 scope applies.

## Philosophy

**Speed over polish.** Plain tables and forms are fine; nobody is selling this UI. But the design
tokens still apply — map tokens from `@carevan/shared` into the Tailwind theme / CSS variables:
trust-blue chrome, semantic status colors, and red reserved for SOS/danger only.

## What it does (v1)

- CRUD: schools, vans, drivers, students, parents, student↔parent and van↔student (stopOrder)
  mappings. Accounts + PINs are created here — there is no self-signup anywhere.
- Live trip map: active trips with latest pings.
- Subscriptions: status view + mark-paid (manual CASH/TRANSFER PaymentRecord). No gateway.
- Driver payouts: server-computed activeDays per month, amount, mark paid.
- Alert audit log: every AlertLog with its status trail (CREATED → SENT → DELIVERED/FAILED) —
  this page is how we prove alert reliability to ourselves.
- **DEMO MODE trigger** — prominent one-click button + live progress of the scripted trip.

## Patterns

- Session auth against the backend (ADMIN-role JWT in an httpOnly cookie); protect every route
  via middleware.
- Server components + plain `fetch` to the backend; parse responses with zod schemas from
  `@carevan/shared` — drift dies here too.
- Tables: plain HTML + Tailwind, no heavyweight grid libraries. Forms: whichever of server
  actions / simple client forms is fastest to ship correctly.

## Implemented structure (Phase 5)

- **Auth**: `lib/auth-actions.ts` `loginAction` posts to backend `/auth/login`, rejects non-ADMIN,
  sets the JWT in an httpOnly cookie (`carevan_admin`); `middleware.ts` gates every route except
  `/login`; `lib/api.ts` sends the cookie's bearer token and redirects to `/login` on 401.
- **Data**: `lib/api.ts` `apiGet`/`apiSend` parse every backend response through a `@carevan/shared`
  zod schema. Mutations live in `lib/actions.ts` (`'use server'`) and `revalidatePath` after.
  Data pages are `export const dynamic = 'force-dynamic'`.
- **Pages** (`app/(app)/`): dashboard, live (map), schools, vans (+roster), users (drivers/parents),
  students (+parent link), subscriptions (+record payment / cancel), payouts (+mark paid), alerts.
- **Live map**: `react-leaflet` + OpenStreetMap tiles (no API key). It MUST be loaded via
  `next/dynamic({ ssr:false })` (see `components/LiveMap.tsx` → `LeafletMap.tsx`) — leaflet touches
  `window` at import time and crashes SSR otherwise. The map polls `/api/live` (a route handler
  that proxies the backend with the server-side cookie) every 10s.
- **Tokens**: `components/TokenStyle.tsx` injects `@carevan/shared` `cssVariables` on `:root`; use
  the `cv-*` classes in `globals.css` (which reference the vars). Never hardcode hex. Red
  (`--color-danger`) is SOS/overspeed ONLY — a FAILED alert delivery shows amber, not red.
- Dev: `pnpm --filter @carevan/admin dev` on `:3002`; set `BACKEND_URL` (defaults to `:3005`).
