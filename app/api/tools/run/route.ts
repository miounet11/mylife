import { NextRequest, NextResponse } from 'next/server';
import { trackServerEvent } from '@/lib/analytics';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { buildToolRunSummary, getToolDefinition } from '@/lib/tools';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const body = await request.json();
    const toolSlug = typeof body?.toolSlug === 'string' ? body.toolSlug.trim() : '';
    const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
    const note = typeof body?.note === 'string' ? body.note.trim() : '';
    const attribution = body?.attribution && typeof body.attribution === 'object' ? body.attribution : null;

    const tool = getToolDefinition(toolSlug);
    if (!tool) {
      return NextResponse.json({ success: false, error: '工具不存在' }, { status: 404 });
    }

    const report = reportId
      ? fortuneOperations.getById(reportId)
      : fortuneOperations.getByUserId(userId)[0] || null;
    const recentSessions = toolSessionOperations.listByUser(userId, 6);

    if (!report) {
      return NextResponse.json({
        success: false,
        error: '请先完成一次综合判断，再进入单项工具',
        redirectTo: '/analyze',
      }, { status: 400 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ success: false, error: '无权使用这份报告运行工具' }, { status: 403 });
    }

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'tool_run_started',
      page: `/tools/${tool.slug}`,
      meta: {
        toolSlug: tool.slug,
        reportId: report.id,
        category: tool.category,
        attribution,
      },
    });

    const result = buildToolRunSummary({
      tool,
      report,
      recentSessions: recentSessions as any,
      note,
    });

    const sessionId = `tool_${generateId()}`;
    toolSessionOperations.create({
      id: sessionId,
      userId,
      reportId: report.id,
      toolSlug: tool.slug,
      status: 'completed',
      input: {
        note,
        reportName: report.name,
      },
      result,
      meta: {
        toolTitle: tool.shortTitle,
        category: tool.category,
        premiumServiceKey: tool.premiumServiceKey || null,
        chatIntent: tool.chatIntent || null,
        nextToolSlugs: tool.nextToolSlugs,
        inheritedSessionIds: recentSessions.slice(0, 4).map((item) => item.id),
        inheritedCategories: Array.from(new Set(recentSessions.slice(0, 4).map((item) => (item.meta as Record<string, unknown> | undefined)?.category || 'unknown'))),
        attribution,
      },
    });

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'tool_run_completed',
      page: `/tool-result/${sessionId}`,
      meta: {
        toolSlug: tool.slug,
        reportId: report.id,
        category: tool.category,
        attribution,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        tool,
        result,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 运行单项工具失败:', error);
    return NextResponse.json(
      { success: false, error: '运行工具失败' },
      { status: 500 }
    );
  }
}
