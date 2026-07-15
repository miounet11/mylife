// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getProfileSettings } from '@/lib/profile-settings-service';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

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
    const payload = getProfileSettings(userId, fortuneId);

    return NextResponse.json({
      ...payload,
      authenticated: Boolean(session.authenticated),
      userId,
    });
  } catch (error) {
    console.error('[API] profile settings GET failed:', error);
    return NextResponse.json(
      { success: false, error: '读取资料失败，请稍后重试' },
      { status: 500 },
    );
  }
}
