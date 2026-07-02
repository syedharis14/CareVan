import { NextResponse } from 'next/server';
import { DemoStartResponseSchema, DemoStatusResponseSchema } from '@carevan/shared';
import { apiGet, apiSend } from '@/lib/api';

/** Live demo progress (polled by the DemoPanel). */
export async function GET() {
  return NextResponse.json(await apiGet('/demo/status', DemoStatusResponseSchema));
}

/** One-click demo trigger — the founder's sales button. */
export async function POST() {
  return NextResponse.json(
    await apiSend('/demo/start', 'POST', undefined, DemoStartResponseSchema),
  );
}
