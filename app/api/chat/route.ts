// AI聊天API
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { eventOperations, fortuneOperations, questionOperations, runInTransaction, toolSessionOperations } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { validateQuestion } from '@/lib/validators';
import { checkRateLimit, RATE_LIMITS, getClientKey } from '@/lib/rate-limit';
import { trackServerEvent } from '@/lib/analytics';
import { buildChatExperienceContext, type ChatExperienceContext } from '@/lib/chat-context';
import { getChatIntentSummaryHint, getChatIntentSystemPrompt, normalizeChatIntent, type ChatIntent } from '@/lib/chat-intent';
import { formatModelAttemptLabel, getModelFallbackChain } from '@/lib/llm-model-fallback';
import {
  assessScopeProviderHealth,
  computeAttemptTimeouts,
  getDynamicModelExecutionPlan,
  recordModelAttempt,
  shouldConservativelyDeferForSnapshots,
  summarizeModelExecutionPlan,
} from '@/lib/llm-provider-health';

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
    eventId?: string | null;
    focusAreas?: string[];
    turnId?: string;
    responseToQuestionId?: string | null;
    edited?: boolean;
    regenerated?: boolean;
    intent?: ChatIntent | null;
  };
  createdAt?: string;
  created_at?: string;
};

type TimelineMessage = QuestionRow & {
  role: 'user' | 'assistant';
  content: string;
};

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

async function generateAIResponse(
  question: string,
  userHistory: HistoryMessage[],
  contextSummary: string,
  options?: {
    intent?: ChatIntent;
    context?: ChatExperienceContext;
  }
): Promise<{ answer: string; llmUsed: boolean; fallbackReason?: string }> {
  const apiKey = getApiKey();
  const fallbackAnswer = buildFallbackChatAnswer(question, options?.context, options?.intent);
  if (!apiKey) {
    console.warn('[LLM Chat] API_KEY is not set.');
    return {
      answer: fallbackAnswer,
      llmUsed: false,
      fallbackReason: 'missing_api_key',
    };
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
  });

  const intentPrompt = getChatIntentSystemPrompt(options?.intent);
  const intentSummaryHint = getChatIntentSummaryHint(options?.intent);
  const messages = [
    {
      role: 'system',
      content: [
        '你是一位精通传统子平八字、滴天髓等命理学，同时又懂得现代心理学和职场发展的顶级AI命理大师。',
        '你必须优先引用用户当前报告里的结构、用神、行运阶段、未来窗口和已记录现实事件，不要给空泛套话。',
        '每次回答都尽量包含：1）判断依据 2）当前阶段建议 3）风险提醒 4）若适合，建议把节点落成事件。',
        '若某结论受时辰或短期节奏影响较大，要明确提示不确定性。',
        intentPrompt,
        contextSummary,
        intentSummaryHint,
      ].join('\n'),
    },
    ...userHistory.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: question },
  ];

  try {
    const baseChain = getModelFallbackChain(getDefaultModel());
    const providerHealth = assessScopeProviderHealth(baseChain, 'chat');
    if (providerHealth.shouldDefer || shouldConservativelyDeferForSnapshots(providerHealth.snapshots || [])) {
      return {
        answer: fallbackAnswer,
        llmUsed: false,
        fallbackReason: 'provider_health_gate',
      };
    }

    const plan = getDynamicModelExecutionPlan(baseChain, 'chat');
    const modelCandidates = plan.orderedModels;
    const planSummary = summarizeModelExecutionPlan(plan);
    const attemptTimeouts = computeAttemptTimeouts(9000, modelCandidates.length);
    const deadlineAt = Date.now() + 9000;
    console.log(
      `[LLM Chat] planner ${planSummary.label} ` +
      `(base=${formatModelAttemptLabel(baseChain)})`
    );

    for (const [index, model] of modelCandidates.entries()) {
      const remainingBudget = deadlineAt - Date.now();
      if (remainingBudget < 900) {
        break;
      }

      const controller = new AbortController();
      const attemptTimeoutMs = Math.max(900, Math.min(remainingBudget, attemptTimeouts[index] || remainingBudget));
      const timeoutId = setTimeout(() => controller.abort(), attemptTimeoutMs);
      const startedAt = Date.now();
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
          temperature: 0.7,
          max_tokens: 900,
        }, {
          signal: controller.signal,
          timeout: attemptTimeoutMs,
          maxRetries: 0,
        });

        const content = completion.choices[0].message.content?.trim();
        if (!content) {
          console.error(`[LLM Chat] Model ${model} returned empty content`);
          recordModelAttempt({
            model,
            scope: 'chat',
            success: false,
            latencyMs: Date.now() - startedAt,
            errorType: 'empty',
            traceLabel: 'chat:main',
          });
          continue;
        }

        recordModelAttempt({
          model,
          scope: 'chat',
          success: true,
          latencyMs: Date.now() - startedAt,
          traceLabel: 'chat:main',
        });
        if (model !== modelCandidates[0]) {
          console.warn(`[LLM Chat] Model fallback succeeded with ${model}`);
        }

        return {
          answer: content,
          llmUsed: true,
          fallbackReason: undefined,
        };
      } catch (error) {
        recordModelAttempt({
          model,
          scope: 'chat',
          success: false,
          latencyMs: Date.now() - startedAt,
          errorType: error instanceof Error ? error.name || 'error' : 'error',
          traceLabel: 'chat:main',
        });
        console.error(`[LLM Chat] Model ${model} failed:`, error);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return {
      answer: fallbackAnswer,
      llmUsed: false,
      fallbackReason: 'all_models_failed',
    };
  } catch (error) {
    console.error('[LLM Chat] Generation Error:', error);
    return {
      answer: fallbackAnswer,
      llmUsed: false,
      fallbackReason: 'generation_exception',
    };
  }
}

