import OpenAI from 'openai';
import { getApiBaseUrl, getApiKey, getDefaultModel } from '@/lib/env';
import { formatModelAttemptLabel, getModelFallbackChain, getReportNarrativeFallbackChain } from '@/lib/llm-model-fallback';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import {
  computeAttemptTimeouts,
  getDynamicModelExecutionPlan,
  recordModelAttempt,
  summarizeModelExecutionPlan,
} from '@/lib/llm-provider-health';
import { WORLD_YI_DELIVERY_DIRECTIVE, WORLD_YI_DOCTRINE_BRIEF } from '@/lib/world-yi-doctrine';

const toModelDisplayName = (model: string) => {
  if (model === 'claude-opus-4-7-high') {
    return '主分析模型 Claude Opus 4.7 High';
  }
  if (model === 'gpt-5.4-mini-my') {
    return '默认请求模型 GPT-5.4 Mini My';
  }
  if (model === 'gpt-5.5') {
    return '旧版备用推理模型 GPT-5.5';
  }
  if (model === 'gpt-5.4-mini') {
    return '快速备用模型 GPT-5.4 Mini';
  }
  if (model === 'gpt-5.4') {
    return '备用推理模型 GPT-5.4';
  }
  if (model === 'gpt-5.2') {
    return '旧版备用模型 GPT-5.2';
  }
  if (model === 'gpt-5.2-codex') {
    return '旧版备用推理模型 GPT-5.2 Codex';
  }
  if (model === 'gpt-4.1-mini-2025-04-14' || model === 'gpt-4.1-mini') {
    return '备用快速生成模型 GPT-4.1 Mini';
  }
  if (model === 'grok-420-fast') {
    return '备用快速生成模型 Grok 420 Fast';
  }
  if (model === 'lingsi1.0') {
    return '兜底生成模型 Lingsi 1.0';
  }
  if (model === 'auto') {
    return '自动路由模型';
  }
  return `模型 ${model}`;
};

type LlmProgressEvent = {
  type: 'model-attempt' | 'model-fallback' | 'model-success' | 'model-failed';
  model: string;
  nextModel?: string;
  detail: string;
};

type PhaseKey = 'structure' | 'narrative';

function createLlmClient(timeoutMs: number) {
  return new OpenAI({
    apiKey: getApiKey()!,
    baseURL: getApiBaseUrl(),
    timeout: timeoutMs,
    maxRetries: 0,
  });
}

export async function generateFortuneInterpretation(
  baziData: Record<string, unknown>,
  timeoutMs: number = 25000,
  onProgress?: (event: LlmProgressEvent) => void | Promise<void>
) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('API_KEY is not set. Skip LLM interpretation.');
    return null;
  }

  console.log(`[LLM] Starting interpretation with ${timeoutMs}ms timeout...`);

  try {
    const coreTimeoutMs = Math.max(3000, Math.floor(timeoutMs * 0.72));
    const structureDraft = await generateFortuneInterpretationCore(
      baziData,
      coreTimeoutMs,
      onProgress
    );

    if (!structureDraft) {
      return null;
    }

    const remainingBudget = Math.max(0, timeoutMs - coreTimeoutMs);
    if (remainingBudget < 1400) {
      return structureDraft;
    }

    return generateFortuneInterpretationFollowup(
      baziData,
      structureDraft,
      remainingBudget,
      onProgress
    );
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.name === 'AbortError' ||
        error.message.includes('timeout') ||
        error.message.includes('timed out')
      ) {
        console.error('[LLM] Request timeout - API took too long to respond');
      } else {
        console.error('[LLM] Generation Error:', error.message);
      }
    } else {
      console.error('[LLM] Generation Error:', error);
    }
    return null;
  }
}

export async function generateFortuneInterpretationCore(
  baziData: Record<string, unknown>,
  timeoutMs: number = 18000,
  onProgress?: (event: LlmProgressEvent) => void | Promise<void>
) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const openai = createLlmClient(timeoutMs);
  const baseChain = getModelFallbackChain(undefined, 'report');
  const deadlineAt = Date.now() + timeoutMs;

  return executeReportPhase({
    openai,
    phase: 'structure',
    baseChain,
    timeoutMs,
    deadlineAt,
    prompt: buildStructuredPrompt(baziData),
    onProgress,
  });
}

