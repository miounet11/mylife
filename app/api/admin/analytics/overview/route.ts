import { NextResponse } from 'next/server';
import { buildAdminActionItems, buildAdminOperatingInsight } from '@/lib/admin-analytics-insights';
import { getAuthSession } from '@/lib/auth';
import { analyticsOperations } from '@/lib/database';
import { getKnowledgeOpsSnapshot } from '@/lib/knowledge-ops';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const overview = analyticsOperations.getOverview();
    const knowledgeOps = getKnowledgeOpsSnapshot();
    const insights = {
      operatingInsight: buildAdminOperatingInsight({
        totals: overview.totals,
        pendingValidationBuckets: overview.pendingValidationBuckets,
        driftReasonBreakdown: overview.driftReasonBreakdown,
        reportVersionBreakdown: overview.reportVersionBreakdown,
        journeyFunnel: overview.journeyFunnel,
        reasoningModeBreakdown: overview.reasoningModeBreakdown,
        chatActionBreakdown: overview.chatActionBreakdown,
      }),
      actionItems: buildAdminActionItems({
        totals: overview.totals,
        pendingValidationBuckets: overview.pendingValidationBuckets,
        driftReasonBreakdown: overview.driftReasonBreakdown,
        reportVersionBreakdown: overview.reportVersionBreakdown,
        journeyFunnel: overview.journeyFunnel,
        reasoningModeBreakdown: overview.reasoningModeBreakdown,
        chatActionBreakdown: overview.chatActionBreakdown,
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        ...overview,
        knowledgeOps,
        insights,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] analytics overview failed:', error);
    return NextResponse.json(
      { success: false, error: '获取经营概览失败' },
      { status: 500 }
    );
  }
}
