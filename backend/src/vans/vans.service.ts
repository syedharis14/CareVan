import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignVanStudentRequest,
  CreateVanRequest,
  ListVansResponse,
  ListVansResponseSchema,
  UpdateStopOrderRequest,
  UpdateVanRequest,
  VanResponse,
  VanResponseSchema,
  VanRosterResponse,
  VanRosterResponseSchema,
} from '@carevan/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const vanInclude = {
  driver: { select: { id: true, name: true, phone: true } },
  school: { select: { id: true, name: true } },
} satisfies Prisma.VanInclude;

type VanWithRefs = Prisma.VanGetPayload<{ include: typeof vanInclude }>;

@Injectable()
export class VansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(request: CreateVanRequest): Promise<VanResponse> {
    await this.assertDriver(request.driverId);
    await this.assertSchool(request.schoolId);
    try {
      const van = await this.prisma.van.create({ data: request, include: vanInclude });
      return this.toResponse(van);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A van with this plate number already exists');
      }
      throw e;
    }
  }

  async list(): Promise<ListVansResponse> {
    const vans = await this.prisma.van.findMany({
      include: vanInclude,
      orderBy: { plateNo: 'asc' },
    });
    return ListVansResponseSchema.parse(vans.map((v) => this.toResponse(v)));
  }

  async get(id: string): Promise<VanResponse> {
    const van = await this.prisma.van.findUnique({ where: { id }, include: vanInclude });
    if (!van) throw new NotFoundException('Van not found');
    return this.toResponse(van);
  }

  async update(id: string, request: UpdateVanRequest): Promise<VanResponse> {
    const existing = await this.prisma.van.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!existing) throw new NotFoundException('Van not found');
    if (request.driverId) await this.assertDriver(request.driverId);
    if (request.schoolId && request.schoolId !== existing.schoolId) {
      await this.assertSchool(request.schoolId);
      // The roster invariant (student.schoolId === van.schoolId) must survive updates too.
      if (existing._count.students > 0) {
        throw new ConflictException(
          'Van has students on its roster — remove them before changing its school',
        );
      }
    }
    try {
      const van = await this.prisma.van.update({
        where: { id },
        data: request,
        include: vanInclude,
      });
      return this.toResponse(van);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A van with this plate number already exists');
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    try {
      await this.prisma.van.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('Van has trips recorded — cannot delete');
      }
      throw e;
    }
  }

  // --- Roster (VanStudent mapping) ---

  async roster(vanId: string): Promise<VanRosterResponse> {
    await this.get(vanId);
    const entries = await this.prisma.vanStudent.findMany({
      where: { vanId },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { stopOrder: 'asc' },
    });
    return VanRosterResponseSchema.parse(
      entries.map((e) => ({ stopOrder: e.stopOrder, student: e.student })),
    );
  }

  async assignStudent(vanId: string, request: AssignVanStudentRequest): Promise<VanRosterResponse> {
    const van = await this.prisma.van.findUnique({ where: { id: vanId } });
    if (!van) throw new NotFoundException('Van not found');

    const student = await this.prisma.student.findUnique({ where: { id: request.studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.schoolId !== van.schoolId) {
      throw new BadRequestException('Student and van belong to different schools');
    }

    try {
      // Count and create atomically so concurrent assigns can't exceed capacity.
      await this.prisma.$transaction(async (tx) => {
        const seated = await tx.vanStudent.count({ where: { vanId } });
        if (seated >= van.capacity) {
          throw new ConflictException('Van is at capacity');
        }
        await tx.vanStudent.create({
          data: { vanId, studentId: request.studentId, stopOrder: request.stopOrder },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Student is already on this van');
      }
      throw e;
    }
    return this.roster(vanId);
  }

  async updateStopOrder(
    vanId: string,
    studentId: string,
    request: UpdateStopOrderRequest,
  ): Promise<VanRosterResponse> {
    try {
      await this.prisma.vanStudent.update({
        where: { vanId_studentId: { vanId, studentId } },
        data: { stopOrder: request.stopOrder },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Student is not on this van');
      }
      throw e;
    }
    return this.roster(vanId);
  }

  async removeStudent(vanId: string, studentId: string): Promise<void> {
    try {
      await this.prisma.vanStudent.delete({
        where: { vanId_studentId: { vanId, studentId } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Student is not on this van');
      }
      throw e;
    }
  }

  private toResponse(van: VanWithRefs): VanResponse {
    return VanResponseSchema.parse({
      id: van.id,
      plateNo: van.plateNo,
      capacity: van.capacity,
      driver: van.driver,
      school: van.school,
    });
  }

  private async assertDriver(driverId: string): Promise<void> {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.role !== 'DRIVER') throw new BadRequestException('User is not a DRIVER');
  }

  private async assertSchool(schoolId: string): Promise<void> {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
  }
}