function trackChatCompleted(params: {
  userId: string;
  sessionId?: string | null;
  action: 'ask' | 'regenerate' | 'edit' | 'delete' | 'load';
  reportId?: string | null;
  eventId?: string | null;
  intent?: ChatIntent | null;
  llmUsed?: boolean;
  durationMs: number;
  fallbackReason?: string;
  historyCount?: number;
  questionLength?: number;
  truncatedCount?: number;
  deletedCount?: number;
}) {
  trackServerEvent({
    userId: params.userId,
    sessionId: params.sessionId || params.userId,
    eventName: 'chat_completed',
    page: '/chat',
    meta: {
      action: params.action,
      reportId: params.reportId || null,
      eventId: params.eventId || null,
      intent: params.intent || null,
      llmUsed: params.llmUsed,
      durationMs: params.durationMs,
      fallbackReason: params.fallbackReason || null,
      historyCount: params.historyCount,
      questionLength: params.questionLength,
      truncatedCount: params.truncatedCount,
      deletedCount: params.deletedCount,
    },
  });
}

function trackChatFailed(params: {
  userId?: string | null;
  sessionId?: string | null;
  action: 'ask' | 'regenerate' | 'edit' | 'delete' | 'load';
  reportId?: string | null;
  eventId?: string | null;
  intent?: ChatIntent | null;
  durationMs: number;
  error: unknown;
}) {
  trackServerEvent({
    userId: params.userId || undefined,
    sessionId: params.sessionId || params.userId || undefined,
    eventName: 'chat_failed',
    page: '/chat',
    meta: {
      action: params.action,
      reportId: params.reportId || null,
      eventId: params.eventId || null,
      intent: params.intent || null,
      durationMs: params.durationMs,
      error: params.error instanceof Error ? params.error.message : 'unknown',
    },
  });
}

