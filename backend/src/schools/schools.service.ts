import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateSchoolRequest,
  ListSchoolsResponse,
  ListSchoolsResponseSchema,
  SchoolResponse,
  SchoolResponseSchema,
  UpdateSchoolRequest,
} from '@carevan/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(request: CreateSchoolRequest): Promise<SchoolResponse> {
    const school = await this.prisma.school.create({ data: request });
    return SchoolResponseSchema.parse(school);
  }

  async list(): Promise<ListSchoolsResponse> {
    const schools = await this.prisma.school.findMany({ orderBy: { name: 'asc' } });
    return ListSchoolsResponseSchema.parse(schools);
  }

  async get(id: string): Promise<SchoolResponse> {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    return SchoolResponseSchema.parse(school);
  }

  async update(id: string, request: UpdateSchoolRequest): Promise<SchoolResponse> {
    await this.get(id);
    const school = await this.prisma.school.update({ where: { id }, data: request });
    return SchoolResponseSchema.parse(school);
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    try {
      await this.prisma.school.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('School still has vans or students linked to it');
      }
      throw e;
    }
  }
}
