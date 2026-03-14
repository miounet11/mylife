import { NextRequest, NextResponse } from 'next/server';
import { runReportMonthlyDigestCycle } from '@/lib/report-monthly-digest';

export const maxDuration = 30;

function isAuthorized(request: NextRequest) {
  const expected = `${process.env.REPORT_MONTHLY_DIGEST_CRON_TOKEN || ''}`.trim();
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
      success: true,
      ...result,
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
