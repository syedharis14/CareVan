import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { DemoStartResponse, DemoStatusResponse, DemoStatusResponseSchema } from '@carevan/shared';
import { distanceMeters } from '../common/geo';
import { AuthPrincipal } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import { PingProcessorService } from '../trips/ping-processor.service';
import { TripsService } from '../trips/trips.service';
import { DEMO_PING_INTERVAL_S, DEMO_ROUTE } from './lahore-route';

export const DEMO_VAN_PLATE = 'DEMO-001';

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
 * The founder's sales demo. It creates a REAL trip on the seeded demo van and drives
 * it through the SAME services production uses — TripsService.postEvents for BOARDED
 * and PingProcessorService.ingest for each scripted ping — so REACHED_SCHOOL is derived
 * by the real geofence and every alert gets a real AlertLog row + push. No parallel path.
 */
@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);
  private timers: NodeJS.Timeout[] = [];
  private state: DemoState = {
    running: false,
    tripId: null,
    boardedFired: false,
    reachedFired: false,
    pingsSent: 0,
    totalPings: DEMO_ROUTE.length,
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
    // can't slip through the guard→await gap and launch two overlapping demo trips.
    this.reset();
    this.state = {
      running: true,
      tripId: null,
      boardedFired: false,
      reachedFired: false,
      pingsSent: 0,
      totalPings: DEMO_ROUTE.length,
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
      const driver: AuthPrincipal = {
        id: van.driver.id,
        phone: van.driver.phone,
        role: 'DRIVER',
      };
      const studentId = van.students[0]!.studentId;

      // Reap any orphaned ACTIVE demo trips (e.g. a crash between BOARDED and finish) so
      // they don't linger on the admin live map or stack up over repeated demos.
      await this.prisma.trip.updateMany({
        where: { isDemo: true, status: 'ACTIVE' },
        data: { status: 'ABORTED', endedAt: new Date() },
      });

      // A real trip, flagged isDemo so payouts/rollups skip it.
      const trip = await this.prisma.trip.create({
        data: { vanId: van.id, type: 'PICKUP', isDemo: true },
      });
      this.state.tripId = trip.id;

      // BOARDED right away (the hero beat) — through the real event pipeline. If it fails,
      // abort the whole run rather than showing a moving van with no alerts.
      await this.trips.postEvents(driver, trip.id, {
        events: [{ id: randomUUID(), studentId, type: 'BOARDED', at: new Date() }],
      });
      this.state.boardedFired = true;

      // Scripted pings, one every DEMO_PING_INTERVAL_S — each through the real ingest path,
      // so the geofence fires REACHED_SCHOOL once the van enters the school fence.
      DEMO_ROUTE.forEach((point, i) => {
        const prev = i > 0 ? DEMO_ROUTE[i - 1] : null;
        const speedKmh = prev
          ? (distanceMeters(prev.lat, prev.lng, point.lat, point.lng) / 1000) *
            (3600 / DEMO_PING_INTERVAL_S)
          : 0;
        const timer = setTimeout(
          () => void this.emitPing(driver, trip.id, point, speedKmh),
          i * DEMO_PING_INTERVAL_S * 1000,
        );
        this.timers.push(timer);
      });

      // Complete the trip a beat after the last ping.
      const endTimer = setTimeout(
        () => void this.finish(driver, trip.id),
        (DEMO_ROUTE.length + 1) * DEMO_PING_INTERVAL_S * 1000,
      );
      this.timers.push(endTimer);

      return { tripId: trip.id, message: 'Demo started — watch the parent phone.' };
    } catch (e) {
      // Setup/BOARDED failed — release the lock so the founder can retry, and don't leave
      // the freshly-created demo trip ACTIVE.
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

  private async emitPing(
    driver: AuthPrincipal,
    tripId: string,
    point: { lat: number; lng: number },
    speedKmh: number,
  ): Promise<void> {
    try {
      await this.pings.ingest(driver, tripId, {
        pings: [{ id: randomUUID(), lat: point.lat, lng: point.lng, speedKmh, at: new Date() }],
      });
      this.state.pingsSent += 1;
      // Reflect the real geofence outcome in demo status.
      const reached = await this.prisma.alertLog.count({
        where: { tripId, type: 'REACHED_SCHOOL' },
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
