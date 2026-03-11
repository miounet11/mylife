import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginCodeAndCreateSession } from '@/lib/auth';
import { getCurrentUserId } from '@/lib/user-utils';
import { validateEmail } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;
    const code = `${body.code || ''}`.trim();

    const error = validateEmail(email);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: '请输入 6 位验证码' },
        { status: 400 }
      );
    }

    const currentUserId = await getCurrentUserId();
    const result = await verifyLoginCodeAndCreateSession({
      email,
      code,
      currentUserId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('[API] 验证登录验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
