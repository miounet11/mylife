/**
 * Naming Lab LLM layer — ranks/polishes deterministic candidates + writes narrative.
 * Always safe to skip: caller keeps engine result on failure.
 */

import OpenAI from 'openai';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import type { NameCandidate, NamingMode } from './types';

export type NamingLlmEnhancement = {
  narrativeSummary: string;
  schemeAdvice: string[];
  riskNotes: string[];
  candidateBlurbs: Record<string, string>;
  /** optional reorder by display name key */
  preferredOrder?: string[];
  model?: string;
  usedLlm: boolean;
};

export type NamingDetailLlm = {
  title: string;
  overview: string;
  charBreakdown: string[];
  soundNote: string;
  fitNote: string;
  variants: string[];
  caution: string[];
  model?: string;
  usedLlm: boolean;
};

function parseJsonObject(text: string): Record<string, unknown> | null {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : t;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const i = raw.indexOf('{');
    const j = raw.lastIndexOf('}');
    if (i >= 0 && j > i) {
      try {
        return JSON.parse(raw.slice(i, j + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function enhanceNamingWithLlm(input: {
  mode: NamingMode;
  context: Record<string, unknown>;
  candidates: NameCandidate[];
  model?: string;
}): Promise<NamingLlmEnhancement> {
  const fallback: NamingLlmEnhancement = {
    narrativeSummary: buildFallbackNarrative(input.mode, input.candidates),
    schemeAdvice: buildFallbackAdvice(input.mode, input.context),
    riskNotes: [
      '姓名学与品牌命名为文化/结构参考，不构成命运或法律承诺。',
      input.mode !== 'person' ? '公司/产品名请核验工商注册与商标。' : '正式改名请考虑户籍与家庭共识。',
    ],
    candidateBlurbs: Object.fromEntries(
      input.candidates.slice(0, 18).map((c) => [c.fullName || c.name, c.reason]),
    ),
    usedLlm: false,
  };

  const apiKey = getApiKey();
  if (!apiKey) return fallback;

  const model = input.model || 'grok-4.3-fast';
  const slim = input.candidates.slice(0, 24).map((c) => ({
    name: c.fullName || c.name,
    score: c.score,
    elements: c.elements.map((e) => `${e.char}${e.element}`).join(''),
    reason: c.reason,
  }));

  try {
    const client = new OpenAI({ apiKey, baseURL: getApiBaseUrl() || undefined });
    const completion = await createOpenAiCompatibleChatCompletion(
      client,
      {
        model,
        temperature: 0.45,
        messages: [
          {
            role: 'system',
            content: `你是中文起名/品牌命名顾问。基于已有候选与分数做专业解读，禁止吉凶恐吓与命运承诺。
输出严格 JSON：
{"narrativeSummary":"80-160字总评","schemeAdvice":["建议1","建议2","建议3"],"riskNotes":["注意1"],"candidateBlurbs":{"名字":"一句话理由20-40字"},"preferredOrder":["名字1","名字2"]}
candidateBlurbs 只覆盖输入中的名字；preferredOrder 可选，按推荐优先级排列子集。`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              mode: input.mode,
              context: input.context,
              candidates: slim,
            }),
          },
        ],
      },
      { timeout: 45_000 },
    );

    const text = completion.choices?.[0]?.message?.content || '';
    const parsed = parseJsonObject(text);
    if (!parsed) return fallback;

    const blurbs: Record<string, string> = { ...fallback.candidateBlurbs };
    if (parsed.candidateBlurbs && typeof parsed.candidateBlurbs === 'object') {
      for (const [k, v] of Object.entries(parsed.candidateBlurbs as Record<string, unknown>)) {
        if (typeof v === 'string' && v.trim()) blurbs[k] = v.trim().slice(0, 120);
      }
    }

    const schemeAdvice = Array.isArray(parsed.schemeAdvice)
      ? (parsed.schemeAdvice as unknown[]).map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
      : fallback.schemeAdvice;
    const riskNotes = Array.isArray(parsed.riskNotes)
      ? (parsed.riskNotes as unknown[]).map(String).map((s) => s.trim()).filter(Boolean).slice(0, 4)
      : fallback.riskNotes;
    const preferredOrder = Array.isArray(parsed.preferredOrder)
      ? (parsed.preferredOrder as unknown[]).map(String).filter(Boolean).slice(0, 24)
      : undefined;

    return {
      narrativeSummary:
        typeof parsed.narrativeSummary === 'string' && parsed.narrativeSummary.trim()
          ? parsed.narrativeSummary.trim().slice(0, 400)
          : fallback.narrativeSummary,
      schemeAdvice: schemeAdvice.length ? schemeAdvice : fallback.schemeAdvice,
      riskNotes: riskNotes.length ? riskNotes : fallback.riskNotes,
      candidateBlurbs: blurbs,
      preferredOrder,
      model,
      usedLlm: true,
    };
  } catch (err) {
    console.error('[naming/llm-enhance]', err);
    return fallback;
  }
}

export async function enhanceNameDetailWithLlm(input: {
  mode: NamingMode;
  name: string;
  candidate?: NameCandidate | null;
  context: Record<string, unknown>;
  model?: string;
}): Promise<NamingDetailLlm> {
  const c = input.candidate;
  const fallback: NamingDetailLlm = {
    title: `${input.name} · 结构详解`,
    overview: c?.reason || '基于五行、音韵与字义的结构观察。',
    charBreakdown: (c?.elements || []).map(
      (e) => `${e.char}：五行偏${e.element}`,
    ),
    soundNote: c ? `音韵分 ${c.breakdown.phonology}，字义分 ${c.breakdown.semantics}` : '音韵以顺口为先。',
    fitNote: c
      ? `综合 ${c.score} 分（五行 ${c.breakdown.wuxing}${c.breakdown.brandability != null ? ` · 传播 ${c.breakdown.brandability}` : ''}）`
      : '可结合用神或行业再微调。',
    variants: [],
    caution: ['文化结构参考，非命运承诺。'],
    usedLlm: false,
  };

  const apiKey = getApiKey();
  if (!apiKey) return fallback;
  const model = input.model || 'grok-4.3-fast';

  try {
    const client = new OpenAI({ apiKey, baseURL: getApiBaseUrl() || undefined });
    const completion = await createOpenAiCompatibleChatCompletion(
      client,
      {
        model,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: `你是中文起名详解顾问。针对单个名字做下一级详解。禁止吉凶恐吓。
输出 JSON：
{"title":"","overview":"60-120字","charBreakdown":["字：释义+五行"],"soundNote":"","fitNote":"","variants":["可微调名1","名2"],"caution":["注意"]}`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              mode: input.mode,
              name: input.name,
              score: c?.score,
              breakdown: c?.breakdown,
              elements: c?.elements,
              context: input.context,
            }),
          },
        ],
      },
      { timeout: 40_000 },
    );
    const text = completion.choices?.[0]?.message?.content || '';
    const parsed = parseJsonObject(text);
    if (!parsed) return fallback;

    return {
      title:
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title.trim().slice(0, 60)
          : fallback.title,
      overview:
        typeof parsed.overview === 'string' && parsed.overview.trim()
          ? parsed.overview.trim().slice(0, 400)
          : fallback.overview,
      charBreakdown: Array.isArray(parsed.charBreakdown)
        ? (parsed.charBreakdown as unknown[]).map(String).slice(0, 8)
        : fallback.charBreakdown,
      soundNote:
        typeof parsed.soundNote === 'string' ? parsed.soundNote.slice(0, 200) : fallback.soundNote,
      fitNote: typeof parsed.fitNote === 'string' ? parsed.fitNote.slice(0, 200) : fallback.fitNote,
      variants: Array.isArray(parsed.variants)
        ? (parsed.variants as unknown[]).map(String).slice(0, 6)
        : [],
      caution: Array.isArray(parsed.caution)
        ? (parsed.caution as unknown[]).map(String).slice(0, 4)
        : fallback.caution,
      model,
      usedLlm: true,
    };
  } catch (err) {
    console.error('[naming/detail-llm]', err);
    return fallback;
  }
}

