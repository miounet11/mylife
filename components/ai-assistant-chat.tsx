'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, Send } from 'lucide-react';
import {
  type ChatContextEvent,
  type ChatCorrectionPrompt,
  type ChatExperienceContext,
  type ChatReportContext,
} from '@/lib/chat-context';
import { trackClientEvent } from '@/lib/analytics-client';
import { trackGoogleAnalyticsEvent } from '@/lib/google-analytics';
import TacitKnowledgeComposer from '@/components/tacit-knowledge-composer';
import {
  areTacitKnowledgeInputsEqual,
  buildTacitKnowledgeSummary,
  cloneTacitKnowledgeInput,
  createEmptyTacitKnowledgeInput,
  hasTacitKnowledgeInput,
} from '@/lib/tacit-knowledge';
import {
  type ChatContextState,
  type ChatMessage,
  buildPreviousUserQuestionMap,
  buildSyntheticOpeningMessage,
  buildSyntheticOpeningMessageId,
  findLatestScopedTacitContext,
  getIntentPreset,
  hasRealChatMessages,
  isSyntheticOpeningMessage,
  isSyntheticOpeningMessageId,
  toMaterialPayload,
} from '@/components/ai-assistant-chat/chat-helpers';
import { ChatOpeningPanel } from '@/components/ai-assistant-chat/chat-opening-panel';
import { ChatMidRail } from '@/components/ai-assistant-chat/chat-mid-rail';
import { ContextCard } from '@/components/ai-assistant-chat/context-card';
import { MaterialEvidenceComposer } from '@/components/ai-assistant-chat/material-evidence-composer';
import { MessageBubble } from '@/components/ai-assistant-chat/message-bubble';
import { useChatMaterials } from '@/components/ai-assistant-chat/use-chat-materials';
import { useChatEvents } from '@/components/ai-assistant-chat/use-chat-events';
import { useChatTacit } from '@/components/ai-assistant-chat/use-chat-tacit';
import { useChatMessageActions } from '@/components/ai-assistant-chat/use-chat-message-actions';
import { useChatScroll } from '@/components/ai-assistant-chat/use-chat-scroll';
import { memoryInputFromChatContext } from '@/lib/chat/memory-narrative';
import {
  buildTeacherOpening,
  slotsFromChatReport,
} from '@/lib/teacher-opening';
import { resolveChatTeacher } from '@/lib/chat-teacher-runtime';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';
import { teacherFromTopicKey, type TeacherTopicChip } from '@/lib/teachers';
import { abortControllerRef, fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

type ChatContextReport = ChatReportContext;

const CHAT_HISTORY_TIMEOUT_MS = 12_000;
const CHAT_REPLY_TIMEOUT_MS = 90_000;
const CHAT_DELETE_TIMEOUT_MS = 10_000;

function isSilentChatAbort(error: unknown) {
  const value = error instanceof Error ? `${error.name} ${error.message}` : `${error || ''}`;
  return /superseded|unmounted/i.test(value);
}

const LAST_REPORT_KEY = 'lk_last_report_id';

function readLastReportId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return `${window.localStorage.getItem(LAST_REPORT_KEY) || ''}`.trim();
  } catch {
    return '';
  }
}

function rememberReportId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    window.localStorage.setItem(LAST_REPORT_KEY, id);
  } catch {
    // ignore
  }
}

