import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { exportAccuracyBadSamples } from '@/lib/accuracy-eval-export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') return null;
  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const limit = Number(sp.get('limit') || 40);
    const windowDays = Number(sp.get('days') || 30);
    const includePartial = sp.get('partial') === '1';
    const format = `${sp.get('format') || 'json'}`.toLowerCase();

    const result = exportAccuracyBadSamples({
      limit: Number.isFinite(limit) ? limit : 40,
      windowDays: Number.isFinite(windowDays) ? windowDays : 30,
      includePartial,
    });

    if (format === 'jsonl') {
      const body = result.samples.map((s) => JSON.stringify(s)).join('\n');
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Content-Disposition': `attachment; filename="accuracy-eval-${Date.now()}.jsonl"`,
        },
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[admin/accuracy-eval]', error);
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 });
  }
}
