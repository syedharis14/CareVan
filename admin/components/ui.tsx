import { ReactNode } from 'react';

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {children}
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="cv-card mb-6 p-5">
      {title ? <h2 className="mb-3 font-bold">{title}</h2> : null}
      {children}
    </div>
  );
}

type Tone = 'safe' | 'transit' | 'danger' | 'primary' | 'neutral';

const toneVar: Record<Tone, string> = {
  safe: 'var(--color-safe)',
  transit: 'var(--color-transit)',
  danger: 'var(--color-danger)',
  primary: 'var(--color-primary)',
  neutral: 'var(--color-ink-soft)',
};

/** Status pill — icon+label via color, but color is never the ONLY signal (text present). */
export function Chip({ label, tone }: { label: string; tone: Tone }) {
  const color = toneVar[tone];
  return (
    <span
      className="cv-chip"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {label}
    </span>
  );
}
