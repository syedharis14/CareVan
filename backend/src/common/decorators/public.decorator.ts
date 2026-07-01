import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as unauthenticated (login only — everything else declares @Roles). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