export async function generateFortuneInterpretationFollowup(
  baziData: Record<string, unknown>,
  structureDraft: Record<string, unknown>,
  timeoutMs: number = 8000,
  onProgress?: (event: LlmProgressEvent) => void | Promise<void>
) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return structureDraft;
  }

  const openai = createLlmClient(timeoutMs);
  const baseChain = getReportNarrativeFallbackChain();
  const deadlineAt = Date.now() + timeoutMs;
  const narrativePatch = await executeReportPhase({
    openai,
    phase: 'narrative',
    baseChain,
    timeoutMs,
    deadlineAt,
    prompt: buildNarrativePatchPrompt(baziData, structureDraft),
    onProgress,
  });

  return narrativePatch
    ? mergeInterpretation(structureDraft, narrativePatch)
    : structureDraft;
}

async function executeReportPhase(params: {
  openai: OpenAI;
  phase: PhaseKey;
  baseChain: string[];
  timeoutMs: number;
  deadlineAt: number;
  prompt: string;
  onProgress?: (event: LlmProgressEvent) => void | Promise<void>;
}) {
  const plan = getDynamicModelExecutionPlan(params.baseChain, 'report');
  const modelCandidates = plan.orderedModels;
  const planSummary = summarizeModelExecutionPlan(plan);
  const attemptTimeouts = computeReportAttemptTimeouts(params.phase, params.timeoutMs, modelCandidates.length);
  const phaseLabel = params.phase === 'structure' ? '结构化解释草案' : '正文补强与建议完善';
  const traceLabel = `report:${params.phase}`;

  console.log(
    `[LLM] ${traceLabel} calling API at ${getApiBaseUrl()} with planner ${planSummary.label} ` +
    `(base=${formatModelAttemptLabel(params.baseChain)})`
  );

  let lastError: unknown = null;

  for (const [index, model] of modelCandidates.entries()) {
    const remainingBudget = Math.min(params.timeoutMs, params.deadlineAt - Date.now());
    if (remainingBudget < 1200) {
      break;
    }

    await params.onProgress?.({
      type: 'model-attempt',
      model,
      detail: `${toModelDisplayName(model)} 正在生成${phaseLabel}。`,
    });

    const attemptController = new AbortController();
    const attemptTimeoutMs = Math.max(1200, Math.min(remainingBudget, attemptTimeouts[index] || remainingBudget));
    const attemptTimeoutId = setTimeout(() => attemptController.abort(), attemptTimeoutMs);
    const startedAt = Date.now();

    try {
      const completion = await createOpenAiCompatibleChatCompletion(params.openai, {
        model,
        messages: [
          { role: 'system', content: buildPhaseSystemPrompt(params.phase) },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.phase === 'structure' ? 0.35 : 0.45,
        // v5-C5 (2026-05-16): C4 抬到 1400/700 仍观察到 finish=length 截断（实际输出 1197+ 字符仍未闭合），
        // 继续抬到 2400/1200。gpt-4.1-mini 输出无 reasoning 缓冲，直接对应字段；GPT-5 系列只影响上限。
        maxTokens: params.phase === 'structure' ? 2400 : 1200,
        reasoningEffort: 'low',
      }, {
        signal: attemptController.signal,
        timeout: attemptTimeoutMs,
        maxRetries: 0,
      });

      const responseText = completion.choices?.[0]?.message?.content?.trim();
      const finishReason = completion.choices?.[0]?.finish_reason;
      if (!responseText) {
        lastError = new Error(`EMPTY_CONTENT:${model}`);
        recordModelAttempt({
          model,
          scope: 'report',
          success: false,
          latencyMs: Date.now() - startedAt,
          errorType: 'empty',
          errorMessage: `EMPTY_CONTENT${finishReason ? `:finish=${finishReason}` : ''}`,
          traceLabel,
        });
        continue;
      }

      const parsed = parseJsonContent<Record<string, unknown>>(responseText);
      if (!parsed) {
        lastError = new Error(`JSON_PARSE_FAILED:${model}`);
        recordModelAttempt({
          model,
          scope: 'report',
          success: false,
          latencyMs: Date.now() - startedAt,
          errorType: 'parse',
          errorMessage: `JSON_PARSE_FAILED${finishReason ? `:finish=${finishReason}` : ''}:len=${responseText.length}`,
          traceLabel,
        });
        continue;
      }

      recordModelAttempt({
        model,
        scope: 'report',
        success: true,
        latencyMs: Date.now() - startedAt,
        traceLabel,
      });
      if (model !== modelCandidates[0]) {
        console.warn(`[LLM] Model fallback succeeded with ${model} for ${params.phase}`);
      }

      await params.onProgress?.({
        type: 'model-success',
        model,
        detail: params.phase === 'structure'
          ? `${toModelDisplayName(model)} 已完成结构草案，正在争取补强正文与建议。`
          : `${toModelDisplayName(model)} 已完成正文增强。`,
      });

      return parsed;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      recordModelAttempt({
        model,
        scope: 'report',
        success: false,
        latencyMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name || 'error' : 'error',
        errorMessage: message,
        traceLabel,
      });
      console.error(`[LLM] ${traceLabel} model ${model} failed: ${message}`);
      const nextModel = modelCandidates[index + 1];
      await params.onProgress?.({
        type: nextModel ? 'model-fallback' : 'model-failed',
        model,
        nextModel,
        detail: nextModel
          ? `${toModelDisplayName(model)} 在${phaseLabel}阶段响应较慢或异常，正在切换到 ${toModelDisplayName(nextModel)}。`
          : `${toModelDisplayName(model)} 在${phaseLabel}阶段暂未稳定返回，当前没有更多可用模型可切换。`,
      });
    } finally {
      clearTimeout(attemptTimeoutId);
    }
  }

  console.error(`[LLM] ${traceLabel} all model attempts failed: ${formatModelAttemptLabel(modelCandidates)}`);
  if (lastError) return null;
  return null;
}

function computeReportAttemptTimeouts(phase: PhaseKey, totalBudgetMs: number, attemptCount: number) {
  if (attemptCount <= 0) return [];
  if (attemptCount === 1) return [totalBudgetMs];

  // 用户等待路径不能被主模型拖死：首拍短试，保留 fallback 时间。
  const weights = phase === 'structure'
    ? attemptCount === 2
      ? [0.45, 0.55]
      : [0.34, 0.34, 0.32]
    : attemptCount === 2
      ? [0.40, 0.60]
      : [0.30, 0.35, 0.35];

  return computeAttemptTimeoutsWithWeights(totalBudgetMs, attemptCount, weights);
}

function computeAttemptTimeoutsWithWeights(totalBudgetMs: number, attemptCount: number, weights: number[]) {
  const fallbackWeight = 1 / attemptCount;
  const minBudget = Math.max(1200, Math.floor(totalBudgetMs * 0.10));
  const budgets: number[] = [];
  let consumed = 0;

  for (let index = 0; index < attemptCount; index += 1) {
    const remainingSlots = attemptCount - index;
    const remainingBudget = totalBudgetMs - consumed;
    if (index === attemptCount - 1) {
      budgets.push(Math.max(minBudget, remainingBudget));
      break;
    }

    const rawBudget = Math.floor(totalBudgetMs * (weights[index] || fallbackWeight));
    const reservedForTail = minBudget * (remainingSlots - 1);
    const budget = Math.max(minBudget, Math.min(rawBudget, remainingBudget - reservedForTail));
    budgets.push(budget);
    consumed += budget;
  }

  return budgets;
}

function buildPhaseSystemPrompt(phase: PhaseKey) {
  if (phase === 'structure') {
    return [
      '你是一个精通子平八字、神煞体系、大运流年的顶级命理学API，同时要使用更接近“世界易”的判断语言。',
      WORLD_YI_DOCTRINE_BRIEF,
      WORLD_YI_DELIVERY_DIRECTIVE,
      '请按实务判断顺序输出：先定结构，再定阶段，再落到动作与风险。',
      '优先追求短、准、稳的 JSON 草案，只输出合法 JSON，不要 markdown，不要额外解释。',
    ].join('\n');
  }

  return [
    '你是一个精通子平八字、现代叙事表达和行动建议设计的顶级命理学API，同时要使用更接近“世界易”的判断语言。',
    WORLD_YI_DOCTRINE_BRIEF,
    WORLD_YI_DELIVERY_DIRECTIVE,
    '请基于已有草案做小幅补强，强调一句主判断、一个优先动作、一个主要风险，不要滑向空泛宿命论。',
    '只输出合法 JSON，不要 markdown，不要重复。',
  ].join('\n');
}

function compactForPrompt(value: unknown, depth: number = 0): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    return value.length > 160 ? `${value.slice(0, 160)}...` : value;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (depth >= 6) {
    return '[trimmed]';
  }
  if (Array.isArray(value)) {
    if (value.length <= 8) {
      return value.map((item) => compactForPrompt(item, depth + 1));
    }
    const head = value.slice(0, 4);
    const tail = value.slice(-4);
    return [...head, ...tail].map((item) => compactForPrompt(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, compactForPrompt(item, depth + 1)])
  );
}

