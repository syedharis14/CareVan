'use client';

import { useActionState } from 'react';
import { Logo } from '@/components/Logo';
import { loginAction, type LoginState } from '@/lib/auth-actions';

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form action={action} className="cv-card w-full max-w-sm p-8">
        <Logo size={40} />
        <p className="cv-text-soft mb-6 mt-1 text-sm">Admin panel</p>

        <label className="mb-1 block text-sm font-semibold">Phone</label>
        <input
          name="phone"
          className="cv-input mb-4"
          placeholder="03XX XXXXXXX"
          autoComplete="username"
        />

        <label className="mb-1 block text-sm font-semibold">PIN</label>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          className="cv-input mb-4"
          placeholder="••••"
          autoComplete="current-password"
        />

        {/* Not red — red is reserved for SOS/overspeed. Form errors use ink emphasis. */}
        {state.error ? <p className="mb-3 text-sm font-semibold">{state.error}</p> : null}

        <button className="cv-btn w-full" type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
