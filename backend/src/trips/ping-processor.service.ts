import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PostPingsRequest, PostPingsResponse, PostPingsResponseSchema } from '@carevan/shared';
import { LocationPing, Prisma } from '@prisma/client';
import { alertMessage } from '../alerts/alert-messages';
import { AlertDraft, AlertsService } from '../alerts/alerts.service';
import { distanceMeters } from '../common/geo';
import { AuthPrincipal } from '../common/types';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const tripInclude = {
  van: { include: { school: true } },
} satisfies Prisma.TripInclude;

type TripWithVanSchool = Prisma.TripGetPayload<{ include: typeof tripInclude }>;

/** Minimal coordinate for fence math. */
interface Coord {
  lat: number;
  lng: number;
}

/**
 * Batched ping ingestion + everything derived from pings: overspeed SafetyEvents,
 * throttled OVERSPEED alerts, and geofence REACHED_SCHOOL / REACHED_HOME alerts.
 *
 * The insert and ALL derivation run in ONE interactive transaction, guarded by a
 * per-trip row lock (SELECT ... FOR UPDATE). This is deliberate and load-bearing:
 * - Atomicity — if derivation throws after the pings are inserted, the whole batch
 *   rolls back, so the client's retry re-derives instead of silently dropping a
 *   SafetyEvent or a geofence alert (a dropped BOARDED-class alert is a critical
 *   failure, not a bug).
 * - Serialization — the row lock stops two overlapping ping batches on the same
 *   trip from both passing a once-per-trip / once-per-student / cooldown check and
 *   double-firing.
 */
