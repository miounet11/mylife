'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  ImagePlus,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  buildChatEventDraft,
  type ChatContextEvent,
  type ChatCorrectionPrompt,
  type ChatExperienceContext,
  type ChatReportContext,
} from '@/lib/chat-context';
import { listChatIntentPresets } from '@/lib/chat-intent';
import { trackClientEvent } from '@/lib/analytics-client';
import { trackGoogleAnalyticsEvent } from '@/lib/google-analytics';
import ChatMarkdown from '@/components/chat-markdown';
import TacitKnowledgeComposer from '@/components/tacit-knowledge-composer';
import type { ReportActionSuggestion } from '@/lib/report-v2';
import {
  areTacitKnowledgeInputsEqual,
  buildTacitKnowledgeSummary,
  cloneTacitKnowledgeInput,
  createEmptyTacitKnowledgeInput,
  hasTacitKnowledgeInput,
} from '@/lib/tacit-knowledge';
import {
  type ChatContextState,
  type ChatMaterialDisplay,
  type ChatMaterialDraft,
  type ChatMaterialKind,
  type ChatMessage,
  type IntentPreset,
  type SuggestedEventDraft,
  buildPreviousUserQuestionMap,
  buildScopedChatHref,
  defaultWorldYiQuestions,
  findLatestScopedTacitContext,
  formatChatTime,
  formatFileSize,
  getIntentPreset,
  getMaterialOption,
  mapEventTypeLabel,
  mapImpactLabel,
  mapValidationLabel,
  materialKindOptions,
  maxInlineImageBytes,
  maxMaterialCount,
  readFileAsDataUrl,
  toMaterialPayload,
} from '@/components/ai-assistant-chat/chat-helpers';
import {
  CorrectionPromptButton,
  MaterialChip,
  QuickQuestionButton,
} from '@/components/ai-assistant-chat/chat-buttons';
import { ContextCard } from '@/components/ai-assistant-chat/context-card';
import { MaterialEvidenceComposer } from '@/components/ai-assistant-chat/material-evidence-composer';
import { MessageBubble } from '@/components/ai-assistant-chat/message-bubble';
import { useChatMaterials } from '@/components/ai-assistant-chat/use-chat-materials';
import { useChatEvents } from '@/components/ai-assistant-chat/use-chat-events';
import { useChatTacit } from '@/components/ai-assistant-chat/use-chat-tacit';

type ChatContextReport = ChatReportContext;

