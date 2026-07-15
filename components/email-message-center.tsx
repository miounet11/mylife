'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookMarked,
  Loader2,
  Mail,
  MessageSquareReply,
  RefreshCcw,
  Send,
} from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';
import EmailTrustPanel from '@/components/email-trust-panel';
import ProfileSupplementPrompt from '@/components/profile-supplement-prompt';
import SubscriptionFocusBanner from '@/components/subscription-focus-banner';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

type InboxMessage = {
  id: string;
  subject: string;
  preview: string;
  category: string;
  categoryLabel: string;
  sentAt: string;
  reportId?: string | null;
  replyCount?: number;
  bodyText?: string | null;
};

type ReplyMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  answer?: string | null;
  status: string;
  createdAt: string;
};

type MessageListResponse = {
  success?: boolean;
  error?: string;
  messages?: InboxMessage[];
};

type MessageDetailResponse = {
  success?: boolean;
  error?: string;
  message?: InboxMessage;
  replies?: ReplyMessage[];
};

type ReplyResponse = {
  success?: boolean;
  error?: string;
  answer?: string;
};

const TIMEOUT_MS = 20_000;

export default function EmailMessageCenter({
  initialEmail = '',
  autoLoad = false,
  initialMessageId = '',
}: {
  initialEmail?: string;
  autoLoad?: boolean;
  initialMessageId?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState(initialMessageId || '');
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [replies, setReplies] = useState<ReplyMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [extractLoading, setExtractLoading] = useState(false);
  const [profileContext, setProfileContext] = useState<ProfileSettingsResponse | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    if (!autoLoad) return;
    const loadProfileContext = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          '/api/profile/settings',
          { timeoutMs: 8000, timeoutReason: 'email-message-center-profile' },
        );
        if (response.ok && data.success) {
          setProfileContext(data);
        }
      } catch {
        setProfileContext(null);
      }
    };
    void loadProfileContext();
  }, [autoLoad]);
  const selected = useMemo(
    () => messages.find((item) => item.id === selectedId) || selectedMessage,
    [messages, selectedId, selectedMessage],
  );

  const loadMessages = async () => {
    if (!normalizedEmail) return;
    setLoading(true);
    setError('');
    try {
      const { response, data } = await fetchJsonWithTimeout<MessageListResponse>(
        `/api/email/messages?email=${encodeURIComponent(normalizedEmail)}`,
        { timeoutMs: TIMEOUT_MS, timeoutReason: 'email-message-list-timeout' },
      );
      if (!response.ok || !data.success) {
        setMessages([]);
        setError(data.error || '加载邮件记录失败');
        return;
      }
      setMessages(data.messages || []);
      if (!selectedId && data.messages?.[0]) {
        setSelectedId(data.messages[0].id);
      }
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError('加载等待时间过长，请稍后重试');
      } else {
        setError('网络异常，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessageDetail = async (messageId: string) => {
    if (!messageId || !normalizedEmail) return;
    try {
      const { response, data } = await fetchJsonWithTimeout<MessageDetailResponse>(
        `/api/email/messages/${encodeURIComponent(messageId)}?email=${encodeURIComponent(normalizedEmail)}`,
        { timeoutMs: TIMEOUT_MS, timeoutReason: 'email-message-detail-timeout' },
      );
      if (!response.ok || !data.success || !data.message) return;
      setSelectedMessage(data.message);
      setReplies(data.replies || []);
    } catch {
      /* ignore detail load errors */
    }
  };

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (initialMessageId) setSelectedId(initialMessageId);
  }, [initialMessageId]);

  useEffect(() => {
    if (autoLoad && normalizedEmail) {
      void loadMessages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, normalizedEmail]);

  useEffect(() => {
    if (selectedId) {
      void loadMessageDetail(selectedId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, normalizedEmail]);

  const handleSaveToLibrary = async () => {
    if (!selected?.id || !normalizedEmail) return;
    setExtractLoading(true);
    setError('');
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        message?: string;
      }>('/api/profile/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'email',
          sourceId: selected.id,
          fortuneId: selected.reportId || undefined,
          autoSave: true,
        }),
        timeoutMs: TIMEOUT_MS,
        timeoutReason: 'email-save-to-profile-library',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '保存到资料库失败');
        return;
      }
      setMessage(data.message || '已保存到测算资料库。');
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError('保存等待时间过长，请稍后重试');
        return;
      }
      setError('网络异常，请稍后重试');
    } finally {
      setExtractLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedId || !question.trim() || !normalizedEmail) return;
    setReplyLoading(true);
    setError('');
    setMessage('');
    try {
      const { response, data } = await fetchJsonWithTimeout<ReplyResponse>(
        `/api/email/messages/${encodeURIComponent(selectedId)}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, question: question.trim() }),
          timeoutMs: TIMEOUT_MS,
          timeoutReason: 'email-message-reply-timeout',
        },
      );
      if (!response.ok || !data.success) {
        setError(data.error || '追问失败，请稍后重试');
        return;
      }
      setQuestion('');
      setMessage('专业回复已生成，并同步发送到你的邮箱。');
      await loadMessageDetail(selectedId);
      await loadMessages();
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError('回复生成等待时间过长，请稍后重试');
      } else {
        setError('网络异常，请稍后重试');
      }
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <EmailTrustPanel email={normalizedEmail} />

      {profileContext?.subscriptionFocus ? (
        <SubscriptionFocusBanner focus={profileContext.subscriptionFocus} />
      ) : null}

      <div className="fb-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[color:var(--fb-border)] px-4 py-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="输入邮箱查看发送记录"
              className="fb-input h-10 w-full pl-9 pr-3 text-[13px]"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadMessages()}
            disabled={loading || !normalizedEmail}
            className="fb-btn fb-btn-primary inline-flex h-10 items-center gap-1.5 px-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            刷新记录
          </button>
        </div>

        {message ? (
          <AlertBanner tone="success" className="mx-4 mt-3 text-xs">{message}</AlertBanner>
        ) : null}
        {error ? (
          <AlertBanner className="mx-4 mt-3 text-xs">{error}</AlertBanner>
        ) : null}

        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-[color:var(--fb-border)] lg:border-b-0 lg:border-r">
            <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              发送记录 ({messages.length})
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {messages.length > 0 ? messages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full border-b border-[color:var(--hairline)] px-4 py-3 text-left transition ${
                    selectedId === item.id ? 'bg-[color:var(--brand-soft)]' : 'hover:bg-[color:var(--bg-sunken)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                      {item.categoryLabel}
                    </span>
                    <span className="font-mono text-[11px] text-[color:var(--ink-5)]">
                      {formatDate(item.sentAt)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[color:var(--ink-1)]">{item.subject}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--ink-3)]">{item.preview}</div>
                  {(item.replyCount || 0) > 0 ? (
                    <div className="mt-1 text-[11px] font-semibold text-[color:var(--brand-strong)]">
                      {item.replyCount} 条追问往来
                    </div>
                  ) : null}
                </button>
              )) : (
                <div className="px-4 py-8 text-sm text-[color:var(--ink-4)]">
                  {loading ? '加载中…' : '暂无邮件记录。开启订阅后会在这里归档。'}
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {selected.categoryLabel} · {formatDate(selected.sentAt)}
                  </div>
                  <h3 className="mt-1 text-lg font-black text-[color:var(--ink-1)]">{selected.subject}</h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
                    {selected.bodyText || selected.preview}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.reportId ? (
                      <Link
                        href={`/result/${selected.reportId}`}
                        className="fb-btn h-8 px-3 text-xs hover:no-underline"
                      >
                        查看关联报告 →
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleSaveToLibrary()}
                      disabled={extractLoading}
                      className="fb-btn h-8 px-3 text-xs disabled:opacity-60"
                    >
                      {extractLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookMarked className="h-3.5 w-3.5" />}
                      保存到资料库
                    </button>
                    <Link href="/profile/settings" className="fb-btn h-8 px-3 text-xs hover:no-underline">
                      打开资料设置
                    </Link>
                  </div>
                </div>

                {replies.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                      追问往来
                    </div>
                    {replies.map((reply) => (
                      <div key={reply.id} className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
                        <div className="text-xs font-semibold text-[color:var(--ink-2)]">你的追问</div>
                        <p className="mt-1 text-sm text-[color:var(--ink-3)]">{reply.body}</p>
                        {reply.answer ? (
                          <>
                            <div className="mt-3 text-xs font-semibold text-[color:var(--brand-strong)]">专业回复</div>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[color:var(--ink-2)]">{reply.answer}</p>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {selected.reportId ? (
                  <ProfileSupplementPrompt
                    fortuneId={selected.reportId}
                    canManage={autoLoad}
                    variant="email"
                  />
                ) : null}

                <div className="rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-1)]">
                    <MessageSquareReply className="h-4 w-4 text-[color:var(--brand-strong)]" />
                    继续追问这封邮件
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--ink-3)]">
                    我们会结合这封提醒的内容和你的报告上下文，生成专业回复并同步发到你的邮箱。你也可以直接回复收到的邮件。
                  </p>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={4}
                    placeholder="例如：这封日常提醒里提到的“今天适合推进”，具体适合推进哪类事情？"
                    className="fb-input mt-3 w-full resize-y px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleReply()}
                    disabled={replyLoading || !question.trim()}
                    className="fb-btn fb-btn-primary mt-2 h-10 px-4 text-sm disabled:opacity-50"
                  >
                    {replyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    发送追问并获取专业回复
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-[color:var(--ink-4)]">
                选择左侧一封邮件，查看详情并追问
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link href="/updates" className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-strong)] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          返回订阅设置
        </Link>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}