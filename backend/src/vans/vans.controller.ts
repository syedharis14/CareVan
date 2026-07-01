import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  AssignVanStudentRequest,
  AssignVanStudentRequestSchema,
  CreateVanRequest,
  CreateVanRequestSchema,
  ListVansResponse,
  UpdateStopOrderRequest,
  UpdateStopOrderRequestSchema,
  UpdateVanRequest,
  UpdateVanRequestSchema,
  VanResponse,
  VanRosterResponse,
} from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { VansService } from './vans.service';

@Roles('ADMIN')
@Controller('vans')
export class VansController {
  constructor(private readonly vansService: VansService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateVanRequestSchema)) body: CreateVanRequest,
  ): Promise<VanResponse> {
    return this.vansService.create(body);
  }

  @Get()
  list(): Promise<ListVansResponse> {
    return this.vansService.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<VanResponse> {
    return this.vansService.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateVanRequestSchema)) body: UpdateVanRequest,
  ): Promise<VanResponse> {
    return this.vansService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.vansService.remove(id);
  }

  // --- Roster ---

  @Get(':id/students')
  roster(@Param('id') id: string): Promise<VanRosterResponse> {
    return this.vansService.roster(id);
  }

  @Post(':id/students')
  assignStudent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignVanStudentRequestSchema)) body: AssignVanStudentRequest,
  ): Promise<VanRosterResponse> {
    return this.vansService.assignStudent(id, body);
  }

  @Patch(':id/students/:studentId')
  updateStopOrder(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body(new ZodValidationPipe(UpdateStopOrderRequestSchema)) body: UpdateStopOrderRequest,
  ): Promise<VanRosterResponse> {
    return this.vansService.updateStopOrder(id, studentId, body);
  }

  @Delete(':id/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string): Promise<void> {
    return this.vansService.removeStudent(id, studentId);
  }
}
