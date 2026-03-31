import { NextResponse } from 'next/server';
import { toolSessionOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export async function GET() {
  try {
    const userId = await getOrCreateGuestUserId();
    const sessions = toolSessionOperations.listByUser(userId, 40);
    return NextResponse.json({
      success: true,
      data: sessions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取工具历史失败:', error);
    return NextResponse.json(
      { success: false, error: '获取工具历史失败' },
      { status: 500 }
    );
  }
}
