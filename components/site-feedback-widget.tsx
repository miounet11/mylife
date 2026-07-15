'use client';

/**
 * Global anonymous feedback / bug-report entry.
 * Visible on every page; never exposes ops email to the user.
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, MessageSquarePlus, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { FEEDBACK_CATEGORIES } from '@/lib/user-feedback-types';
import { trackClientEvent } from '@/lib/analytics-client';

type Status = 'idle' | 'submitting' | 'done' | 'error';

export default function SiteFeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('page_error');
  const [message, setMessage] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketId, setTicketId] = useState('');

  const hideOnAdmin = useMemo(
    () => (pathname || '').startsWith('/admin'),
    [pathname],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPageUrl(window.location.href);
  }, [pathname, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (hideOnAdmin) return null;

  const resetForm = () => {
    setCategory('page_error');
    setMessage('');
    setStatus('idle');
    setErrorMsg('');
    setTicketId('');
    if (typeof window !== 'undefined') setPageUrl(window.location.href);
  };

  const handleOpen = (preset?: string) => {
    resetForm();
    if (preset) setCategory(preset);
    setOpen(true);
    void trackClientEvent({
      eventName: 'feedback_widget_opened',
      page: pathname || undefined,
      meta: { preset: preset || 'default' },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          pageUrl: pageUrl.trim() || (typeof window !== 'undefined' ? window.location.href : ''),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || '提交失败');
      }
      setTicketId(data.id || '');
      setStatus('done');
      void trackClientEvent({
        eventName: 'feedback_submitted',
        page: pathname || undefined,
        meta: { category, hasUrl: Boolean(pageUrl.trim()) },
      });
    } catch (error) {
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : '提交失败，请稍后重试');
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 md:bottom-6 md:right-6">
        <button
          type="button"
          onClick={() => handleOpen('page_error')}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3.5 text-[13px] font-semibold text-[color:var(--ink-2)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]"
          aria-label="报错或留言"
        >
          <AlertTriangle className="h-4 w-4 text-[color:var(--signal-strong)]" />
          报错
        </button>
        <button
          type="button"
          onClick={() => handleOpen('message')}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--brand)] px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(41,72,125,0.28)] transition hover:opacity-95"
          aria-label="匿名留言"
        >
          <MessageSquarePlus className="h-4 w-4" />
          留言
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/35 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-feedback-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--hairline)] px-4 py-3">
              <div>
                <h2 id="site-feedback-title" className="text-[15px] font-bold text-[color:var(--ink-1)]">
                  匿名报错 / 留言
                </h2>
                <p className="mt-0.5 text-[12px] leading-5 text-[color:var(--ink-4)]">
                  无需登录。我们会定期查看并优化产品，不会向你展示运营邮箱。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)]"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {status === 'done' ? (
              <div className="space-y-3 px-4 py-6">
                <div className="flex items-start gap-2 text-[color:var(--success)]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-[14px] font-semibold text-[color:var(--ink-1)]">已收到，谢谢你的反馈</p>
                    <p className="mt-1 text-[12px] leading-5 text-[color:var(--ink-3)]">
                      我们会定期排查这些记录来优化体验。
                      {ticketId ? (
                        <>
                          {' '}
                          编号 <span className="font-mono text-[color:var(--ink-2)]">{ticketId}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="fb-btn fb-btn-primary h-9 w-full text-[13px]"
                >
                  关闭
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 px-4 py-4">
                <label className="block space-y-1.5">
                  <span className="text-[12px] font-semibold text-[color:var(--ink-2)]">问题类型</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="fb-input h-10 w-full px-3 text-[13px]"
                    required
                  >
                    {FEEDBACK_CATEGORIES.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[12px] font-semibold text-[color:var(--ink-2)]">
                    页面链接
                    <span className="ml-1 font-normal text-[color:var(--ink-4)]">（可改，默认当前页）</span>
                  </span>
                  <input
                    type="url"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                    placeholder="https://www.life-kline.com/..."
                    className="fb-input h-10 w-full px-3 font-mono text-[12px]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[12px] font-semibold text-[color:var(--ink-2)]">说明</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={4}
                    maxLength={4000}
                    rows={5}
                    placeholder="发生了什么？你期望怎样？越具体越好（例如：点了生成后一直转圈 / 某块文字竖排）"
                    className="fb-input min-h-[120px] w-full resize-y px-3 py-2 text-[13px] leading-6"
                  />
                </label>

                {errorMsg ? (
                  <p className="text-[12px] font-semibold text-[color:var(--alert)]">{errorMsg}</p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="fb-btn h-10 flex-1 text-[13px]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'submitting' || message.trim().length < 4}
                    className="fb-btn fb-btn-primary h-10 flex-1 text-[13px] disabled:opacity-50"
                  >
                    {status === 'submitting' ? '提交中…' : '匿名提交'}
                  </button>
                </div>
                <p className="text-[11px] leading-4 text-[color:var(--ink-5)]">
                  仅用于产品改进。请勿填写密码等敏感信息。
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
