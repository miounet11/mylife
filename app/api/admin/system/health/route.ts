import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getSystemOpsSnapshot } from '@/lib/system-ops';

export const maxDuration = 15;

function getAllowedTokens() {
  return [...new Set([
    process.env.SYSTEM_HEALTH_TOKEN,
    process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN,
    process.env.CONTENT_RADAR_CRON_TOKEN,
    process.env.CONTENT_SCHEDULER_CRON_TOKEN,
  ].map((value) => `${value || ''}`.trim()).filter(Boolean))];
}

async function isAuthorized(request: NextRequest) {
  const session = await getAuthSession();
  if (session.authenticated && session.user?.role === 'admin') {
    return true;
  }

  const tokens = getAllowedTokens();
  if (tokens.length === 0) {
    return false;
  }

  const provided = `${request.headers.get('x-system-health-token') || ''}`.trim();
  return !!provided && tokens.includes(provided);
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    snapshot: getSystemOpsSnapshot(),
    timestamp: new Date().toISOString(),
  });
}
