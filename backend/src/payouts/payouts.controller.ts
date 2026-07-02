import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ListPayoutsResponse,
  MarkPayoutPaidRequest,
  MarkPayoutPaidRequestSchema,
  PayoutQuery,
  PayoutQuerySchema,
  PayoutRowResponse,
} from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PayoutsService } from './payouts.service';

@Roles('ADMIN')
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(PayoutQuerySchema)) query: PayoutQuery,
  ): Promise<ListPayoutsResponse> {
    return this.payouts.list(query);
  }

  @Post('paid')
  markPaid(
    @Body(new ZodValidationPipe(MarkPayoutPaidRequestSchema)) body: MarkPayoutPaidRequest,
  ): Promise<PayoutRowResponse> {
    return this.payouts.markPaid(body);
  }
}
