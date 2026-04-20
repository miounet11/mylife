import { NextRequest, NextResponse } from 'next/server';
import { getEmailRetryCronToken } from '@/lib/env';
import { runEmailDeliveryRetryCycle } from '@/lib/email-delivery-jobs';

export const maxDuration = 20;

function isAuthorized(request: NextRequest) {
  const expected = getEmailRetryCronToken();
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
