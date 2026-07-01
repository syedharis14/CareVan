import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActiveTripResponse,
  ActiveTripResponseSchema,
  ListTripsQuery,
  ListTripsResponse,
  ListTripsResponseSchema,
  PostTripEventsRequest,
  PostTripEventsResponse,
  PostTripEventsResponseSchema,
  StartTripRequest,
  TripDetailResponse,
  TripDetailResponseSchema,
  TripResponse,
  TripResponseSchema,
} from '@carevan/shared';
import { Prisma, Trip } from '@prisma/client';
import { alertMessage } from '../alerts/alert-messages';
import { AlertDraft, AlertsService } from '../alerts/alerts.service';
import { AuthPrincipal } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
  ) {}

  async start(driver: AuthPrincipal, request: StartTripRequest): Promise<TripResponse> {
    const van = await this.prisma.van.findUnique({ where: { id: request.vanId } });
    if (!van) throw new NotFoundException('Van not found');
    if (van.driverId !== driver.id) throw new ForbiddenException('This is not your van');

    const active = await this.prisma.trip.findFirst({
      where: { vanId: van.id, status: 'ACTIVE' },
    });
    if (active) throw new ConflictException('Van already has an active trip');

    const trip = await this.prisma.trip.create({
      data: { vanId: van.id, type: request.type },
    });
    return this.toResponse(trip);
  }

  async end(driver: AuthPrincipal, tripId: string, abort: boolean): Promise<TripResponse> {
    const trip = await this.ownedTrip(driver, tripId);
    if (trip.status !== 'ACTIVE') throw new ConflictException('Trip is not active');
    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: abort ? 'ABORTED' : 'COMPLETED', endedAt: new Date() },
    });
    return this.toResponse(updated);
  }

  /**
   * Batched, idempotent event ingestion. Events carry client-generated UUIDs;
   * a retried batch hits the PK and lands in `duplicates` — no double alerts.
   * Accepts events on non-ACTIVE trips too: a late offline flush must never
   * lose a BOARDED event (alert reliability outranks tidiness).
   */
  async postEvents(
    driver: AuthPrincipal,
    tripId: string,
    request: PostTripEventsRequest,
  ): Promise<PostTripEventsResponse> {
    const trip = await this.ownedTrip(driver, tripId);
    const roster = await this.prisma.vanStudent.findMany({
      where: { vanId: trip.vanId },
      include: { student: { include: { parents: true } } },
    });
    const studentsById = new Map(roster.map((r) => [r.studentId, r.student]));

    // A student removed from the van's roster mid-trip may still have queued events
    // from when they were aboard (they physically boarded) — accept those rather than
    // silently dropping a real BOARDED. Truly unknown students are still rejected.
    const knownIds = new Set(studentsById.keys());
    const priorEventStudents = await this.prisma.student.findMany({
      where: { tripEvents: { some: { tripId } }, id: { notIn: [...knownIds] } },
      include: { parents: true },
    });
    for (const s of priorEventStudents) studentsById.set(s.id, s);

    // Don't push "boarded the van" hours after a trip ended: record the event for the
    // audit, but skip alert creation on trips that ended more than a day ago.
    const alertsAllowed =
      !trip.endedAt || Date.now() - trip.endedAt.getTime() <= 24 * 60 * 60 * 1000;

    const accepted: string[] = [];
    const duplicates: string[] = [];
    const rejected: { id: string; reason: string }[] = [];

    const ordered = [...request.events].sort((a, b) => a.at.getTime() - b.at.getTime());
    for (const event of ordered) {
      const student = studentsById.get(event.studentId);
      if (!student) {
        rejected.push({ id: event.id, reason: 'STUDENT_NOT_ON_VAN' });
        continue;
      }
      try {
        // TripEvent + its AlertLog rows commit atomically: no event without its
        // alert trail, no alert without its event.
        await this.prisma.$transaction(async (tx) => {
          await tx.tripEvent.create({
            data: {
              id: event.id,
              tripId,
              studentId: event.studentId,
              type: event.type,
              at: event.at,
              lat: event.lat,
              lng: event.lng,
            },
          });
          if (alertsAllowed && (event.type === 'BOARDED' || event.type === 'DROPPED')) {
            const type = event.type;
            const drafts: AlertDraft[] = student.parents.map((link) => ({
              type,
              tripId,
              tripEventId: event.id,
              studentId: student.id,
              parentUserId: link.parentUserId,
              message: alertMessage[type](student.name),
            }));
            await this.alerts.createAlerts(tx, drafts);
          }
          // ABSENT is recorded but not alerted in v1 (no ABSENT alert type).
        });
        accepted.push(event.id);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          duplicates.push(event.id);
        } else {
          throw e;
        }
      }
    }

    this.alerts.triggerDispatch();
    return PostTripEventsResponseSchema.parse({ accepted, duplicates, rejected });
  }

  async detail(principal: AuthPrincipal, tripId: string): Promise<TripDetailResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { van: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (principal.role === 'DRIVER' && trip.van.driverId !== principal.id) {
      throw new ForbiddenException('This is not your trip');
    }
    return this.toDetail(trip);
  }

  /** Crash/kill recovery: the driver app calls this on open to rehydrate an active trip. */
  async mineActive(driver: AuthPrincipal): Promise<ActiveTripResponse> {
    const trip = await this.prisma.trip.findFirst({
      where: { status: 'ACTIVE', van: { driverId: driver.id } },
      orderBy: { startedAt: 'desc' },
    });
    return ActiveTripResponseSchema.parse({ trip: trip ? await this.toDetail(trip) : null });
  }

  async list(query: ListTripsQuery): Promise<ListTripsResponse> {
    const trips = await this.prisma.trip.findMany({
      where: {
        vanId: query.vanId,
        status: query.status,
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
    return ListTripsResponseSchema.parse(trips.map((t) => this.toResponse(t)));
  }

  private async toDetail(trip: Trip): Promise<TripDetailResponse> {
    const [events, lastPing] = await Promise.all([
      this.prisma.tripEvent.findMany({ where: { tripId: trip.id }, orderBy: { at: 'asc' } }),
      this.prisma.locationPing.findFirst({
        where: { tripId: trip.id },
        orderBy: { at: 'desc' },
      }),
    ]);
    return TripDetailResponseSchema.parse({
      ...this.toResponse(trip),
      events: events.map((e) => ({ id: e.id, studentId: e.studentId, type: e.type, at: e.at })),
      lastPing: lastPing
        ? { lat: lastPing.lat, lng: lastPing.lng, speedKmh: lastPing.speedKmh, at: lastPing.at }
        : null,
    });
  }

  private async ownedTrip(driver: AuthPrincipal, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { van: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.van.driverId !== driver.id) throw new ForbiddenException('This is not your trip');
    return trip;
  }

  private toResponse(trip: Trip): TripResponse {
    return TripResponseSchema.parse({
      id: trip.id,
      vanId: trip.vanId,
      type: trip.type,
      status: trip.status,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
    });
  }
}
