// @ts-nocheck
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    return NextResponse.json({
      success: true,
      ...session,
    });
  } catch (error) {
    console.error('[API] 获取会话失败:', error);
    return NextResponse.json(
      { success: false, authenticated: false, user: null },
      { status: 500 }
    );
  }
}
