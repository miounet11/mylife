import { NextRequest, NextResponse } from 'next/server';
import { getContentSchedulerCronToken } from '@/lib/env';
import { runContentSchedulerCycle } from '@/lib/content-ops';

export const maxDuration = 900;

function isAuthorized(request: NextRequest) {
  const expected = getContentSchedulerCronToken();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-scheduler-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const result = await runContentSchedulerCycle({ trigger: 'cron' });
    return NextResponse.json({
      success: true,
      generatedCount: result.generatedCount,
      publishedCount: result.publishedCount,
      publishedTitle: result.publishedEntry?.title || null,
      reason: result.reason,
      radarRefreshed: result.radarRefreshed,
      scheduler: result.scheduler,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 内容调度任务执行失败:', error);
    return NextResponse.json({ success: false, error: '内容调度任务执行失败' }, { status: 500 });
  }
}
