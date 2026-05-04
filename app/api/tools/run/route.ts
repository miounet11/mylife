import { NextRequest, NextResponse } from 'next/server';
import { trackServerEvent } from '@/lib/analytics';
import { appendSearchParamsToHref } from '@/lib/source-url';
import { runToolWorkflow } from '@/lib/tool-run-orchestrator';

export async function POST(request: NextRequest) {
  let requestedToolSlug = '';
  let requestedAttribution: Record<string, unknown> | null = null;

  try {
    const userAgent = request.headers.get('user-agent');
    const body = await request.json();
    const toolSlug = typeof body?.toolSlug === 'string' ? body.toolSlug.trim() : '';
    const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
    const note = typeof body?.note === 'string' ? body.note.trim() : '';
    const attribution = body?.attribution && typeof body.attribution === 'object' ? body.attribution : null;
    requestedToolSlug = toolSlug;
    requestedAttribution = attribution;

    const execution = await runToolWorkflow({
      toolSlug,
      reportId,
      note,
      userAgent,
      attribution,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: execution.sessionId,
        tool: execution.tool,
        result: execution.result,
        workflow: execution.workflowSnapshot,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'TOOL_NOT_FOUND') {
      return NextResponse.json({ success: false, error: '工具不存在' }, { status: 404 });
    }
    if (message === 'REPORT_REQUIRED') {
      const attributionSource = requestedAttribution?.source;
      const analyzeSource = typeof attributionSource === 'string' && attributionSource.trim()
        ? `tool_run_required:${attributionSource.trim()}`
        : 'tool_run_required';
      return NextResponse.json({
        success: false,
        error: '请先完成一次综合判断，再进入单项工具',
        redirectTo: appendSearchParamsToHref('/analyze', {
          toolSlug: requestedToolSlug,
          source: analyzeSource,
        }),
      }, { status: 400 });
    }
    if (message === 'REPORT_FORBIDDEN') {
      return NextResponse.json({ success: false, error: '无权使用这份报告运行工具' }, { status: 403 });
    }

    console.error('[API] 运行单项工具失败:', error);
    trackServerEvent({
      userAgent: request.headers.get('user-agent'),
      eventName: 'tool_run_started',
      page: '/tools',
      meta: {
        failed: true,
        error: message,
      },
    });
    return NextResponse.json(
      { success: false, error: '运行工具失败' },
      { status: 500 }
    );
  }
}
