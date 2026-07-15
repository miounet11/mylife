// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getProfileSettings, updateProfileAccount } from '@/lib/profile-settings-service';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 },
      );
    }

    const body = await request.json();
    updateProfileAccount(session.user.id, {
      name: body.name,
      timezone: typeof body.timezone === 'number' ? body.timezone : undefined,
    });

    const settings = getProfileSettings(session.user.id, body.fortuneId);
    return NextResponse.json({
      success: true,
      message: '账户信息已更新',
      settings,
    });
  } catch (error) {
    console.error('[API] profile account PATCH failed:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请稍后重试' },
      { status: 500 },
    );
  }
}