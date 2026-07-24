import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { toolSessionOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { trackServerEvent } from '@/lib/analytics';
import { generateByMode, type NamingMode } from '@/lib/naming';
import {
  applyLlmOrder,
  enhanceNamingWithLlm,
} from '@/lib/naming/llm-enhance';
import {
  namingSessionTitle,
  type NamingSessionInput,
  type NamingSessionResult,
} from '@/lib/naming/session-report';

export const runtime = 'nodejs';
export const maxDuration = 90;

function parseMode(raw: unknown): NamingMode {
  if (raw === 'company' || raw === 'product' || raw === 'person') return raw;
  return 'person';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = parseMode(body?.mode);
    const useLlm = body?.useLlm !== false;

    // Generate more engine candidates; LLM may reorder/trim
    const engineBody = { ...body, count: Math.min(36, Number(body?.count) || 24) };
    const engine = generateByMode(mode, engineBody);

    const sessionInput: NamingSessionInput = {
      mode,
      surname: body?.surname ? String(body.surname).slice(0, 4) : undefined,
      gender: body?.gender ? String(body.gender) : undefined,
      yongShen: Array.isArray(body?.yongShen)
        ? body.yongShen.map(String)
        : typeof body?.yongShen === 'string'
          ? String(body.yongShen)
              .split(/[,，、\s]+/)
              .filter(Boolean)
          : undefined,
      jiShen: Array.isArray(body?.jiShen) ? body.jiShen.map(String) : undefined,
      generationChar: body?.generationChar
        ? String(body.generationChar).slice(0, 1)
        : undefined,
      industry: body?.industry ? String(body.industry).slice(0, 40) : undefined,
      keywords: Array.isArray(body?.keywords)
        ? body.keywords.map(String)
        : typeof body?.keywords === 'string'
          ? String(body.keywords)
              .split(/[,，、\s]+/)
              .filter(Boolean)
          : undefined,
      preferredLength: Number(body?.preferredLength) || undefined,
      category: body?.category ? String(body.category).slice(0, 40) : undefined,
      style: body?.style ? String(body.style) : undefined,
      enableWuge: body?.enableWuge === true,
      productKeywords: Array.isArray(body?.productKeywords)
        ? body.productKeywords.map(String)
        : undefined,
    };

    const context = {
      ...sessionInput,
      topScores: engine.candidates.slice(0, 5).map((c) => ({
        name: c.fullName || c.name,
        score: c.score,
      })),
    };

    let llm = await enhanceNamingWithLlm({
      mode,
      context,
      candidates: engine.candidates,
    });
    if (!useLlm) {
      llm = { ...llm, usedLlm: false };
    }

    const ordered = applyLlmOrder(engine.candidates, llm).slice(0, 18);
    const title = namingSessionTitle(mode, sessionInput);
    const result: NamingSessionResult = {
      schema: 'life-kline.naming-session.v1',
      generatedAt: new Date().toISOString(),
      mode,
      title,
      summary: llm.narrativeSummary,
      input: sessionInput,
      candidates: ordered,
      llm,
      disclaimer: engine.disclaimer,
    };

    const auth = await getAuthSession();
    const userId =
      (auth.authenticated && auth.user?.id ? String(auth.user.id) : '') ||
      (await getOrCreateGuestUserId());

    const sessionId = `tool_${generateId()}`;
    toolSessionOperations.create({
      id: sessionId,
      userId,
      toolSlug: 'naming-lab',
      status: 'completed',
      input: sessionInput as unknown as Record<string, unknown>,
      result: {
        ...result,
        tool: 'naming-lab',
        title,
        savedAt: result.generatedAt,
      },
      meta: {
        toolTitle: '起名中心',
        category: 'application',
        mode,
        usedLlm: llm.usedLlm,
        candidateCount: ordered.length,
      },
    });

    trackServerEvent({
      eventName: 'tool_run_completed',
      page: '/tools/naming',
      meta: {
        action: 'naming_run',
        mode,
        usedLlm: llm.usedLlm,
        sessionId,
        count: ordered.length,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId,
      resultUrl: `/tools/naming/result/${sessionId}`,
      result,
      message: llm.usedLlm
        ? '方案已生成（含 AI 测算）'
        : '方案已生成（引擎排序；AI 暂不可用时已用结构分）',
    });
  } catch (error) {
    console.error('[naming/run]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '起名失败' },
      { status: 500 },
    );
  }
}
