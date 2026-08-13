// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getDimension } from '@/lib/dimensions/config';
import { buildDimensionEnginePack } from '@/lib/dimensions/engine-pack';
import { enhanceDimensionReport } from '@/lib/dimensions/enhance-with-llm';
import { isDimensionRunnable, runDimensionAdvisor } from '@/lib/dimensions/run-dimension-advisor';
import type { DimensionSlug } from '@/lib/dimensions/types';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const definition = getDimension(slug);
    if (!definition) {
      return NextResponse.json({ success: false, error: '未知维度' }, { status: 404 });
    }
    if (!isDimensionRunnable(slug)) {
      return NextResponse.json(
        { success: false, error: '该维度尚未开放深度研判', maturity: definition.maturity },
        { status: 501 },
      );
    }

    const body = await request.json();
    const birthDate = `${body?.birthDate || ''}`.trim();
    if (!birthDate) {
      return NextResponse.json({ success: false, error: '请先提供出生日期' }, { status: 400 });
    }

    const session = await getAuthSession();
    const advisorInput = {
      birthDate,
      birthTime: body?.birthTime,
      birthPlace: body?.birthPlace,
      birthAccuracy: body?.birthAccuracy,
      gender: body?.gender,
      name: body?.name,
      reportId: body?.reportId,
    };

    const engineReport = runDimensionAdvisor(slug, advisorInput);
    const llmEnhance = body?.llmEnhance !== false && body?.llm !== 0 && body?.llm !== '0';
    const pack = buildDimensionEnginePack(advisorInput);
    try {
      const { runWorldYiEngineFromLoose } = await import('@/lib/world-yi-engine');
      const truth = pack.truthInput || {};
      engineReport.worldYi = runWorldYiEngineFromLoose({
        dayMaster: truth.yongShen?.dayMaster,
        yongShen: truth.yongShen,
        pattern: truth.pattern,
        pillars: truth.pillars,
        dayun: truth.dayun,
      });
    } catch {
      // World Yi layer is additive; dimension report still ships.
    }
    const report = await enhanceDimensionReport(slug as DimensionSlug, engineReport, {
      pack,
      name: advisorInput.name,
      gender: advisorInput.gender,
      enabled: llmEnhance,
    });

    // 写回人生数据底座
    let foundationWritten = false;
    try {
      const { getOrCreateGuestUserId } = await import('@/lib/user-utils');
      const { writeDimensionToFoundation } = await import('@/lib/life-foundation/writeback');
      const { toolSessionOperations } = await import('@/lib/database');
      const { generateId } = await import('@/lib/utils');
      const userId =
        (session.authenticated && session.user?.id ? String(session.user.id) : '') ||
        (await getOrCreateGuestUserId());
      const firstSection = report?.sections?.[0];
      const summary =
        (firstSection?.items?.[0] as string) ||
        report?.question ||
        definition.title;
      const sessionId = `tool_${generateId()}`;
      try {
        toolSessionOperations.create({
          id: sessionId,
          userId,
          toolSlug: `dimension-${slug}`,
          status: 'completed',
          input: {
            slug,
            reportId: advisorInput.reportId || null,
            birthDate,
          },
          result: {
            slug,
            title: definition.title,
            summary: `${summary}`.slice(0, 240),
            tool: `dimension-${slug}`,
            savedAt: report?.generatedAt || new Date().toISOString(),
          },
          meta: {
            toolTitle: definition.title,
            category: 'dimensions',
            slug,
            reportId: advisorInput.reportId || null,
          },
        });
      } catch {
        // session optional
      }
      const wb = writeDimensionToFoundation({
        userId,
        fortuneId: advisorInput.reportId || null,
        sessionId,
        slug,
        title: definition.title,
        summary: `${summary}`.slice(0, 200),
        predictionCount: Array.isArray(report?.predictions) ? report.predictions.length : 0,
      });
      foundationWritten = wb.ok;
    } catch (e) {
      console.warn('[dimensions] foundation writeback skipped', e);
    }

    return NextResponse.json({
      success: true,
      report,
      authenticated: Boolean(session.authenticated),
      dimension: definition,
      foundationWritten,
    });
  } catch (error) {
    console.error('[API] dimensions POST failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '维度研判失败' },
      { status: 500 },
    );
  }
}