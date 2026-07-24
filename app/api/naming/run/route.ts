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
      tradeName: body?.tradeName ? String(body.tradeName).slice(0, 12) : undefined,
      region: body?.region ? String(body.region).slice(0, 20) : undefined,
      jurisdiction: body?.jurisdiction ? String(body.jurisdiction).slice(0, 12) : undefined,
      entityForm: body?.entityForm ? String(body.entityForm).slice(0, 20) : undefined,
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

    // LLM 限时，避免前端一直停在「测算中」
    let llm = {
      narrativeSummary: '',
      schemeAdvice: [] as string[],
      riskNotes: [] as string[],
      candidateBlurbs: {} as Record<string, string>,
      usedLlm: false,
    };
    if (useLlm) {
      try {
        llm = await Promise.race([
          enhanceNamingWithLlm({
            mode,
            context,
            candidates: engine.candidates,
          }),
          new Promise<typeof llm>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  narrativeSummary: '',
                  schemeAdvice: [],
                  riskNotes: [],
                  candidateBlurbs: {},
                  usedLlm: false,
                }),
              14_000,
            ),
          ),
        ]);
      } catch {
        llm = {
          narrativeSummary: '',
          schemeAdvice: [],
          riskNotes: [],
          candidateBlurbs: {},
          usedLlm: false,
        };
      }
    }
    // 空 LLM 结果时补本地总评
    if (!llm.narrativeSummary) {
      const top = engine.candidates[0];
      llm = {
        ...llm,
        narrativeSummary: top
          ? `已生成 ${engine.candidates.length} 个候选，领先「${top.fullName || top.name}」（${top.score} 分）。可点进下一级查看详解。`
          : '暂无候选',
        schemeAdvice:
          mode === 'company'
            ? [
                '优先选用「字号+行业特征+有限公司」完整主体名，便于核名与对外签约。',
                '可准备省/市前缀与纯品牌短名两套，分别用于执照与传播。',
                '跨法域后缀不同（Ltd / LLC / 株式会社），请按注册地选择。',
              ]
            : ['结合音韵与用神微调末字。', '正式使用前请与家人/法务复核。'],
        riskNotes: [
          '命名为结构参考，不构成命运或法律承诺。',
          mode === 'company' ? '请核验工商/商标/当地公司法要求。' : '改名请考虑户籍与家庭共识。',
        ],
        candidateBlurbs: Object.fromEntries(
          engine.candidates.slice(0, 18).map((c) => [c.fullName || c.name, c.reason]),
        ),
      };
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
