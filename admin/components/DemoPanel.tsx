'use client';

import { useEffect, useState } from 'react';
import { DemoStatusResponse, DemoStatusResponseSchema } from '@carevan/shared';
import { Chip } from './ui';

export function DemoPanel() {
  const [status, setStatus] = useState<DemoStatusResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poll = async () => {
    try {
      const res = await fetch('/api/demo', { cache: 'no-store' });
      if (res.ok) setStatus(DemoStatusResponseSchema.parse(await res.json()));
    } catch {
      /* transient — keep last state */
    }
  };

  useEffect(() => {
    void poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Could not start the demo');
      }
      await poll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the demo');
    } finally {
      setStarting(false);
    }
  };

  const running = status?.running ?? false;

  return (
    <div className="cv-card p-6">
      <p className="cv-text-soft mb-4 text-sm">
        Starts a scripted trip on the demo van along a real Lahore route. Sign into the app as{' '}
        <strong>Demo Parent</strong> (+92 300 0000001) on the phone in your hand — the BOARDED push
        arrives within seconds and REACHED SCHOOL about a minute later. Watch it move on{' '}
        <strong>Live trips</strong>.
      </p>

      <button className="cv-btn" onClick={start} disabled={starting || running}>
        {running ? 'Demo running…' : starting ? 'Starting…' : '▶ Start demo'}
      </button>

      {error ? <p className="mt-3 text-sm font-semibold">{error}</p> : null}

      {status ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Chip label={running ? 'Running' : 'Idle'} tone={running ? 'transit' : 'neutral'} />
          <Chip
            label={status.boardedFired ? '✓ BOARDED fired' : 'BOARDED pending'}
            tone={status.boardedFired ? 'safe' : 'neutral'}
          />
          <Chip
            label={status.reachedFired ? '✓ REACHED SCHOOL fired' : 'REACHED pending'}
            tone={status.reachedFired ? 'safe' : 'neutral'}
          />
          <span className="cv-text-soft text-sm">
            {status.pingsSent}/{status.totalPings} pings sent
          </span>
        </div>
      ) : null}
    </div>
  );
}
