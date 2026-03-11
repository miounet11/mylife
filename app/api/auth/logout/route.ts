import { NextResponse } from 'next/server';
import { logoutCurrentSession } from '@/lib/auth';

export async function POST() {
  try {
    await logoutCurrentSession();
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[API] 退出登录失败:', error);
    return NextResponse.json(
      { success: false, error: '退出失败，请稍后重试' },
      { status: 500 }
    );
  }
}
