import { NextRequest, NextResponse } from 'next/server';
import { getContentGenerationCronToken } from '@/lib/env';
import { processContentGenerationJobBatch } from '@/lib/content-generation-jobs';

export const maxDuration = 900;

function isAuthorized(request: NextRequest) {
  const expected = getContentGenerationCronToken();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-content-generation-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const result = await processContentGenerationJobBatch();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      processedCount: result.processedCount,
      reason: result.reason,
      jobs: result.jobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 内容生成任务执行失败:', error);
    return NextResponse.json({ success: false, error: '内容生成任务执行失败' }, { status: 500 });
  }
}
