import OpenAI from 'openai';

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
    normalizeApiKey(process.env.API_KEY) ||
    'sk-xIeEQPnwggytALqDumo8Ef1KZWbgefs2HAuxL85kvAHX7Kvf'
  );
};

const getDefaultModel = () => {
  return process.env.DEFAULT_MODEL || 'auto';
};

export async function generateFortuneInterpretation(baziData: Record<string, unknown>) {
  const apiKey = getApiKey();
  if (!apiKey) {
     console.warn("API_KEY is not set. Skip LLM interpretation.");
     return null;
  }
  
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: getApiBaseUrl(),
  });
  
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
    const model = getDefaultModel();
    console.log(`[LLM] Calling API at ${getApiBaseUrl()} with model ${model}`);
    
    const completion = await openai.chat.completions.create({
      model: model, 
      messages: [
        { role: "system", content: "你是一个精通子平八字、神煞体系、大运流年的顶级命理学API。你必须充分利用提供的神煞信息和大运数据进行精准解析，不得忽略任何神煞的吉凶影响。只输出合法的JSON，不含任何markdown标记。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) return null;
    
    // Clean up response if it contains markdown JSON blocks
    
    let cleanedText = responseText.trim();
    
    // Attempt to extract JSON if it's wrapped in markdown or other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("[LLM] Generation Error:", error);
    return null;
  }
}
