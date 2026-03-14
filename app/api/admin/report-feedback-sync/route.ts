import { NextRequest, NextResponse } from 'next/server';
import { syncReportFeedbackLoop, syncRecentReportFeedbackLoops } from '@/lib/report-feedback-loop';

export const maxDuration = 30;

function isAuthorized(request: NextRequest) {
  const expected = `${process.env.REPORT_UPGRADE_CRON_TOKEN || ''}`.trim();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-report-upgrade-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
    const limit = typeof body?.limit === 'number' && Number.isFinite(body.limit)
      ? Math.max(1, Math.min(500, Math.floor(body.limit)))
      : 50;

    if (reportId) {
      const result = syncReportFeedbackLoop(reportId);
      return NextResponse.json({
        success: !!result.success,
        mode: 'single',
        result,
        timestamp: new Date().toISOString(),
      }, {
        status: result.success ? 200 : 404,
      });
    }

    const result = syncRecentReportFeedbackLoops(limit);
    return NextResponse.json({
      success: true,
      mode: 'batch',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[report-feedback-sync] failed:', error);
    return NextResponse.json(
      { success: false, error: 'report feedback sync failed' },
      { status: 500 }
    );
  }
}
