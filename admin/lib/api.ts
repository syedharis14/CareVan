import 'server-only';
import { redirect } from 'next/navigation';
import { ZodType } from 'zod';
import { BACKEND_URL } from './config';
import { getToken } from './session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call(path: string, init: RequestInit): Promise<Response> {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  // Session expired/invalid → back to login.
  if (res.status === 401) redirect('/login');
  return res;
}

async function parse<T>(res: Response, schema?: ZodType<T>): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  const json: unknown = await res.json();
  return schema ? schema.parse(json) : (json as T);
}

/** GET a backend resource and validate it through a shared zod schema. */
export async function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return parse(await call(path, { method: 'GET' }), schema);
}

/** Mutating call (used by server actions). Returns the parsed body if a schema is given. */
export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  schema?: ZodType<T>,
): Promise<T> {
  return parse(
    await call(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }),
    schema,
  );
}
