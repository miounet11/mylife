import { NextRequest, NextResponse } from 'next/server';
import { runEmailDeliveryRetryCycle } from '@/lib/email-delivery-jobs';

export const maxDuration = 20;

function isAuthorized(request: NextRequest) {
  const expected = `${process.env.EMAIL_RETRY_CRON_TOKEN || process.env.REPORT_UPGRADE_CRON_TOKEN || ''}`.trim();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-email-retry-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runEmailDeliveryRetryCycle();
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[email-retry-cron] failed:', error);
    return NextResponse.json(
      { success: false, error: 'email retry cron failed' },
      { status: 500 }
    );
  }
}
