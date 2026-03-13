import OpenAI from 'openai';
import { formatModelAttemptLabel, getModelFallbackChain } from '@/lib/llm-model-fallback';
import {
  computeAttemptTimeouts,
  getDynamicModelExecutionPlan,
  recordModelAttempt,
  summarizeModelExecutionPlan,
} from '@/lib/llm-provider-health';

const getApiBaseUrl = () => {
  return process.env.API_BASE_URL || 'https://ttkk.inping.com/v1';
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

export async function generateFortuneInterpretation(baziData: Record<string, unknown>, timeoutMs: number = 25000) {
  const apiKey = getApiKey();
  if (!apiKey) {
     console.warn("API_KEY is not set. Skip LLM interpretation.");
     return null;
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: getApiBaseUrl(),
    timeout: timeoutMs,
    maxRetries: 0,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  console.log(`[LLM] Starting interpretation with ${timeoutMs}ms timeout...`);
  
  const prompt = `
你是一位精通传统子平八字、滴天髓等命理学，同时又懂得现代心理学和职场发展的顶级AI命理大师。
请根据以下用户的八字排盘数据，为其生成一份极具深度、同理心且极度专业、"千人千面"的命理解析报告。

【用户排盘数据】
${JSON.stringify(baziData, null, 2)}

${(baziData as Record<string, unknown>).shenSha ? `【神煞信息】
${JSON.stringify((baziData as Record<string, unknown>).shenSha, null, 2)}
神煞是命局中的特殊星曜，请在解析中结合神煞信息给出更精准的判断。` : ''}

${(baziData as Record<string, unknown>).dayun ? `【大运信息】
${JSON.stringify((baziData as Record<string, unknown>).dayun, null, 2)}
请结合大运走势，对当前运程和未来趋势给出精准预测。` : ''}

请严格以JSON格式输出，不要包含任何markdown标记（如 \`\`\`json ），直接输出合法的JSON对象。
JSON结构必须完全符合以下定义：
{
  "basic": {
     // 基本盘面总结，如日主强弱等（字符串）
  },
  "pattern": {
    "type": "格局名称",
    "description": "对格局的详细且通俗的解释，字数在100字左右",
    "strength": "strong/medium/weak",
    "quality": "good/medium/bad"
  },
  "fiveElements": {
    // 必须包含 wood, fire, earth, metal, water 五个键，每个键对应对象：
    // { "description": "对该五行在命局中作用的专业且易懂的解析", "strength": 数字, "quality": "good/medium/bad/weak/strong" }
  },
  "fortune": {
    "currentDaYun": "当前大运天干地支及详细解析（结合大运信息中的具体数据）",
    "currentDaYunAge": "当前大运起止年龄",
    "currentLiuNian": "当前流年名称及简析",
    "interaction": "大运与流年的互动关系，是否有刑冲合害，对运势的具体影响",
    "nextYear": "明年运势预测，结合流年天干地支与命局的关系",
    "shenShaInfluence": "神煞对当前运程的具体影响（如有天乙贵人、文昌等吉神，或羊刃、劫煞等凶神，请具体说明）",
    "trend": "未来3-5年运势走向总结"
  },
  "advice": {
    "career": {
      "general": "事业总体建议，字数在100字左右",
      "specific": ["具体建议1", "具体建议2", "具体建议3"],
      "timing": "有利时机",
      "direction": "有利方位",
      "colors": ["有利颜色1", "有利颜色2"],
      "avoid": ["避免事项1", "避免事项2"]
    },
    "wealth": {
      // 结构同 career
      "general": "财富总体建议",
      "specific": ["具体建议1", "具体建议2"],
      "timing": "有利时机",
      "direction": "有利方位",
      "colors": ["有利颜色1", "有利颜色2"],
      "avoid": ["避免事项"]
    },
    "marriage": {
      // 结构同 career
      "general": "婚姻感情总体建议",
      "specific": ["具体建议1", "具体建议2"],
      "timing": "有利时机",
      "direction": "有利方位",
      "colors": ["有利颜色"],
      "avoid": ["避免事项"]
    },
    "health": {
      // 结构同 career
      "general": "健康总体建议",
      "specific": ["具体建议1", "具体建议2"],
      "timing": "有利时机",
      "directions": ["有利方位1", "有利方位2"],
      "colors": ["有利颜色"],
      "avoid": ["避免事项"]
    },
    "directions": ["所有有利方位汇总"],
    "colors": ["所有有利颜色汇总"],
    "timing": ["所有有利时机汇总"]
  },
  "evidence": {
    "celebrities": [
      {
         "name": "一位命局相似的历史或现代名人（必须合理）",
         "bazi": ["年柱", "月柱", "日柱", "时柱"],
         "similar": ["相似点1", "相似点2"],
         "lesson": "从TA身上能学到什么"
      }
    ]
  },
  "analysis": {
    "opening": "一句极具大师风范的开场白（如：'细观您的八字，命理之象，历历在目。'）",
    "explanation": "一段200字左右的综合深度解析，将格局、五行、十神融会贯通，给用户指出人生最核心的破局点。"
  }
}
`;

  try {
    const baseChain = getModelFallbackChain(getDefaultModel());
    const plan = getDynamicModelExecutionPlan(baseChain, 'report');
    const modelCandidates = plan.orderedModels;
    const planSummary = summarizeModelExecutionPlan(plan);
    const attemptTimeouts = computeAttemptTimeouts(timeoutMs, modelCandidates.length);
    const deadlineAt = Date.now() + timeoutMs;
    console.log(
      `[LLM] Calling API at ${getApiBaseUrl()} with planner ${planSummary.label} ` +
      `(base=${formatModelAttemptLabel(baseChain)})`
    );

    let lastError: unknown = null;

    for (const [index, model] of modelCandidates.entries()) {
      const remainingBudget = deadlineAt - Date.now();
      if (remainingBudget < 900) {
        break;
      }

      const attemptController = new AbortController();
      const attemptTimeoutMs = Math.max(900, Math.min(remainingBudget, attemptTimeouts[index] || remainingBudget));
      const attemptTimeoutId = setTimeout(() => attemptController.abort(), attemptTimeoutMs);
      const startedAt = Date.now();
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: '你是一个精通子平八字、神煞体系、大运流年的顶级命理学API。你必须充分利用提供的神煞信息和大运数据进行精准解析，不得忽略任何神煞的吉凶影响。只输出合法的JSON，不含任何markdown标记。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }, {
          signal: attemptController.signal,
          timeout: attemptTimeoutMs,
          maxRetries: 0,
        });

        const responseText = completion.choices[0].message.content;
        if (!responseText) {
          lastError = new Error(`EMPTY_CONTENT:${model}`);
          console.error(`[LLM] Model ${model} returned empty content`);
          recordModelAttempt({
            model,
            scope: 'report',
            success: false,
            latencyMs: Date.now() - startedAt,
            errorType: 'empty',
            traceLabel: 'report:main',
          });
          continue;
        }

        let cleanedText = responseText.trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanedText);
        recordModelAttempt({
          model,
          scope: 'report',
          success: true,
          latencyMs: Date.now() - startedAt,
          traceLabel: 'report:main',
        });
        if (model !== modelCandidates[0]) {
          console.warn(`[LLM] Model fallback succeeded with ${model}`);
        }
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
          traceLabel: 'report:main',
        });
        console.error(`[LLM] Model ${model} failed: ${message}`);
      } finally {
        clearTimeout(attemptTimeoutId);
      }
    }

    console.error(`[LLM] All model attempts failed: ${formatModelAttemptLabel(modelCandidates)}`);
    if (lastError) return null;
    return null;

  } catch (error) {
    if (error instanceof Error) {
      if (
        error.name === 'AbortError' ||
        error.message.includes('timeout') ||
        error.message.includes('timed out')
      ) {
        console.error("[LLM] Request timeout - API took too long to respond");
      } else {
        console.error("[LLM] Generation Error:", error.message);
      }
    } else {
      console.error("[LLM] Generation Error:", error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
