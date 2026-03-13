// AI聊天API
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { eventOperations, fortuneOperations, questionOperations, runInTransaction } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { validateQuestion } from '@/lib/validators';
import { checkRateLimit, RATE_LIMITS, getClientKey } from '@/lib/rate-limit';
import { trackServerEvent } from '@/lib/analytics';
import { buildChatExperienceContext } from '@/lib/chat-context';

// 设置 API 路由超时为 30 秒
export const maxDuration = 30;

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type QuestionRow = {
  id: string;
  category: string;
  question: string;
  analysis?: {
    answer?: string;
    llmUsed?: boolean;
    source?: string;
    reportId?: string | null;
    focusAreas?: string[];
    turnId?: string;
    responseToQuestionId?: string | null;
    edited?: boolean;
    regenerated?: boolean;
  };
  createdAt?: string;
  created_at?: string;
};

type TimelineMessage = QuestionRow & {
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
  userHistory: HistoryMessage[],
  contextSummary: string
): Promise<{ answer: string; llmUsed: boolean }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[LLM Chat] API_KEY is not set.');
    return {
      answer: '系统暂未配置AI模型，请联系管理员。',
      llmUsed: false,
    };
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
  });

  const messages = [
    {
      role: 'system',
      content: [
        '你是一位精通传统子平八字、滴天髓等命理学，同时又懂得现代心理学和职场发展的顶级AI命理大师。',
        '你必须优先引用用户当前报告里的结构、用神、行运阶段、未来窗口和已记录现实事件，不要给空泛套话。',
        '每次回答都尽量包含：1）判断依据 2）当前阶段建议 3）风险提醒 4）若适合，建议把节点落成事件。',
        '若某结论受时辰或短期节奏影响较大，要明确提示不确定性。',
        contextSummary,
      ].join('\n'),
    },
    ...userHistory.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: question },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content?.trim();
    if (!content) {
      return {
        answer: '当前回复生成不完整，请稍后重试，或围绕更具体的报告板块继续追问。',
        llmUsed: false,
      };
    }

    return {
      answer: content,
      llmUsed: true,
    };
  } catch (error) {
    console.error('[LLM Chat] Generation Error:', error);
    return {
      answer: '当前生成回复时出现暂时性异常，请稍后再试，或围绕更具体的报告板块继续提问。',
      llmUsed: false,
    };
  }
}

function buildHistoryFromRows(rows: QuestionRow[]): HistoryMessage[] {
  const chatRows = rows
    .filter((row) => row.category === 'chat_user' || row.category === 'chat_assistant')
    .sort(
      (a, b) =>
        new Date(a.createdAt || a.created_at || 0).getTime() - new Date(b.createdAt || b.created_at || 0).getTime()
    );

  return chatRows
    .map((row) => {
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
    })
    .filter((item) => !!item.content);
}

function getSortedChatRows(userId: string, limit = 100): TimelineMessage[] {
  const rows = (questionOperations.getChatByUserId(userId, limit) || []) as QuestionRow[];
  return rows.map((row) => ({
    ...row,
    role: row.category === 'chat_assistant' ? 'assistant' : 'user',
    content: row.category === 'chat_assistant' ? (row.analysis?.answer || row.question || '') : (row.question || ''),
  }));
}

function buildHistoryBeforeIndex(rows: TimelineMessage[], endExclusive: number) {
  return buildHistoryFromRows(rows.slice(0, endExclusive)).slice(-12);
}

function findMessageIndex(rows: TimelineMessage[], messageId: string) {
  return rows.findIndex((row) => row.id === messageId);
}

function findPairedAssistantIndex(rows: TimelineMessage[], userIndex: number) {
  const target = rows[userIndex];
  if (!target || target.role !== 'user') return -1;

  for (let index = userIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.role === 'user') {
      return -1;
    }
    if (row.role === 'assistant') {
      const linkedId = row.analysis?.responseToQuestionId;
      if (!linkedId || linkedId === target.id) {
        return index;
      }
    }
  }

  return -1;
}

function findRelatedUserIndex(rows: TimelineMessage[], assistantIndex: number) {
  const target = rows[assistantIndex];
  if (!target || target.role !== 'assistant') return -1;

  const linkedId = target.analysis?.responseToQuestionId;
  if (linkedId) {
    const linkedIndex = rows.findIndex((row) => row.id === linkedId);
    if (linkedIndex >= 0) {
      return linkedIndex;
    }
  }

  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    if (rows[index].role === 'user') {
      return index;
    }
  }

  return -1;
}

function toHistoryPayload(rows: TimelineMessage[]) {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    llmUsed: row.role === 'assistant' ? !!row.analysis?.llmUsed : undefined,
    timestamp: row.createdAt || row.created_at,
  }));
}

function resolveRequestedReportId(request: NextRequest, bodyReportId?: string) {
  const url = new URL(request.url);
  return bodyReportId || url.searchParams.get('reportId') || undefined;
}

