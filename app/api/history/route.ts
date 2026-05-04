import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { eventOperations, fortuneOperations, toolSessionOperations, userOperations } from '@/lib/database';
import { normalizeEventTransportRecords } from '@/lib/event-view';
import { getCurrentUserId } from '@/lib/user-utils';

export async function GET() {
  try {
    const session = await getAuthSession();
    const authenticated = !!session.authenticated && !!session.user?.id;
    const currentUserId = await getCurrentUserId();
    const userId = session.user?.id || currentUserId || null;

    const user = userId ? userOperations.getById(userId) : null;
    const fortunes = userId ? fortuneOperations.getByUserId(userId) || [] : [];
    const events = userId ? normalizeEventTransportRecords(eventOperations.getByUserId(userId)) : [];
    const toolSessions = userId ? toolSessionOperations.listByUser(userId, 30) || [] : [];

    return NextResponse.json({
      success: true,
      authenticated,
      user,
      fortunes: fortunes,
      events: events,
      toolSessions,
    });
  } catch (error) {
    console.error('[API] 获取历史记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取历史记录失败' },
      { status: 500 }
    );
  }
}
