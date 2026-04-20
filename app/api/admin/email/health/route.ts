import { NextRequest, NextResponse } from 'next/server';
import { getReportUpgradeCronToken } from '@/lib/env';
import { getMailDebugConfig, verifyMailConnection } from '@/mail';

export const maxDuration = 15;

function isAuthorized(request: NextRequest) {
  const expected = getReportUpgradeCronToken();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-report-upgrade-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await verifyMailConnection();
    return NextResponse.json({
      success: true,
      status: 'ok',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const details = error instanceof Error
      ? {
          message: error.message,
          name: error.name,
        }
      : {
          message: 'unknown',
          name: 'UnknownError',
        };

    return NextResponse.json({
      success: false,
      status: 'error',
      config: getMailDebugConfig(),
      error: details,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
