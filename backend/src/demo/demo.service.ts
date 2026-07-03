import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { DemoStartResponse, DemoStatusResponse, DemoStatusResponseSchema } from '@carevan/shared';
import { distanceMeters } from '../common/geo';
import { AuthPrincipal } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import { PingProcessorService } from '../trips/ping-processor.service';
import { TripsService } from '../trips/trips.service';
import { Coord, DEMO_LEGS, DEMO_PING_INTERVAL_S } from './lahore-route';

export const DEMO_VAN_PLATE = 'DEMO-001';

const TOTAL_PINGS =
  DEMO_LEGS.approach.length + DEMO_LEGS.toSchool.length + DEMO_LEGS.toHome.length;

interface DemoState {
  running: boolean;
  tripId: string | null;
  boardedFired: boolean;
  reachedFired: boolean;
  pingsSent: number;
  totalPings: number;
  startedAt: Date | null;
}

/**
 * The founder's sales demo — the full day in one tap. It creates REAL trips on the seeded
 * demo van and drives them through the SAME services production uses (TripsService.postEvents
 * for BOARDED, PingProcessorService.ingest for each ping), so BOARDED / REACHED_SCHOOL /
 * REACHED_HOME all flow through the real event + geofence + alert pipeline. No parallel path,
 * no faked pushes.
 *
 * Sequence: PICKUP trip {approach → BOARDED at home → drive to school → REACHED_SCHOOL},
 * then DROPOFF trip {BOARDED at school → drive home → REACHED_HOME}.
 */
