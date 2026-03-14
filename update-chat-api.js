const fs = require('fs');

const path = 'app/api/chat/route.ts';
let content = fs.readFileSync(path, 'utf8');

// replace the generateAIResponse function with the real LLM implementation
const replacement = `import { generateFortuneInterpretation } from '@/lib/llm';
import OpenAI from 'openai';

const getApiBaseUrl = () => {
  return process.env.API_BASE_URL || 'https://ttqq.inping.com/v1';
};

const getApiKey = () => {
  return process.env.OPENAI_API_KEY || process.env.API_KEY || 'dummy_key';
};

const getDefaultModel = () => {
  return process.env.DEFAULT_MODEL || 'auto';
};

async function generateAIResponse(
  question: string,
  userHistory: any[]
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'dummy_key') {
     console.warn("API_KEY is not set. Using mock chat interpretation.");
     return \`关于您的"\${question}"，这是一 个很有深度的问题。由于当前系统未配置真实的大师模型API，我暂时无法为您提供针对性的解答。\`;
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: getApiBaseUrl(),
  });

  const messages = [
    { role: "system", content: "你是一位精通传统子平八字、滴天髓等命理学，同时又懂得现代心理学和职场发展的顶级AI命理大师。请根据用户的问题进行深度解答，给出专业、贴心、具有指导意义的建议。" },
    ...userHistory.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: question }
  ];

  try {
    const model = getDefaultModel();
    const completion = await openai.chat.completions.create({
      model: model, 
      messages: messages as any,
      temperature: 0.7,
    });

    return completion.choices[0].message.content || "大师暂时在休息，请稍后再问。";
  } catch (error) {
    console.error("[LLM Chat] Generation Error:", error);
    return "大师推算时遇到了一点天机干扰，请稍后再试。";
  }
}
`;

content = content.replace(/async function generateAIResponse[\s\S]*?\}\n\nexport async function POST/, replacement + '\nexport async function POST');

fs.writeFileSync(path, content);
console.log("Updated app/api/chat/route.ts");
