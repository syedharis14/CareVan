# CareVan — PRD (v1)

Product name everywhere user-facing: **CareVan** — a triple pun:
Care+Van in English, spoken "caravan", Urdu کارواں "karwan" (travelers grouping for safety).
Package id: `com.aamirtech.carevan`.

## Problem

School-van transport in Pakistan is informal: parents hand their child to a driver every morning
with zero visibility until the child is home again. The two daily anxiety moments — "did my child
get on the van?" and "did they reach school / get home?" — have no answer today.

## Product

A monthly-subscription **safety layer on top of the existing van arrangement** (v1 does not
replace the parent–driver relationship):

- Live van tracking (parent map + ETA).
- **Proactive push alerts — the hero feature**: BOARDED, DROPPED, REACHED SCHOOL, REACHED HOME.
  A missed BOARDED alert is a critical failure, not a bug. Alert delivery reliability outranks
  everything else, including the map.
- Daily driver safety score (GPS overspeed only in v1).
- SOS.

Drivers run a dead-simple app — one-tap trip start, one tap per student for boarded/dropped —
and are **paid by us** for verified active usage in Phase 1 (activeDays, server-verified from
location pings, never client-trusted).

Phase 2 (explicitly NOT in this build): a curated, vetted driver marketplace with parent
search/booking, monetized from both sides.

## Users & constraints

| User   | Reality                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Driver | Low-end Android (test target: **Oppo F21 Pro** — ColorOS kills background apps), limited data, zero patience for data entry. Battery drain or data usage = uninstall. |
| Parent | Mid-range Android + some iOS (16+). Price-sensitive; the twice-daily alert moment is what they pay for.                                                               |
| Admin  | The founder, desktop web. Ugly-but-functional is fine.                                                                                                                |

Connectivity is unreliable: the driver app is **offline-first** — every event/ping queues locally
and syncs when online.

## v1 scope (LOCKED — do not expand)

1. ONE Expo app with two roles (DRIVER | PARENT) decided at login. Not two apps.
2. Auth: phone + PIN, accounts created by admin. NO OTP/SMS infrastructure.
3. NO payment gateway: admin records cash/transfer payments manually. Schema stays gateway-ready.
4. Safety score v1 = GPS overspeed only. No accelerometer / harsh-braking detection.
5. No route optimization, no chat, no marketplace, no search/booking.
6. DEMO MODE is required and first-class (below).

## Alert pipeline requirement

Every alert is traceable end to end:
`TripEvent → AlertLog(CREATED) → push provider (SENT) → delivery receipt (DELIVERED | FAILED)`.
The AlertLog row is created **before** dispatch, always. Failed deliveries are visible in the
admin audit log. The parent app reconciles on open (poll trip status) because push is never
guaranteed.

## Demo mode (first-class feature)

Admin-triggered scripted fake trip — the founder's sales demo at school gates:

1. Founder clicks "Start demo" in admin.
2. A demo van moves along a **real Lahore route** on the parent app's live map.
3. BOARDED fires → the parent phone in the founder's hand gets a live push.
4. REACHED SCHOOL fires ~60 s later via the real geofence logic.

It runs through the production trip/alert pipeline (no parallel code path) and is excluded from
safety scores, payouts, and billing.

## System

Monorepo: `backend/` (NestJS 11 + Prisma + PostgreSQL), `mobile/` (Expo + expo-dev-client),
`admin/` (Next.js App Router + Tailwind), `packages/shared/` (zod API contracts + design tokens).
The data model (User, School, Van, Student, StudentParent, VanStudent, Trip, TripEvent,
LocationPing, SafetyEvent, Subscription, PaymentRecord, DriverPayout, AlertLog) is locked as
specified and lives in `backend/prisma/schema.prisma` from Phase 1 — extend additively only.

## Success criteria (v1)

- BOARDED/DROPPED alert reaches the parent phone in < 10 s when online — and is never silently
  lost (every failure visible in the AlertLog audit).
- Driver app survives a full trip on the Oppo F21 Pro with battery saver on (after whitelist
  onboarding), including app-killed-mid-trip recovery.
- A full trip costs < 3% battery and < 5 MB data on the driver device.
- Demo mode runs end to end, on demand, reliably.

## Build phases (one per founder instruction; review between)

0. Skeleton — monorepo, context files, agents, docs, tooling, docker-compose. No feature code.
1. Backend core — Prisma schema + migrations, phone+PIN JWT auth, CRUD modules, Lahore seed data.
2. Trip engine — trips, trip events, batched ping ingestion, geofence REACHED events, overspeed,
   AlertLog pipeline with Expo push + delivery tracking.
3. Mobile driver flow — dev client, EAS profiles, auth, today screen, active-trip screen with
   offline queue, background location, battery-whitelist onboarding, SOS.
4. Mobile parent flow — child status card, push handling, live map + ETA, driver card, daily
   safety strip, SOS.
5. Admin panel — CRUD, live trip map, subscriptions + mark-paid, payout view, alert audit log.
6. DEMO MODE + hardening — scripted replay end to end, field-test checklists, ColorOS survival
   testing, alert-delivery fallback (poll-on-open), design-token polish.
