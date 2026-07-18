import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  chatEvalCasesToJsonl,
  exportChatEvalCases,
} from '@/lib/chat-eval-export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminApi() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const format = `${sp.get('format') || 'json'}`.toLowerCase();
    const limit = Number(sp.get('limit') || 80);
    const onlyFeedback = sp.get('onlyFeedback') !== '0';
    const windowHoursRaw = sp.get('windowHours');
    const windowHours =
      windowHoursRaw == null || windowHoursRaw === ''
        ? 168
        : Number(windowHoursRaw);

    const result = exportChatEvalCases({
      limit,
      onlyFeedback,
      prioritizeNegative: true,
      windowHours: Number.isFinite(windowHours) ? windowHours : 168,
    });

    if (format === 'jsonl') {
      const body = chatEvalCasesToJsonl(result.cases);
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Content-Disposition': `attachment; filename="chat-eval-${Date.now()}.jsonl"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[admin/chat-eval] GET', error);
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 });
  }
}
