'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LiveTripRow, LiveTripsResponseSchema } from '@carevan/shared';

const POLL_MS = 10_000;

// react-leaflet must never render on the server (leaflet uses `window`), so the map
// is loaded client-only. This wrapper is itself a client component, so ssr:false is allowed.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="cv-card flex h-full items-center justify-center cv-text-soft">Loading map…</div>
  ),
});

export function LiveMap() {
  const [trips, setTrips] = useState<LiveTripRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        if (!res.ok) throw new Error(`live feed ${res.status}`);
        const parsed = LiveTripsResponseSchema.parse(await res.json());
        if (alive) {
          setTrips(parsed);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'failed to load');
      }
    };
    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <p className="cv-text-soft mb-2 text-sm">
        {trips.length} active trip{trips.length === 1 ? '' : 's'}
        {error ? ` · feed error: ${error}` : ' · refreshing every 10s'}
      </p>
      <div style={{ height: 480, borderRadius: 12, overflow: 'hidden' }}>
        <LeafletMap trips={trips} />
      </div>
    </div>
  );
}