@Injectable()
export class PingProcessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
  ) {}

  async ingest(
    driver: AuthPrincipal,
    tripId: string,
    request: PostPingsRequest,
  ): Promise<PostPingsResponse> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, include: tripInclude });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.van.driverId !== driver.id) throw new ForbiddenException('This is not your trip');

    const inserted = await this.prisma.$transaction(
      async (tx) => {
        // Serialize derivation per trip so concurrent batches can't double-fire.
        await tx.$queryRaw`SELECT id FROM "Trip" WHERE id = ${tripId} FOR UPDATE`;

        const rows = await tx.locationPing.createManyAndReturn({
          data: request.pings.map((p) => ({
            id: p.id,
            tripId,
            lat: p.lat,
            lng: p.lng,
            speedKmh: p.speedKmh,
            at: p.at,
          })),
          skipDuplicates: true,
        });

        if (rows.length > 0) {
          // SafetyEvents always record (driver-score integrity, even for late
          // flushes); alerts only fire while the trip is ACTIVE.
          await this.processOverspeed(tx, trip, rows, trip.status === 'ACTIVE');
          if (trip.status === 'ACTIVE') {
            await this.processGeofence(tx, trip, rows);
          }
        }
        return rows;
      },
      { timeout: 20_000 },
    );

    // Dispatch happens after commit — AlertLog rows are durable first.
    if (inserted.length > 0) this.alerts.triggerDispatch();

    return PostPingsResponseSchema.parse({
      inserted: inserted.length,
      duplicates: request.pings.length - inserted.length,
    });
  }

  private async processOverspeed(
    tx: Prisma.TransactionClient,
    trip: TripWithVanSchool,
    pings: LocationPing[],
    allowAlert: boolean,
  ): Promise<void> {
    const offending = pings.filter((p) => p.speedKmh > env.OVERSPEED_LIMIT_KMH);
    if (offending.length === 0) return;

    await tx.safetyEvent.createMany({
      data: offending.map((p) => ({
        tripId: trip.id,
        type: 'OVERSPEED' as const,
        value: p.speedKmh,
        at: p.at,
      })),
    });

    if (!allowAlert) return;
    // Throttle: at most one OVERSPEED alert per trip per cooldown window.
    const cooldownMs = env.OVERSPEED_ALERT_COOLDOWN_MIN * 60_000;
    const recent = await tx.alertLog.findFirst({
      where: { tripId: trip.id, type: 'OVERSPEED', at: { gte: new Date(Date.now() - cooldownMs) } },
    });
    if (recent) return;

    const topSpeed = Math.max(...offending.map((p) => p.speedKmh));
    const parentIds = await this.aboardParentIds(tx, trip);
    if (parentIds.length === 0) return;

    const drafts: AlertDraft[] = parentIds.map((parentUserId) => ({
      type: 'OVERSPEED',
      tripId: trip.id,
      parentUserId,
      message: alertMessage.OVERSPEED(trip.van.plateNo, topSpeed),
    }));
    await this.alerts.createAlerts(tx, drafts);
  }

  private async processGeofence(
    tx: Prisma.TransactionClient,
    trip: TripWithVanSchool,
    pings: LocationPing[],
  ): Promise<void> {
    const radius = env.GEOFENCE_RADIUS_M;
    const insideNow = (t: Coord) =>
      pings.some((p) => distanceMeters(p.lat, p.lng, t.lat, t.lng) <= radius);

    // Prior pings on this trip (excluding the batch just inserted) — used to require
    // an enter transition so a van that starts inside a fence doesn't fire instantly.
    const batchIds = pings.map((p) => p.id);
    const priorPings = await tx.locationPing.findMany({
      where: { tripId: trip.id, id: { notIn: batchIds } },
      select: { lat: true, lng: true },
    });
    const allPings: Coord[] = [...priorPings, ...pings.map((p) => ({ lat: p.lat, lng: p.lng }))];
    const everOutside = (t: Coord) =>
      allPings.some((p) => distanceMeters(p.lat, p.lng, t.lat, t.lng) > radius);

    if (trip.type === 'PICKUP') {
      // REACHED_SCHOOL: once per trip, on entering the school fence from outside.
      const already = await tx.alertLog.findFirst({
        where: { tripId: trip.id, type: 'REACHED_SCHOOL' },
      });
      if (already) return;
      const school = trip.van.school;
      if (!insideNow(school) || !everOutside(school)) return;

      const boarded = await tx.tripEvent.findMany({
        where: { tripId: trip.id, type: 'BOARDED' },
        include: { student: { include: { parents: true } } },
      });
      const seen = new Set<string>();
      const drafts: AlertDraft[] = [];
      for (const event of boarded) {
        if (seen.has(event.studentId)) continue;
        seen.add(event.studentId);
        for (const link of event.student.parents) {
          drafts.push({
            type: 'REACHED_SCHOOL',
            tripId: trip.id,
            studentId: event.studentId,
            parentUserId: link.parentUserId,
            message: alertMessage.REACHED_SCHOOL(event.student.name),
          });
        }
      }
      if (drafts.length > 0) await this.alerts.createAlerts(tx, drafts);
      return;
    }

    // DROPOFF — REACHED_HOME: once per student, when the van enters that student's
    // home fence (having been outside it) while the student is still aboard.
    const [roster, events, alerted] = await Promise.all([
      tx.vanStudent.findMany({
        where: { vanId: trip.vanId },
        include: { student: { include: { parents: true } } },
      }),
      tx.tripEvent.findMany({ where: { tripId: trip.id } }),
      tx.alertLog.findMany({
        where: { tripId: trip.id, type: 'REACHED_HOME' },
        select: { studentId: true },
      }),
    ]);
    const offVan = new Set(
      events.filter((e) => e.type === 'DROPPED' || e.type === 'ABSENT').map((e) => e.studentId),
    );
    const alreadyAlerted = new Set(alerted.map((a) => a.studentId));

    const drafts: AlertDraft[] = [];
    for (const { student } of roster) {
      if (offVan.has(student.id) || alreadyAlerted.has(student.id)) continue;
      const home = { lat: student.homeLat, lng: student.homeLng };
      if (!insideNow(home) || !everOutside(home)) continue;
      for (const link of student.parents) {
        drafts.push({
          type: 'REACHED_HOME',
          tripId: trip.id,
          studentId: student.id,
          parentUserId: link.parentUserId,
          message: alertMessage.REACHED_HOME(student.name),
        });
      }
    }
    if (drafts.length > 0) await this.alerts.createAlerts(tx, drafts);
  }

  /** Parents of students currently on the van (PICKUP: boarded−dropped; DROPOFF: roster−dropped−absent). */
  private async aboardParentIds(
    tx: Prisma.TransactionClient,
    trip: TripWithVanSchool,
  ): Promise<string[]> {
    const events = await tx.tripEvent.findMany({ where: { tripId: trip.id } });
    const byType = (t: string) =>
      new Set(events.filter((e) => e.type === t).map((e) => e.studentId));
    const dropped = byType('DROPPED');
    const absent = byType('ABSENT');

    let aboard: string[];
    if (trip.type === 'PICKUP') {
      aboard = [...byType('BOARDED')].filter((id) => !dropped.has(id));
    } else {
      const roster = await tx.vanStudent.findMany({ where: { vanId: trip.vanId } });
      aboard = roster.map((r) => r.studentId).filter((id) => !dropped.has(id) && !absent.has(id));
    }
    if (aboard.length === 0) return [];

    const links = await tx.studentParent.findMany({
      where: { studentId: { in: aboard } },
      select: { parentUserId: true },
    });
    return [...new Set(links.map((l) => l.parentUserId))];
  }
}
