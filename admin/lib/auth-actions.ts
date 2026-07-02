'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginResponseSchema, normalizePkPhone } from '@carevan/shared';
import { BACKEND_URL, SESSION_COOKIE } from './config';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = normalizePkPhone(String(formData.get('phone') ?? ''));
  const pin = String(formData.get('pin') ?? '');

  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin }),
    cache: 'no-store',
  });
  if (!res.ok) return { error: 'Incorrect phone or PIN.' };

  const parsed = LoginResponseSchema.safeParse(await res.json());
  if (!parsed.success) return { error: 'Unexpected response from server.' };
  if (parsed.data.user.role !== 'ADMIN') {
    return { error: 'This panel is for admin accounts only.' };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, parsed.data.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/login');
}