function buildFallbackChatAnswer(
  question: string,
  context?: ChatExperienceContext,
  intent?: ChatIntent
) {
  const report = context?.report;
  const focusedEvent = context?.focusedEvent;
  const bestWindow = report?.bestWindow || '近期更强窗口';
  const riskWindow = report?.riskWindow || '当前风险窗口';
  const topScenario = report?.topScenario || '当前主线';

  switch (intent) {
    case 'event-simulation':
      return [
        '先按事件推演模式给你一个可执行版判断。',
        `当前更适合围绕“${topScenario}”来推进，这件事不要一次性压上，优先看 ${bestWindow}，对 ${riskWindow} 保持风控。`,
        '建议节奏：先小范围试探和摸清对方反馈，再进入关键谈判，最后才做正式确认或资源投入。',
        '风险提醒：如果对方反馈反复、推进成本突然升高、你自己开始情绪化加码，就不适合继续硬推。',
        `你可以继续把事件补充为“对象是谁、目标是什么、最晚决策时间是什么”，我再按 ${bestWindow} 和 ${riskWindow} 给你拆细一步。`,
      ].join('\n');
    case 'event-verdict':
      return [
        '先按断事专项给你一个倾向判断。',
        `这件事当前不适合只凭冲动下结论，更像“可以推进，但必须带条件筛选”。核心依据还是 ${topScenario} 与窗口强弱的配合。`,
        `如果你要推进，优先把动作压到 ${bestWindow} 附近；如果现实必须提前做，就一定先缩小试错成本。`,
        '最该防的不是完全不能做，而是判断还没坐实就提前重投入。',
        '你可以继续补一句“这件事最担心失去什么”，我再把倾向判断收窄得更明确。',
      ].join('\n');
    case 'event-review':
      return [
        '先按事件剖析模式给你一个复盘框架。',
        focusedEvent
          ? `这次更适合围绕“${focusedEvent.title}”复盘，先区分偏差来自时机、执行，还是信息判断。`
          : '这次更像要先把偏差来源拆清楚，而不是急着给自己下结论。',
        `如果事情发生在 ${riskWindow} 一类弱窗口，偏差更容易来自时机过早或节奏过满；如果明明靠近 ${bestWindow} 仍然失手，就更要复盘执行链和信息判断。`,
        '下一步建议：先写下当时的目标、实际动作、对方反馈和终局结果，我再帮你判断更像哪里出了偏差。',
      ].join('\n');
    case 'meihua-enhancement':
      return [
        '先按摇卦 / 梅花易增强的短周期模式给你一个收敛判断。',
        `这类问题不看长线空话，重点是接下来 7 天到 30 天的波动。当前更适合先观察对方信号和即时变数，再决定要不要在 ${bestWindow} 前后落动作。`,
        `如果现实已经逼近决策点，就先做最小动作验证，不要在 ${riskWindow} 一类承压节点重押。`,
        '你可以继续把问题缩成 A / B 两个选项，我会按短周期判断继续帮你收口。',
      ].join('\n');
    default:
      return [
        '先给你一个基于当前报告的结构化回答框架。',
        `当前主线在 ${topScenario}，更适合围绕 ${bestWindow} 做关键动作，同时对 ${riskWindow} 保持保守。`,
        '如果你愿意把问题再说具体一点，例如补上时间点、对象或你最担心的风险，我可以继续把回答收窄到更可执行的层级。',
      ].join('\n');
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
    edited: !!row.analysis?.edited,
    regenerated: !!row.analysis?.regenerated,
    reportId: row.analysis?.reportId || null,
    eventId: row.analysis?.eventId || null,
    intent: row.analysis?.intent || null,
    responseToQuestionId: row.analysis?.responseToQuestionId || null,
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

function resolveRequestedIntent(request: NextRequest, bodyIntent?: string) {
  const url = new URL(request.url);
  return normalizeChatIntent(bodyIntent || url.searchParams.get('intent'));
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

function buildChatPayload(
  userId: string,
  requestedReportId?: string,
  requestedEventId?: string,
  requestedIntent?: ChatIntent
) {
  const report = getChatReport(userId, requestedReportId);
  const events = eventOperations.getByUserId(userId).slice(0, 8);
  const toolSessions = toolSessionOperations.listByUser(userId, 8);

  return buildChatExperienceContext({
    report,
    events,
    toolSessions,
    focusEventId: requestedEventId,
    intent: requestedIntent,
  });
}

function rowMatchesScope(
  row: TimelineMessage,
  requestedReportId?: string,
  requestedEventId?: string,
  requestedIntent?: ChatIntent
) {
  const rowReportId = row.analysis?.reportId || '';
  const rowEventId = row.analysis?.eventId || '';
  const rowIntent = normalizeChatIntent(row.analysis?.intent || undefined);

  if (requestedIntent && rowIntent !== requestedIntent) {
    return false;
  }

  if (requestedEventId) {
    return rowEventId === requestedEventId;
  }

  if (requestedReportId) {
    return rowReportId === requestedReportId;
  }

  return true;
}

function getScopedChatRows(
  userId: string,
  requestedReportId?: string,
  requestedEventId?: string,
  requestedIntent?: ChatIntent,
  limit = 100
) {
  return getSortedChatRows(userId, limit).filter((row) => rowMatchesScope(row, requestedReportId, requestedEventId, requestedIntent));
}

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  try {
    const clientKey = getClientKey(request);
    sessionId = clientKey;
    const rateLimit = checkRateLimit(`chat:${clientKey}`, RATE_LIMITS.chat);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '消息发送过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const data = await request.json();
    const question = (data?.question || '').trim();
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    requestedIntent = resolveRequestedIntent(request, typeof data?.intent === 'string' ? data.intent : undefined);

    const questionErr = validateQuestion(question);
    if (questionErr) {
      return NextResponse.json(
        { success: false, error: questionErr.message },
        { status: 400 }
      );
    }

    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);
    const scopeReportId = context.report?.id || requestedReportId;
    const scopeEventId = context.focusedEvent?.id || requestedEventId;
    const previousRows = getScopedChatRows(userId, scopeReportId, scopeEventId, requestedIntent, 60);
    const userHistory = buildHistoryFromRows(previousRows).slice(-12);
    const { answer, llmUsed, fallbackReason } = await generateAIResponse(question, userHistory, context.summary, {
      intent: requestedIntent,
      context,
    });
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
        eventId: context.focusedEvent?.id || null,
        focusAreas: context.focusAreas,
        turnId,
        intent: requestedIntent || null,
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
        eventId: context.focusedEvent?.id || null,
        turnId,
        responseToQuestionId: userMessageId,
        intent: requestedIntent || null,
      },
    });

    trackServerEvent({
      userId,
      sessionId,
      eventName: 'chat_message_sent',
      page: '/chat',
      meta: {
        llmUsed,
        durationMs: Date.now() - requestStartedAt,
        fallbackReason: fallbackReason || null,
        questionLength: question.length,
        reportId: context.report?.id || null,
        eventId: context.focusedEvent?.id || null,
        intent: requestedIntent || null,
      },
    });
    trackChatCompleted({
      userId,
      sessionId,
      action: 'ask',
      reportId: context.report?.id || null,
      eventId: context.focusedEvent?.id || null,
      intent: requestedIntent || null,
      llmUsed,
      durationMs: Date.now() - requestStartedAt,
      fallbackReason,
      historyCount: previousRows.length,
      questionLength: question.length,
    });

    return NextResponse.json({
      success: true,
      answer,
      llmUsed,
      userId,
      context,
      intent: requestedIntent || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] AI聊天失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      action: 'ask',
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '聊天失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestStartedAt = Date.now();
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  let trackedAction: 'regenerate' | 'edit' = 'edit';
  try {
    const clientKey = getClientKey(request);
    sessionId = clientKey;
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
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    requestedIntent = resolveRequestedIntent(request, typeof data?.intent === 'string' ? data.intent : undefined);
    const rows = getScopedChatRows(userId, requestedReportId, requestedEventId, requestedIntent, 100);
    const targetIndex = findMessageIndex(rows, messageId);

    if (!messageId || targetIndex < 0) {
      return NextResponse.json({ success: false, error: '未找到对应消息' }, { status: 404 });
    }

    const target = rows[targetIndex];
    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);

    if (action === 'regenerate') {
      trackedAction = 'regenerate';
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
      const { answer, llmUsed, fallbackReason } = await generateAIResponse(userQuestion, historyBefore, context.summary, {
        intent: requestedIntent,
        context,
      });
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
            eventId: context.focusedEvent?.id || null,
            responseToQuestionId: rows[userIndex].id,
            regenerated: true,
            intent: requestedIntent || null,
          },
        });
      });

      trackServerEvent({
        userId,
        sessionId,
        eventName: 'chat_message_sent',
        page: '/chat',
        meta: {
          action: 'regenerate',
          reportId: context.report?.id || null,
          eventId: context.focusedEvent?.id || null,
          llmUsed,
          durationMs: Date.now() - requestStartedAt,
          fallbackReason: fallbackReason || null,
          truncatedCount: trailingIds.length,
          intent: requestedIntent || null,
        },
      });
      trackChatCompleted({
        userId,
        sessionId,
        action: 'regenerate',
        reportId: context.report?.id || null,
        eventId: context.focusedEvent?.id || null,
        intent: requestedIntent || null,
        llmUsed,
        durationMs: Date.now() - requestStartedAt,
        fallbackReason,
        truncatedCount: trailingIds.length,
      });

      return NextResponse.json({
        success: true,
        answer,
        llmUsed,
        context,
        intent: requestedIntent || null,
        truncatedCount: trailingIds.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'edit') {
      trackedAction = 'edit';
      if (target.role !== 'user') {
        return NextResponse.json({ success: false, error: '只能编辑已发送的问题' }, { status: 400 });
      }

      const questionErr = validateQuestion(content);
      if (questionErr) {
        return NextResponse.json({ success: false, error: questionErr.message }, { status: 400 });
      }

      const assistantIndex = findPairedAssistantIndex(rows, targetIndex);
      const historyBefore = buildHistoryBeforeIndex(rows, targetIndex);
      const { answer, llmUsed, fallbackReason } = await generateAIResponse(content, historyBefore, context.summary, {
        intent: requestedIntent,
        context,
      });
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
            eventId: context.focusedEvent?.id || null,
            focusAreas: context.focusAreas,
            edited: true,
            intent: requestedIntent || null,
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
              eventId: context.focusedEvent?.id || null,
              responseToQuestionId: target.id,
              edited: true,
              regenerated: true,
              intent: requestedIntent || null,
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
              eventId: context.focusedEvent?.id || null,
              responseToQuestionId: target.id,
              turnId: target.analysis?.turnId || generateId(),
              edited: true,
              regenerated: true,
              intent: requestedIntent || null,
            },
          });
        }

        if (trailingIds.length > 0) {
          questionOperations.deleteMany(trailingIds);
        }
      });

      trackServerEvent({
        userId,
        sessionId,
        eventName: 'chat_message_sent',
        page: '/chat',
        meta: {
          action: 'edit',
          reportId: context.report?.id || null,
          eventId: context.focusedEvent?.id || null,
          llmUsed,
          durationMs: Date.now() - requestStartedAt,
          fallbackReason: fallbackReason || null,
          truncatedCount: trailingIds.length,
          intent: requestedIntent || null,
        },
      });
      trackChatCompleted({
        userId,
        sessionId,
        action: 'edit',
        reportId: context.report?.id || null,
        eventId: context.focusedEvent?.id || null,
        intent: requestedIntent || null,
        llmUsed,
        durationMs: Date.now() - requestStartedAt,
        fallbackReason,
        truncatedCount: trailingIds.length,
        questionLength: content.length,
      });

      return NextResponse.json({
        success: true,
        answer,
        llmUsed,
        context,
        intent: requestedIntent || null,
        truncatedCount: trailingIds.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: false, error: '不支持的消息操作' }, { status: 400 });
  } catch (error) {
    console.error('[API] 更新聊天消息失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      action: trackedAction,
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '更新聊天消息失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestStartedAt = Date.now();
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  try {
    sessionId = getClientKey(request);
    const data = await request.json();
    const messageId = typeof data?.messageId === 'string' ? data.messageId : '';
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    requestedIntent = resolveRequestedIntent(request, typeof data?.intent === 'string' ? data.intent : undefined);
    const rows = getScopedChatRows(userId, requestedReportId, requestedEventId, requestedIntent, 100);
    const targetIndex = findMessageIndex(rows, messageId);

    if (!messageId || targetIndex < 0) {
      return NextResponse.json({ success: false, error: '未找到对应消息' }, { status: 404 });
    }

    const target = rows[targetIndex];
    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);
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
      sessionId,
      eventName: 'chat_message_sent',
      page: '/chat',
      meta: {
          action: 'delete',
          reportId: context.report?.id || null,
          eventId: context.focusedEvent?.id || null,
          durationMs: Date.now() - requestStartedAt,
          deletedCount: allIds.length,
          intent: requestedIntent || null,
        },
      });
    trackChatCompleted({
      userId,
      sessionId,
      action: 'delete',
      reportId: context.report?.id || null,
      eventId: context.focusedEvent?.id || null,
      intent: requestedIntent || null,
      durationMs: Date.now() - requestStartedAt,
      deletedCount: allIds.length,
      truncatedCount: trailingIds.length,
    });

    return NextResponse.json({
      success: true,
      deletedCount: allIds.length,
      truncatedCount: trailingIds.length,
      context,
      intent: requestedIntent || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除聊天消息失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      action: 'delete',
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '删除聊天消息失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestStartedAt = Date.now();
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  try {
    sessionId = getClientKey(request);
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request);
    requestedEventId = resolveRequestedEventId(request);
    requestedIntent = resolveRequestedIntent(request);
    const rows = getScopedChatRows(userId, requestedReportId, requestedEventId, requestedIntent, 100);
    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);
    const history = toHistoryPayload(rows);

    trackServerEvent({
      userId,
      sessionId,
      eventName: 'chat_context_loaded',
      page: '/chat',
      meta: {
        reportId: context.report?.id || null,
        eventId: context.focusedEvent?.id || null,
        durationMs: Date.now() - requestStartedAt,
        historyCount: history.length,
        recentEvents: context.recentEvents.length,
        intent: requestedIntent || null,
      },
    });
    trackChatCompleted({
      userId,
      sessionId,
      action: 'load',
      reportId: context.report?.id || null,
      eventId: context.focusedEvent?.id || null,
      intent: requestedIntent || null,
      durationMs: Date.now() - requestStartedAt,
      historyCount: history.length,
    });

    return NextResponse.json({
      success: true,
      userId,
      history,
      context,
      intent: requestedIntent || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取聊天历史失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      action: 'load',
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '获取聊天历史失败' },
      { status: 500 }
    );
  }
}
