import { NextResponse } from 'next/server';
import { buildAdminActionItems, buildAdminOperatingInsight } from '@/lib/admin-analytics-insights';
import { getAuthSession } from '@/lib/auth';
import { analyticsOperations } from '@/lib/database';

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
    const insights = {
      operatingInsight: buildAdminOperatingInsight({
        totals: overview.totals,
        pendingValidationBuckets: overview.pendingValidationBuckets,
        driftReasonBreakdown: overview.driftReasonBreakdown,
        reportVersionBreakdown: overview.reportVersionBreakdown,
      }),
      actionItems: buildAdminActionItems({
        totals: overview.totals,
        pendingValidationBuckets: overview.pendingValidationBuckets,
        driftReasonBreakdown: overview.driftReasonBreakdown,
        reportVersionBreakdown: overview.reportVersionBreakdown,
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        ...overview,
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
