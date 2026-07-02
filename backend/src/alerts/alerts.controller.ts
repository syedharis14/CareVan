import { Controller, Get, Query } from '@nestjs/common';
import { AlertAuditQuery, AlertAuditQuerySchema, AlertAuditResponse } from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AlertsService } from './alerts.service';

@Roles('ADMIN')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  audit(
    @Query(new ZodValidationPipe(AlertAuditQuerySchema)) query: AlertAuditQuery,
  ): Promise<AlertAuditResponse> {
    return this.alerts.auditLog(query);
  }
}
