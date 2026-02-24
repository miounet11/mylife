// AI聊天API
import { NextRequest, NextResponse } from 'next/server';

// 模拟AI模型（实际应该调用真实的AI API）
import { generateFortuneInterpretation } from '@/lib/llm';
import OpenAI from 'openai';

const getApiBaseUrl = () => {
  return process.env.API_BASE_URL || 'https://ttkk.inping.com/v1';
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
     return `关于您的"${question}"，这是一 个很有深度的问题。由于当前系统未配置真实的大师模型API，我暂时无法为您提供针对性的解答。`;
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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { question, userId, sessionId } = data;

    if (!question || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成AI响应
    const answer = await generateAIResponse(question, []);

    // 返回响应
    return NextResponse.json({
      success: true,
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] AI聊天失败:', error);
    return NextResponse.json(
      { success: false, error: '聊天失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// GET方法 - 聊天历史
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url!);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: '缺少用户ID' },
      { status: 400 }
    );
  }

  // 模拟获取历史
  const chatHistory = [
    {
      id: '1',
      role: 'user',
      content: '我最近事业运如何？',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      role: 'assistant',
      content: '根据您的八字，您最近的事业运势呈上升趋势...',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
  ];

  return NextResponse.json({
    success: true,
    history: chatHistory,
    timestamp: new Date().toISOString(),
  });
}
