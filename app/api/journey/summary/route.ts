import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import { buildPersonalizedJourney } from '@/lib/surface-journeys';

export async function GET() {
  try {
    const session = await getAuthSession();
    const authenticated = !!session.authenticated && !!session.user?.id;
    const reports = authenticated && session.user?.id ? fortuneOperations.getByUserId(session.user.id) || [] : [];
    const toolSessions = authenticated && session.user?.id ? toolSessionOperations.listByUser(session.user.id, 10) || [] : [];
    const summary = buildPersonalizedJourney({
      reports: reports as any,
      toolSessions: toolSessions as any,
    });
    const growthHub = authenticated
      ? buildPersonalGrowthHub({
        reports: reports as any,
        toolSessions: toolSessions as any,
      })
      : null;

    return NextResponse.json({
      success: true,
      authenticated,
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
