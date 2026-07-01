import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  CreateUserRequest,
  CreateUserRequestSchema,
  ListUsersQuery,
  ListUsersQuerySchema,
  ListUsersResponse,
  UpdateUserRequest,
  UpdateUserRequestSchema,
  UserResponse,
} from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UsersService } from './users.service';

@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateUserRequestSchema)) body: CreateUserRequest,
  ): Promise<UserResponse> {
    return this.usersService.create(body);
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(ListUsersQuerySchema)) query: ListUsersQuery,
  ): Promise<ListUsersResponse> {
    return this.usersService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserRequestSchema)) body: UpdateUserRequest,
  ): Promise<UserResponse> {
    return this.usersService.update(id, body);
  }
}
