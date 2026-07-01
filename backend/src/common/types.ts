import { Role } from '@carevan/shared';
import { Request } from 'express';

/** JWT payload as signed by AuthService. */
export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
}

/** The authenticated principal attached to the request by JwtAuthGuard. */
export interface AuthPrincipal {
  id: string;
  phone: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPrincipal;
}
