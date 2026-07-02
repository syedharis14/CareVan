'use client';

import { LiveTripRow } from '@carevan/shared';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Lahore center fallback.
const LAHORE: [number, number] = [31.5204, 74.3587];

/**
 * The actual react-leaflet map. Imported ONLY via next/dynamic({ ssr:false }) from
 * LiveMap — leaflet touches `window` at import time, so it must never load on the server.
 */
export default function LeafletMap({ trips }: { trips: LiveTripRow[] }) {
  const pinged = trips.filter((t) => t.lastPing);
  return (
    <MapContainer center={LAHORE} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pinged.map((t) => (
        <Marker key={t.id} position={[t.lastPing!.lat, t.lastPing!.lng]}>
          <Popup>
            <strong>Van {t.van.plateNo}</strong>
            <br />
            {t.driver.name} · {t.type === 'PICKUP' ? 'Pickup' : 'Dropoff'}
            <br />
            {t.boardedCount}/{t.rosterCount} boarded · {Math.round(t.lastPing!.speedKmh)} km/h
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
