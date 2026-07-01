import { SetMetadata } from '@nestjs/common';
import { Role } from '@carevan/shared';

export const ROLES_KEY = 'roles';

/**
 * Declares which roles may call a route. Authorization is fail-closed:
 * a non-@Public route without @Roles metadata is rejected by RolesGuard.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