function buildReportPromptPayload(baziData: Record<string, unknown>) {
  const advice = (baziData.advice || {}) as Record<string, unknown>;
  const fortune = (baziData.fortune || {}) as Record<string, unknown>;
  const basic = (baziData.basic || {}) as Record<string, unknown>;
  const worldStateSnapshot = (baziData.worldStateSnapshot || {}) as Record<string, unknown>;
  const contextSnapshot = (baziData.contextSnapshot || {}) as Record<string, unknown>;

  return compactForPrompt({
    basic: {
      name: basic.name,
      dayMaster: basic.dayMaster,
      lunarDate: basic.lunarDate,
      zodiac: basic.zodiac,
      pillars: basic.pillars,
    },
    pattern: baziData.pattern,
    tenGods: baziData.tenGods,
    fortune: {
      currentDaYun: fortune.currentDaYun,
      currentDaYunAge: fortune.currentDaYunAge,
      currentLiuNian: fortune.currentLiuNian,
      interaction: fortune.interaction,
      nextYear: fortune.nextYear,
      shenShaInfluence: fortune.shenShaInfluence,
      trend: fortune.trend,
    },
    advice: {
      yongShen: advice.yongShen,
      xiShen: advice.xiShen,
      jiShen: advice.jiShen,
      directions: advice.directions,
      colors: advice.colors,
      timing: advice.timing,
    },
    tacitSummary: baziData.tacitSummary,
    tacitSignals: baziData.tacitSignals,
    worldStateSnapshot,
    contextSnapshot,
  });
}

