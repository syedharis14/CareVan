import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { AlertType, Prisma } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { ALERT_TITLE } from './alert-messages';

export interface AlertDraft {
  type: AlertType;
  tripId: string;
  parentUserId: string;
  message: string;
  tripEventId?: string;
  studentId?: string;
}

/** A parent who hasn't registered a push token yet keeps the alert pending this long
 *  (they may be opening the app for the first time) before it's failed as NO_PUSH_TOKEN. */
const NO_TOKEN_GRACE_MS = 10 * 60 * 1000;
/** Expo receipts expire after ~24h; a SENT row we never got a receipt for is failed after this. */
const RECEIPT_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * The alert pipeline. THE invariant: an AlertLog row exists (status CREATED)
 * BEFORE any dispatch attempt — callers create rows via `createAlerts` inside
 * their own transaction, then trigger `dispatchPending`. A sweeper re-dispatches
 * stale CREATED rows so a crash between commit and dispatch loses nothing, and a
 * receipt poller advances SENT rows to DELIVERED/FAILED. Every row therefore
 * reaches a terminal state (DELIVERED or FAILED) — nothing is silently lost.
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private readonly expo = new Expo(
    env.EXPO_ACCESS_TOKEN ? { accessToken: env.EXPO_ACCESS_TOKEN } : {},
  );
  private dispatchInFlight = false;
  private rerunRequested = false;
  private receiptsInFlight = false;

  constructor(private readonly prisma: PrismaService) {}

  /** Create CREATED rows inside the caller's transaction. Returns nothing — dispatch is separate. */
  async createAlerts(tx: Prisma.TransactionClient, drafts: AlertDraft[]): Promise<void> {
    if (drafts.length === 0) return;
    await tx.alertLog.createMany({
      data: drafts.map((d) => ({
        type: d.type,
        tripId: d.tripId,
        tripEventId: d.tripEventId,
        studentId: d.studentId,
        parentUserId: d.parentUserId,
        channel: 'PUSH' as const,
        status: 'CREATED' as const,
        message: d.message,
      })),
    });
  }

  /** Fire-and-forget helper for request paths — never throws into the caller. */
  triggerDispatch(): void {
    void this.dispatchPending().catch((e) =>
      this.logger.error(`dispatch failed: ${e instanceof Error ? e.message : String(e)}`),
    );
  }

  /** Sweeper: anything still CREATED (crash between commit and dispatch) gets retried. */
  @Interval(60_000)
  async sweepStalePending(): Promise<void> {
    await this.dispatchPending().catch((e) =>
      this.logger.error(`sweep failed: ${e instanceof Error ? e.message : String(e)}`),
    );
  }

  async dispatchPending(): Promise<void> {
    // Coalesce concurrent triggers: if a dispatch is running, ask it to loop once more
    // when it finishes so an alert committed mid-run isn't stuck waiting for the sweeper.
    if (this.dispatchInFlight) {
      this.rerunRequested = true;
      return;
    }
    this.dispatchInFlight = true;
    try {
      do {
        this.rerunRequested = false;
        await this.dispatchOnce();
      } while (this.rerunRequested);
    } finally {
      this.dispatchInFlight = false;
    }
  }

  private async dispatchOnce(): Promise<void> {
    const pending = await this.prisma.alertLog.findMany({
      where: { status: 'CREATED', channel: 'PUSH' },
      include: {
        parent: { include: { pushTokens: { orderBy: { updatedAt: 'desc' }, take: 1 } } },
      },
      orderBy: { at: 'asc' },
      take: 500,
    });
    if (pending.length === 0) return;

    const sendable: { alertId: string; token: string; push: ExpoPushMessage }[] = [];
    for (const alert of pending) {
      const token = alert.parent.pushTokens[0]?.token;
      if (!token) {
        // Give a just-registering parent a grace window before failing the alert.
        if (Date.now() - alert.at.getTime() >= NO_TOKEN_GRACE_MS) {
          await this.markFailed(alert.id, 'NO_PUSH_TOKEN');
        }
        continue;
      }
      if (!Expo.isExpoPushToken(token)) {
        await this.markFailed(alert.id, 'INVALID_PUSH_TOKEN');
        continue;
      }
      sendable.push({
        alertId: alert.id,
        token,
        push: {
          to: token,
          title: ALERT_TITLE,
          body: alert.message,
          priority: 'high',
          data: { type: alert.type, tripId: alert.tripId, studentId: alert.studentId },
        },
      });
    }

    for (const chunk of this.expo.chunkPushNotifications(sendable.map((s) => s.push))) {
      // Chunks preserve order; splice consumes the aligned sendable entries.
      const chunkItems = sendable.splice(0, chunk.length);
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const item = chunkItems[i];
          if (!ticket || !item) continue;
          if (ticket.status === 'ok') {
            await this.prisma.alertLog.update({
              where: { id: item.alertId },
              data: { status: 'SENT', pushTicketId: ticket.id, sentAt: new Date() },
            });
          } else {
            await this.markFailed(item.alertId, ticket.details?.error ?? ticket.message);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              await this.dropToken(item.token);
            }
          }
        }
      } catch (e) {
        // Expo unreachable: leave rows CREATED — the sweeper retries them.
        this.logger.warn(
          `push chunk failed, will retry: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  /** Receipt poller: SENT → DELIVERED | FAILED. */
  @Interval(30_000)
  async pollReceipts(): Promise<void> {
    if (this.receiptsInFlight) return;
    this.receiptsInFlight = true;
    try {
      // Any SENT row we never got a receipt for reaches a terminal state.
      await this.prisma.alertLog.updateMany({
        where: { status: 'SENT', sentAt: { lt: new Date(Date.now() - RECEIPT_EXPIRY_MS) } },
        data: { status: 'FAILED', errorDetail: 'RECEIPT_EXPIRED' },
      });

      const sent = await this.prisma.alertLog.findMany({
        where: {
          status: 'SENT',
          pushTicketId: { not: null },
          sentAt: { gte: new Date(Date.now() - RECEIPT_EXPIRY_MS) },
        },
        orderBy: { sentAt: 'asc' },
        take: 300,
      });
      if (sent.length === 0) return;

      const byTicket = new Map<string, (typeof sent)[number]>();
      for (const alert of sent) {
        if (alert.pushTicketId) byTicket.set(alert.pushTicketId, alert);
      }
      for (const chunk of this.expo.chunkPushNotificationReceiptIds([...byTicket.keys()])) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
          for (const [ticketId, receipt] of Object.entries(receipts)) {
            const alert = byTicket.get(ticketId);
            if (!alert) continue;
            if (receipt.status === 'ok') {
              await this.prisma.alertLog.update({
                where: { id: alert.id },
                data: { status: 'DELIVERED', deliveredAt: new Date() },
              });
            } else {
              await this.markFailed(alert.id, receipt.details?.error ?? 'RECEIPT_ERROR');
              if (receipt.details?.error === 'DeviceNotRegistered') {
                await this.prisma.pushToken.deleteMany({ where: { userId: alert.parentUserId } });
              }
            }
          }
        } catch (e) {
          this.logger.warn(
            `receipt chunk failed, will retry: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } finally {
      this.receiptsInFlight = false;
    }
  }

  private async markFailed(alertId: string, errorDetail: string): Promise<void> {
    await this.prisma.alertLog.update({
      where: { id: alertId },
      data: { status: 'FAILED', errorDetail },
    });
  }

  private async dropToken(token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { token } });
  }
}
