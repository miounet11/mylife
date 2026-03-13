import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { contentRadarRunOperations, contentSignalOperations } from '@/lib/database';
import { getContentRadarSources, runContentRadarCycle, buildSignalSuggestions } from '@/lib/content-radar';

export const maxDuration = 30;

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

export async function GET() {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  const signals = contentSignalOperations.listRecent(40);
  return NextResponse.json({
    success: true,
    sources: getContentRadarSources(),
    signals,
    runs: contentRadarRunOperations.listRecent(20),
    suggestions: buildSignalSuggestions(signals),
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const sourceIds = Array.isArray(body.sourceIds)
      ? body.sourceIds.map((item: unknown) => `${item || ''}`.trim()).filter(Boolean)
      : undefined;

    const result = await runContentRadarCycle({
      sourceIds,
      limitPerSource: typeof body.limitPerSource === 'number' ? body.limitPerSource : 12,
    });

    return NextResponse.json({
      success: true,
      ...result,
      recentSignals: contentSignalOperations.listRecent(40),
      recentRuns: contentRadarRunOperations.listRecent(20),
    });
  } catch (error) {
    console.error('[API] 内容雷达执行失败:', error);
    return NextResponse.json({ success: false, error: '内容雷达执行失败' }, { status: 500 });
  }
}
