// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { callJsonLLM } from '@/lib/agentic-report/llm-client';
import { buildAlmanacDayPack } from '@/lib/almanac/day-pack';
import {
  ALMANAC_LENSES,
  buildAlmanacLensFallback,
  buildAlmanacLensPrompts,
  getAlmanacLens,
  type AlmanacLensResult,
} from '@/lib/almanac/llm-lenses';
import { buildPersonalDayOverlay } from '@/lib/almanac/personal-day';
import {
  buildChartFromBirth,
  resolveUserChartForAlmanac,
} from '@/lib/almanac/resolve-user-chart';
import { getAuthSession } from '@/lib/auth';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { todayDateString } from '@/lib/almanac/day-pack';

export async function GET() {
  return NextResponse.json({
    success: true,
    lenses: ALMANAC_LENSES,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const lensId = `${body?.lensId || body?.lens || 'overview'}`.trim();
    const lens = getAlmanacLens(lensId);
    if (!lens) {
      return NextResponse.json({ success: false, error: '未知镜头' }, { status: 400 });
    }

    const date = `${body?.date || todayDateString()}`.trim();
    const pack = buildAlmanacDayPack(date);
    if (!pack) {
      return NextResponse.json({ success: false, error: '日期无效' }, { status: 400 });
    }

    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId().catch(() => null));

    let chart = null;
    if (body?.birthDate) {
      chart = buildChartFromBirth({
        birthDate: body.birthDate,
        birthTime: body.birthTime,
        birthPlace: body.birthPlace,
      });
    } else if (body?.dayMaster) {
      chart = {
        source: 'query' as const,
        dayMaster: `${body.dayMaster}`.trim(),
        dayBranch: `${body.dayBranch || ''}`.trim(),
        yongShen: Array.isArray(body.yongShen) ? body.yongShen : [],
      };
    } else {
      chart = await resolveUserChartForAlmanac(userId);
    }

    const personal = chart ? buildPersonalDayOverlay(pack, chart) : null;
    const { system, user } = buildAlmanacLensPrompts({ lens, pack, personal, chart });

    const llm = await callJsonLLM<{
      mood?: string;
      paragraphs?: string[];
      bullets?: string[];
      closing?: string;
    }>({
      system,
      user,
      temperature: 0.4,
      timeoutMs: 28000,
      maxTokens: 900,
      traceLabel: `almanac_lens_${lens.id}`,
      scope: 'agent',
    });

    let result: AlmanacLensResult;
    if (llm && (llm.paragraphs?.length || llm.bullets?.length)) {
      result = {
        lensId: lens.id,
        title: lens.title,
        mood: `${llm.mood || ''}`.trim() || '平和',
        paragraphs: Array.isArray(llm.paragraphs)
          ? llm.paragraphs.map((p) => `${p || ''}`.trim()).filter(Boolean).slice(0, 4)
          : [],
        bullets: Array.isArray(llm.bullets)
          ? llm.bullets.map((p) => `${p || ''}`.trim()).filter(Boolean).slice(0, 6)
          : [],
        closing: `${llm.closing || ''}`.trim() || '今天只做一件可复盘的事。',
      };
      if (!result.paragraphs.length) {
        result = buildAlmanacLensFallback({ lens, pack, personal });
      }
    } else {
      result = buildAlmanacLensFallback({ lens, pack, personal });
    }

    return NextResponse.json({
      success: true,
      date,
      lensId: lens.id,
      result,
      llmUsed: Boolean(llm?.paragraphs?.length || llm?.bullets?.length),
      hasChart: Boolean(chart),
      canonicalPath: `/almanac/${date}`,
    });
  } catch (error) {
    console.error('[API] almanac lens failed', error);
    return NextResponse.json({ success: false, error: '镜头生成失败' }, { status: 500 });
  }
}
