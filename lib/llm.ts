import OpenAI from 'openai';
import { formatModelAttemptLabel, getModelFallbackChain } from '@/lib/llm-model-fallback';
import {
  computeAttemptTimeouts,
  getDynamicModelExecutionPlan,
  recordModelAttempt,
  summarizeModelExecutionPlan,
} from '@/lib/llm-provider-health';

const getApiBaseUrl = () => {
  return process.env.API_BASE_URL || 'https://ttqq.inping.com/v1';
};

const normalizeApiKey = (value?: string | null) => {
  const key = (value || '').trim();
  if (!key || key === 'dummy_key') return null;
  return key;
};

const getApiKey = () => {
  return (
    normalizeApiKey(process.env.OPENAI_API_KEY) ||
    normalizeApiKey(process.env.API_KEY)
  );
};

const getDefaultModel = () => {
  return process.env.DEFAULT_MODEL || 'auto';
};

const toModelDisplayName = (model: string) => {
  if (model === 'gpt-5.2') {
    return '主分析模型 GPT-5.2';
  }
  if (model === 'grok-420-fast') {
    return '备用模型 Grok 420 Fast';
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

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
    timeout: timeoutMs,
    maxRetries: 0,
  });

  console.log(`[LLM] Starting interpretation with ${timeoutMs}ms timeout...`);

  try {
    const baseChain = getModelFallbackChain(getDefaultModel());
    const deadlineAt = Date.now() + timeoutMs;
    const structureBudgetMs = Math.max(2600, Math.floor(timeoutMs * 0.68));

    const structureDraft = await executeReportPhase({
      openai,
      phase: 'structure',
      baseChain,
      timeoutMs: structureBudgetMs,
      deadlineAt,
      prompt: buildStructuredPrompt(baziData),
      onProgress,
    });

    if (!structureDraft) {
      return null;
    }

    const remainingBudget = deadlineAt - Date.now();
    if (remainingBudget < 1400) {
      return structureDraft;
    }

    const narrativePatch = await executeReportPhase({
      openai,
      phase: 'narrative',
      baseChain,
      timeoutMs: remainingBudget,
      deadlineAt,
      prompt: buildNarrativePatchPrompt(baziData, structureDraft),
      onProgress,
    });

    return narrativePatch
      ? mergeInterpretation(structureDraft, narrativePatch)
      : structureDraft;
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
  const attemptTimeouts = computeAttemptTimeouts(params.timeoutMs, modelCandidates.length);
  const phaseLabel = params.phase === 'structure' ? '结构化解释草案' : '正文补强与建议完善';
  const traceLabel = `report:${params.phase}`;

  console.log(
    `[LLM] ${traceLabel} calling API at ${getApiBaseUrl()} with planner ${planSummary.label} ` +
    `(base=${formatModelAttemptLabel(params.baseChain)})`
  );

  let lastError: unknown = null;

  for (const [index, model] of modelCandidates.entries()) {
    const remainingBudget = Math.min(params.timeoutMs, params.deadlineAt - Date.now());
    if (remainingBudget < 900) {
      break;
    }

    await params.onProgress?.({
      type: 'model-attempt',
      model,
      detail: `${toModelDisplayName(model)} 正在生成${phaseLabel}。`,
    });

    const attemptController = new AbortController();
    const attemptTimeoutMs = Math.max(900, Math.min(remainingBudget, attemptTimeouts[index] || remainingBudget));
    const attemptTimeoutId = setTimeout(() => attemptController.abort(), attemptTimeoutMs);
    const startedAt = Date.now();

    try {
      const completion = await params.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: buildPhaseSystemPrompt(params.phase) },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.phase === 'structure' ? 0.45 : 0.55,
      }, {
        signal: attemptController.signal,
        timeout: attemptTimeoutMs,
        maxRetries: 0,
      });

      const responseText = completion.choices?.[0]?.message?.content?.trim();
      if (!responseText) {
        lastError = new Error(`EMPTY_CONTENT:${model}`);
        recordModelAttempt({
          model,
          scope: 'report',
          success: false,
          latencyMs: Date.now() - startedAt,
          errorType: 'empty',
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

function buildPhaseSystemPrompt(phase: PhaseKey) {
  if (phase === 'structure') {
    return '你是一个精通子平八字、神煞体系、大运流年的顶级命理学API。先输出完整、克制、结构稳定的 JSON 草案，只输出合法 JSON，不要 markdown。';
  }

  return '你是一个精通子平八字、现代叙事表达和行动建议设计的顶级命理学API。请基于已有草案只补强正文、趋势解释和行动建议，只输出合法 JSON，不要 markdown。';
}

function buildStructuredPrompt(baziData: Record<string, unknown>) {
  return `
你需要先生成一份稳定的结构化命理报告草案。目标是字段完整、可解析、可用于后续补强。

【用户排盘数据】
${JSON.stringify(baziData, null, 2)}

${(baziData as Record<string, unknown>).shenSha ? `【神煞信息】
${JSON.stringify((baziData as Record<string, unknown>).shenSha, null, 2)}` : ''}

${(baziData as Record<string, unknown>).dayun ? `【大运信息】
${JSON.stringify((baziData as Record<string, unknown>).dayun, null, 2)}` : ''}

要求：
1. 输出合法 JSON，不要 markdown。
2. 先保证字段完整和判断正确，再追求文采。
3. 文本保持中等长度，减少冗长，方便后续第二阶段补强。
4. 必须结合大运、流年、神煞、用神/忌神去写，不得泛泛而谈。

JSON 结构必须完整包含：
{
  "basic": {
    "summary": "一句基础盘面总结"
  },
  "pattern": {
    "type": "格局名称",
    "description": "80字以内的格局解释",
    "strength": "strong/medium/weak",
    "quality": "good/medium/bad"
  },
  "fiveElements": {
    "wood": { "description": "说明", "strength": 0, "quality": "good/medium/bad/weak/strong" },
    "fire": { "description": "说明", "strength": 0, "quality": "good/medium/bad/weak/strong" },
    "earth": { "description": "说明", "strength": 0, "quality": "good/medium/bad/weak/strong" },
    "metal": { "description": "说明", "strength": 0, "quality": "good/medium/bad/weak/strong" },
    "water": { "description": "说明", "strength": 0, "quality": "good/medium/bad/weak/strong" }
  },
  "fortune": {
    "currentDaYun": "当前大运解释",
    "currentDaYunAge": "年龄范围",
    "currentLiuNian": "当前流年解释",
    "interaction": "大运流年互动",
    "nextYear": "明年趋势",
    "shenShaInfluence": "神煞影响",
    "trend": "未来3-5年总结"
  },
  "advice": {
    "career": {
      "general": "事业总建议",
      "specific": ["建议1", "建议2"],
      "timing": "时机",
      "direction": "方位",
      "colors": ["颜色1"],
      "avoid": ["避免事项1"]
    },
    "wealth": {
      "general": "财富总建议",
      "specific": ["建议1", "建议2"],
      "timing": "时机",
      "direction": "方位",
      "colors": ["颜色1"],
      "avoid": ["避免事项1"]
    },
    "marriage": {
      "general": "关系总建议",
      "specific": ["建议1", "建议2"],
      "timing": "时机",
      "direction": "方位",
      "colors": ["颜色1"],
      "avoid": ["避免事项1"]
    },
    "health": {
      "general": "健康总建议",
      "specific": ["建议1", "建议2"],
      "timing": "时机",
      "directions": ["方位1"],
      "colors": ["颜色1"],
      "avoid": ["避免事项1"]
    },
    "directions": ["汇总方位"],
    "colors": ["汇总颜色"],
    "timing": ["汇总时机"]
  },
  "evidence": {
    "celebrities": [
      {
        "name": "相似名人",
        "bazi": ["年柱", "月柱", "日柱", "时柱"],
        "similar": ["相似点1"],
        "lesson": "启发"
      }
    ]
  },
  "analysis": {
    "opening": "开场句",
    "explanation": "150字左右的综合解释"
  }
}
`;
}

function buildNarrativePatchPrompt(
  baziData: Record<string, unknown>,
  draft: Record<string, unknown>
) {
  return `
你现在不是重写整份报告，而是在已有结构化草案上做第二阶段补强。

【用户排盘数据】
${JSON.stringify(baziData, null, 2)}

【当前结构草案】
${JSON.stringify(draft, null, 2)}

要求：
1. 只补强叙事深度、行动建议和趋势说明，不要推翻已有结构。
2. 必须结合大运、流年、神煞、关键结构来写，不要空话。
3. explanation 控制在 260-420 字，opening 更有大师感但不要浮夸。
4. career/wealth/marriage/health 的 general 和 specific 要更落地，避免重复。
5. 输出合法 JSON，不要 markdown。

只输出需要覆盖的补丁字段：
{
  "fortune": {
    "interaction": "补强后的互动解释",
    "nextYear": "补强后的明年趋势",
    "trend": "补强后的未来3-5年趋势",
    "shenShaInfluence": "补强后的神煞影响"
  },
  "advice": {
    "career": {
      "general": "补强后的事业建议",
      "specific": ["更具体建议1", "更具体建议2", "更具体建议3"]
    },
    "wealth": {
      "general": "补强后的财富建议",
      "specific": ["更具体建议1", "更具体建议2", "更具体建议3"]
    },
    "marriage": {
      "general": "补强后的关系建议",
      "specific": ["更具体建议1", "更具体建议2"]
    },
    "health": {
      "general": "补强后的健康建议",
      "specific": ["更具体建议1", "更具体建议2"]
    }
  },
  "analysis": {
    "opening": "补强后的开场白",
    "explanation": "补强后的综合解释"
  },
  "evidence": {
    "celebrities": [
      {
        "name": "更合理的相似名人",
        "bazi": ["年柱", "月柱", "日柱", "时柱"],
        "similar": ["相似点1", "相似点2"],
        "lesson": "可借鉴的经验"
      }
    ]
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
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, '\'')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
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
