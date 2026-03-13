import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getContentOpsSnapshot, getContentSchedulerOverview, runContentAutomationCycle, runContentSchedulerCycle } from '@/lib/content-ops';

export const maxDuration = 30;

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
    snapshot: getContentOpsSnapshot(),
    scheduler: getContentSchedulerOverview(),
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (body.useScheduler === true) {
      const result = await runContentSchedulerCycle({ trigger: 'manual' });
      return NextResponse.json({
        success: true,
        ...result,
        snapshot: getContentOpsSnapshot(),
      });
    }

    const limit = Number(body.limit || 3);
    const result = await runContentAutomationCycle({
      userId: user.id,
      limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 6) : 3,
      autoPublish: body.autoPublish === true,
    });

    return NextResponse.json({
      success: true,
      ...result,
      snapshot: getContentOpsSnapshot(),
      scheduler: getContentSchedulerOverview(),
    });
  } catch (error) {
    console.error('[API] 内容自动化执行失败:', error);
    return NextResponse.json({ success: false, error: '内容自动化执行失败' }, { status: 500 });
  }
}
