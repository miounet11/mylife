// @ts-nocheck
import { NextResponse } from 'next/server';

import { getSystemCapabilityStats } from '@/lib/system-capability-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = getSystemCapabilityStats();
  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}