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

## ADR-0012: zod-only validation — class-validator omitted

- 2026-07-02 / Accepted
- Context: the original brief listed class-validator in the backend stack, but the conventions
  make packages/shared zod schemas the contract of record; two validation systems would mean two
  places for a rule to live (and drift).
- Decision: a single ZodValidationPipe validates every request against the shared schemas;
  responses are parsed through the shared schemas too (which strips fields like pinHash by
  construction). class-validator/class-transformer are not installed.
- Consequences: one validation source of truth; any DTO change is forced through packages/shared.

## ADR-0013: 30-day JWT, no refresh flow; PIN brute force handled by lockout

- 2026-07-02 / Accepted
- Context: drivers/parents must not be asked to re-enter a PIN mid-week, and refresh-token
  infrastructure is not v1-scope. PINs are 4–6 digits — low entropy by design.
- Decision: single access token, 30-day expiry; logout discards it client-side. Brute force is
  mitigated server-side: argon2id hashing, per-IP route throttling (5 login calls/min), and a
  per-phone lockout (5 failed PINs → 15-minute lock, in-memory, single-instance assumption).
  Login returns the same 401 for unknown phone vs wrong PIN so phone numbers can't be enumerated.
- Consequences: a stolen token is valid up to 30 days (acceptable v1 trade-off; revisit with
  refresh tokens if it ever matters); lockout state resets on server restart. Role changes and
  account deletions also only take effect at token expiry — there is no revocation list in v1.

## ADR-0014: Fail-closed authorization — every route declares @Roles or @Public

- 2026-07-02 / Accepted
- Context: a forgotten guard on a new endpoint must not silently expose data.
- Decision: RolesGuard rejects any non-@Public route that carries no @Roles metadata (403), so an
  undeclared route fails loudly in the first manual test instead of shipping open.
- Consequences: slight ceremony on every controller; impossible to add an accidentally-public
  endpoint.

## ADR-0015: Local dev ports — Postgres on 5433, API on 3005

- 2026-07-02 / Accepted
- Context: the dev machine already runs a system Postgres on 5432 and another service on 3001,
  which shadowed the CareVan container and blocked the API during Phase 1 verification.
- Decision: docker-compose maps Postgres to host port 5433; the API defaults to PORT=3005 via
  backend/.env. Both are dev-machine conveniences, not production choices.
- Consequences: connection strings in .env.example use 5433; mobile/admin dev configs must point
  at :3005.

## ADR-0016: AlertLog carries type + full audit columns (additive extension)

- 2026-07-02 / Accepted
- Context: code review of Phase 1 flagged that the locked AlertLog shape couldn't support the
  documented audit trail: REACHED_*/OVERSPEED/SOS alerts have no TripEvent (tripEventId null), so
  rows were indistinguishable in the audit log, and the pipeline stores a push ticket id at SENT
  and error detail at FAILED with per-transition timestamps.
- Decision: extend AlertLog additively with `type` (AlertType enum: BOARDED, DROPPED,
  REACHED_SCHOOL, REACHED_HOME, OVERSPEED, SOS), `pushTicketId?`, `errorDetail?`, `sentAt?`,
  `deliveredAt?`. Mirrored as AlertTypeEnum in packages/shared.
- Consequences: the admin alert audit is fully readable for every alert type; `type` also serves
  as the "fire once per trip per target" dedupe key for geofence alerts in Phase 2.

## ADR-0017: Alert pipeline semantics (Phase 2)

- 2026-07-02 / Accepted
- Context: the trip engine needed concrete answers the PRD leaves open: who receives which
  alert, how push targets are stored, and how the pipeline survives crashes.
- Decision:
  - PushToken model (additive): token is the unique key, re-homed on account switch; dispatch
    uses the user's most-recently-updated token only. Registered via PUT /me/push-token,
    cleared on logout via DELETE.
  - AlertLog gains `message` (exact text sent — audit truth) and `studentId?` (which child),
    both additive.
  - Recipients: BOARDED/DROPPED → that student's parents. REACHED_SCHOOL (PICKUP only, once
    per trip) → parents of boarded students, one row per parent-student pair. REACHED_HOME
    (DROPOFF only, once per student, while the student is still aboard) → that student's
    parents. OVERSPEED → parents of students currently aboard, throttled to one alert per trip
    per cooldown (SafetyEvents record every offending ping regardless).
  - ABSENT events are recorded but not alerted in v1 (no ABSENT alert type — deferred).
  - Alerts are NOT gated on subscription status in v1 (UNPAID parents still get alerts;
    collection is handled personally by the founder — deferred business decision).
  - Reliability: AlertLog rows commit in the same transaction as their TripEvent; dispatch is
    async; a 60 s sweeper re-dispatches stale CREATED rows (crash recovery); a 30 s receipt
    poller advances SENT → DELIVERED/FAILED; Expo-unreachable chunks stay CREATED and retry.
  - Late offline flushes are accepted on non-ACTIVE trips (events still alert — a late BOARDED
    beats a lost one; geofence alerts only fire while ACTIVE).
