import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations, reportJourneyEventOperations, toolSessionOperations } from '@/lib/database';
import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import { buildPersonalizedJourney } from '@/lib/surface-journeys';
import { getCurrentUserId } from '@/lib/user-utils';

export async function GET() {
  try {
    const session = await getAuthSession();
    const authenticated = !!session.authenticated && !!session.user?.id;
    const currentUserId = await getCurrentUserId();
    const userId = session.user?.id || currentUserId || null;
    const hasSessionContext = !!userId;
    const reports = userId ? fortuneOperations.getByUserId(userId) || [] : [];
    const toolSessions = userId ? toolSessionOperations.listByUser(userId, 10) || [] : [];
    const journeyEvents = userId ? reportJourneyEventOperations.listByUser(userId, 20) || [] : [];
    const summary = buildPersonalizedJourney({
      reports: reports as any,
      toolSessions: toolSessions as any,
    });
    const growthHub = hasSessionContext
      ? buildPersonalGrowthHub({
        reports: reports as any,
        toolSessions: toolSessions as any,
        journeyEvents,
      })
      : null;

    return NextResponse.json({
      success: true,
      authenticated,
      hasSessionContext,
      data: {
        ...summary,
        growthHub,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取协同路径失败:', error);
    return NextResponse.json(
      { success: false, error: '获取协同路径失败' },
      { status: 500 }
    );
  }
}
