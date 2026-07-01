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
