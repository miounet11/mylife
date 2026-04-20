import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousGrowthCronToken } from '@/lib/env';
import { runWorldYiAutonomousCycle } from '@/lib/world-yi-autonomous-engine';

export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const expected = getAutonomousGrowthCronToken();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-autonomous-growth-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const mode = (
      request.nextUrl.searchParams.get('mode') === 'validation'
      || request.headers.get('x-autonomous-growth-mode') === 'validation'
    ) ? 'validation' : 'full';
    const result = await runWorldYiAutonomousCycle({ trigger: 'cron', mode });
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[autonomous-system] cron run failed:', error);
    return NextResponse.json({ success: false, error: '自治总控任务执行失败' }, { status: 500 });
  }
}