function resolveRequestedEventId(request: NextRequest, bodyEventId?: string) {
  const url = new URL(request.url);
  return bodyEventId || url.searchParams.get('eventId') || undefined;
}

function getChatReport(userId: string, requestedReportId?: string) {
  if (requestedReportId) {
    const report = fortuneOperations.getById(requestedReportId);
    if (report && report.userId === userId) {
      return report;
    }
  }

  return fortuneOperations.getByUserId(userId)?.[0] || null;
}

function buildChatPayload(userId: string, requestedReportId?: string, requestedEventId?: string) {
  const report = getChatReport(userId, requestedReportId);
  const events = eventOperations.getByUserId(userId).slice(0, 8);

  return buildChatExperienceContext({
    report,
    events,
    focusEventId: requestedEventId,
  });
}

export async function POST(request: NextRequest) {
  try {
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
    const requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    const requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);

    const questionErr = validateQuestion(question);
    if (questionErr) {
      return NextResponse.json(
        { success: false, error: questionErr.message },
        { status: 400 }
      );
    }

    const previousRows = questionOperations.getByUserId(userId, 30) || [];
    const userHistory = buildHistoryFromRows(previousRows).slice(-12);
    const context = buildChatPayload(userId, requestedReportId, requestedEventId);
    const { answer, llmUsed } = await generateAIResponse(question, userHistory, context.summary);
    const turnId = generateId();
    const userMessageId = generateId();
    const assistantMessageId = generateId();

    questionOperations.create({
      id: userMessageId,
      userId,
      question,
      category: 'chat_user',
      analysis: {
        source: 'chat_api',
        reportId: context.report?.id || null,
        focusAreas: context.focusAreas,
        turnId,
      },
    });

    questionOperations.create({
      id: assistantMessageId,
      userId,
      question: answer,
      category: 'chat_assistant',
      analysis: {
        source: llmUsed ? 'llm' : 'fallback',
        answer,
        llmUsed,
        reportId: context.report?.id || null,
        turnId,
        responseToQuestionId: userMessageId,
      },
    });

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'chat_message_sent',
      page: '/chat',
      meta: {
        llmUsed,
        questionLength: question.length,
        reportId: context.report?.id || null,
        eventId: context.focusedEvent?.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      answer,
      llmUsed,
      userId,
      context,
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

export async function PATCH(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    const rateLimit = checkRateLimit(`chat:${clientKey}`, RATE_LIMITS.chat);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '消息操作过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const data = await request.json();
    const action = typeof data?.action === 'string' ? data.action : '';
    const messageId = typeof data?.messageId === 'string' ? data.messageId : '';
    const content = typeof data?.content === 'string' ? data.content.trim() : '';
    const userId = await getOrCreateGuestUserId();
    const requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    const requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    const rows = getSortedChatRows(userId, 100);
    const targetIndex = findMessageIndex(rows, messageId);

    if (!messageId || targetIndex < 0) {
      return NextResponse.json({ success: false, error: '未找到对应消息' }, { status: 404 });
    }

    const target = rows[targetIndex];
    const context = buildChatPayload(userId, requestedReportId, requestedEventId);

    if (action === 'regenerate') {
      if (target.role !== 'assistant') {
        return NextResponse.json({ success: false, error: '只能重新生成回答消息' }, { status: 400 });
      }

      const userIndex = findRelatedUserIndex(rows, targetIndex);
      if (userIndex < 0) {
        return NextResponse.json({ success: false, error: '缺少对应提问，无法重新生成' }, { status: 400 });
      }

      const userQuestion = rows[userIndex].question.trim();
      const questionErr = validateQuestion(userQuestion);
      if (questionErr) {
        return NextResponse.json({ success: false, error: questionErr.message }, { status: 400 });
      }

      const historyBefore = buildHistoryBeforeIndex(rows, userIndex);
      const { answer, llmUsed } = await generateAIResponse(userQuestion, historyBefore, context.summary);
      const trailingIds = rows.slice(targetIndex + 1).map((row) => row.id);

      runInTransaction(() => {
        if (trailingIds.length > 0) {
          questionOperations.deleteMany(trailingIds);
        }

        questionOperations.update(target.id, {
          question: answer,
          analysis: {
            ...(target.analysis || {}),
            source: llmUsed ? 'llm' : 'fallback',
            answer,
            llmUsed,
            reportId: context.report?.id || null,
            responseToQuestionId: rows[userIndex].id,
            regenerated: true,
          },
        });
      });

      trackServerEvent({
        userId,
        sessionId: userId,
        eventName: 'chat_message_sent',
        page: '/chat',
        meta: {
          action: 'regenerate',
          reportId: context.report?.id || null,
          eventId: context.focusedEvent?.id || null,
          truncatedCount: trailingIds.length,
        },
      });

      return NextResponse.json({
        success: true,
        answer,
        llmUsed,
        context,
        truncatedCount: trailingIds.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'edit') {
      if (target.role !== 'user') {
        return NextResponse.json({ success: false, error: '只能编辑已发送的问题' }, { status: 400 });
      }

      const questionErr = validateQuestion(content);
      if (questionErr) {
        return NextResponse.json({ success: false, error: questionErr.message }, { status: 400 });
      }

      const assistantIndex = findPairedAssistantIndex(rows, targetIndex);
      const historyBefore = buildHistoryBeforeIndex(rows, targetIndex);
      const { answer, llmUsed } = await generateAIResponse(content, historyBefore, context.summary);
      const trailingStart = assistantIndex >= 0 ? assistantIndex + 1 : targetIndex + 1;
      const trailingIds = rows.slice(trailingStart).map((row) => row.id);
      const assistantId = assistantIndex >= 0 ? rows[assistantIndex].id : generateId();

      runInTransaction(() => {
        questionOperations.update(target.id, {
          question: content,
          analysis: {
            ...(target.analysis || {}),
            source: 'chat_api',
            reportId: context.report?.id || null,
            focusAreas: context.focusAreas,
            edited: true,
          },
        });

        if (assistantIndex >= 0) {
          questionOperations.update(assistantId, {
            question: answer,
            analysis: {
              ...(rows[assistantIndex].analysis || {}),
              source: llmUsed ? 'llm' : 'fallback',
              answer,
              llmUsed,
              reportId: context.report?.id || null,
              responseToQuestionId: target.id,
              regenerated: true,
            },
          });
        } else {
          questionOperations.create({
            id: assistantId,
            userId,
            question: answer,
            category: 'chat_assistant',
            analysis: {
              source: llmUsed ? 'llm' : 'fallback',
              answer,
              llmUsed,
              reportId: context.report?.id || null,
              responseToQuestionId: target.id,
              turnId: target.analysis?.turnId || generateId(),
              regenerated: true,
            },
          });
        }

        if (trailingIds.length > 0) {
          questionOperations.deleteMany(trailingIds);
        }
      });

      trackServerEvent({
        userId,
        sessionId: userId,
        eventName: 'chat_message_sent',
        page: '/chat',
        meta: {
          action: 'edit',
          reportId: context.report?.id || null,
          eventId: context.focusedEvent?.id || null,
          truncatedCount: trailingIds.length,
        },
      });

      return NextResponse.json({
        success: true,
        answer,
        llmUsed,
        context,
        truncatedCount: trailingIds.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: false, error: '不支持的消息操作' }, { status: 400 });
  } catch (error) {
    console.error('[API] 更新聊天消息失败:', error);
    return NextResponse.json(
      { success: false, error: '更新聊天消息失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const messageId = typeof data?.messageId === 'string' ? data.messageId : '';
    const userId = await getOrCreateGuestUserId();
    const requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    const requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    const rows = getSortedChatRows(userId, 100);
    const targetIndex = findMessageIndex(rows, messageId);

    if (!messageId || targetIndex < 0) {
      return NextResponse.json({ success: false, error: '未找到对应消息' }, { status: 404 });
    }

    const target = rows[targetIndex];
    const context = buildChatPayload(userId, requestedReportId, requestedEventId);
    let deleteUntilIndex = targetIndex;

    if (target.role === 'user') {
      const assistantIndex = findPairedAssistantIndex(rows, targetIndex);
      deleteUntilIndex = assistantIndex >= 0 ? assistantIndex : targetIndex;
    }

    const deleteIds = rows.slice(targetIndex, deleteUntilIndex + 1).map((row) => row.id);
    const trailingIds = rows.slice(deleteUntilIndex + 1).map((row) => row.id);
    const allIds = [...deleteIds, ...trailingIds];

    questionOperations.deleteMany(allIds);

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'chat_message_sent',
      page: '/chat',
      meta: {
        action: 'delete',
        reportId: context.report?.id || null,
        eventId: context.focusedEvent?.id || null,
        deletedCount: allIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: allIds.length,
      truncatedCount: trailingIds.length,
      context,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除聊天消息失败:', error);
    return NextResponse.json(
      { success: false, error: '删除聊天消息失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const requestedReportId = resolveRequestedReportId(request);
    const requestedEventId = resolveRequestedEventId(request);
    const rows = getSortedChatRows(userId, 100);
    const context = buildChatPayload(userId, requestedReportId, requestedEventId);
    const history = toHistoryPayload(rows);

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'chat_context_loaded',
      page: '/chat',
      meta: {
        reportId: context.report?.id || null,
        eventId: context.focusedEvent?.id || null,
        historyCount: history.length,
        recentEvents: context.recentEvents.length,
      },
    });

    return NextResponse.json({
      success: true,
      userId,
      history,
      context,
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
