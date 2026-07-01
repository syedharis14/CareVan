import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignParentRequest,
  CreateStudentRequest,
  ListStudentsQuery,
  ListStudentsResponse,
  ListStudentsResponseSchema,
  StudentResponse,
  StudentResponseSchema,
  UpdateStudentRequest,
} from '@carevan/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const studentInclude = {
  school: { select: { id: true, name: true } },
  parents: { include: { parent: { select: { id: true, name: true, phone: true } } } },
} satisfies Prisma.StudentInclude;

type StudentWithRefs = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(request: CreateStudentRequest): Promise<StudentResponse> {
    await this.assertSchool(request.schoolId);
    const student = await this.prisma.student.create({
      data: request,
      include: studentInclude,
    });
    return this.toResponse(student);
  }

  async list(query: ListStudentsQuery): Promise<ListStudentsResponse> {
    const students = await this.prisma.student.findMany({
      where: query.schoolId ? { schoolId: query.schoolId } : undefined,
      include: studentInclude,
      orderBy: { name: 'asc' },
    });
    return ListStudentsResponseSchema.parse(students.map((s) => this.toResponse(s)));
  }

  async get(id: string): Promise<StudentResponse> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: studentInclude,
    });
    if (!student) throw new NotFoundException('Student not found');
    return this.toResponse(student);
  }

  async update(id: string, request: UpdateStudentRequest): Promise<StudentResponse> {
    const existing = await this.prisma.student.findUnique({
      where: { id },
      include: { vanLinks: { select: { vanId: true } } },
    });
    if (!existing) throw new NotFoundException('Student not found');
    if (request.schoolId && request.schoolId !== existing.schoolId) {
      await this.assertSchool(request.schoolId);
      // The roster invariant (student.schoolId === van.schoolId) must survive updates too.
      if (existing.vanLinks.length > 0) {
        throw new ConflictException(
          'Student is assigned to a van — remove them from it before changing school',
        );
      }
    }
    const student = await this.prisma.student.update({
      where: { id },
      data: request,
      include: studentInclude,
    });
    return this.toResponse(student);
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    try {
      await this.prisma.student.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('Student has trips or subscriptions recorded — cannot delete');
      }
      throw e;
    }
  }

  // --- Parent mapping ---

  async assignParent(studentId: string, request: AssignParentRequest): Promise<StudentResponse> {
    await this.get(studentId);
    const parent = await this.prisma.user.findUnique({ where: { id: request.parentUserId } });
    if (!parent) throw new NotFoundException('Parent user not found');
    if (parent.role !== 'PARENT') throw new BadRequestException('User is not a PARENT');

    try {
      await this.prisma.studentParent.create({
        data: { studentId, parentUserId: request.parentUserId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Parent is already linked to this student');
      }
      throw e;
    }
    return this.get(studentId);
  }

  async removeParent(studentId: string, parentUserId: string): Promise<void> {
    try {
      await this.prisma.studentParent.delete({
        where: { studentId_parentUserId: { studentId, parentUserId } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Parent is not linked to this student');
      }
      throw e;
    }
  }

  private toResponse(student: StudentWithRefs): StudentResponse {
    return StudentResponseSchema.parse({
      id: student.id,
      name: student.name,
      homeLat: student.homeLat,
      homeLng: student.homeLng,
      pickupNotes: student.pickupNotes,
      school: student.school,
      parents: student.parents.map((link) => link.parent),
    });
  }

  private async assertSchool(schoolId: string): Promise<void> {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
  }
}
