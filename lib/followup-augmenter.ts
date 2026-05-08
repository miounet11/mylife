// v5-B5 (2026-05-08) AI augmented followup generator
//
// 在 B4 deterministic 之上叠加 LLM 个性化重写：
// - 给 LLM 看 B4 已经生成的 3 个 question + 报告关键事实
// - LLM 任务：把 question 措辞重写得更自然、更有人味，但保留 intent + label
// - 强约束 JSON schema，3-5 秒超时，失败直接回退原 B4 输出
//
// 设计原则：
// - 不引入新的 LLM 调用类型（复用 openai-compatible-chat）
// - 必须对 LLM 不健康优雅降级（不能让 followup 错误影响报告渲染）
// - 不在 result page hot path 调用 — 仅在 server-side (pipeline / API endpoint) 调用

import OpenAI from 'openai';
import { getApiBaseUrl, getApiKey, getDefaultModel } from '@/lib/env';
import {
  createOpenAiCompatibleChatCompletion,
} from '@/lib/openai-compatible-chat';
import type { ReportFollowupSuggestion } from '@/lib/chat-entry';

const SYSTEM_PROMPT = `你是「人生K线」的判断系统编辑。读用户的报告事实+我已经生成的3条追问问题，把每条问题的 question 字段重写得更自然、更有「跟你聊」的感觉，但严格保留 intent 和 label 字段不变。

要求：
- question 长度控制在 80-180 字
- 用「你」称呼，避免「该用户」「他/她」
- 包含 1-2 个报告里的具体名词（如格局、日主、动作标题、窗口月份），让用户感到「这是真的针对我的」
- 保留追问的开放性：不替用户得出结论，只引导更深的思考
- 不要使用 markdown 语法
- 输出必须是合法 JSON，结构完全匹配输入：{"suggestions":[{"label":..,"question":..,"intent":..}]}`;

export interface GenerateAugmentedFollowupsParams {
  // B4 deterministic 已经生成的 3 条作为锚点
  baseSuggestions: ReportFollowupSuggestion[];
  // 报告关键事实供 LLM 引用
  reportFacts: {
    publicName?: string;
    patternType?: string | null;
    dayMaster?: string | null;
    primaryActionTitle?: string | null;
    cautionScenarioTitle?: string | null;
    pushScenarioTitle?: string | null;
    topWindowLabel?: string | null;
    correctionLevel?: 'healthy' | 'watch' | 'action' | null;
    pendingOverdueTitle?: string | null;
  };
  // 超时（默认 5s — 超过就 fall back）
  timeoutMs?: number;
}

export async function generateAugmentedFollowups(
  params: GenerateAugmentedFollowupsParams,
): Promise<ReportFollowupSuggestion[]> {
  const baseSuggestions = params.baseSuggestions || [];
  const apiKey = getApiKey();
  if (!apiKey || !baseSuggestions.length) {
    return baseSuggestions;
  }

  const model = getDefaultModel();
  const baseUrl = getApiBaseUrl();
  const openai = new OpenAI({ apiKey, baseURL: baseUrl });
  const timeoutMs = params.timeoutMs || 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const userPrompt = JSON.stringify(
      {
        reportFacts: params.reportFacts,
        suggestions: baseSuggestions.map((s) => ({
          label: s.label,
          intent: s.intent,
          questionDraft: s.question,
        })),
      },
      null,
      2,
    );

    const response = await createOpenAiCompatibleChatCompletion(
      openai,
      {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 800,
        temperature: 0.6,
        responseFormat: { type: 'json_object' },
      },
      { signal: controller.signal, timeout: timeoutMs },
    );

    const content = response.choices?.[0]?.message?.content?.trim();
    if (!content) return baseSuggestions;

    const parsed = JSON.parse(content) as {
      suggestions?: Array<{ label?: string; question?: string; intent?: string }>;
    };

    if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      return baseSuggestions;
    }

    // Merge: 用 LLM 的 question，保留 B4 的 label + intent（防止 hallucinated 字段）
    return baseSuggestions.map((base, idx) => {
      const ai = parsed.suggestions?.[idx];
      const aiQuestion = `${ai?.question || ''}`.trim();
      // 校验 LLM 输出长度合理（80-300 chars）
      if (!aiQuestion || aiQuestion.length < 30 || aiQuestion.length > 500) {
        return base;
      }
      return { ...base, question: aiQuestion };
    });
  } catch (err) {
    console.warn('[v5-B5] augmented followup gen failed:', err instanceof Error ? err.message : err);
    return baseSuggestions;
  } finally {
    clearTimeout(timeoutId);
  }
}
