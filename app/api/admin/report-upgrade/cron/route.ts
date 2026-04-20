import { NextRequest, NextResponse } from 'next/server';
import { getReportUpgradeCronToken } from '@/lib/env';
import { processReportUpgradeBatch } from '@/lib/report-upgrade-jobs';

function isAuthorized(request: NextRequest) {
  const expected = getReportUpgradeCronToken();
  if (!expected) return false;
  return request.headers.get('x-report-upgrade-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await processReportUpgradeBatch();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[report-upgrade-cron] failed:', error);
    return NextResponse.json(
      { success: false, error: 'report upgrade cron failed' },
      { status: 500 }
    );
  }
}