export function applyLlmOrder(
  candidates: NameCandidate[],
  enhancement: NamingLlmEnhancement,
): NameCandidate[] {
  if (!enhancement.preferredOrder?.length) {
    return candidates.map((c) => ({
      ...c,
      reason: enhancement.candidateBlurbs[c.fullName || c.name] || c.reason,
    }));
  }
  const map = new Map(candidates.map((c) => [c.fullName || c.name, c]));
  const ordered: NameCandidate[] = [];
  for (const key of enhancement.preferredOrder) {
    const hit = map.get(key);
    if (hit) {
      ordered.push({
        ...hit,
        reason: enhancement.candidateBlurbs[key] || hit.reason,
      });
      map.delete(key);
    }
  }
  for (const c of map.values()) {
    ordered.push({
      ...c,
      reason: enhancement.candidateBlurbs[c.fullName || c.name] || c.reason,
    });
  }
  return ordered;
}

function buildFallbackNarrative(mode: NamingMode, candidates: NameCandidate[]): string {
  const top = candidates[0];
  const modeLabel =
    mode === 'person' ? '个人起名' : mode === 'company' ? '公司起名' : '产品起名';
  if (!top) return `${modeLabel}暂无候选，请调整条件后重试。`;
  return `${modeLabel}已生成 ${candidates.length} 个候选。综合分领先为「${top.fullName || top.name}」（${top.score} 分）。以下按结构分排序，可点进下一级查看详解。`;
}

function buildFallbackAdvice(mode: NamingMode, ctx: Record<string, unknown>): string[] {
  if (mode === 'person') {
    return [
      '优先看用神契合与音韵顺口，末字微调成本通常更低。',
      ctx.yongShen ? `用神倾向：${Array.isArray(ctx.yongShen) ? (ctx.yongShen as string[]).join('、') : ctx.yongShen}` : '可关联主盘用神后再生成一轮。',
      '家庭讨论时同时看字义与书写是否顺手。',
    ];
  }
  if (mode === 'company') {
    return [
      '短名利于传播；注册前请检索工商与商标近似。',
      ctx.industry ? `行业语境：${ctx.industry}` : '可补充行业关键词提高匹配。',
      '可准备 2–3 个备选全称，避免单一名称撞名。',
    ];
  }
  return [
    '产品名宜短、好记、无负面联想。',
    ctx.category ? `品类：${ctx.category}` : '可补充品类与卖点词。',
    '中英文并列时保持读音接近更易传播。',
  ];
}
