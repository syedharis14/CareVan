# CareVan — Architecture Decision Records

Append-only. Every significant decision gets an entry — including "deferred" verdicts on
out-of-scope ideas. Newest at the bottom.

Format:

```
## ADR-NNNN: Title
- Date / Status (Accepted | Superseded by ADR-XXXX | Deferred)
- Context: why a decision was needed
- Decision: what we chose
- Consequences: what this locks in / trade-offs
```

---

## ADR-0001: pnpm-workspace monorepo with packages/shared as the API contract

- 2026-07-02 / Accepted
- Context: three deployables (backend, mobile, admin) share one API surface and one design
  system; drift between backend and mobile would break alerts silently.
- Decision: single repo, pnpm workspaces; all API request/response zod schemas and design tokens
  live in `packages/shared`, imported by all three consumers.
- Consequences: one PR changes contract + consumers atomically; every API change must touch
  `packages/shared` first (enforced by the api-contract-keeper agent).

## ADR-0002: One Expo app with two roles, not two apps

- 2026-07-02 / Accepted
- Context: driver and parent experiences differ, but two apps double build/review/update cost for
  a one-engineer team.
- Decision: single Expo app; role (DRIVER | PARENT) comes from the JWT at login and selects the
  navigation stack.
- Consequences: one EAS pipeline, one store listing later; role separation enforced in
  navigation + API guards, not at install time.

## ADR-0003: Phone + PIN auth, admin-provisioned accounts, no OTP

- 2026-07-02 / Accepted
- Context: OTP requires SMS infrastructure (cost, deliverability in Pakistan, extra failure
  mode); v1 accounts are onboarded face-to-face by the founder anyway.
- Decision: admin creates accounts with phone + PIN; login = phone + PIN → JWT. No OTP/SMS in v1.
- Consequences: PINs are low-entropy — hash (argon2id) and rate-limit login per phone. OTP can
  be added later without schema change.

## ADR-0004: No payment gateway in v1; manual payment records

- 2026-07-02 / Accepted
- Context: subscriptions start as cash/bank-transfer collected personally; gateway integration
  is premature.
- Decision: admin records payments manually (PaymentRecord with method CASH | TRANSFER).
  Schema keeps Subscription/PaymentRecord separate so a gateway can append later.
- Consequences: no card flows, no webhooks in v1; billing truth is the admin's ledger.

## ADR-0005: expo-dev-client is mandatory; Expo Go is unsupported

- 2026-07-02 / Accepted
- Context: background location (the driver tracking core) does not work in Expo Go.
- Decision: development uses a dev-client build; EAS profiles `development` (internal dev client)
  and `preview` (APK for sideloading the Oppo F21 Pro).
- Consequences: first build per platform needs EAS; docs/agents must never suggest Expo Go.

## ADR-0006: Offline-first driver app — local queue before network, always

- 2026-07-02 / Accepted
- Context: driver connectivity is unreliable; a missed BOARDED alert is a critical failure.
- Decision: every trip event and ping is written to a persistent local queue (SQLite/MMKV) with a
  client-generated UUID before any upload; uploader drains in batches with backoff; server
  dedupes by id.
- Consequences: retries are always safe (idempotent ingestion); queue must survive app kill;
  no per-ping uploads anywhere.

## ADR-0007: AlertLog precedes dispatch — no untraceable alert, ever

- 2026-07-02 / Accepted
- Context: alert delivery reliability is the product; a push that fails invisibly is the
  worst-case failure.
- Decision: the pipeline is TripEvent → AlertLog(CREATED) → push dispatch (SENT) → receipt poll
  (DELIVERED | FAILED). Creating the AlertLog row is a precondition of dispatch.
- Consequences: the admin alert audit is complete by construction; SMS_FALLBACK stays in the
  enum for later but is not built in v1.

## ADR-0008: Red (#D64541) is reserved exclusively for SOS/danger

- 2026-07-02 / Accepted
- Context: CareVan is a trust product; if red appears for form errors or delete buttons, it stops
  meaning "your child may be in danger".
- Decision: danger red is used only for SOS and overspeed. Safe green (#1B873F) is the emotional
  hero color; transit amber (#E8A13D) for en-route. Status always ships icon + label, never color
  alone; text contrast >= 4.5:1.
- Consequences: destructive admin actions use ink/primary styling, not red.

## ADR-0009: Demo mode replays through the production pipeline

- 2026-07-02 / Accepted
- Context: demo mode is the founder's sales tool; a faked parallel path would rot and lie about
  what the product does.
- Decision: demo = a real Trip on seeded demo entities; a scheduler replays scripted Lahore-route
  pings and the BOARDED event through the same ingestion/alert/geofence code as production.
  REACHED_SCHOOL derives from real geofence logic (~60 s after BOARDED by script design).
- Consequences: every demo is also an end-to-end pipeline test; demo trips are excluded from
  safety scores, activeDays/payouts, and billing.

## ADR-0010: activeDays is computed server-side from pings

- 2026-07-02 / Accepted
- Context: drivers are paid per verified active day — a direct financial incentive to spoof.
- Decision: activeDays = days with a COMPLETED trip having more than N location pings, computed
  from LocationPing on the server. No client-reported counters.
- Consequences: payout math is auditable from raw pings; N is tunable server-side.

## ADR-0011: Local Postgres via docker compose; Prisma migrate-only workflow

- 2026-07-02 / Accepted
- Context: reproducible local dev for a growing schema with seeded demo data.
- Decision: `docker compose up -d postgres` (Postgres 16); schema evolves only via
  `prisma migrate dev` — `db push` is banned on shared branches; extend the locked data model
  additively only.
- Consequences: migration history is the schema's source of truth; fresh clone → compose up →
  migrate → seed → working demo.
