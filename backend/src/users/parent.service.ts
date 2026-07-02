import { Injectable } from '@nestjs/common';
import { ChildrenResponse, ChildrenResponseSchema, ChildStatus } from '@carevan/shared';
import { Trip, TripEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Pakistan is UTC+5 year-round (no DST). Compute "start of today" in PKT explicitly
// so the parent-facing daily safety count rolls over at local midnight, not the
// server host's (a UTC container would otherwise reset the count at 5am PKT).
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function startOfTodayPkt(): Date {
  const nowPkt = new Date(Date.now() + PKT_OFFSET_MS);
  const midnightPktAsUtc = Date.UTC(
    nowPkt.getUTCFullYear(),
    nowPkt.getUTCMonth(),
    nowPkt.getUTCDate(),
  );
  return new Date(midnightPktAsUtc - PKT_OFFSET_MS);
}

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everything the parent home screen needs, one entry per linked child. */
  async childrenFor(parentUserId: string): Promise<ChildrenResponse> {
    const links = await this.prisma.studentParent.findMany({
      where: { parentUserId },
      include: { student: { include: { school: true } } },
      orderBy: { studentId: 'asc' },
    });

    const summaries = await Promise.all(
      links.map(async ({ student }) => {
        const vanLink = await this.prisma.vanStudent.findFirst({
          where: { studentId: student.id },
          include: { van: { include: { driver: true } } },
        });
        const van = vanLink?.van ?? null;

        const activeTrip = van
          ? await this.prisma.trip.findFirst({
              where: { vanId: van.id, status: 'ACTIVE' },
              orderBy: { startedAt: 'desc' },
            })
          : null;

        const [events, reached, sos, lastPing, subscription, todayOverspeedCount] =
          await Promise.all([
            activeTrip
              ? this.prisma.tripEvent.findMany({
                  where: { tripId: activeTrip.id, studentId: student.id },
                })
              : Promise.resolve([] as TripEvent[]),
            activeTrip
              ? this.prisma.alertLog.findMany({
                  where: {
                    tripId: activeTrip.id,
                    studentId: student.id,
                    type: { in: ['REACHED_SCHOOL', 'REACHED_HOME'] },
                  },
                  select: { type: true },
                })
              : Promise.resolve([] as { type: string }[]),
            activeTrip
              ? this.prisma.alertLog.count({ where: { tripId: activeTrip.id, type: 'SOS' } })
              : Promise.resolve(0),
            activeTrip
              ? this.prisma.locationPing.findFirst({
                  where: { tripId: activeTrip.id },
                  orderBy: { at: 'desc' },
                })
              : Promise.resolve(null),
            this.prisma.subscription.findFirst({
              where: { parentUserId, studentId: student.id },
            }),
            van
              ? this.prisma.safetyEvent.count({
                  where: {
                    type: 'OVERSPEED',
                    at: { gte: startOfTodayPkt() },
                    trip: { vanId: van.id },
                  },
                })
              : Promise.resolve(0),
          ]);

        const reachedTypes = new Set(reached.map((r) => r.type));
        const status = deriveStatus(activeTrip, events, reachedTypes);

        return {
          student: { id: student.id, name: student.name },
          school: { name: student.school.name, lat: student.school.lat, lng: student.school.lng },
          home: { lat: student.homeLat, lng: student.homeLng },
          van: van
            ? { plateNo: van.plateNo, driverName: van.driver.name, driverPhone: van.driver.phone }
            : null,
          status,
          subscriptionStatus: subscription?.status ?? null,
          activeTrip: activeTrip
            ? {
                id: activeTrip.id,
                type: activeTrip.type,
                lastPing: lastPing
                  ? {
                      lat: lastPing.lat,
                      lng: lastPing.lng,
                      speedKmh: lastPing.speedKmh,
                      at: lastPing.at,
                    }
                  : null,
              }
            : null,
          sosActive: sos > 0,
          todayOverspeedCount,
        };
      }),
    );

    return ChildrenResponseSchema.parse(summaries);
  }
}

function deriveStatus(trip: Trip | null, events: TripEvent[], reached: Set<string>): ChildStatus {
  if (!trip) return 'IDLE';
  const types = new Set(events.map((e) => e.type));
  if (trip.type === 'PICKUP') {
    if (reached.has('REACHED_SCHOOL') || types.has('DROPPED')) return 'AT_SCHOOL';
    if (types.has('ABSENT')) return 'IDLE';
    if (types.has('BOARDED')) return 'ON_VAN_TO_SCHOOL';
    return 'WAITING';
  }
  if (reached.has('REACHED_HOME') || types.has('DROPPED')) return 'AT_HOME';
  if (types.has('ABSENT')) return 'IDLE';
  return 'ON_VAN_TO_HOME';
}
