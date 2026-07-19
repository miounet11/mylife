'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';
import { buildSceneFollowupSuggestions } from '@/lib/chat-entry';
import ChatReportGate from '@/components/chat/chat-report-gate';
import { trackFunnel } from '@/components/funnel-tracker';
import {
  buildReportAnchoredAnswer,
  extractChatContextFromSnapshot,
  type ChatMessage,
  type ReportChatContext,
} from '@/lib/chat-report-anchor';
import { trackProductEvent } from '@/lib/product-analytics';
import {
  buildTeacherChatHref,
  getTeacher,
  listReportTeachers,
  type TeacherId,
} from '@/lib/teachers';
import ProgressiveProfilePrompt from '@/components/chat/progressive-profile-prompt';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

function msgId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function ChatWorkspace() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId') || '';
  const intent = searchParams.get('intent') || '';
  const source = searchParams.get('source') || 'chat_workspace';
  const teacherIdParam = searchParams.get('teacher') || '';
  const city = searchParams.get('city') || '';
  const initialQuestion = searchParams.get('q') || searchParams.get('question') || '';
  const locale = searchParams.get('lang') || searchParams.get('locale') || '';
  const en = isEnglishUiLocale(locale);
  const t = (zh: string, enText: string) => (en ? enText : zh);
  const teacher = getTeacher(teacherIdParam || intent || 'overview');

  const [question, setQuestion] = useState(initialQuestion);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState<ReportChatContext | null>(null);
  const [ctxNote, setCtxNote] = useState('');
  const [autoAsked, setAutoAsked] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const ctxRef = useRef<ReportChatContext | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);

  const sceneIntent =
    intent === 'career' || intent === 'wealth' || intent === 'marriage' || intent === 'health'
      ? intent
      : 'general';

  const suggestions =
    teacher.starters.length > 0
      ? teacher.starters
      : [
          ...buildSceneFollowupSuggestions(sceneIntent).slice(0, 3),
          t(
            '基于我的最新报告，现在最该优先推进的一件事是什么？',
            'From my latest report, what should I prioritize first right now?',
          ),
        ];

  const analyzeHref = `/analyze?source=chat_workspace&intent=${encodeURIComponent(intent || 'career')}`;

  async function submit(textRaw: string) {
    const text = textRaw.trim();
    if (!text || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: ChatMessage = { id: msgId(), role: 'user', content: text, at: Date.now() };
    const nextMessages = [...messagesRef.current, userMsg];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setQuestion('');
    trackProductEvent('chat_message_sent', {
      reportId: reportId || '',
      turn: nextMessages.filter((m) => m.role === 'user').length,
      intent: intent || teacher.id,
      teacherId: teacher.id,
    });

    // 渐进建档：从本句尽量抽取资料（不阻塞对话）
    void fetch('/api/profile/progressive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: reportId || undefined,
        teacher: teacher.id,
        message: text,
      }),
    }).catch(() => {});

    try {
      let answer = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: reportId || undefined,
            question: text,
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            intent: intent || teacher.scene || teacher.id,
            teacher: teacher.id,
            city: city || undefined,
            source: source || 'chat_workspace',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          answer =
            data.answer ||
            data.reply ||
            data.message ||
            data.content ||
            (typeof data.data === 'string' ? data.data : '') ||
            '';
        }
      } catch {
        // no chat API
      }

      if (!answer) {
        // 多轮：把当前用户消息之前的历史传入，供承接上一轮主题
        const historyBeforeUser = nextMessages.slice(0, -1);
        const base = buildReportAnchoredAnswer(
          text,
          ctxRef.current || (reportId ? { reportId } : null),
          historyBeforeUser
        );
        // 本地兜底：以老师身份收束，不暴露内部体系
        answer = `【${teacher.name}】\n${base}`;
      }

      const withAnswer: ChatMessage[] = [
        ...messagesRef.current,
        { id: msgId(), role: 'assistant', content: answer, at: Date.now() },
      ];
      messagesRef.current = withAnswer;
      setMessages(withAnswer);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!reportId) {
      setCtx(null);
      setCtxNote('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const endpoints = [
          `/api/report/${encodeURIComponent(reportId)}`,
          `/api/fortune/${encodeURIComponent(reportId)}`,
        ];
        let snapshot: unknown = null;
        for (const url of endpoints) {
          try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const data = await res.json();
            if (data?.success && (data.report || data.result || data.analysis)) {
              snapshot = data.report?.snapshot ?? data.report ?? data.result ?? data;
              break;
            }
          } catch {
            // try next
          }
        }
        if (cancelled) return;
        if (snapshot) {
          if (typeof snapshot === 'string') {
            try {
              snapshot = JSON.parse(snapshot);
            } catch {
              // keep
            }
          }
          const next = extractChatContextFromSnapshot(reportId, snapshot);
          setCtx(next);
          trackProductEvent('chat_anchor_loaded', {
            reportId,
            hasDayMaster: Boolean(next.dayMaster),
            hasDayun: Boolean(next.currentDayun),
          });
          setCtxNote(
            next.dayMaster
              ? en
                ? `Anchored report truth: day master ${next.dayMaster}${next.yongShen?.length ? ` · favorable ${next.yongShen.join(', ')}` : ''}`
                : `已锚定报告真值：日主 ${next.dayMaster}${next.yongShen?.length ? ` · 用神 ${next.yongShen.join('、')}` : ''}`
              : en
                ? `Linked report ${reportId.slice(0, 10)}… (partial fields missing; answering with a conservative structure)`
                : `已关联报告 ${reportId.slice(0, 10)}…（部分字段未落库，将用保守结构回答）`,
          );
        } else {
          setCtx({ reportId });
          setCtxNote(
            en
              ? `Linked report ${reportId.slice(0, 10)}… — structure follow-ups by report ID.`
              : `已关联报告 ${reportId.slice(0, 10)}…，将按报告 ID 做结构追问。`,
          );
        }
      } catch {
        if (!cancelled) {
          setCtx({ reportId });
          setCtxNote(
            en
              ? 'Report context fetch limited; still anchoring answers by reportId.'
              : '报告上下文拉取受限，仍将按 reportId 做锚定回答。',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, en]);

  useEffect(() => {
    if (!initialQuestion.trim() || !reportId || autoAsked || loadingRef.current) return;
    if (ctx || ctxNote) {
      setAutoAsked(true);
      void submit(initialQuestion.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, initialQuestion, ctx, ctxNote, autoAsked]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-medium text-[color:var(--ink-5)]">
              {t('当前老师', 'Current guide')}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold text-[color:var(--ink-1)]">{teacher.name}</div>
            <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{teacher.tagline}</p>
            <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">{teacher.boundary}</p>
          </div>
          <Link
            href={reportId ? `/teachers?reportId=${encodeURIComponent(reportId)}` : '/teachers'}
            className="shrink-0 text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
          >
            {t('换老师', 'Switch guide')}
          </Link>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-[color:var(--hairline)] pt-2.5">
          {listReportTeachers().map((t) => {
            const active = t.id === teacher.id;
            const href = buildTeacherChatHref({
              teacherId: t.id as TeacherId,
              reportId: reportId || undefined,
              city: city || undefined,
              question: t.starters[0],
              source: source || 'chat_switch',
            });
            return (
              <Link
                key={t.id}
                href={href}
                className={`text-[12px] no-underline hover:underline ${
                  active
                    ? 'font-medium text-[color:var(--ink-1)]'
                    : 'text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)]'
                }`}
              >
                {t.name.replace(/老师$/, '')}
              </Link>
            );
          })}
        </div>
      </div>

      <ChatReportGate
        reportId={reportId}
        intent={intent || teacher.scene || 'career'}
        source={source}
        variant="card"
        locale={locale}
      />

      <ProgressiveProfilePrompt
        reportId={reportId || undefined}
        teacherId={teacher.id}
        locale={locale}
        onApplyAnswer={(text) => setQuestion(text)}
      />

      {reportId ? (
        <AlertBanner tone="info" className="text-xs">
          {t('已关联报告', 'Linked report')}{' '}
          <span className="font-mono">{reportId.slice(0, 8)}…</span>
          {en ? '.' : '。'}
          <Link href={`/result/${reportId}`} className="ml-1 font-semibold hover:no-underline">
            {t('打开报告', 'Open report')}
          </Link>
          {city ? (
            <span className="ml-1">
              · {t('城市', 'City')} {city}
            </span>
          ) : null}
          {ctxNote ? <span className="mt-1 block text-[11px] opacity-90">{ctxNote}</span> : null}
        </AlertBanner>
      ) : null}

      {messages.length > 0 ? (
        <section className="space-y-3 border-t border-[color:var(--hairline)] pt-4">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">
            {t('对话', 'Chat')} · {teacher.name}
          </div>
          <div className="max-h-[420px] space-y-4 overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className="text-[13px] leading-[1.65]">
                <div className="mb-0.5 text-[11px] text-[color:var(--ink-5)]">
                  {m.role === 'user' ? t('你', 'You') : teacher.name}
                </div>
                <div
                  className={`whitespace-pre-wrap ${
                    m.role === 'user' ? 'text-[color:var(--ink-1)]' : 'text-[color:var(--ink-2)]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-[12px] text-[color:var(--ink-5)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('正在组织回答…', 'Composing reply…')}
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </section>
      ) : null}

      <section className="border-t border-[color:var(--hairline)] pt-4">
        <div className="text-[13px] font-medium text-[color:var(--ink-1)]">
          {t('输入追问', 'Ask a follow-up')}
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder={t(
            '例如：这份报告说今年适合转型，但我现在在职稳定——应如何理解这个判断？',
            'e.g. The report says this year favors a transition, but my job is stable — how should I read that?',
          )}
          className="fb-input mt-2 w-full resize-y px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && question.trim()) {
              e.preventDefault();
              void submit(question);
            }
          }}
        />
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setQuestion(item)}
              className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              {item.slice(0, 22)}…
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          {!reportId ? (
            <Link
              href={analyzeHref}
              onClick={() =>
                trackFunnel('chat_to_analyze_click', {
                  source: 'chat_workspace_primary',
                  intent: intent || 'career',
                })
              }
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              {t('先生成报告', 'Create report first')}
            </Link>
          ) : null}
          <button
            type="button"
            disabled={!question.trim() || loading}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
            onClick={() => {
              if (!reportId) {
                window.location.href = `${analyzeHref}&from=chat_question&q=${encodeURIComponent(question.trim())}`;
                return;
              }
              void submit(question);
            }}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {reportId ? t('发送', 'Send') : t('去排盘', 'Create chart')}
          </button>
          {reportId && messages.length > 0 ? (
            <button
              type="button"
              className="text-[color:var(--ink-4)] underline-offset-2 hover:underline"
              onClick={() => {
                setMessages([]);
                messagesRef.current = [];
              }}
            >
              {t('清空', 'Clear')}
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          {reportId
            ? t(
                '多轮追问锚定已绑定报告；⌘/Ctrl+Enter 发送。',
                'Multi-turn follow-ups are anchored to the bound report; ⌘/Ctrl+Enter to send.',
              )
            : t(
                '没有报告时，优先生成报告后再回来追问。',
                'Without a report, create one first, then come back to follow up.',
              )}
        </p>
      </section>
    </div>
  );
}
