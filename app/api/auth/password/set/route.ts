import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { setPasswordForUser } from '@/lib/auth-password';

export const dynamic = 'force-dynamic';

/** Set password for current logged-in user (after OTP/Google). */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = `${body.password || ''}`;
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : null;

    const result = await setPasswordForUser({
      userId: session.user.id,
      password,
      currentPassword,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: '密码已保存，下次可用账号密码直接登录',
    });
  } catch (error) {
    console.error('[api/auth/password/set]', error);
    return NextResponse.json(
      { success: false, error: '设置失败，请稍后重试' },
      { status: 500 },
    );
  }
}
