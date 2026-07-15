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
    const report = await enhanceDimensionReport(slug as DimensionSlug, engineReport, {
      pack,
      name: advisorInput.name,
      gender: advisorInput.gender,
      enabled: llmEnhance,
    });

    return NextResponse.json({
      success: true,
      report,
      authenticated: Boolean(session.authenticated),
      dimension: definition,
    });
  } catch (error) {
    console.error('[API] dimensions POST failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '维度研判失败' },
      { status: 500 },
    );
  }
}