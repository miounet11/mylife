import { NextResponse } from 'next/server';
import { eventOperations, fortuneOperations, userOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export async function GET() {
  try {
    const userId = await getOrCreateGuestUserId();
    
    const user = userOperations.getById(userId);
    const fortunes = fortuneOperations.getByUserId(userId) || [];
    const events = eventOperations.getByUserId(userId) || [];
    
    return NextResponse.json({
      success: true,
      user: user || { name: '未命名测算者', gender: 'male', id: userId },
      fortunes: fortunes,
      events: events
    });
  } catch (error) {
    console.error('[API] 获取历史记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取历史记录失败' },
      { status: 500 }
    );
  }
}
