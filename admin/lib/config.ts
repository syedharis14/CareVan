/** Backend base URL for server-side fetches. */
export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3005';

/** httpOnly cookie holding the ADMIN JWT. */
export const SESSION_COOKIE = 'carevan_admin';
