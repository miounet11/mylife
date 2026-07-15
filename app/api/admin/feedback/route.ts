import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  countSiteFeedbackByStatus,
  listSiteFeedback,
  updateSiteFeedbackStatus,
  type SiteFeedbackRecord,
} from '@/lib/user-feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminApi() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
    }
    const status = request.nextUrl.searchParams.get('status') || 'all';
    const limit = Number(request.nextUrl.searchParams.get('limit') || 80);
    const items = listSiteFeedback({
      limit,
      status: status as SiteFeedbackRecord['status'] | 'all',
    });
    const counts = countSiteFeedbackByStatus();
    return NextResponse.json({ success: true, items, counts });
  } catch (error) {
    console.error('[admin/feedback] GET', error);
    return NextResponse.json({ success: false, error: '加载失败' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const id = `${body.id || ''}`.trim();
    const status = `${body.status || ''}`.trim() as SiteFeedbackRecord['status'];
    if (!id || !['new', 'read', 'done', 'ignored'].includes(status)) {
      return NextResponse.json({ success: false, error: '参数无效' }, { status: 400 });
    }
    const updated = updateSiteFeedbackStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: '未找到记录' }, { status: 404 });
    }
    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('[admin/feedback] PATCH', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}
