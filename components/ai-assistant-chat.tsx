'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Bot, CalendarClock, Check, CheckCircle2, Copy, Pencil, RotateCcw, Send, Sparkles, Trash2, X } from 'lucide-react';
import { buildChatEventDraft } from '@/lib/chat-context';
import { getChatIntentPreset } from '@/lib/chat-intent';
import ChatMarkdown from '@/components/chat-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  llmUsed?: boolean;
  edited?: boolean;
  regenerated?: boolean;
  reportId?: string | null;
  eventId?: string | null;
  responseToQuestionId?: string | null;
}

interface ChatContextReport {
  id: string;
  name: string;
  dayMaster: string;
  pattern: string;
  currentDaYun: string;
  currentLiuNian: string;
  yongShen: string[];
  topScenario: string;
  bestWindow: string;
  riskWindow: string;
  confidenceLevel: string;
}

interface ChatContextEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  impact: 'positive' | 'negative' | 'neutral';
  validationStatus: 'accurate' | 'drift' | 'pending';
  reportId?: string;
  reason?: string;
  notes?: string;
}

interface ChatCorrectionPrompt {
  key: string;
  question: string;
  helper: string;
}

interface SuggestedEventDraft {
  key: string;
  title: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
  date: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  reason: string;
  reminderAdvanceDays: number;
  source: 'scenario' | 'window';
}

interface ChatContextState {
  summary: string;
  focusAreas: string[];
  suggestedPrompts: string[];
  correctionPrompts: ChatCorrectionPrompt[];
  recentEvents: ChatContextEvent[];
  suggestedEventDrafts: SuggestedEventDraft[];
  validationSummary?: {
    accurateCount: number;
    driftCount: number;
    pendingCount: number;
    headline: string;
  };
  focusedEvent?: ChatContextEvent;
  report?: ChatContextReport;
}