@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);
  private timers: NodeJS.Timeout[] = [];
  private vanId: string | null = null;
  private studentId: string | null = null;
  private driver: AuthPrincipal | null = null;
  private state: DemoState = {
    running: false,
    tripId: null,
    boardedFired: false,
    reachedFired: false,
    pingsSent: 0,
    totalPings: TOTAL_PINGS,
    startedAt: null,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly trips: TripsService,
    private readonly pings: PingProcessorService,
  ) {}

  async start(): Promise<DemoStartResponse> {
    if (this.state.running) throw new ConflictException('A demo is already running');
    // Acquire the lock SYNCHRONOUSLY (before any await) so a double-click / second tab
    // can't slip through the guard→await gap and launch two overlapping demo runs.
    this.reset();
    this.state = {
      running: true,
      tripId: null,
      boardedFired: false,
      reachedFired: false,
      pingsSent: 0,
      totalPings: TOTAL_PINGS,
      startedAt: new Date(),
    };

    try {
      const van = await this.prisma.van.findUnique({
        where: { plateNo: DEMO_VAN_PLATE },
        include: { driver: true, students: true },
      });
      if (!van || van.students.length === 0) {
        throw new BadRequestException('Demo data missing — run `pnpm prisma db seed` first');
      }
      this.vanId = van.id;
      this.driver = { id: van.driver.id, phone: van.driver.phone, role: 'DRIVER' };
      this.studentId = van.students[0]!.studentId;

      // Reap any orphaned ACTIVE demo trips (e.g. a crash mid-run) so they don't linger on the
      // admin live map or stack up over repeated demos.
      await this.prisma.trip.updateMany({
        where: { isDemo: true, status: 'ACTIVE' },
        data: { status: 'ABORTED', endedAt: new Date() },
      });

      // Leg 1+2 live on a real PICKUP trip.
      const pickup = await this.prisma.trip.create({
        data: { vanId: van.id, type: 'PICKUP', isDemo: true },
      });
      this.state.tripId = pickup.id;
      this.schedulePickup(pickup.id);

      return { tripId: pickup.id, message: 'Demo started — watch the parent phone.' };
    } catch (e) {
      // Setup failed — release the lock so the founder can retry, and don't leave the
      // freshly-created demo trip ACTIVE.
      this.reset();
      const orphan = this.state.tripId;
      this.state.running = false;
      this.state.tripId = null;
      if (orphan) {
        await this.prisma.trip
          .update({ where: { id: orphan }, data: { status: 'ABORTED', endedAt: new Date() } })
          .catch(() => undefined);
      }
      throw e;
    }
  }

  status(): DemoStatusResponse {
    return DemoStatusResponseSchema.parse(this.state);
  }

  /** PICKUP leg: approach home (WAITING) → BOARDED at home → drive to school → REACHED_SCHOOL. */
  private schedulePickup(tripId: string): void {
    const driver = this.driver!;
    const studentId = this.studentId!;
    const interval = DEMO_PING_INTERVAL_S * 1000;
    let step = 0;

    // Leg 1 — approach: van drives toward home. Child status stays WAITING ("driver is coming").
    DEMO_LEGS.approach.forEach((pt, i) => {
      const speed = this.speed(DEMO_LEGS.approach, i);
      this.schedule((step + i) * interval, () => void this.emitPing(driver, tripId, pt, speed));
    });
    step += DEMO_LEGS.approach.length;

    // BOARDED at home (the first hero push) → ON_VAN_TO_SCHOOL.
    this.schedule(step * interval, () => void this.fireBoarded(driver, tripId, studentId));
    step += 1;

    // Leg 2 — home → school. The van enters the school fence near the end → REACHED_SCHOOL.
    DEMO_LEGS.toSchool.forEach((pt, i) => {
      const speed = this.speed(DEMO_LEGS.toSchool, i);
      this.schedule((step + i) * interval, () => void this.emitPing(driver, tripId, pt, speed));
    });
    step += DEMO_LEGS.toSchool.length;

    // End the pickup trip, then start + drive the dropoff trip.
    this.schedule((step + 1) * interval, () => void this.runDropoff());
  }

  /** DROPOFF leg: end pickup → new DROPOFF trip → BOARDED at school → drive home → REACHED_HOME. */
  private async runDropoff(): Promise<void> {
    const driver = this.driver;
    const studentId = this.studentId;
    const vanId = this.vanId;
    if (!driver || !studentId || !vanId) {
      this.state.running = false;
      return;
    }

    const pickupId = this.state.tripId;

    // Atomic handoff: complete the pickup and open the dropoff in ONE transaction so the demo
    // van is never momentarily without an ACTIVE trip — otherwise a parent poll landing in that
    // gap flickers the hero screen to the "no trip" view mid-demo. We set the pickup's status
    // directly instead of via trips.end() (which only sets status + endedAt) so both writes commit
    // together.
    let dropoffId: string;
    try {
      const dropoff = await this.prisma.$transaction(async (tx) => {
        if (pickupId) {
          await tx.trip.update({
            where: { id: pickupId },
            data: { status: 'COMPLETED', endedAt: new Date() },
          });
        }
        return tx.trip.create({ data: { vanId, type: 'DROPOFF', isDemo: true } });
      });
      dropoffId = dropoff.id;
    } catch (e) {
      this.logger.error(`demo dropoff handoff failed: ${this.msg(e)}`);
      this.state.running = false;
      return;
    }
    this.state.tripId = dropoffId;

    // "Boarded for home" push (child gets on at school). Status stays ON_VAN_TO_HOME.
    await this.fireBoarded(driver, dropoffId, studentId);

    // Leg 3 — school → home. The van enters the home fence near the end → REACHED_HOME.
    const interval = DEMO_PING_INTERVAL_S * 1000;
    DEMO_LEGS.toHome.forEach((pt, i) => {
      const speed = this.speed(DEMO_LEGS.toHome, i);
      this.schedule(i * interval, () => void this.emitPing(driver, dropoffId, pt, speed));
    });
    this.schedule((DEMO_LEGS.toHome.length + 1) * interval, () => void this.finish(driver, dropoffId));
  }

  private schedule(delayMs: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, delayMs));
  }

  /** Scripted speed from the gap to the previous point (km/h); 0 for the first point of a leg. */
  private speed(route: Coord[], i: number): number {
    const prev = i > 0 ? route[i - 1] : null;
    const pt = route[i]!;
    return prev
      ? (distanceMeters(prev.lat, prev.lng, pt.lat, pt.lng) / 1000) * (3600 / DEMO_PING_INTERVAL_S)
      : 0;
  }

  private async fireBoarded(
    driver: AuthPrincipal,
    tripId: string,
    studentId: string,
  ): Promise<void> {
    try {
      await this.trips.postEvents(driver, tripId, {
        events: [{ id: randomUUID(), studentId, type: 'BOARDED', at: new Date() }],
      });
      this.state.boardedFired = true;
    } catch (e) {
      this.logger.error(`demo boarded failed: ${this.msg(e)}`);
    }
  }

  private async emitPing(
    driver: AuthPrincipal,
    tripId: string,
    point: Coord,
    speedKmh: number,
  ): Promise<void> {
    try {
      await this.pings.ingest(driver, tripId, {
        pings: [{ id: randomUUID(), lat: point.lat, lng: point.lng, speedKmh, at: new Date() }],
      });
      this.state.pingsSent += 1;
      // Reflect the real geofence outcome (school OR home) in demo status.
      const reached = await this.prisma.alertLog.count({
        where: { tripId, type: { in: ['REACHED_SCHOOL', 'REACHED_HOME'] } },
      });
      if (reached > 0) this.state.reachedFired = true;
    } catch (e) {
      this.logger.error(`demo ping failed: ${this.msg(e)}`);
    }
  }

  private async finish(driver: AuthPrincipal, tripId: string): Promise<void> {
    try {
      await this.trips.end(driver, tripId, false);
    } catch (e) {
      this.logger.warn(`demo finish: ${this.msg(e)}`);
    }
    this.state.running = false;
  }

  private reset(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  private msg(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }
}
