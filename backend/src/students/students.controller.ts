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
  Query,
} from '@nestjs/common';
import {
  AssignParentRequest,
  AssignParentRequestSchema,
  CreateStudentRequest,
  CreateStudentRequestSchema,
  ListStudentsQuery,
  ListStudentsQuerySchema,
  ListStudentsResponse,
  StudentResponse,
  UpdateStudentRequest,
  UpdateStudentRequestSchema,
} from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { StudentsService } from './students.service';

@Roles('ADMIN')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateStudentRequestSchema)) body: CreateStudentRequest,
  ): Promise<StudentResponse> {
    return this.studentsService.create(body);
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(ListStudentsQuerySchema)) query: ListStudentsQuery,
  ): Promise<ListStudentsResponse> {
    return this.studentsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<StudentResponse> {
    return this.studentsService.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStudentRequestSchema)) body: UpdateStudentRequest,
  ): Promise<StudentResponse> {
    return this.studentsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.studentsService.remove(id);
  }

  // --- Parent mapping ---

  @Post(':id/parents')
  assignParent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignParentRequestSchema)) body: AssignParentRequest,
  ): Promise<StudentResponse> {
    return this.studentsService.assignParent(id, body);
  }

  @Delete(':id/parents/:parentUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeParent(
    @Param('id') id: string,
    @Param('parentUserId') parentUserId: string,
  ): Promise<void> {
    return this.studentsService.removeParent(id, parentUserId);
  }
}
