import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CreateSubscriptionRequest,
  CreateSubscriptionRequestSchema,
  ListSubscriptionsResponse,
  RecordPaymentRequest,
  RecordPaymentRequestSchema,
  SubscriptionResponse,
  UpdateSubscriptionStatusRequest,
  UpdateSubscriptionStatusRequestSchema,
} from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { BillingService } from './billing.service';

@Roles('ADMIN')
@Controller('subscriptions')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  list(): Promise<ListSubscriptionsResponse> {
    return this.billing.list();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateSubscriptionRequestSchema)) body: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    return this.billing.create(body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSubscriptionStatusRequestSchema))
    body: UpdateSubscriptionStatusRequest,
  ): Promise<SubscriptionResponse> {
    return this.billing.updateStatus(id, body);
  }

  @Post(':id/payments')
  recordPayment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RecordPaymentRequestSchema)) body: RecordPaymentRequest,
  ): Promise<SubscriptionResponse> {
    return this.billing.recordPayment(id, body);
  }
}
