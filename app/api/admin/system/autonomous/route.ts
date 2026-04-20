import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { buildWorldYiAutonomousSnapshot, runWorldYiAutonomousCycle } from '@/lib/world-yi-autonomous-engine';

export const maxDuration = 60;

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

export async function GET() {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    snapshot: buildWorldYiAutonomousSnapshot(),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const mode = body?.mode === 'validation' ? 'validation' : 'full';
    const result = await runWorldYiAutonomousCycle({ trigger: 'manual', mode });
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[autonomous-system] manual run failed:', error);
    return NextResponse.json({ success: false, error: '自治总控执行失败' }, { status: 500 });
  }
}
