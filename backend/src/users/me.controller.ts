import { Body, Controller, Delete, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { RegisterPushTokenRequest, RegisterPushTokenRequestSchema } from '@carevan/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthPrincipal } from '../common/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

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
}
