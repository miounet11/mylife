import { NextRequest, NextResponse } from 'next/server';
import { emailSubscriptionOperations } from '@/lib/database';
import { validateEmail } from '@/lib/validators';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') || '';
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json(
      { success: false, error: emailError.message },
      { status: 400 }
    );
  }

  try {
    const subscription = emailSubscriptionOperations.getByEmail(email);
    return NextResponse.json({
      success: true,
      exists: !!subscription,
      subscription,
    });
  } catch (error) {
    console.error('[API] 查询订阅邮箱失败:', error);
    return NextResponse.json(
      { success: false, error: '查询失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;
    const source = `${body.source || 'site'}`;
    const tags = Array.isArray(body.tags) ? body.tags.filter((item: unknown): item is string => typeof item === 'string') : [];

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 400 }
      );
    }

    emailSubscriptionOperations.upsert(email, source, tags);

    return NextResponse.json({
      success: true,
      message: '订阅已保存',
    });
  } catch (error) {
    console.error('[API] 订阅邮箱失败:', error);
    return NextResponse.json(
      { success: false, error: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 400 }
      );
    }

    const result = emailSubscriptionOperations.unsubscribe(email);
    return NextResponse.json({
      success: true,
      message: '已退订',
      updated: result.changes > 0,
    });
  } catch (error) {
    console.error('[API] 退订邮箱失败:', error);
    return NextResponse.json(
      { success: false, error: '退订失败，请稍后重试' },
      { status: 500 }
    );
  }
}