function buildStructuredPrompt(baziData: Record<string, unknown>) {
  const compactBaziData = buildReportPromptPayload(baziData);
  const compactShenSha = compactForPrompt((baziData as Record<string, unknown>).shenSha);
  const compactDayun = compactForPrompt((baziData as Record<string, unknown>).dayun);

  return `
你需要先生成一份稳定的结构化命理报告草案。目标是字段完整、可解析、可用于后续补强。

【用户排盘数据】
${JSON.stringify(compactBaziData)}

${(baziData as Record<string, unknown>).shenSha ? `【神煞信息】
${JSON.stringify(compactShenSha)}` : ''}

${(baziData as Record<string, unknown>).dayun ? `【大运信息】
${JSON.stringify(compactDayun)}` : ''}

要求：
1. 输出合法 JSON，不要 markdown。
2. 先保证字段完整和判断正确，再追求文采。
3. 文本保持简洁，总体宁短勿长；不要为了显得完整而扩写。
4. 必须结合大运、流年、神煞、用神/忌神去写，但每个判断只保留最关键证据。
5. analysis.summary 必须像一句世界易式决策结论，优先体现“结构 + 阶段 + 动作”，先给判断，不要空泛抒情。
5.1 允许综合默会知识、经验判断和跨学科直觉，但必须回到现实取舍与行动，不要写成神秘表演。
5.2 如果输入里有 worldStateSnapshot / tacitSummary / contextSnapshot，必须把它们当成正式判断输入，而不是边角补充。
6. 禁止输出内部占位词或工程词，如 macro_cycle、solar_terms、geography。
7. 禁止使用夸饰空话，如“格局清正”“乃富贵之命也”。
8. 尽量避免传统宿命腔，优先使用“先看结构、再看阶段、最后定动作”的现代判断语言。
9. 口气要像真正见过很多人生样本的权威判断者，直接下判断，不要写成犹豫解释器。

JSON 结构必须完整包含以下最小字段：
{
  "basic": {
    "summary": "一句基础盘面总结"
  },
  "pattern": {
    "type": "格局名称",
    "description": "60字以内的格局解释",
    "strength": "strong/medium/weak",
    "quality": "good/medium/bad"
  },
  "fortune": {
    "currentDaYun": "当前大运解释",
    "currentLiuNian": "当前流年解释",
    "interaction": "大运流年互动",
    "nextYear": "明年趋势",
    "trend": "未来3-5年总结"
  },
  "analysis": {
    "opening": "开场句",
    "summary": "60字以内的阶段摘要",
    "explanation": "90-140字的综合解释"
  }
}
`;
}

