import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateUserRequest,
  ListUsersQuery,
  ListUsersResponse,
  ListUsersResponseSchema,
  normalizePkPhone,
  UpdateUserRequest,
  UserResponse,
  UserResponseSchema,
} from '@carevan/shared';
import { Prisma, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(request: CreateUserRequest): Promise<UserResponse> {
    const phone = normalizePkPhone(request.phone);
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) throw new ConflictException('A user with this phone already exists');

    try {
      const user = await this.prisma.user.create({
        data: {
          phone,
          name: request.name,
          role: request.role,
          pinHash: await argon2.hash(request.pin),
        },
      });
      return this.toResponse(user);
    } catch (e) {
      // Pre-check above races with concurrent creates; map the unique violation too.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A user with this phone already exists');
      }
      throw e;
    }
  }

  async list(query: ListUsersQuery): Promise<ListUsersResponse> {
    const users = await this.prisma.user.findMany({
      where: query.role ? { role: query.role } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return ListUsersResponseSchema.parse(users.map((u) => this.toResponse(u)));
  }

  async get(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.toResponse(user);
  }

  async update(id: string, request: UpdateUserRequest): Promise<UserResponse> {
    await this.get(id);
    const phone = request.phone ? normalizePkPhone(request.phone) : undefined;
    if (phone) {
      const clash = await this.prisma.user.findUnique({ where: { phone } });
      if (clash && clash.id !== id) {
        throw new ConflictException('A user with this phone already exists');
      }
    }
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          phone,
          name: request.name,
          pinHash: request.pin ? await argon2.hash(request.pin) : undefined,
        },
      });
      return this.toResponse(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A user with this phone already exists');
      }
      throw e;
    }
  }

  /** Parsing through the shared schema strips pinHash by construction. */
  private toResponse(user: User): UserResponse {
    return UserResponseSchema.parse({
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
}
