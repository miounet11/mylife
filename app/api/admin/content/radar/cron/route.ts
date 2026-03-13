import { NextRequest, NextResponse } from 'next/server';
import { runContentAutomationCycle } from '@/lib/content-ops';
import { runContentRadarCycle } from '@/lib/content-radar';

export const maxDuration = 30;

function isAuthorized(request: NextRequest) {
  const expected = `${process.env.CONTENT_RADAR_CRON_TOKEN || ''}`.trim();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-radar-cron-token') === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const result = await runContentRadarCycle();
    const shouldAutoGenerate = process.env.CONTENT_RADAR_AUTO_GENERATE === '1';
    const shouldAutoPublish = process.env.CONTENT_RADAR_AUTO_PUBLISH === '1';
    const automation = shouldAutoGenerate
      ? await runContentAutomationCycle({
          userId: 'system_radar',
          limit: 3,
          autoPublish: shouldAutoPublish,
        })
      : null;

    return NextResponse.json({
      success: true,
      fetchedSources: result.sources.length,
      fetchedSignals: result.signals.length,
      topSuggestions: result.suggestions.slice(0, 5),
      automation: automation
        ? {
            generatedCount: automation.generatedCount,
            publishedCount: automation.publishedCount,
            draftCount: automation.draftCount,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 内容雷达定时执行失败:', error);
    return NextResponse.json({ success: false, error: '内容雷达定时执行失败' }, { status: 500 });
  }
}
