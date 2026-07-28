import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { buildLifeFoundation } from '@/lib/life-foundation';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '无法建立会话，请刷新后重试' },
        { status: 401 },
      );
    }

    const fortuneId = request.nextUrl.searchParams.get('fortuneId');
    const foundation = buildLifeFoundation(userId, fortuneId);

    return NextResponse.json({
      success: true,
      authenticated: Boolean(session.authenticated),
      userId,
      foundation,
    });
  } catch (error) {
    console.error('[API] profile foundation GET failed:', error);
    return NextResponse.json(
      { success: false, error: '读取数据底座失败，请稍后重试' },
      { status: 500 },
    );
  }
}