// v5-D60: FB Messenger 2017 风消息流 + 底部 sticky 输入区
export default function AIAssistantChat({
  uiLocale,
}: {
  /** From server getRequestLocale / ?lang= / /en/chat */
  uiLocale?: string | null;
} = {}) {
  const searchParams = useSearchParams();
  const urlReportId = searchParams?.get('reportId') || '';
  const eventId = searchParams?.get('eventId') || '';
  const intent = searchParams?.get('intent') || '';
  const source = searchParams?.get('source') || '';
  const ctaStrategyKey = searchParams?.get('ctaStrategyKey') || '';
  const sourceFamily = searchParams?.get('sourceFamily') || '';
  const prefilledQuestion =
    searchParams?.get('question') || searchParams?.get('q') || '';
  const urlTeacher = searchParams?.get('teacher') || searchParams?.get('teacherId') || '';
  const urlTopic = searchParams?.get('topic') || '';
  const urlWindow = searchParams?.get('window') || '';
  /** Default opening product mode; only explicit prefill fills the input. */
  const urlMode = searchParams?.get('mode') || 'opening';
  const resolvedLocale =
    uiLocale || searchParams?.get('lang') || searchParams?.get('locale') || '';
  const enUi = isEnglishUiLocale(resolvedLocale);
  /** Client chrome copy — not LLM answers. */
  const t = (zh: string, en: string) => (enUi ? en : zh);
  const isPrefillMode = urlMode === 'prefill';
  const [rememberedReportId, setRememberedReportId] = useState('');
  const reportId = urlReportId || rememberedReportId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<ChatContextState | null>(null);
  const [bindError, setBindError] = useState('');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [openingTeacherId, setOpeningTeacherId] = useState('');
  const [greetingIndex, setGreetingIndex] = useState(0);
  /** Opening empty: keep composer minimal until user expands tools. */
  const [showOpeningTools, setShowOpeningTools] = useState(false);
  const openingShownKeyRef = useRef('');
  /** Prevents double-inject of client-only first_mes for the same teacher/report key. */
  const openingInjectedKeyRef = useRef('');
  /** After user deletes a synthetic opening, suppress re-inject until key changes. */
  const openingDeletedKeyRef = useRef('');
  const {
    editingMessageId,
    editingContent,
    messageActionKey,
    copiedMessageId,
    previousUserQuestions,
    setEditingMessageId,
    setEditingContent,
    setMessageActionKey,
    setCopiedMessageId,
    setPreviousUserQuestions,
  } = useChatMessageActions();
  const {
    messagesScrollerRef,
    isNearBottom,
    scrollToBottom,
    resetInitialScroll,
  } = useChatScroll({ messages, isTyping, loadingHistory });
  const {
    tacitContext,
    restoredTacitContext,
    showTacitComposer,
    setTacitContext,
    setRestoredTacitContext,
    setShowTacitComposer,
  } = useChatTacit();
  const {
    materials,
    selectedMaterialKind,
    materialNote,
    isAddingMaterial,
    materialError,
    materialFileInputRef,
    setMaterials,
    setMaterialNote,
    setMaterialError,
    setSelectedMaterialKind,
    handleMaterialFileChange,
    handleAddTextMaterial,
    handleRemoveMaterial,
    resetMaterials,
  } = useChatMaterials({ intent, source, ctaStrategyKey, sourceFamily });
  const {
    savingEventKey,
    savedEventKeys,
    handleSaveSuggestedEvent,
    handleSaveMessageEvent,
  } = useChatEvents({ context, reportId, source, setError });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fetchHistoryRef = useRef<(showLoader?: boolean) => Promise<boolean>>(async () => false);
  const mountedRef = useRef(true);
  const historyControllerRef = useRef<AbortController | null>(null);
  const replyControllerRef = useRef<AbortController | null>(null);
  const messageActionControllerRef = useRef<AbortController | null>(null);
  const intentPreset = getIntentPreset(intent);
  const topicTeacherId = urlTopic ? teacherFromTopicKey(urlTopic).id : '';
  const resolvedOpeningTeacherId =
    openingTeacherId ||
    urlTeacher ||
    topicTeacherId ||
    resolveChatTeacher({ teacher: urlTeacher || undefined, intent: intent || undefined }).id;
  const openingWindowHint = urlWindow
    ? enUi
      ? `Current focus: ${urlWindow}`
      : `当前关注：${urlWindow}`
    : urlTopic
      ? enUi
        ? `Current topic: ${urlTopic}`
        : `当前议题：${urlTopic}`
      : undefined;
  const openingView = buildTeacherOpening({
    teacherId: resolvedOpeningTeacherId,
    greetingIndex,
    locale: resolvedLocale,
    slots: context?.report
      ? slotsFromChatReport(
          {
            name: context.report.name,
            dayMaster: context.report.dayMaster,
            pattern: context.report.pattern,
            currentDaYun: context.report.currentDaYun,
            currentLiuNian: context.report.currentLiuNian,
            yongShen: context.report.yongShen,
            bestWindow: context.report.bestWindow,
            riskWindow: context.report.riskWindow,
            topScenario: context.report.topScenario,
          },
          { windowHint: openingWindowHint, locale: resolvedLocale },
        )
      : openingWindowHint
        ? { windowHint: openingWindowHint }
        : undefined,
    // Revisit memory: event validation today; prediction stats when chat API provides them.
    memory: memoryInputFromChatContext(context),
  });
  const scopePayload = {
    reportId: reportId || context?.report?.id || undefined,
    eventId: eventId || context?.focusedEvent?.id || undefined,
    intent: intent || undefined,
    teacher: resolvedOpeningTeacherId || urlTeacher || undefined,
    source: source || undefined,
    ctaStrategyKey: ctaStrategyKey || undefined,
    sourceFamily: sourceFamily || undefined,
  };
  const isPalmistryUploadFlow = intent === 'palmistry-reading';
  const tacitSummary = buildTacitKnowledgeSummary(tacitContext);
  const hasTacitContext = hasTacitKnowledgeInput(tacitContext);
  const canRestoreTacit = hasTacitKnowledgeInput(restoredTacitContext) && !areTacitKnowledgeInputsEqual(restoredTacitContext, tacitContext);

  useEffect(() => {
    mountedRef.current = true;
    const last = readLastReportId();
    if (last && !urlReportId) {
      setRememberedReportId(last);
    }
    return () => {
      mountedRef.current = false;
      abortControllerRef(historyControllerRef, 'chat-unmounted');
      abortControllerRef(replyControllerRef, 'chat-unmounted');
      abortControllerRef(messageActionControllerRef, 'chat-unmounted');
    };
  }, [urlReportId]);

  useEffect(() => {
    if (urlReportId) {
      rememberReportId(urlReportId);
      setRememberedReportId(urlReportId);
    }
  }, [urlReportId]);

  const fetchHistory = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoadingHistory(true);
      }
      setError('');
      setBindError('');
      const queryParams = new URLSearchParams();
      if (reportId) queryParams.set('reportId', reportId);
      if (eventId) queryParams.set('eventId', eventId);
      if (intent) queryParams.set('intent', intent);
      if (source) queryParams.set('source', source);
      if (ctaStrategyKey) queryParams.set('ctaStrategyKey', ctaStrategyKey);
      if (sourceFamily) queryParams.set('sourceFamily', sourceFamily);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const { response, data } = await fetchJsonWithTimeout<any>(`/api/chat${query}`, {
        cache: 'no-store',
        timeoutMs: CHAT_HISTORY_TIMEOUT_MS,
        timeoutReason: 'chat-history-timeout',
        controllerRef: historyControllerRef,
        supersedeReason: 'chat-history-superseded',
      });
      if (!response.ok || !data.success) {
        setError(data.error || t('加载聊天历史失败', 'Failed to load chat history'));
        return false;
      }

      const mapped = (data.history || []).map((item: any) => ({
        id: item.id,
        role: item.role,
        content: item.content || '',
        timestamp: item.timestamp ? new Date(item.timestamp) : null,
        llmUsed: item.role === 'assistant' ? !!item.llmUsed : undefined,
        edited: !!item.edited,
        regenerated: !!item.regenerated,
        reportId: item.reportId || null,
        eventId: item.eventId || null,
        responseToQuestionId: item.responseToQuestionId || null,
        tacitContext: item.tacitContext || null,
        tacitSummary: item.tacitSummary || null,
        materials: Array.isArray(item.materials) ? item.materials : [],
        materialSummary: item.materialSummary || null,
        feedbackRating: item.feedbackRating || null,
        fallbackReason: item.fallbackReason || null,
        efcOk: item.efcOk === undefined || item.efcOk === null ? null : !!item.efcOk,
        efcIssues: Array.isArray(item.efcIssues) ? item.efcIssues : [],
        structureFilled: item.structureFilled != null ? Number(item.structureFilled) : null,
        structureRich:
          item.structureRich === undefined || item.structureRich === null
            ? null
            : !!item.structureRich,
        structureThin:
          item.structureThin === undefined || item.structureThin === null
            ? null
            : !!item.structureThin,
      }));
      const latestTacitContext = findLatestScopedTacitContext(mapped);

      // Real history replaces the timeline; allow opening re-inject only when empty.
      if (mapped.length === 0) {
        openingInjectedKeyRef.current = '';
        openingDeletedKeyRef.current = '';
      } else {
        openingInjectedKeyRef.current = '';
      }
      setMessages(mapped);
      setPreviousUserQuestions(buildPreviousUserQuestionMap(mapped));
      setContext(data.context || null);
      const boundId = `${data.boundReportId || data.context?.report?.id || ''}`.trim();
      if (boundId) {
        rememberReportId(boundId);
        setRememberedReportId(boundId);
        setBindError('');
      } else if (data.contextBindError || (reportId && !data.contextBound)) {
        setBindError(
          data.contextBindError === 'report_not_owned_by_session'
            ? t(
                '报告未能绑定到当前会话（可能换了浏览器或登录态）。请从报告页「顾问开场」重新进入。',
                'Could not bind this report to the current session (browser or login may have changed). Re-enter from the report page consultant opening.',
              )
            : t(
                '尚未绑定结构报告，命盘级追问会缺少日主/用神真值。请从报告页进入或先完成排盘。',
                'No structure report linked. Chart-level questions need day master / favorable-element truth. Open from a report or create a chart first.',
              ),
        );
      } else if (!reportId) {
        setBindError(
          t(
            '尚未绑定结构报告。请从报告页进入追问，避免空谈用神。',
            'No structure report linked. Open follow-ups from a report so we do not invent favorable elements.',
          ),
        );
      }
      setRestoredTacitContext(latestTacitContext);
      setTacitContext(cloneTacitKnowledgeInput(latestTacitContext));
      setShowTacitComposer(hasTacitKnowledgeInput(latestTacitContext));
      return true;
    } catch (historyError) {
      if (!mountedRef.current || isSilentChatAbort(historyError)) {
        return false;
      }
      setError(
        isAbortLikeError(historyError)
          ? t('加载聊天历史等待时间过长，请稍后重试', 'Loading chat history timed out — try again')
          : t('网络异常，加载聊天历史失败', 'Network error — failed to load chat history'),
      );
      return false;
    } finally {
      if (showLoader) {
        setLoadingHistory(false);
      }
    }
  };

  fetchHistoryRef.current = fetchHistory;

  useEffect(() => {
    resetInitialScroll();
    void fetchHistoryRef.current(true);
  }, [reportId, eventId, intent, source, ctaStrategyKey, sourceFamily, resetInitialScroll]);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    // Default / mode=opening：不预填，把舞台留给顾问卡 first_mes
    if (!isPrefillMode) return;

    if (prefilledQuestion && !input.trim() && messages.length === 0) {
      setInput(prefilledQuestion);
      return;
    }

    if (!intentPreset || input.trim() || messages.length > 0 || prefilledQuestion) {
      return;
    }

    // 有老师开场时不再塞 intent 默认长问，避免挡住 starters
    if (openingView.firstMes) return;

    setInput(intentPreset.prefillQuestion);
  }, [
    intentPreset,
    input,
    messages.length,
    prefilledQuestion,
    isPrefillMode,
    openingView.firstMes,
  ]);

  useEffect(() => {
    if (!copiedMessageId) return undefined;
    const timer = window.setTimeout(() => setCopiedMessageId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedMessageId, setCopiedMessageId]);

  const trackFollowupClick = (question: string) => {
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'chat_followup_clicked',
        page: '/chat',
        meta: {
          question,
          reportId: context?.report?.id || reportId || null,
          eventId: context?.focusedEvent?.id || eventId || null,
          intent: intent || null,
          source: source || null,
          ctaStrategyKey: ctaStrategyKey || null,
          sourceFamily: sourceFamily || null,
        },
      }),
    }).catch(() => undefined);
  };


  const sendQuestion = async (rawQuestion: string) => {
    if (isTyping || loadingHistory) return;
    const question = rawQuestion.trim();
    if (!question) return;
    const materialSnapshot = materials;

    const userMessage: ChatMessage = {
      id: `${Date.now()}_user`,
      role: 'user',
      content: question,
      timestamp: null,
      tacitContext: hasTacitContext ? cloneTacitKnowledgeInput(tacitContext) : null,
      tacitSummary: tacitSummary || null,
      materials: materialSnapshot.map(({ dataUrl, ...item }) => item),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    resetMaterials();
    setIsTyping(true);
    setError('');
    setEditingMessageId(null);
    setRestoredTacitContext(cloneTacitKnowledgeInput(tacitContext));
    const palmPhotoCount = materialSnapshot.filter((item) => item.kind === 'palm_photo').length;
    if (isPalmistryUploadFlow && palmPhotoCount > 0) {
      void trackClientEvent({
        eventName: 'tool_image_upload_started',
        page: '/chat',
        meta: {
          phase: 'client_intent',
          confirmed: false,
          toolSlug: 'application-palmistry-reading',
          intent,
          source: source || null,
          ctaStrategyKey: ctaStrategyKey || null,
          sourceFamily: sourceFamily || null,
          materialCount: materialSnapshot.length,
          palmPhotoCount,
          imageMaterialCount: materialSnapshot.filter((item) => item.imageIncluded).length,
        },
      });
    }

    try {
      const { response, data } = await fetchJsonWithTimeout<any>('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          tacitContext,
          materials: toMaterialPayload(materialSnapshot),
          ...scopePayload,
        }),
        timeoutMs: CHAT_REPLY_TIMEOUT_MS,
        timeoutReason: 'chat-reply-timeout',
        controllerRef: replyControllerRef,
        supersedeReason: 'chat-reply-superseded',
      });
      if (!response.ok || !data.success) {
        setMessages((current) => current.filter((item) => item.id !== userMessage.id));
        setMaterials(materialSnapshot);
        setError(data.error || t('AI 回复失败，请稍后重试', 'Reply failed — try again shortly'));
        return;
      }

      await fetchHistory(false);

      const activeReportId = reportId || context?.report?.id || '';

      trackGoogleAnalyticsEvent('chat_completed', {
        report_id: activeReportId,
        event_id: eventId || context?.focusedEvent?.id || '',
        intent: intent || 'default',
        llm_used: !!data.llmUsed,
        material_count: materialSnapshot.length,
      });

      if (activeReportId && source.startsWith('result_')) {
        void trackClientEvent({
          eventName: 'report_to_chat_completed',
          page: '/chat',
          meta: {
            reportId: activeReportId,
            eventId: eventId || context?.focusedEvent?.id || null,
            intent: intent || null,
            source,
            ctaStrategyKey: ctaStrategyKey || null,
            sourceFamily: sourceFamily || null,
            llmUsed: !!data.llmUsed,
            materialCount: materialSnapshot.length,
          },
        });
      }

      if (!data.llmUsed) {
        setError(
          t(
            '当前为简化回答版本，你可以稍后重试，或把问题问得更具体一些。',
            'This is a simplified answer. Retry later, or ask a more specific question.',
          ),
        );
      }
    } catch (replyError) {
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
      setMaterials(materialSnapshot);
      if (!mountedRef.current || isSilentChatAbort(replyError)) {
        return;
      }
      setError(
        isAbortLikeError(replyError)
          ? t('AI 回复等待时间过长，请稍后重试', 'Reply timed out — try again')
          : t('网络异常，AI 回复失败', 'Network error — reply failed'),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (isTyping || loadingHistory) return;

    // Client-only consultant opening — remove locally, never hit the API.
    if (isSyntheticOpeningMessageId(messageId)) {
      if (!window.confirm(t('删除这条开场白？', 'Delete this opening?'))) {
        return;
      }
      openingDeletedKeyRef.current = messageId;
      openingInjectedKeyRef.current = messageId;
      setMessages((current) => current.filter((item) => item.id !== messageId));
      setEditingMessageId(null);
      return;
    }

    if (
      !window.confirm(
        t(
          '删除这条消息后，这条消息之后的对话也会一并移除，确认继续吗？',
          'Delete this message? Everything after it will also be removed.',
        ),
      )
    ) {
      return;
    }
    setMessageActionKey(`delete:${messageId}`);
    setError('');
    setEditingMessageId(null);

    try {
      const { response, data } = await fetchJsonWithTimeout<any>('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          ...scopePayload,
        }),
        timeoutMs: CHAT_DELETE_TIMEOUT_MS,
        timeoutReason: 'chat-delete-timeout',
        controllerRef: messageActionControllerRef,
        supersedeReason: 'chat-message-action-superseded',
      });
      if (!response.ok || !data.success) {
        setError(data.error || t('删除消息失败', 'Failed to delete message'));
        return;
      }
      await fetchHistory(false);
    } catch (deleteError) {
      if (!mountedRef.current || isSilentChatAbort(deleteError)) {
        return;
      }
      setError(
        isAbortLikeError(deleteError)
          ? t('删除消息等待时间过长，请稍后重试', 'Delete timed out — try again')
          : t('网络异常，删除消息失败', 'Network error — failed to delete'),
      );
    } finally {
      setMessageActionKey(null);
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    if (isTyping || loadingHistory) return;
    if (isSyntheticOpeningMessageId(messageId)) {
      // Opening is template text, not an LLM reply.
      return;
    }
    if (
      !window.confirm(
        t(
          '重新生成会覆盖这条回答之后的对话分支，确认继续吗？',
          'Regenerating will replace the conversation after this reply. Continue?',
        ),
      )
    ) {
      return;
    }
    setMessageActionKey(`regenerate:${messageId}`);
    setIsTyping(true);
    setError('');
    setEditingMessageId(null);

    try {
      const { response, data } = await fetchJsonWithTimeout<any>('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          messageId,
          ...scopePayload,
        }),
        timeoutMs: CHAT_REPLY_TIMEOUT_MS,
        timeoutReason: 'chat-regenerate-timeout',
        controllerRef: messageActionControllerRef,
        supersedeReason: 'chat-message-action-superseded',
      });
      if (!response.ok || !data.success) {
        setError(data.error || t('重新生成失败', 'Regenerate failed'));
        return;
      }
      await fetchHistory(false);
      if (!data.llmUsed) {
        setError(t('当前为简化回答版本，你可以稍后再试。', 'This is a simplified answer. Try again later.'));
      }
    } catch (regenerateError) {
      if (!mountedRef.current || isSilentChatAbort(regenerateError)) {
        return;
      }
      setError(
        isAbortLikeError(regenerateError)
          ? t('重新生成等待时间过长，请稍后重试', 'Regenerate timed out — try again')
          : t('网络异常，重新生成失败', 'Network error — regenerate failed'),
      );
    } finally {
      setIsTyping(false);
      setMessageActionKey(null);
    }
  };

  const handleFeedback = async (
    messageId: string,
    rating: 'helpful' | 'not_helpful' | 'empty',
  ) => {
    if (loadingHistory) return;
    setMessageActionKey(`feedback:${messageId}`);
    // Optimistic UI
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedbackRating: rating } : m)),
    );
    try {
      const { response, data } = await fetchJsonWithTimeout<any>('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          messageId,
          rating,
          ...scopePayload,
        }),
        timeoutMs: 15_000,
        timeoutReason: 'chat-feedback-timeout',
        controllerRef: messageActionControllerRef,
        supersedeReason: 'chat-message-action-superseded',
      });
      if (!response.ok || !data.success) {
        setError(data.error || t('反馈提交失败', 'Failed to submit feedback'));
        return;
      }
    } catch (feedbackError) {
      if (!mountedRef.current || isSilentChatAbort(feedbackError)) {
        return;
      }
      setError(
        isAbortLikeError(feedbackError)
          ? t('反馈提交超时，请重试', 'Feedback timed out — try again')
          : t('网络异常，反馈提交失败', 'Network error — feedback failed'),
      );
    } finally {
      setMessageActionKey(null);
    }
  };

  const handleStartEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSubmitEdit = async (messageId: string) => {
    if (isTyping || loadingHistory) return;
    const content = editingContent.trim();
    if (!content) {
      setError(t('问题内容不能为空', 'Question cannot be empty'));
      return;
    }

    if (
      !window.confirm(
        t(
          '重新提交后，这条问题之后的回答会按新问题重算，后续对话分支也会被替换，确认继续吗？',
          'Resubmitting will recompute answers after this question and replace later turns. Continue?',
        ),
      )
    ) {
      return;
    }

    setMessageActionKey(`edit:${messageId}`);
    setIsTyping(true);
    setError('');

    try {
      const { response, data } = await fetchJsonWithTimeout<any>('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          messageId,
          content,
          ...scopePayload,
        }),
        timeoutMs: CHAT_REPLY_TIMEOUT_MS,
        timeoutReason: 'chat-edit-timeout',
        controllerRef: messageActionControllerRef,
        supersedeReason: 'chat-message-action-superseded',
      });
      if (!response.ok || !data.success) {
        setError(data.error || t('修改消息失败', 'Failed to update message'));
        return;
      }
      setEditingMessageId(null);
      setEditingContent('');
      await fetchHistory(false);
      if (!data.llmUsed) {
        setError(t('当前为简化回答版本，你可以稍后再试。', 'This is a simplified answer. Try again later.'));
      }
    } catch (editError) {
      if (!mountedRef.current || isSilentChatAbort(editError)) {
        return;
      }
      setError(
        isAbortLikeError(editError)
          ? t('修改消息等待时间过长，请稍后重试', 'Update timed out — try again')
          : t('网络异常，修改消息失败', 'Network error — update failed'),
      );
    } finally {
      setIsTyping(false);
      setMessageActionKey(null);
    }
  };

  const handlePromptClick = (question: string) => {
    trackFollowupClick(question);
    void sendQuestion(question);
  };

  const handleOpeningStarter = (question: string, meta?: { source?: string }) => {
    const src = meta?.source || 'opening_starter';
    void trackClientEvent({
      eventName: 'chat_starter_clicked',
      page: '/chat',
      meta: {
        teacherId: openingView.teacherId,
        source: src,
        reportId: reportId || context?.report?.id || null,
        questionLength: question.length,
      },
    });
    if (src === 'mid_continuation') {
      void trackClientEvent({
        eventName: 'chat_followup_clicked',
        page: '/chat',
        meta: {
          teacherId: openingView.teacherId,
          source: 'mid_continuation',
          reportId: reportId || context?.report?.id || null,
        },
      });
    }
    trackFollowupClick(question);
    void sendQuestion(question);
  };

  const handleOpeningChip = (chip: TeacherTopicChip) => {
    const nextId = chip.teacherId || chip.id;
    // Allow re-inject / in-place update after a local opening delete.
    openingDeletedKeyRef.current = '';
    setOpeningTeacherId(nextId);
    setGreetingIndex(0);
    void trackClientEvent({
      eventName: 'chat_topic_chip',
      page: '/chat',
      meta: {
        chipId: chip.id,
        teacherId: nextId,
        reportId: reportId || context?.report?.id || null,
      },
    });
  };

  const handleSwapGreeting = () => {
    openingDeletedKeyRef.current = '';
    setGreetingIndex((i) => i + 1);
    void trackClientEvent({
      eventName: 'chat_greeting_swiped',
      page: '/chat',
      meta: {
        teacherId: openingView.teacherId,
        fromIndex: greetingIndex,
        reportId: reportId || context?.report?.id || null,
      },
    });
  };

  // Inject consultant first_mes into the timeline when history is empty.
  // useLayoutEffect: before paint so we don't flash panel firstMes + bubble.
  // Topic chip / greeting changes update the synthetic message in place.
  useLayoutEffect(() => {
    if (loadingHistory) return;
    const firstMes = `${openingView.firstMes || ''}`.trim();
    if (!firstMes) return;

    const boundReportId = reportId || context?.report?.id || 'none';
    const injectKey = buildSyntheticOpeningMessageId(openingView.teacherId, boundReportId);

    setMessages((current) => {
      if (hasRealChatMessages(current)) {
        return current;
      }

      // User deleted this opening; stay empty until teacher/report key changes.
      if (openingDeletedKeyRef.current === injectKey) {
        const withoutOpening = current.filter((m) => !isSyntheticOpeningMessage(m));
        return withoutOpening.length === current.length ? current : withoutOpening;
      }

      const openingMsg = buildSyntheticOpeningMessage({
        teacherId: openingView.teacherId,
        reportId: boundReportId,
        content: firstMes,
      });

      const existingIdx = current.findIndex((m) => isSyntheticOpeningMessage(m));
      if (existingIdx >= 0) {
        const existing = current[existingIdx];
        if (existing.id === openingMsg.id && existing.content === openingMsg.content) {
          openingInjectedKeyRef.current = injectKey;
          return current;
        }
        const next = current.slice();
        next[existingIdx] = { ...existing, ...openingMsg, timestamp: existing.timestamp };
        openingInjectedKeyRef.current = injectKey;
        openingDeletedKeyRef.current = '';
        return next;
      }

      // Only inject into a fully empty timeline (never beside real history).
      if (current.length > 0) {
        return current;
      }

      // Empty timeline → inject once. Concurrent setState both returning [openingMsg]
      // still yields a single bubble (React keeps last updater result).
      openingInjectedKeyRef.current = injectKey;
      openingDeletedKeyRef.current = '';
      return [openingMsg];
    });
  }, [
    loadingHistory,
    openingView.firstMes,
    openingView.teacherId,
    greetingIndex,
    reportId,
    context?.report?.id,
  ]);

  // Fire once on empty timeline with consultant first_mes (report optional).
  useEffect(() => {
    if (loadingHistory || hasRealChatMessages(messages) || !openingView.firstMes) return;
    const bound = context?.report?.id || reportId || 'none';
    const key = `${bound}:${openingView.teacherId}`;
    if (openingShownKeyRef.current === key) return;
    openingShownKeyRef.current = key;
    void trackClientEvent({
      eventName: 'chat_opening_shown',
      page: '/chat',
      meta: {
        teacherId: openingView.teacherId,
        reportId: context?.report?.id || reportId || null,
        hasReport: Boolean(context?.report?.id || reportId),
        hasFirstMes: Boolean(openingView.firstMes),
        starterCount: openingView.starters.length,
        mode: urlMode || 'opening',
        source: source || null,
      },
    });
  }, [
    loadingHistory,
    messages,
    context?.report?.id,
    openingView.teacherId,
    openingView.firstMes,
    openingView.starters.length,
    reportId,
    urlMode,
    source,
  ]);


  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
    } catch {
      setError(t('复制失败，请稍后再试', 'Copy failed — try again'));
    }
  };

  const hasRealMessages = hasRealChatMessages(messages);
  const hasSyntheticOpening = messages.some((m) => isSyntheticOpeningMessage(m));
  /** Chips + starters while timeline has no real turns (empty or opening-only). */
  const showOpeningChrome = !loadingHistory && !hasRealMessages;
  const hideOpeningFirstMes = hasSyntheticOpening;

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col bg-white"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* 消息流区：唯一滚动层 */}
      <div className="relative min-h-0 flex-1 bg-white">
        <div
          ref={messagesScrollerRef}
          className="h-full overflow-y-auto overscroll-contain px-3 py-2.5 md:px-4 md:py-3"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 pb-2">
          {/* Opening stage: skip heavy context card (duplicates first_mes / starters) */}
          {context && !showOpeningChrome ? (
            <ContextCard
              context={context}
              intentPreset={intentPreset}
              onPromptClick={handlePromptClick}
              onSaveSuggestedEvent={handleSaveSuggestedEvent}
              disabled={isTyping || loadingHistory}
              savingEventKey={savingEventKey}
              savedEventKeys={savedEventKeys}
            />
          ) : null}

          {error && (
            <div className="rounded-[3px] border border-[#bd4c42] bg-[#fdecea] px-3 py-2 text-[13px] text-[#bd4c42]">
              {error}
            </div>
          )}

          {/* Only when NOT in opening chrome — opening already has a single unbound CTA */}
          {bindError && !context?.report && !showOpeningChrome ? (
            <div className="rounded-[8px] border border-[#f0c36d]/80 bg-[#fff8e6] px-3 py-2 text-[13px] leading-[1.5] text-[#7a5b00]">
              {bindError}
              <div className="mt-1.5 flex flex-wrap gap-3">
                <a href="/analyze" className="font-semibold text-[#3b5998] hover:underline">
                  {t('去排盘', 'Create chart')}
                </a>
                {reportId ? (
                  <a
                    href={`/result/${encodeURIComponent(reportId)}`}
                    className="font-semibold text-[#3b5998] hover:underline"
                  >
                    {t('打开报告再追问', 'Open report to follow up')}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {loadingHistory && (
            <div className="py-10 text-center text-[13px] text-[#606770]">
              {t('正在载入聊天记录...', 'Loading chat history…')}
            </div>
          )}

          {showOpeningChrome && prefilledQuestion && !isPrefillMode ? (
            <div className="rounded-[3px] border border-[#dddfe2] bg-white px-3 py-2.5">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3b5998]">
                {t('你带来的问题（点一下发送）', 'Your question (tap to send)')}
              </div>
              <button
                type="button"
                disabled={isTyping || loadingHistory}
                onClick={() => handleOpeningStarter(prefilledQuestion, { source: 'legacy_prefill_chip' })}
                className="mt-2 w-full min-h-[44px] touch-manipulation rounded-[6px] border border-[#dddfe2] bg-[#f6f7f9] px-3 py-2 text-left text-[13px] leading-[1.45] text-[#1d2129] transition hover:border-[#3b5998] active:opacity-70 disabled:opacity-50"
              >
                {prefilledQuestion.length > 120
                  ? `${prefilledQuestion.slice(0, 118)}…`
                  : prefilledQuestion}
              </button>
            </div>
          ) : null}

          {showOpeningChrome && context?.report ? (
            <div className="space-y-2">
              <div className="rounded-[8px] border border-[#e7f3ff] bg-[#f0f6ff] px-2.5 py-1.5 text-[11px] leading-[1.45] text-[#365899]">
                <span className="font-semibold">{context.report.name || t('你', 'You')}</span>
                {' · '}
                {t('日主', 'Day master')}{' '}
                <span className="font-mono font-semibold">{context.report.dayMaster || '—'}</span>
                {' · '}
                {t('大运', 'Luck cycle')}{' '}
                <span className="font-mono font-semibold">{context.report.currentDaYun || '—'}</span>
                {(context.report.yongShen || []).length > 0 ? (
                  <>
                    {' · '}
                    {t('用神', 'Favorable')}{' '}
                    <span className="font-semibold">{context.report.yongShen.join(enUi ? ', ' : '、')}</span>
                  </>
                ) : null}
              </div>
              {/* first_mes is injected as MessageBubble below; panel keeps chips + starters */}
              {!hideOpeningFirstMes ? (
                <ChatOpeningPanel
                  opening={openingView}
                  locale={resolvedLocale}
                  disabled={isTyping || loadingHistory}
                  onStarter={handleOpeningStarter}
                  onChip={handleOpeningChip}
                  onSwapGreeting={handleSwapGreeting}
                  hideFirstMes={false}
                />
              ) : null}
            </div>
          ) : null}

          {showOpeningChrome && !context?.report ? (
            <div className="space-y-2">
              {/* Single unbound strip — merges former bindError + yellow bar */}
              <div className="flex items-start justify-between gap-3 rounded-[8px] border border-[#f0c36d]/70 bg-[#fff8e6] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#7a5b00]">
                    {enUi
                      ? 'No report linked · general framework only'
                      : '未绑定报告 · 先用通用框架开聊'}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-[1.45] text-[#9a7b20]">
                    {enUi
                      ? 'No invented day master or favorable elements. Create a chart for personalized rhythm and windows.'
                      : '不编造日主/用神。要个性化节奏与窗口，请先排盘生成结构报告。'}
                  </p>
                </div>
                <a
                  href="/analyze"
                  className="inline-flex shrink-0 items-center rounded-[6px] bg-[#3b5998] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#2d4373]"
                >
                  {enUi ? 'Create chart' : '去排盘'}
                </a>
              </div>
              {!hideOpeningFirstMes ? (
                <ChatOpeningPanel
                  opening={buildTeacherOpening({
                    teacherId: resolvedOpeningTeacherId,
                    greetingIndex,
                    locale: resolvedLocale,
                  })}
                  locale={resolvedLocale}
                  disabled={isTyping || loadingHistory}
                  onStarter={handleOpeningStarter}
                  onChip={handleOpeningChip}
                  onSwapGreeting={handleSwapGreeting}
                  hideFirstMes={false}
                />
              ) : null}
            </div>
          ) : null}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              locale={resolvedLocale}
              previousUserQuestion={previousUserQuestions[message.id] || ''}
              onSaveEvent={handleSaveMessageEvent}
              onDelete={handleDeleteMessage}
              onRegenerate={handleRegenerateMessage}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSubmitEdit={handleSubmitEdit}
              onFeedback={handleFeedback}
              isEditing={editingMessageId === message.id}
              editingContent={editingContent}
              onEditingContentChange={setEditingContent}
              isSaving={savingEventKey === `message:${message.id}`}
              isSaved={savedEventKeys.includes(`message:${message.id}`)}
              isActing={
                messageActionKey === `delete:${message.id}` ||
                messageActionKey === `regenerate:${message.id}` ||
                messageActionKey === `edit:${message.id}` ||
                messageActionKey === `feedback:${message.id}`
              }
              onCopy={handleCopyMessage}
              copied={copiedMessageId === message.id}
            />
          ))}

          {/* After opening bubble: chips + starters (hide firstMes — already in timeline) */}
          {showOpeningChrome && hideOpeningFirstMes ? (
            <ChatOpeningPanel
              opening={openingView}
              locale={resolvedLocale}
              disabled={isTyping || loadingHistory}
              onStarter={handleOpeningStarter}
              onChip={handleOpeningChip}
              onSwapGreeting={handleSwapGreeting}
              hideFirstMes
            />
          ) : null}

          {/* Mid-chat: keep conversation moving without blank input anxiety */}
          {!loadingHistory && hasRealMessages && !isTyping ? (
            <ChatMidRail
              opening={openingView}
              locale={resolvedLocale}
              disabled={isTyping || loadingHistory}
              onStarter={handleOpeningStarter}
              onChip={handleOpeningChip}
            />
          ) : null}

          {isTyping && (
            <div className="flex justify-start">
              <div
                className="rounded-[18px] px-4 py-2 text-[13px] text-[#606770]"
                style={{ background: '#f1f0f0' }}
              >
                {t('正在整理回答...', 'Composing reply…')}
              </div>
            </div>
          )}
          </div>
        </div>

        {!isNearBottom && hasRealMessages ? (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="fb-btn absolute bottom-3 right-3 inline-flex h-8 items-center gap-1 px-2.5 text-[12px] font-semibold text-[#1d2129] shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {t('回到最新消息', 'Latest')}
          </button>
        ) : null}
      </div>

      {/* 底部输入：开场态极简，对话中再展开资料/默会 */}
      <div
        className="shrink-0 border-t border-[#e4e6eb] bg-white px-3 pt-2 md:px-4"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(input);
          }}
          className="mx-auto max-w-2xl space-y-1.5"
        >
          {showOpeningChrome && !showOpeningTools ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowOpeningTools(true)}
                className="text-[11px] font-medium text-[#8a8d91] underline-offset-2 hover:text-[#3b5998] hover:underline"
              >
                {t('添加资料 / 状态', 'Add materials / status')}
              </button>
            </div>
          ) : (
            <>
              <MaterialEvidenceComposer
                materials={materials}
                selectedKind={selectedMaterialKind}
                note={materialNote}
                isAdding={isAddingMaterial}
                error={materialError}
                disabled={isTyping || loadingHistory}
                fileInputRef={materialFileInputRef}
                onKindChange={(kind) => {
                  setSelectedMaterialKind(kind);
                  setMaterialError('');
                }}
                onNoteChange={setMaterialNote}
                onFileChange={handleMaterialFileChange}
                onUploadClick={() => materialFileInputRef.current?.click()}
                onAddText={handleAddTextMaterial}
                onRemove={handleRemoveMaterial}
              />

              <TacitKnowledgeComposer
                value={tacitContext}
                onChange={setTacitContext}
                title={t('说不清也可以先点出来', 'Tap options if it’s hard to put into words')}
                description=""
                collapsedLabel={t('补充这一轮状态', 'Add this turn’s status')}
                emptyHint=""
                summaryLabel={t('本轮默会信息：', 'This turn’s tacit context:')}
                expanded={showTacitComposer}
                onExpandedChange={setShowTacitComposer}
                onReset={() => setTacitContext(createEmptyTacitKnowledgeInput())}
                variant="chat"
                restoreLabel={t('沿用上一轮状态', 'Reuse previous status')}
                onRestore={() => {
                  setTacitContext(cloneTacitKnowledgeInput(restoredTacitContext));
                  setShowTacitComposer(hasTacitKnowledgeInput(restoredTacitContext));
                }}
                canRestore={canRestoreTacit}
              />
            </>
          )}

          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    if (input.trim() && !isTyping && !isAddingMaterial) {
                      void sendQuestion(input);
                    }
                  }
                }}
                placeholder={
                  showOpeningChrome
                    ? t('或直接输入问题…', 'Or type a question…')
                    : (!enUi && intentPreset?.placeholder) ||
                      t(
                        '输入你最关心的一个问题，例如"结合 2026.08 这个窗口，我该不该推进跳槽？"',
                        'Ask one focused question, e.g. “Given the 2026.08 window, should I push a job move?”',
                      )
                }
                rows={showOpeningChrome ? 1 : 2}
                className="fb-input min-h-[40px] w-full resize-none px-3 py-2 text-[14px]"
                disabled={isTyping}
              />
              {hasTacitContext ? (
                <div className="mt-1 px-1">
                  <span className="rounded-[3px] border border-[#dddfe2] bg-[#f5f6f7] px-2 py-0.5 text-xs font-semibold text-[#3b5998]">
                    {t('已带入默会信息', 'Tacit context included')}
                  </span>
                </div>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping || isAddingMaterial}
              aria-label={t('发送', 'Send')}
              className="fb-btn fb-btn-primary inline-flex h-10 shrink-0 items-center gap-1.5 px-4 text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {t('发送', 'Send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
