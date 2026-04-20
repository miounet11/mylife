import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getKnowledgeCronToken } from '@/lib/env';
import { getKnowledgeOpsSnapshot } from '@/lib/knowledge-ops';

export const maxDuration = 15;

async function isAuthorized(request: NextRequest) {
  const session = await getAuthSession();
  if (session.authenticated && session.user?.role === 'admin') {
    return true;
  }

  const expected = getKnowledgeCronToken();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-knowledge-cron-token') === expected;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    snapshot: getKnowledgeOpsSnapshot(),
    timestamp: new Date().toISOString(),
  });
}
