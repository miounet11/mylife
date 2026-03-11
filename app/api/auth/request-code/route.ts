import { NextRequest, NextResponse } from 'next/server';
import { createLoginCode } from '@/lib/auth';
import { validateEmail } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;
    const error = validateEmail(email);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const result = createLoginCode(email);
    console.log(`[Auth] Login code for ${result.email}: ${result.code}`);

    return NextResponse.json({
      success: true,
      message: '验证码已生成',
      expiresAt: result.expiresAt,
      previewCode:
        process.env.NODE_ENV !== 'production' || process.env.AUTH_SHOW_CODE === 'true'
          ? result.code
          : undefined,
    });
  } catch (error) {
    console.error('[API] 请求登录验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