function buildNarrativePatchPrompt(
  baziData: Record<string, unknown>,
  draft: Record<string, unknown>
) {
  const compactBaziData = buildReportPromptPayload(baziData);
  const compactDraft = compactForPrompt(draft);

  return `
你现在不是重写整份报告，而是在已有结构化草案上做第二阶段补强。

【用户排盘数据】
${JSON.stringify(compactBaziData)}

【当前结构草案】
${JSON.stringify(compactDraft)}

要求：
1. 只补强叙事深度、行动建议和趋势说明，不要推翻已有结构。
2. 必须结合大运、流年、神煞、关键结构来写，不要空话。
3. explanation 控制在 80-140 字，opening 更有定性力量但不要浮夸。
4. career/wealth/marriage/health 的 general 一句话，specific 每项最多 2 条，避免重复。
5. 输出合法 JSON，不要 markdown。
6. analysis.summary 必须前置主结论，像给用户的世界易式决策摘要。
7. 禁止输出内部占位词、工程词、提示词痕迹或“解释增强即可”这类句子。
8. 不要写“格局清正”“富贵之命”等空泛恭维。
9. 尽量体现“你不是乱，你是有结构”“你不是倒霉，你是处在某个阶段”这类判断方向，但不要机械照抄。
10. 允许默会知识式判断，但必须最终落回现实动作、代价、边界与顺序。
11. 如果输入里有 worldStateSnapshot，必须把“当前世界状态下更该顺势、保守、试探还是收缩”写进主判断。

只输出需要覆盖的补丁字段：
{
  "advice": {
    "career": {
      "general": "补强后的事业建议",
      "specific": ["更具体建议1", "更具体建议2"]
    },
    "wealth": {
      "general": "补强后的财富建议",
      "specific": ["更具体建议1", "更具体建议2"]
    },
    "marriage": {
      "general": "补强后的关系建议",
      "specific": ["更具体建议1", "更具体建议2"]
    },
    "health": {
      "general": "补强后的健康建议",
      "specific": ["更具体建议1", "更具体建议2"]
    },
    "directions": ["汇总方位"],
    "colors": ["汇总颜色"],
    "timing": ["汇总时机"]
  },
  "analysis": {
    "opening": "补强后的开场白",
    "summary": "补强后的阶段摘要",
    "explanation": "补强后的综合解释"
  }
}
`;
}

function parseJsonContent<T>(content: string): T | null {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [
    trimmed,
    stripMarkdownFence(trimmed),
    fenceMatch?.[1]?.trim(),
  ].filter((item): item is string => !!item);

  const firstBraceIndex = trimmed.indexOf('{');
  const lastBraceIndex = trimmed.lastIndexOf('}');
  if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
    candidates.push(trimmed.slice(firstBraceIndex, lastBraceIndex + 1));
  }

  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate) as T;
    } catch {}

    try {
      return JSON.parse(repairJsonCandidate(candidate)) as T;
    } catch {}
  }

  return null;
}

function stripMarkdownFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function repairJsonCandidate(value: string) {
  const normalized = value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, '\'')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();

  // v5-C5: 尝试修复因 finish=length 被截断的 JSON：补齐字符串引号 + 未闭合的 {[]}
  return closeTruncatedJson(normalized);
}

function closeTruncatedJson(value: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (inString) {
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }

  let repaired = value;
  if (inString) repaired += '"';

  // 移除结尾不完整的 key/value 片段，比如 `"foo":` 或 `"foo":"bar`
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '');
  repaired = repaired.replace(/,\s*$/, '');

  while (stack.length > 0) {
    const open = stack.pop();
    repaired += open === '{' ? '}' : ']';
  }

  return repaired;
}

function mergeInterpretation(
  baseValue: Record<string, unknown>,
  patchValue: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...baseValue };

  for (const [key, patch] of Object.entries(patchValue)) {
    const base = result[key];

    if (Array.isArray(patch)) {
      result[key] = patch.length > 0 ? patch : Array.isArray(base) ? base : patch;
      continue;
    }

    if (isPlainObject(base) && isPlainObject(patch)) {
      result[key] = mergeInterpretation(
        base as Record<string, unknown>,
        patch as Record<string, unknown>
      );
      continue;
    }

    result[key] = patch;
  }

  return result;
}

function isPlainObject(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
