import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { getCurrentUserId } from '@/lib/user-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const currentUserId = await getCurrentUserId();
    const userId = session.user?.id || currentUserId || '';
    if (!userId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        hasSessionContext: false,
        data: null,
      });
    }

    const email = session.user?.email || '';
    const requestedReportId = request.nextUrl.searchParams.get('reportId') || '';

    return NextResponse.json({
      success: true,
      authenticated: !!session.authenticated,
      hasSessionContext: true,
      data: buildUpdatesSummary({
        userId,
        email,
        requestedReportId,
      }),
    });
  } catch (error) {
    console.error('[API] 获取更新中心摘要失败:', error);
    return NextResponse.json(
      { success: false, error: '获取更新中心摘要失败' },
      { status: 500 }
    );
  }
}
