import { NextRequest, NextResponse } from 'next/server';
import { trackServerEvent } from '@/lib/analytics';
import { appendSearchParamsToHref } from '@/lib/source-url';
import { runToolWorkflow } from '@/lib/tool-run-orchestrator';
import { parseToolBirthInput } from '@/lib/tool-birth-context';

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
    // Accept birth at top-level or nested under body.birth
    const birth =
      parseToolBirthInput(body?.birth) ||
      parseToolBirthInput({
        birthDate: body?.birthDate,
        birthTime: body?.birthTime,
        birthPlace: body?.birthPlace,
        gender: body?.gender,
        name: body?.name,
        birthAccuracy: body?.birthAccuracy,
      });
    requestedToolSlug = toolSlug;
    requestedAttribution = attribution;

    const execution = await runToolWorkflow({
      toolSlug,
      reportId,
      note,
      userAgent,
      attribution,
      birth,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: execution.sessionId,
        tool: execution.tool,
        result: execution.result,
        workflow: execution.workflowSnapshot,
        birthOnly: Boolean((execution as { report?: { reportVersion?: string } }).report?.reportVersion?.includes('birth-ephemeral')),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'TOOL_NOT_FOUND') {
      return NextResponse.json({ success: false, error: '工具不存在' }, { status: 404 });
    }
    if (message === 'BIRTH_INVALID') {
      return NextResponse.json(
        { success: false, error: '出生信息无法计算，请检查日期与时辰' },
        { status: 400 },
      );
    }
    if (message === 'REPORT_REQUIRED') {
      const attributionSource = requestedAttribution?.source;
      const analyzeSource = typeof attributionSource === 'string' && attributionSource.trim()
        ? `tool_run_required:${attributionSource.trim()}`
        : 'tool_run_required';
      return NextResponse.json({
        success: false,
        error: '请先完成一次综合判断，或直接提供出生日期运行单项工具',
        redirectTo: appendSearchParamsToHref('/analyze', {
          toolSlug: requestedToolSlug,
          source: analyzeSource,
        }),
        // Client may also open birth form instead of full analyze
        allowBirthOnly: true,
      }, { status: 400 });
    }
    if (message === 'REPORT_FORBIDDEN') {
      return NextResponse.json({ success: false, error: '无权使用这份报告运行工具' }, { status: 403 });
    }

    console.error('[API] 运行单项工具失败:', error);
    trackServerEvent({
      userAgent: request.headers.get('user-agent'),
      eventName: 'tool_run_started',
      page: requestedToolSlug ? `/tools/${requestedToolSlug}` : '/tools',
      meta: {
        phase: 'server_failed',
        confirmed: false,
        toolSlug: requestedToolSlug || null,
        source: typeof requestedAttribution?.source === 'string' ? requestedAttribution.source : null,
        attribution: requestedAttribution || null,
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
