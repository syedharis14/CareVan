import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import {
  ChildrenResponse,
  DriverVansResponse,
  DriverVansResponseSchema,
  RegisterPushTokenRequest,
  RegisterPushTokenRequestSchema,
} from '@carevan/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthPrincipal } from '../common/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';
import { ParentService } from './parent.service';
import { UsersService } from './users.service';

@Controller('me')
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly parentService: ParentService,
    private readonly prisma: PrismaService,
  ) {}

  /** The parent home screen — each linked child with derived status, van, and safety. */
  @Roles('PARENT')
  @Get('children')
  children(@CurrentUser() user: AuthPrincipal): Promise<ChildrenResponse> {
    return this.parentService.childrenFor(user.id);
  }

  /** The mobile app registers its Expo push token after login and on token rotation. */
  @Roles('ADMIN', 'DRIVER', 'PARENT')
  @Put('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  registerPushToken(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(RegisterPushTokenRequestSchema)) body: RegisterPushTokenRequest,
  ): Promise<void> {
    return this.usersService.registerPushToken(user.id, body.token);
  }

  /** Called on logout — removes all of this user's device tokens. */
  @Roles('ADMIN', 'DRIVER', 'PARENT')
  @Delete('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePushTokens(@CurrentUser() user: AuthPrincipal): Promise<void> {
    return this.usersService.removePushTokens(user.id);
  }

  /** The driver app's home data: their van(s) with the ordered student roster. */
  @Roles('DRIVER')
  @Get('van')
  async myVan(@CurrentUser() driver: AuthPrincipal): Promise<DriverVansResponse> {
    const vans = await this.prisma.van.findMany({
      where: { driverId: driver.id },
      include: {
        school: { select: { id: true, name: true, lat: true, lng: true } },
        students: {
          include: { student: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
      orderBy: { plateNo: 'asc' },
    });

    return DriverVansResponseSchema.parse(
      vans.map((van) => ({
        id: van.id,
        plateNo: van.plateNo,
        capacity: van.capacity,
        school: van.school,
        students: van.students.map((vs) => ({
          id: vs.student.id,
          name: vs.student.name,
          stopOrder: vs.stopOrder,
          homeLat: vs.student.homeLat,
          homeLng: vs.student.homeLng,
          pickupNotes: vs.student.pickupNotes,
        })),
      })),
    );
  }
}