interface QuickQuestionButtonProps {
  question: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function AIAssistantChat() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId') || '';
  const eventId = searchParams.get('eventId') || '';
  const intent = searchParams.get('intent') || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<ChatContextState | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [savingEventKey, setSavingEventKey] = useState<string | null>(null);
  const [savedEventKeys, setSavedEventKeys] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messageActionKey, setMessageActionKey] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesScrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDoneRef = useRef(false);
  const fetchHistoryRef = useRef<(showLoader?: boolean) => Promise<boolean>>(async () => false);
  const intentPreset = getIntentPreset(intent);
  const scopePayload = {
    reportId: reportId || context?.report?.id || undefined,
    eventId: eventId || context?.focusedEvent?.id || undefined,
    intent: intent || undefined,
  };

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
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        llmUsed: item.role === 'assistant' ? !!item.llmUsed : undefined,
        edited: !!item.edited,
        regenerated: !!item.regenerated,
        reportId: item.reportId || null,
        eventId: item.eventId || null,
        responseToQuestionId: item.responseToQuestionId || null,
      }));

      setMessages(mapped);
      setContext(data.context || null);
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
  }, [reportId, eventId]);

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
    if (!intentPreset || input.trim() || messages.length > 0) {
      return;
    }

    setInput(intentPreset.prefillQuestion);
  }, [intentPreset, input, messages.length]);

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
        },
      }),
    }).catch(() => undefined);
  };

  const saveEventPayload = async (eventKey: string, payload: Record<string, unknown>) => {
    if (savingEventKey) return;
    setSavingEventKey(eventKey);
    setError('');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '保存事件失败');
        return;
      }
      setSavedEventKeys((current) => [...current, eventKey]);
    } catch {
      setError('网络异常，保存事件失败');
    } finally {
      setSavingEventKey(null);
    }
  };

  const sendQuestion = async (rawQuestion: string) => {
    if (isTyping || loadingHistory) return;
    const question = rawQuestion.trim();
    if (!question) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}_user`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsTyping(true);
    setError('');
    setEditingMessageId(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessages((current) => current.filter((item) => item.id !== userMessage.id));
        setError(data.error || 'AI 回复失败，请稍后重试');
        return;
      }

      await fetchHistory(false);

      if (!data.llmUsed) {
        setError('当前为简化回答版本，你可以稍后重试，或把问题问得更具体一些。');
      }
    } catch {
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
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

  const handleSaveSuggestedEvent = (item: SuggestedEventDraft) => {
    void saveEventPayload(`suggestion:${item.key}`, {
      type: item.type,
      title: item.title,
      date: item.date,
      description: item.description,
      impact: item.impact,
      reminderEnabled: true,
      reminderAdvanceDays: item.reminderAdvanceDays,
      reminderMethod: 'app',
      source: 'chat_message',
      page: '/chat',
      fortuneAnalysis: {
        source: 'chat_message',
        reportId: context?.report?.id || reportId || undefined,
        suggestionKey: item.key,
        reason: item.reason,
        title: item.title,
      },
      followUpAdvice: {
        shortTerm: item.reason,
        longTerm: '事件发生后回到聊天页继续复盘，校验这次判断与现实偏差。',
      },
    });
  };

  const handleSaveMessageEvent = (question: string, answer: string, key: string) => {
    const draft = buildChatEventDraft({
      question,
      answer,
      context,
    });

    void saveEventPayload(`message:${key}`, {
      ...draft,
      reminderEnabled: true,
      reminderMethod: 'app',
      source: 'chat_message',
      page: '/chat',
    });
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
    : [
        '我最近事业运如何？',
        '接下来三个月财运怎么样？',
        '我该如何判断一段关系是否值得推进？',
        '今年最需要规避的风险是什么？',
      ];
  const visibleQuickQuestions = intentPreset
    ? Array.from(new Set([...intentPreset.questions, ...quickQuestions])).slice(0, 4)
    : quickQuestions;

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-white/60 bg-white/70 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-[color:var(--ink)]">AI 命理助手</h2>
            <p className="text-sm text-[color:var(--muted)]">
              {intentPreset ? `当前已进入${intentPreset.entryLabel}，建议直接围绕一件具体事情发问。` : '看完报告后继续问，把重点问题说清楚。'}
            </p>
          </div>
        </div>

        {intentPreset ? (
          <div className="mt-4 rounded-[1.4rem] border border-[color:var(--line)] bg-white/82 px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">
            <span className="font-semibold text-[color:var(--accent-strong)]">{intentPreset.entryLabel}</span>
            {` · ${intentPreset.helper}`}
          </div>
        ) : null}
      </div>

      <div className="relative flex-1">
        <div ref={messagesScrollerRef} className="flex h-full flex-col space-y-4 overflow-y-auto p-5">
          {context && (
            <ContextCard
              context={context}
              onPromptClick={handlePromptClick}
              onSaveSuggestedEvent={handleSaveSuggestedEvent}
              disabled={isTyping || loadingHistory}
              savingEventKey={savingEventKey}
              savedEventKeys={savedEventKeys}
            />
          )}

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {loadingHistory && <div className="py-10 text-center text-sm text-[color:var(--muted)]">正在载入聊天记录...</div>}

          {!loadingHistory && messages.length === 0 && (
            <div className="space-y-6 rounded-[1.75rem] bg-white/75 p-6">
              <div>
                <div className="section-label">
                  <Sparkles className="h-3.5 w-3.5" />
                  推荐追问
                </div>
                <h3 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">先问一个最具体的问题</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  用报告里的一个板块、一个月份或一个现实事件作为锚点，回答会明显更有用。
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {visibleQuickQuestions.map((question) => (
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

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              previousUserQuestion={findPreviousUserQuestion(messages, index)}
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
              <div className="rounded-[1.5rem] bg-white px-4 py-3 text-sm text-[color:var(--muted)]">正在整理回答，请稍候...</div>
            </div>
          )}
        </div>

        {!isNearBottom && messages.length > 0 ? (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/95 px-4 py-2 text-sm font-semibold text-[color:var(--ink)] shadow-[0_18px_36px_rgba(23,32,51,0.14)]"
          >
            <ArrowDown className="h-4 w-4" />
            回到最新消息
          </button>
        ) : null}
      </div>

      <div className="border-t border-white/60 bg-white/70 p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(input);
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (input.trim() && !isTyping) {
                    void sendQuestion(input);
                  }
                }
              }}
              placeholder={intentPreset?.placeholder || '输入你最关心的一个问题，例如“结合 2026.08 这个窗口，我该不该推进跳槽？”'}
              rows={2}
              className="min-h-[56px] w-full resize-none rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
              disabled={isTyping}
            />
            <div className="mt-2 px-1 text-xs text-[color:var(--muted)]">`Enter` 发送，`Shift + Enter` 换行。建议一次只问一个具体问题。</div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ContextCard({
  context,
  onPromptClick,
  onSaveSuggestedEvent,
  disabled,
  savingEventKey,
  savedEventKeys,
}: {
  context: ChatContextState;
  onPromptClick: (question: string) => void;
  onSaveSuggestedEvent: (item: SuggestedEventDraft) => void;
  disabled: boolean;
  savingEventKey: string | null;
  savedEventKeys: string[];
}) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--line)] bg-white/78 p-5 shadow-[0_18px_36px_rgba(23,32,51,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            这次咨询
          </div>
          <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">
            {context.report ? `已锚定报告 ${context.report.pattern} / ${context.report.currentDaYun}` : '当前对话未绑定具体报告'}
          </h3>
          <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            {context.report
              ? `日主 ${context.report.dayMaster}，当前重点是 ${context.report.topScenario}，最近优先窗口 ${context.report.bestWindow}。`
              : '你可以直接提问，我们会结合最近记录的内容继续回答。'}
          </p>
        </div>
        <Link
          href={context.report ? `/result/${context.report.id}` : '/events'}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
        >
          {context.report ? '返回报告' : '查看事件'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {context.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {context.focusAreas.map((item) => (
            <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)]">
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="rounded-[1.5rem] bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            <CalendarClock className="h-4 w-4" />
            最近事件
          </div>
          <div className="mt-3 grid gap-3">
            {context.recentEvents.length > 0 ? (
              context.recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl bg-white px-4 py-3">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
                  <div className="mt-1 text-xs text-[color:var(--muted)]">
                    {event.date} · {mapEventTypeLabel(event.type)} · {mapImpactLabel(event.impact)}
                  </div>
                  <div className="mt-2 text-xs font-medium text-[color:var(--muted)]">{mapValidationLabel(event.validationStatus)}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[color:var(--muted)]">
                还没有事件记录。看完聊天建议后，可以把关键节点存成事件持续复盘。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">推荐追问</div>
          <div className="mt-3 grid gap-3">
            {(intentPreset ? Array.from(new Set([...intentPreset.questions, ...context.suggestedPrompts])) : context.suggestedPrompts).slice(0, 3).map((question) => (
              <QuickQuestionButton
                key={question}
                question={question}
                onClick={() => onPromptClick(question)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>

      {context.validationSummary?.headline && (
        <div className="rounded-[1.5rem] bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">最近反馈</div>
          <div className="mt-2 text-sm leading-7 text-[color:var(--ink)]">{context.validationSummary.headline}</div>
        </div>
      )}

      {context.focusedEvent && (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">本次重点问题</div>
          <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{context.focusedEvent.title}</div>
          <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            {context.focusedEvent.reason || context.focusedEvent.notes || '当前对话应优先围绕这条已出现偏差的事件做纠偏分析。'}
          </div>
        </div>
      )}

      {context.correctionPrompts.length > 0 && (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">建议先问</div>
          <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            先把问题拆清楚，再继续追问，答案会更有针对性。
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {context.correctionPrompts.map((item) => (
              <CorrectionPromptButton
                key={item.key}
                question={item.question}
                helper={item.helper}
                onClick={() => onPromptClick(item.question)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {context.suggestedEventDrafts.length > 0 && (
        <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[rgba(178,149,93,0.08)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">可以顺手记下的提醒</div>
          <div className="mt-3 grid gap-3">
            {context.suggestedEventDrafts.slice(0, 2).map((item) => {
              const eventKey = `suggestion:${item.key}`;
              const isSaved = savedEventKeys.includes(eventKey);

              return (
                <div key={item.key} className="rounded-2xl bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {item.date} · {mapEventTypeLabel(item.type)} · {mapImpactLabel(item.impact)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSaveSuggestedEvent(item)}
                      disabled={disabled || isSaved || savingEventKey === eventKey}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                      {isSaved ? '已保存' : savingEventKey === eventKey ? '保存中...' : '记下来'}
                    </button>
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.reason}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type IntentPreset = {
  entryLabel: string;
  helper: string;
  placeholder: string;
  prefillQuestion: string;
  questions: string[];
};

function getIntentPreset(intent: string): IntentPreset | null {
  const preset = getChatIntentPreset(intent);
  if (!preset) {
    return null;
  }

  return {
    entryLabel: preset.entryLabel,
    helper: preset.helper,
    placeholder: preset.placeholder,
    prefillQuestion: preset.prefillQuestion,
    questions: preset.questions,
  };
}

function MessageBubble({
  message,
  previousUserQuestion,
  onSaveEvent,
  onDelete,
  onRegenerate,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  isEditing,
  editingContent,
  onEditingContentChange,
  isSaving,
  isSaved,
  isActing,
  onCopy,
  copied,
}: {
  message: ChatMessage;
  previousUserQuestion: string;
  onSaveEvent: (question: string, answer: string, key: string) => void;
  onDelete: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onStartEdit: (message: ChatMessage) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (messageId: string) => void;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (value: string) => void;
  isSaving: boolean;
  isSaved: boolean;
  isActing: boolean;
  onCopy: (messageId: string, content: string) => void;
  copied: boolean;
}) {
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl rounded-[1.75rem] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-4 text-white shadow-[0_14px_32px_rgba(178,149,93,0.2)]">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editingContent}
                onChange={(event) => onEditingContentChange(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/60"
                placeholder="修改你的问题"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-white/70">修改后会基于这条问题重新生成后续回答。</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white/88"
                  >
                    <X className="h-3.5 w-3.5" />
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmitEdit(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isActing ? '提交中...' : '重新提交'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-7">{message.content}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/75">
                <div className="flex items-center gap-2">
                  <span>{time}</span>
                  {message.edited ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold text-white/88">已编辑</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStartEdit(message)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white/88"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white/88 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isActing ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl rounded-[1.75rem] border border-[color:var(--line)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(23,32,51,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[color:var(--ink)]">命理回复</span>
          {message.llmUsed === false && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">兜底模式</span>
          )}
          {message.regenerated ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">已重生成</span>
          ) : null}
          {message.edited ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">源问题已编辑</span>
          ) : null}
        </div>
        <div className="mt-3">
          <ChatMarkdown content={message.content} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
          <span>{message.llmUsed ? '结合当前报告与对话内容生成' : '当前为简化回答'}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onRegenerate(message.id)}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              {isActing ? '处理中...' : '重新生成'}
            </button>
            {previousUserQuestion && (
              <button
                type="button"
                onClick={() => onSaveEvent(previousUserQuestion, message.content, message.id)}
                disabled={isSaving || isSaved}
                className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                {isSaved ? '已记下' : isSaving ? '保存中...' : '记为提醒'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onCopy(message.id, message.content)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 font-semibold text-[color:var(--ink)]"
            >
              <Copy className="h-4 w-4" />
              {copied ? '已复制' : '复制'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
            <span>{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickQuestionButton({ question, onClick, disabled = false }: QuickQuestionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-4 text-left text-sm leading-7 text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {question}
    </button>
  );
}

function CorrectionPromptButton({
  question,
  helper,
  onClick,
  disabled = false,
}: {
  question: string;
  helper: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[1.5rem] border border-amber-200 bg-white px-4 py-4 text-left transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-sm font-semibold leading-7 text-[color:var(--ink)]">{question}</div>
      <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{helper}</div>
    </button>
  );
}

function findPreviousUserQuestion(messages: ChatMessage[], currentIndex: number) {
  for (let index = currentIndex - 1; index >= 0; index--) {
    if (messages[index]?.role === 'user') {
      return messages[index].content;
    }
  }

  return '';
}

function mapEventTypeLabel(type: string) {
  switch (type) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '关系';
    case 'health':
      return '健康';
    case 'family':
      return '家庭';
    default:
      return '其他';
  }
}

function mapImpactLabel(impact: ChatContextEvent['impact']) {
  switch (impact) {
    case 'positive':
      return '积极';
    case 'negative':
      return '风险';
    default:
      return '中性';
  }
}

function mapValidationLabel(status: ChatContextEvent['validationStatus']) {
  switch (status) {
    case 'accurate':
      return '已验证准确';
    case 'drift':
      return '已记录偏差';
    default:
      return '待验证';
  }
}
