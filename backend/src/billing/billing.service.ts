import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSubscriptionRequest,
  ListSubscriptionsResponse,
  ListSubscriptionsResponseSchema,
  RecordPaymentRequest,
  SubscriptionResponse,
  SubscriptionResponseSchema,
  UpdateSubscriptionStatusRequest,
} from '@carevan/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const subInclude = {
  parent: { select: { id: true, name: true, phone: true } },
  student: { select: { id: true, name: true } },
  payments: { orderBy: { recordedAt: 'desc' } },
} satisfies Prisma.SubscriptionInclude;

type SubWithRefs = Prisma.SubscriptionGetPayload<{ include: typeof subInclude }>;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ListSubscriptionsResponse> {
    const subs = await this.prisma.subscription.findMany({
      include: subInclude,
      orderBy: { student: { name: 'asc' } },
    });
    return ListSubscriptionsResponseSchema.parse(subs.map((s) => this.toResponse(s)));
  }

  async create(request: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    const parent = await this.prisma.user.findUnique({ where: { id: request.parentUserId } });
    if (!parent) throw new NotFoundException('Parent not found');
    if (parent.role !== 'PARENT') throw new BadRequestException('User is not a PARENT');
    const student = await this.prisma.student.findUnique({ where: { id: request.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.prisma.subscription.findFirst({
      where: { parentUserId: request.parentUserId, studentId: request.studentId },
    });
    if (existing)
      throw new ConflictException('A subscription already exists for this parent + child');

    const sub = await this.prisma.subscription.create({
      // Starts UNPAID; recording a payment flips it to ACTIVE.
      data: { ...request, status: 'UNPAID' },
      include: subInclude,
    });
    return this.toResponse(sub);
  }

  async updateStatus(
    id: string,
    request: UpdateSubscriptionStatusRequest,
  ): Promise<SubscriptionResponse> {
    await this.getOrThrow(id);
    const sub = await this.prisma.subscription.update({
      where: { id },
      data: { status: request.status },
      include: subInclude,
    });
    return this.toResponse(sub);
  }

  /** Record a manual cash/transfer payment; a received payment marks the sub ACTIVE. */
  async recordPayment(id: string, request: RecordPaymentRequest): Promise<SubscriptionResponse> {
    await this.getOrThrow(id);
    await this.prisma.$transaction([
      this.prisma.paymentRecord.create({
        data: {
          subscriptionId: id,
          amountPkr: request.amountPkr,
          method: request.method,
          note: request.note,
        },
      }),
      this.prisma.subscription.update({ where: { id }, data: { status: 'ACTIVE' } }),
    ]);
    const sub = await this.prisma.subscription.findUniqueOrThrow({
      where: { id },
      include: subInclude,
    });
    return this.toResponse(sub);
  }

  private async getOrThrow(id: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
  }

  private toResponse(sub: SubWithRefs): SubscriptionResponse {
    return SubscriptionResponseSchema.parse({
      id: sub.id,
      status: sub.status,
      amountPkr: sub.amountPkr,
      parent: sub.parent,
      student: sub.student,
      payments: sub.payments.map((p) => ({
        id: p.id,
        amountPkr: p.amountPkr,
        method: p.method,
        note: p.note,
        recordedAt: p.recordedAt,
      })),
      paidTotalPkr: sub.payments.reduce((sum, p) => sum + p.amountPkr, 0),
    });
  }
}