export default function AIAssistantChat() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId') || '';
  const eventId = searchParams.get('eventId') || '';
  const intent = searchParams.get('intent') || '';
  const source = searchParams.get('source') || '';
  const ctaStrategyKey = searchParams.get('ctaStrategyKey') || '';
  const sourceFamily = searchParams.get('sourceFamily') || '';
  const prefilledQuestion = searchParams.get('question') || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<ChatContextState | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messageActionKey, setMessageActionKey] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [previousUserQuestions, setPreviousUserQuestions] = useState<Record<string, string>>({});
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
  const messagesScrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDoneRef = useRef(false);
  const fetchHistoryRef = useRef<(showLoader?: boolean) => Promise<boolean>>(async () => false);
  const intentPreset = getIntentPreset(intent);
  const scopedIntentLinks = listChatIntentPresets().map((item) => ({
    ...item,
    href: buildScopedChatHref({
      reportId: reportId || context?.report?.id || undefined,
      eventId: eventId || context?.focusedEvent?.id || undefined,
      intent: item.key,
      source: source || undefined,
      ctaStrategyKey: ctaStrategyKey || undefined,
      sourceFamily: sourceFamily || undefined,
    }),
  }));
  const scopePayload = {
    reportId: reportId || context?.report?.id || undefined,
    eventId: eventId || context?.focusedEvent?.id || undefined,
    intent: intent || undefined,
    source: source || undefined,
    ctaStrategyKey: ctaStrategyKey || undefined,
    sourceFamily: sourceFamily || undefined,
  };
  const isPalmistryUploadFlow = intent === 'palmistry-reading';
  const tacitSummary = buildTacitKnowledgeSummary(tacitContext);
  const hasTacitContext = hasTacitKnowledgeInput(tacitContext);
  const canRestoreTacit = hasTacitKnowledgeInput(restoredTacitContext) && !areTacitKnowledgeInputsEqual(restoredTacitContext, tacitContext);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const node = messagesScrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  const fetchHistory = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoadingHistory(true);
      }
      setError('');
      const queryParams = new URLSearchParams();
      if (reportId) queryParams.set('reportId', reportId);
      if (eventId) queryParams.set('eventId', eventId);
      if (intent) queryParams.set('intent', intent);
      if (source) queryParams.set('source', source);
      if (ctaStrategyKey) queryParams.set('ctaStrategyKey', ctaStrategyKey);
      if (sourceFamily) queryParams.set('sourceFamily', sourceFamily);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await fetch(`/api/chat${query}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '加载聊天历史失败');
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
      }));
      const latestTacitContext = findLatestScopedTacitContext(mapped);

      setMessages(mapped);
      setPreviousUserQuestions(buildPreviousUserQuestionMap(mapped));
      setContext(data.context || null);
      setRestoredTacitContext(latestTacitContext);
      setTacitContext(cloneTacitKnowledgeInput(latestTacitContext));
      setShowTacitComposer(hasTacitKnowledgeInput(latestTacitContext));
      return true;
    } catch {
      setError('网络异常，加载聊天历史失败');
      return false;
    } finally {
      if (showLoader) {
        setLoadingHistory(false);
      }
    }
  };

  fetchHistoryRef.current = fetchHistory;

  useEffect(() => {
    initialScrollDoneRef.current = false;
    void fetchHistoryRef.current(true);
  }, [reportId, eventId, intent, source, ctaStrategyKey, sourceFamily]);

  useEffect(() => {
    const node = messagesScrollerRef.current;
    if (!node) return undefined;

    const handleScroll = () => {
      const distanceToBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
      setIsNearBottom(distanceToBottom <= 120);
    };

    handleScroll();
    node.addEventListener('scroll', handleScroll);

    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (loadingHistory) return;
    if (initialScrollDoneRef.current && !isNearBottom && !isTyping) return;
    const behavior: ScrollBehavior = initialScrollDoneRef.current ? 'smooth' : 'auto';
    const timer = window.requestAnimationFrame(() => {
      scrollToBottom(behavior);
      initialScrollDoneRef.current = true;
    });

    return () => window.cancelAnimationFrame(timer);
  }, [messages, isTyping, loadingHistory, isNearBottom]);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    if (prefilledQuestion && !input.trim() && messages.length === 0) {
      setInput(prefilledQuestion);
      return;
    }

    if (!intentPreset || input.trim() || messages.length > 0 || prefilledQuestion) {
      return;
    }

    setInput(intentPreset.prefillQuestion);
  }, [intentPreset, input, messages.length, prefilledQuestion]);

  useEffect(() => {
    if (!copiedMessageId) return undefined;
    const timer = window.setTimeout(() => setCopiedMessageId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedMessageId]);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          tacitContext,
          materials: toMaterialPayload(materialSnapshot),
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessages((current) => current.filter((item) => item.id !== userMessage.id));
        setMaterials(materialSnapshot);
        setError(data.error || 'AI 回复失败，请稍后重试');
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
        setError('当前为简化回答版本，你可以稍后重试，或把问题问得更具体一些。');
      }
    } catch {
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
      setMaterials(materialSnapshot);
      setError('网络异常，AI 回复失败');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (isTyping || loadingHistory) return;
    if (!window.confirm('删除这条消息后，这条消息之后的对话也会一并移除，确认继续吗？')) {
      return;
    }
    setMessageActionKey(`delete:${messageId}`);
    setError('');
    setEditingMessageId(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '删除消息失败');
        return;
      }
      await fetchHistory(false);
    } catch {
      setError('网络异常，删除消息失败');
    } finally {
      setMessageActionKey(null);
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    if (isTyping || loadingHistory) return;
    if (!window.confirm('重新生成会覆盖这条回答之后的对话分支，确认继续吗？')) {
      return;
    }
    setMessageActionKey(`regenerate:${messageId}`);
    setIsTyping(true);
    setError('');
    setEditingMessageId(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          messageId,
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '重新生成失败');
        return;
      }
      await fetchHistory(false);
      if (!data.llmUsed) {
        setError('当前为简化回答版本，你可以稍后再试。');
      }
    } catch {
      setError('网络异常，重新生成失败');
    } finally {
      setIsTyping(false);
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
      setError('问题内容不能为空');
      return;
    }

    if (!window.confirm('重新提交后，这条问题之后的回答会按新问题重算，后续对话分支也会被替换，确认继续吗？')) {
      return;
    }

    setMessageActionKey(`edit:${messageId}`);
    setIsTyping(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          messageId,
          content,
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '修改消息失败');
        return;
      }
      setEditingMessageId(null);
      setEditingContent('');
      await fetchHistory(false);
      if (!data.llmUsed) {
        setError('当前为简化回答版本，你可以稍后再试。');
      }
    } catch {
      setError('网络异常，修改消息失败');
    } finally {
      setIsTyping(false);
      setMessageActionKey(null);
    }
  };

  const handlePromptClick = (question: string) => {
    trackFollowupClick(question);
    void sendQuestion(question);
  };


  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
    } catch {
      setError('复制失败，请稍后再试');
    }
  };

  const quickQuestions = context?.suggestedPrompts?.length
    ? context.suggestedPrompts
    : defaultWorldYiQuestions;
  const visibleQuickQuestions = intentPreset
    ? Array.from(new Set([...intentPreset.questions, ...quickQuestions])).slice(0, 4)
    : quickQuestions;

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-white/60 bg-[color:var(--paper)] p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[color:var(--ink)]">世界易结构追问器</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {reportId || context?.report?.id ? (
              <span className="rounded-md bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
                已绑定报告
              </span>
            ) : null}
            {eventId || context?.focusedEvent?.id ? (
              <span className="rounded-md bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
                已绑定事件
              </span>
            ) : null}
            <span className="rounded-md bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
              {intentPreset ? `专项 ${intentPreset.entryLabel}` : '自由结构追问'}
            </span>
          </div>
        </div>

        <details className="mt-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--paper)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
            切换专项
            <span className="text-[color:var(--accent-strong)]">{intentPreset?.entryLabel || '自由结构追问'}</span>
          </summary>
          <div className="grid gap-2 border-t border-[color:var(--line)] p-3 sm:grid-cols-2">
            {scopedIntentLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition hover:-translate-y-0.5 ${
                  item.key === intent ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent-strong)]' : 'bg-[color:var(--bg-elevated)] text-[color:var(--ink)]'
                }`}
              >
                <div>{item.entryLabel}</div>
              </Link>
            ))}
          </div>
        </details>
      </div>

      <div className="relative flex-1">
        <div ref={messagesScrollerRef} className="flex h-full flex-col space-y-3 overflow-y-auto p-4 md:p-5">
          {context && (
            <ContextCard
              context={context}
              intentPreset={intentPreset}
              onPromptClick={handlePromptClick}
              onSaveSuggestedEvent={handleSaveSuggestedEvent}
              disabled={isTyping || loadingHistory}
              savingEventKey={savingEventKey}
              savedEventKeys={savedEventKeys}
            />
          )}

          {error && (
            <div className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-4 py-3 text-sm text-[color:var(--signal-strong)]">
              {error}
            </div>
          )}

          {loadingHistory && <div className="py-10 text-center text-sm text-[color:var(--muted)]">正在载入聊天记录...</div>}

          {/* v5-B3 (2026-05-08) 进入聊天页第一条系统提示
              当用户从结果页带 reportId 进入、还没说话时，明确告诉他：
              这份报告是谁的、当前阶段是什么、可以问什么 */}
          {!loadingHistory && messages.length === 0 && context?.report ? (
            <div className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--brand-strong)]">
                    系统已带上你的报告
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">
                    这次对话是围绕 <span className="font-bold">{context.report.name || '你'}</span> 的报告展开的：
                    日主 <span className="font-mono font-bold">{context.report.dayMaster}</span>，
                    格局 <span className="font-mono font-bold">{context.report.pattern}</span>，
                    当前大运 <span className="font-mono font-bold">{context.report.currentDaYun}</span>。
                    我已经把报告里的结构、阶段、五行、十神、近期窗口都加载到了上下文里——你可以直接问具体问题，不用再交代背景。
                  </p>
                  {visibleQuickQuestions.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {visibleQuickQuestions.slice(0, 4).map((question) => (
                        <QuickQuestionButton
                          key={`hint-${question}`}
                          question={question}
                          onClick={() => handlePromptClick(question)}
                          disabled={isTyping || loadingHistory}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {!loadingHistory && messages.length === 0 && !context && (
            <div className="space-y-4 rounded-[var(--radius)] bg-[color:var(--paper)] p-4 md:p-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3 w-3" />
                  推荐追问
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {visibleQuickQuestions.slice(0, 2).map((question) => (
                  <QuickQuestionButton
                    key={question}
                    question={question}
                    onClick={() => handlePromptClick(question)}
                    disabled={isTyping || loadingHistory}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              previousUserQuestion={previousUserQuestions[message.id] || ''}
              onSaveEvent={handleSaveMessageEvent}
              onDelete={handleDeleteMessage}
              onRegenerate={handleRegenerateMessage}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSubmitEdit={handleSubmitEdit}
              isEditing={editingMessageId === message.id}
              editingContent={editingContent}
              onEditingContentChange={setEditingContent}
              isSaving={savingEventKey === `message:${message.id}`}
              isSaved={savedEventKeys.includes(`message:${message.id}`)}
              isActing={messageActionKey === `delete:${message.id}` || messageActionKey === `regenerate:${message.id}` || messageActionKey === `edit:${message.id}`}
              onCopy={handleCopyMessage}
              copied={copiedMessageId === message.id}
            />
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-3 text-sm text-[color:var(--muted)]">正在整理回答，请稍候...</div>
            </div>
          )}
        </div>

        {!isNearBottom && messages.length > 0 ? (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-4 right-4 inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] shadow-[var(--shadow-card)] transition hover:border-[color:var(--brand)]"
          >
            <ArrowDown className="h-4 w-4" />
            回到最新消息
          </button>
        ) : null}
      </div>

      <div className="border-t border-white/60 bg-[color:var(--paper)] p-4 md:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(input);
          }}
          className="space-y-3"
        >
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
            title="说不清也可以先点出来"
            description=""
            collapsedLabel="补充这一轮状态"
            emptyHint=""
            summaryLabel="本轮默会信息："
            expanded={showTacitComposer}
            onExpandedChange={setShowTacitComposer}
            onReset={() => setTacitContext(createEmptyTacitKnowledgeInput())}
            variant="chat"
            restoreLabel="沿用上一轮状态"
            onRestore={() => {
              setTacitContext(cloneTacitKnowledgeInput(restoredTacitContext));
              setShowTacitComposer(hasTacitKnowledgeInput(restoredTacitContext));
            }}
            canRestore={canRestoreTacit}
          />

          <div className="flex items-end gap-3">
            <div className="flex-1">
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
                placeholder={intentPreset?.placeholder || '输入你最关心的一个问题，例如“结合 2026.08 这个窗口，我该不该推进跳槽？”'}
                rows={2}
                className="min-h-[56px] w-full resize-none rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
                disabled={isTyping}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-xs text-[color:var(--muted)]">
                {hasTacitContext ? (
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 font-semibold text-[color:var(--accent-strong)]">
                    已带入默会信息
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping || isAddingMaterial}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

