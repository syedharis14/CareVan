import { NextResponse } from 'next/server';
import { LiveTripsResponseSchema } from '@carevan/shared';
import { apiGet } from '@/lib/api';

/** Proxies the admin live-trips feed (keeps the ADMIN JWT server-side; the map polls this). */
export async function GET() {
  const trips = await apiGet('/trips/live', LiveTripsResponseSchema);
  return NextResponse.json(trips);
}
