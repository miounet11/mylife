import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getAdminOpsDashboardSnapshot } from '@/lib/admin-ops-dashboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
    }

    const data = getAdminOpsDashboardSnapshot();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] admin dashboard failed:', error);
    return NextResponse.json({ success: false, error: '获取看板失败' }, { status: 500 });
  }
}
