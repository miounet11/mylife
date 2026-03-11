// AI聊天API
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { questionOperations } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { validateQuestion } from '@/lib/validators';
import { checkRateLimit, RATE_LIMITS, getClientKey } from '@/lib/rate-limit';

// 设置 API 路由超时为 30 秒
export const maxDuration = 30;

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

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

async function generateAIResponse(
  question: string,
  userHistory: HistoryMessage[]
): Promise<{ answer: string; llmUsed: boolean }> {
  const apiKey = getApiKey();
  if (!apiKey) {
     console.warn("[LLM Chat] API_KEY is not set.");
     return {
      answer: '系统暂未配置AI模型，请联系管理员。',
      llmUsed: false,
    };
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
      messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content?.trim();
    if (!content) {
      return {
        answer: '大师暂时在休息，请稍后再问。',
        llmUsed: false,
      };
    }

    return {
      answer: content,
      llmUsed: true,
    };
  } catch (error) {
    console.error("[LLM Chat] Generation Error:", error);
    return {
      answer: '大师推算时遇到了一点天机干扰，请稍后再试。',
      llmUsed: false,
    };
  }
}

interface QuestionRow {
  id: string;
  category: string;
  question: string;
  analysis?: { answer?: string; llmUsed?: boolean; source?: string };
  created_at?: string;
}

function buildHistoryFromRows(rows: QuestionRow[]): HistoryMessage[] {
  const chatRows = rows
    .filter((row) => row.category === 'chat_user' || row.category === 'chat_assistant')
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

  return chatRows.map((row) => {
    if (row.category === 'chat_assistant') {
      return {
        role: 'assistant',
        content: row.analysis?.answer || row.question || '',
      } as HistoryMessage;
    }

    return {
      role: 'user',
      content: row.question || '',
    } as HistoryMessage;
  }).filter((m) => !!m.content);
}

export async function POST(request: NextRequest) {
  try {
    // 速率限制
    const clientKey = getClientKey(request);
    const rateLimit = checkRateLimit(`chat:${clientKey}`, RATE_LIMITS.chat);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '消息发送过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const data = await request.json();
    const question = (data?.question || '').trim();
    const userId = await getOrCreateGuestUserId();

    const questionErr = validateQuestion(question);
    if (questionErr) {
      return NextResponse.json(
        { success: false, error: questionErr.message },
        { status: 400 }
      );
    }

    const previousRows = questionOperations.getByUserId(userId, 30) || [];
    const userHistory = buildHistoryFromRows(previousRows).slice(-12);

    // 生成AI响应
    const { answer, llmUsed } = await generateAIResponse(question, userHistory);

    // 持久化本轮问答
    questionOperations.create({
      id: generateId(),
      userId,
      question,
      category: 'chat_user',
      analysis: { source: 'chat_api' },
    });

    questionOperations.create({
      id: generateId(),
      userId,
      question: answer,
      category: 'chat_assistant',
      analysis: {
        source: llmUsed ? 'llm' : 'fallback',
        answer,
        llmUsed,
      },
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      answer,
      llmUsed,
      userId,
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
  try {
    const userId = await getOrCreateGuestUserId();
    const rows = questionOperations.getByUserId(userId, 100) || [];
    const history = rows
      .filter((row: any) => row.category === 'chat_user' || row.category === 'chat_assistant')
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((row: any) => ({
        id: row.id,
        role: row.category === 'chat_assistant' ? 'assistant' : 'user',
        content: row.category === 'chat_assistant' ? (row.analysis?.answer || row.question) : row.question,
        llmUsed: row.category === 'chat_assistant' ? !!row.analysis?.llmUsed : undefined,
        timestamp: row.created_at,
      }));

    return NextResponse.json({
      success: true,
      userId,
      history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取聊天历史失败:', error);
    return NextResponse.json(
      { success: false, error: '获取聊天历史失败' },
      { status: 500 }
    );
  }
}