- Consequences: every alert answers "what exactly did the parent see and did it arrive";
  multi-device parents get pushes on their newest device only (revisit if it ever matters).

## ADR-0018: Alert-pipeline hardening from Phase 2 code review

- 2026-07-02 / Accepted
- Context: review of the Phase 2 pipeline found several ways an alert or derived event could be
  silently lost or double-fired — unacceptable for the product's spine.
- Decisions:
  - Ping insert + all derivation (SafetyEvents, geofence/overspeed alerts) run in ONE
    interactive transaction guarded by a per-trip `SELECT ... FOR UPDATE` lock: atomic
    (a failure rolls back and the client retry re-derives) and serialized (concurrent batches
    on one trip can't both pass a once-per-trip check).
  - Every AlertLog row is guaranteed to reach a terminal state: a receipt-expiry sweep fails
    SENT rows with no receipt after 24 h (`RECEIPT_EXPIRED`); token-less rows stay CREATED for a
    10-minute grace (a parent may be opening the app for the first time) before `NO_PUSH_TOKEN`.
  - `dispatchPending` coalesces concurrent triggers (re-runs once more if a trigger arrived
    mid-run) so a BOARDED committed during an in-flight dispatch doesn't wait up to 60 s.
  - `DeviceNotRegistered` from Expo deletes the dead PushToken so an older valid token can win.
  - Geofence REACHED_* requires an enter transition (the van must have been outside the fence
    on this trip) so a van starting inside a fence doesn't fire instantly. This is a v1
    heuristic — plain radius + enter check, still no routing/ETA.
  - Events for a student removed from the roster mid-trip are still accepted if they already
    have a TripEvent on the trip (a real boarding must not be dropped); truly unknown students
    are rejected. Alerts are skipped (event still recorded) for trips ended > 24 h ago.
- Scaling note: dispatch/receipt in-flight guards are per-process (correct for single-instance
  v1). Horizontal scaling would need a DB-level claim (conditional updateMany on CREATED) or two
  instances double-send.

## ADR-0019: Mobile offline-first architecture (Phase 3 driver flow)

- 2026-07-02 / Accepted
- Context: drivers are on unreliable networks and battery-hostile OEMs (Oppo/ColorOS); a missed
  BOARDED is the worst failure.
- Decisions:
  - Persistent SQLite outbox (expo-sqlite): every event/ping is written locally BEFORE any network
    call and survives app kill. A sync engine drains it in batches; idempotency is the client
    UUID + `INSERT OR IGNORE` + server dedupe, so retries never double-count or double-alert.
  - Background location via expo-location foreground service; the task reads the active trip id
    from a SQLite kv row so a background-launched process still works. Ping ~12s/25m; **uploads
    are throttled to ~30s even in the background** (kv timestamp) to hit the CLAUDE.md 30–60s
    batch target — balancing battery/data against REACHED-alert timeliness.
  - Duplicate-tap prevention: a student's action buttons show only while status is PENDING;
    optimistic local state + server/local-overlay reconcile keeps the row from flipping back.
  - Auth token in expo-secure-store; api client reads it via a provider so requests always use the
    live token. Role from the JWT selects DriverStack / Parent placeholder / Admin notice.
- Consequences: tracking runs only during an active trip; stopTracking clears the service + kv;
  kill/relaunch recovery rehydrates from GET /trips/mine/active.

## ADR-0020: pnpm hoisted node-linker; SOS + driver-van endpoints

- 2026-07-02 / Accepted
- Context: React Native / Expo don't reliably follow pnpm's symlinked store; the driver app needs
  its van roster and an SOS action.
- Decisions:
  - Root `.npmrc` sets `node-linker=hoisted` (npm-like flat node_modules) repo-wide — required for
    Metro/RN autolinking. Backend re-verified after the relayout (prisma generate + build).
  - `GET /me/van` (DRIVER) returns the driver's van(s) + ordered roster for the boarding list.
  - `POST /trips/:id/sos` (DRIVER) creates SOS-type AlertLog rows for parents of the van's roster
    and dispatches through the existing push pipeline — PUSH channel only, no SMS (per scope).
  - Contract added to `@carevan/shared` first (api/driver.ts, SOS in api/trips.ts).
- Consequences: one install strategy for the whole repo; SOS reuses the alert spine (traceable).

## ADR-0021: Parent flow reads a single derived-status endpoint (Phase 4)

- 2026-07-02 / Accepted
- Context: the parent home is the child-status card; the app must show the right state even when a
  push is missed, and must not leak other families' data.
- Decisions:
  - `GET /me/children` (PARENT) returns each linked child with a **server-derived** status
    (IDLE / WAITING / ON_VAN_TO_SCHOOL / AT_SCHOOL / ON_VAN_TO_HOME / AT_HOME), van + driver,
    last ping, subscription status, today's overspeed count, and an SOS flag. The app polls it on
    open and every ~15s — push is a latency optimization, never the source of truth.
  - Live map + ETA are client-side: `react-native-maps` + a straight-line distance ÷ recent-speed
    estimate. No routing engine (v1 scope). Android requires a Google Maps API key (documented).
  - "Call driver" is a native `tel:` link — no in-app calling/chat/SMS.
  - Notification tap → `usePushRouting` + a navigation ref deep-links to that child's live screen.
- Consequences: parent data is scoped to StudentParent links; the map degrades to a "no active
  trip" card when the van is idle; ETA is intentionally approximate.

## ADR-0022: Phase 4 code-review fixes (duplicate-BOARDED, timezone)

- 2026-07-02 / Accepted
- Context: review of the full mobile app found a critical-class alert-integrity race plus a
  parent-facing metric bug.
- Decisions:
  - Duplicate-BOARDED race (HIGH): `refreshStatuses` now reads the local outbox BEFORE the server
    (an in-flight event is otherwise in neither set → resets to PENDING → a re-tap fires a second
    alert). Server backstop: `TripEvent @@unique([tripId, studentId, type])` — a re-tap with a new
    UUID collides (P2002) and is recorded as a duplicate, so at most one alert per type per
    student per trip. Verified live.
  - Daily-safety timezone (MEDIUM): the overspeed-count day boundary is computed in `Asia/Karachi`
    (UTC+5, no DST) so a UTC host doesn't reset the parent's "safe today" strip at 5am PKT.
  - Retry backoff: the outbox sync now backs off exponentially (30s → 5min) on repeated network
    failure, resetting on success — instead of a flat 30s hammer.
  - Hardening: shared `AlertPushDataSchema` (safeParsed in the push-tap router instead of an
    `as` cast); `tel:` call has a failure fallback; the live map uses `initialRegion` +
    imperative `animateToRegion` (>75m move) so the parent's pan/zoom isn't reset each poll;
    rejected events are logged, not silently swallowed.
  - Noted, not blocking: `parent.service.ts` is N+1 bounded by a parent's child count — fine at v1
    scale; batch if the parent base grows.

## ADR-0023: Admin panel — Next.js App Router, cookie session, server-computed payouts (Phase 5)

- 2026-07-02 / Accepted
- Context: the founder needs an internal ops tool for CRUD, live tracking, manual billing, driver
  payouts, and alert auditing — speed over polish, but on the shared contract + tokens.
- Decisions:
  - Session auth: `loginAction` verifies `role === ADMIN` against the backend, stores the JWT in an
    httpOnly cookie; `middleware.ts` gates all routes; server components/actions fetch the backend
    with that cookie and parse through `@carevan/shared` zod. A 401 redirects to `/login`.
  - Billing: manual `PaymentRecord` (CASH|TRANSFER) only — no gateway. Recording a payment flips the
    subscription to ACTIVE in one transaction; a subscription starts UNPAID.
  - Payouts: `activeDays` computed server-side from `LocationPing` (days with a COMPLETED trip
    having > `ACTIVE_DAY_MIN_PINGS` pings), month boundary in `Asia/Karachi`; amount =
    activeDays × `PAYOUT_PER_ACTIVE_DAY_PKR`. Mark-paid upserts a `DriverPayout` with `paidAt`.
  - Live map: `react-leaflet` + OSM tiles, loaded via `dynamic({ ssr:false })` (leaflet is not
    SSR-safe); polls a `/api/live` route handler that keeps the JWT server-side.
  - Tokens injected from `@carevan/shared` as CSS vars; red stays SOS/overspeed-only (a FAILED
    delivery shows amber in the audit).
  - Demo-mode trigger deferred to Phase 6 with the demo engine.
- Consequences: one more workspace on the hoisted install; the admin never exposes the JWT to the
  browser; payout math is auditable from raw pings.
