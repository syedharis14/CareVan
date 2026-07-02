import { Injectable } from '@nestjs/common';
import {
  ListPayoutsResponse,
  ListPayoutsResponseSchema,
  MarkPayoutPaidRequest,
  PayoutQuery,
  PayoutRowResponse,
} from '@carevan/shared';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** [start, end) UTC instants bounding a "YYYY-MM" month in Pakistan time. */
function monthRangePkt(month: string): { start: Date; end: Date } {
  const [y, m] = month.split('-').map(Number);
  const year = y as number;
  const mon = m as number;
  const start = new Date(Date.UTC(year, mon - 1, 1) - PKT_OFFSET_MS);
  const end = new Date(
    Date.UTC(mon === 12 ? year + 1 : year, mon === 12 ? 0 : mon, 1) - PKT_OFFSET_MS,
  );
  return { start, end };
}

/** The Pakistan-local calendar day (YYYY-MM-DD) for an instant. */
function pktDayKey(at: Date): string {
  return new Date(at.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PayoutQuery): Promise<ListPayoutsResponse> {
    const drivers = await this.prisma.user.findMany({
      where: { role: 'DRIVER' },
      orderBy: { name: 'asc' },
    });
    const rows = await Promise.all(
      drivers.map((d) => this.rowFor(d.id, d.name, d.phone, query.month)),
    );
    return ListPayoutsResponseSchema.parse(rows);
  }

  /** Compute activeDays + amount, then upsert a DriverPayout with paidAt = now. */
  async markPaid(request: MarkPayoutPaidRequest): Promise<PayoutRowResponse> {
    const { activeDays, amountPkr } = await this.compute(request.driverId, request.month);
    const paidAt = new Date();
    await this.prisma.driverPayout.upsert({
      where: { driverId_month: { driverId: request.driverId, month: request.month } },
      create: { driverId: request.driverId, month: request.month, activeDays, amountPkr, paidAt },
      update: { activeDays, amountPkr, paidAt },
    });
    return this.rowFor(request.driverId, undefined, undefined, request.month);
  }

  private async rowFor(
    driverId: string,
    name: string | undefined,
    phone: string | undefined,
    month: string,
  ): Promise<PayoutRowResponse> {
    const driver =
      name && phone
        ? { id: driverId, name, phone }
        : await this.prisma.user
            .findUniqueOrThrow({ where: { id: driverId } })
            .then((u) => ({ id: u.id, name: u.name, phone: u.phone }));

    const existing = await this.prisma.driverPayout.findUnique({
      where: { driverId_month: { driverId, month } },
    });

    // Once paid, show the snapshot that was actually paid — NOT a live recompute, or a
    // later qualifying trip would inflate the number shown next to "Paid" (money-path lie).
    if (existing?.paidAt) {
      return {
        driver,
        month,
        activeDays: existing.activeDays,
        amountPkr: existing.amountPkr,
        paidAt: existing.paidAt,
      };
    }

    // Not yet paid: live estimate from pings.
    const { activeDays, amountPkr } = await this.compute(driverId, month);
    return { driver, month, activeDays, amountPkr, paidAt: null };
  }

  /**
   * activeDays = count of Pakistan-local days in the month with a COMPLETED trip on
   * one of the driver's vans that had MORE than ACTIVE_DAY_MIN_PINGS location pings.
   * Computed from LocationPing — never client-trusted (see backend/CLAUDE.md).
   * Demo trips (isDemo) are excluded so scripted sales demos never inflate a payout.
   */
  private async compute(
    driverId: string,
    month: string,
  ): Promise<{ activeDays: number; amountPkr: number }> {
    const { start, end } = monthRangePkt(month);
    const trips = await this.prisma.trip.findMany({
      where: {
        status: 'COMPLETED',
        isDemo: false,
        startedAt: { gte: start, lt: end },
        van: { driverId },
      },
      select: { startedAt: true, _count: { select: { pings: true } } },
    });

    const activeDayKeys = new Set<string>();
    for (const t of trips) {
      if (t._count.pings > env.ACTIVE_DAY_MIN_PINGS) activeDayKeys.add(pktDayKey(t.startedAt));
    }
    const activeDays = activeDayKeys.size;
    return { activeDays, amountPkr: activeDays * env.PAYOUT_PER_ACTIVE_DAY_PKR };
  }
}
