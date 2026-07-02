import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './config';

/** The ADMIN JWT from the httpOnly session cookie (server-only). */
export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
