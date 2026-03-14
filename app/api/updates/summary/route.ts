import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { buildUpdatesSummary } from '@/lib/updates-summary';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.id) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        data: null,
      });
    }

    const userId = session.user.id;
    const email = session.user.email || '';
    const requestedReportId = request.nextUrl.searchParams.get('reportId') || '';

    return NextResponse.json({
      success: true,
      authenticated: true,
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
