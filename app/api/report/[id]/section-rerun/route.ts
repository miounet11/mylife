/**
 * POST /api/report/[id]/section-rerun
 * Body: { agentKeys: string[] }  — max 3 core agent keys
 * Owner-only: re-run selected multi-agent sections without full report regenerate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fortuneOperations } from '@/lib/database';
import { getCurrentUserId, getOrCreateGuestUserId } from '@/lib/user-utils';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import {
  normalizeSectionKeys,
  rerunReportSections,
  SECTION_RERUN_CATALOG,
} from '@/lib/experience-kernel/section-rerun';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function GET() {
  return NextResponse.json({
    success: true,
    catalog: SECTION_RERUN_CATALOG,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const clientKey = getClientKey(request);
  const rate = checkRateLimit(`section-rerun:${clientKey}`, {
    windowMs: 60_000,
    maxRequests: 6,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: '操作过于频繁，请稍后再试' },
      { status: 429 },
    );
  }

  if (!reportId?.trim()) {
    return NextResponse.json({ success: false, error: '缺少报告 ID' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const agentKeys = normalizeSectionKeys(body?.agentKeys ?? body?.sections ?? body?.key);
    if (!agentKeys.length) {
      return NextResponse.json(
        {
          success: false,
          error: '请指定要重算的专章',
          catalog: SECTION_RERUN_CATALOG,
        },
        { status: 400 },
      );
    }

    const userId = (await getCurrentUserId()) || (await getOrCreateGuestUserId());
    const getById =
      (fortuneOperations as { getById?: (id: string) => any }).getById ||
      (fortuneOperations as { findById?: (id: string) => any }).findById;
    const record = typeof getById === 'function' ? getById(reportId) : null;
    if (!record) {
      return NextResponse.json({ success: false, error: '未找到报告' }, { status: 404 });
    }

    const ownerId = `${record.userId || ''}`.trim();
    if (ownerId && ownerId !== `${userId || ''}`.trim()) {
      return NextResponse.json({ success: false, error: '无权完善这份报告' }, { status: 403 });
    }

    const result = await rerunReportSections({ record, agentKeys });
    if (!result.ok && result.error) {
      return NextResponse.json(
        { success: false, error: result.error, ran: result.ran },
        { status: 422 },
      );
    }

    const update = (fortuneOperations as { update?: (id: string, patch: any) => any }).update;
    if (typeof update === 'function') {
      update(reportId, {
        analysis: result.analysis,
        // keep chart fields untouched
        name: record.name,
        bazi: record.bazi,
        fiveElements: record.fiveElements,
        tenGods: record.tenGods,
        pattern: record.pattern,
        fortune: record.fortune,
        advice: record.advice,
        evidence: record.evidence,
        klineData: record.klineData,
        dayun: record.dayun,
        shenSha: record.shenSha,
        reportVersion: record.reportVersion,
      });
    }

    try {
      trackServerEvent({
        userId: userId || undefined,
        sessionId: clientKey,
        eventName: 'report_section_rerun',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          keys: result.ran,
          succeeded: result.succeeded,
          failed: result.failed,
          durationMs: result.durationMs,
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      reportId,
      ran: result.ran,
      succeeded: result.succeeded,
      failed: result.failed,
      durationMs: result.durationMs,
      quality: {
        score: result.analysis?.qualityAudit?.overallScore,
        grade: result.analysis?.qualityAudit?.grade,
        deliveryTier: result.analysis?.qualityAudit?.deliveryTier,
      },
    });
  } catch (err) {
    console.error('[section-rerun]', err);
    return NextResponse.json(
      { success: false, error: '专章重算失败，请稍后再试' },
      { status: 500 },
    );
  }
}
