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
  CreateSchoolRequest,
  CreateSchoolRequestSchema,
  ListSchoolsResponse,
  SchoolResponse,
  UpdateSchoolRequest,
  UpdateSchoolRequestSchema,
} from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SchoolsService } from './schools.service';

@Roles('ADMIN')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateSchoolRequestSchema)) body: CreateSchoolRequest,
  ): Promise<SchoolResponse> {
    return this.schoolsService.create(body);
  }

  @Get()
  list(): Promise<ListSchoolsResponse> {
    return this.schoolsService.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<SchoolResponse> {
    return this.schoolsService.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSchoolRequestSchema)) body: UpdateSchoolRequest,
  ): Promise<SchoolResponse> {
    return this.schoolsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.schoolsService.remove(id);
  }
}
