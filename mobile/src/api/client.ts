import { ZodType } from 'zod';
import { API_URL } from '../config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Resolves the current bearer token; set by the auth store after login. */
let tokenProvider: () => string | null = () => null;
export function setTokenProvider(fn: () => string | null): void {
  tokenProvider = fn;
}

interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** zod schema the response is parsed through — the contract boundary. */
  schema?: ZodType<T>;
  /** Skip the auth header (login only). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { method = 'GET', body, schema, anonymous, signal } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!anonymous) {
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const message =
      (errBody && typeof errBody === 'object' && 'message' in errBody
        ? String((errBody as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, errBody);
  }

  if (res.status === 204) return undefined as T;
  const json: unknown = await res.json();
  return schema ? schema.parse(json) : (json as T);
}
