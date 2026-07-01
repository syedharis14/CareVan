import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, AuthPrincipal } from '../types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      // JwtAuthGuard always runs first; reaching here without a user is a wiring bug.
      throw new Error('CurrentUser used on a route without an authenticated principal');
    }
    return request.user;
  },
);
