import { NextRequest, NextResponse } from 'next/server';
import { getUserLifecycleEmailCronToken } from '@/lib/env';
import { runUserLifecycleEmailCycle } from '@/lib/user-lifecycle-email';

export const maxDuration = 30;

function isAuthorized(request: NextRequest) {
  const expected = getUserLifecycleEmailCronToken();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-user-lifecycle-email-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runUserLifecycleEmailCycle({ trigger: 'cron' });
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[user-lifecycle-email-cron] failed:', error);
    return NextResponse.json(
      { success: false, error: 'user lifecycle email cron failed' },
      { status: 500 }
    );
  }
}
