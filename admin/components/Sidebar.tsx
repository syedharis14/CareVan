'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/live', label: 'Live trips' },
  { href: '/schools', label: 'Schools' },
  { href: '/vans', label: 'Vans' },
  { href: '/users', label: 'Drivers & parents' },
  { href: '/students', label: 'Students' },
  { href: '/subscriptions', label: 'Subscriptions' },
  { href: '/payouts', label: 'Driver payouts' },
  { href: '/alerts', label: 'Alert audit' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontWeight: active ? 700 : 500,
              background: active ? 'var(--color-primary-light)' : 'transparent',
              color: active ? 'var(--color-primary)' : 'var(--color-ink)',
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
