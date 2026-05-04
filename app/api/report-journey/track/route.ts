import { NextRequest, NextResponse } from 'next/server';
import { fortuneOperations, reportJourneyEventOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';

function readString(value: unknown, maxLength = 160) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, maxLength);
}

function readMeta(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await getOrCreateGuestUserId();
    const reportId = readString(body?.reportId, 80);
    const workflowId = readString(body?.workflowId, 80);
    const layerKey = readString(body?.layerKey || 'unknown', 80);
    const actionTarget = readString(body?.actionTarget, 120);

    if (!reportId || !workflowId || !actionTarget) {
      return NextResponse.json(
        { success: false, error: '缺少报告旅程字段' },
        { status: 400 }
      );
    }

    const report = fortuneOperations.getById(reportId);
    if (!report || report.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权记录该报告旅程' },
        { status: 403 }
      );
    }

    reportJourneyEventOperations.create({
      id: `rje_${generateId()}`,
      userId,
      reportId,
      workflowId,
      layerKey,
      actionTarget,
      category: readString(body?.category, 40) || undefined,
      toolSlug: readString(body?.toolSlug, 120) || undefined,
      source: readString(body?.source, 180) || undefined,
      href: readString(body?.href, 260) || undefined,
      meta: readMeta(body?.meta),
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] report journey track failed:', error);
    return NextResponse.json(
      { success: false, error: '报告旅程记录失败' },
      { status: 500 }
    );
  }
}
