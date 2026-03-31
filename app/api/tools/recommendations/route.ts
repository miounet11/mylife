import { NextRequest, NextResponse } from 'next/server';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { buildToolRecommendations, getToolDefinition } from '@/lib/tools';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const reportId = new URL(request.url).searchParams.get('reportId') || '';
    const report = reportId
      ? fortuneOperations.getById(reportId)
      : fortuneOperations.getByUserId(userId)[0] || null;
    const recentSessions = toolSessionOperations.listByUser(userId, 8);
    const recommendations = buildToolRecommendations({
      report,
      recentSessions: recentSessions as any,
      limit: 8,
    }).map((item) => ({
      ...item,
      tool: getToolDefinition(item.slug),
    })).filter((item) => item.tool);

    return NextResponse.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取工具推荐失败:', error);
    return NextResponse.json(
      { success: false, error: '获取工具推荐失败' },
      { status: 500 }
    );
  }
}
