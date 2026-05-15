import { NextRequest, NextResponse } from 'next/server';
import { getReportMonthlyDigestCronToken } from '@/lib/env';
import { runReportMonthlyDigestCycle } from '@/lib/report-monthly-digest';

export const maxDuration = 30;

function isAuthorized(request: NextRequest) {
  const expected = getReportMonthlyDigestCronToken();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-report-monthly-digest-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runReportMonthlyDigestCycle({ trigger: 'cron' });
    return NextResponse.json({
      ...result,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[report-monthly-digest-cron] failed:', error);
    return NextResponse.json(
      { success: false, error: 'report monthly digest cron failed' },
      { status: 500 }
    );
  }
}
