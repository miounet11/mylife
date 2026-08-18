'use client';

/**
 * Global anonymous feedback / bug-report entry.
 * Visible on every page; never exposes ops email to the user.
 * Can be opened from anywhere via openSiteFeedback().
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, MessageSquarePlus, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { FEEDBACK_CATEGORIES, type FeedbackCategoryKey } from '@/lib/user-feedback-types';
import { isBlankStructuredFeedback } from '@/lib/feedback-signal';
import { trackClientEvent } from '@/lib/analytics-client';

type Status = 'idle' | 'submitting' | 'done' | 'error';

export type OpenFeedbackOptions = {
  category?: FeedbackCategoryKey | string;
  message?: string;
  reportId?: string;
  pageUrl?: string;
};

const OPEN_EVENT = 'lk-open-feedback';

/** Open the global feedback dialog from any component. */
export function openSiteFeedback(options: OpenFeedbackOptions = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: options }));
}

export default function SiteFeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>('content_wrong');
  const [message, setMessage] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [reportId, setReportId] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketId, setTicketId] = useState('');

  const hideOnAdmin = useMemo(
    () => (pathname || '').startsWith('/admin'),
    [pathname],
  );
  const onReportPage = useMemo(
    () => /^\/(result|r)\//.test(pathname || ''),
    [pathname],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPageUrl(window.location.href);
    const match = (pathname || '').match(/^\/(?:result|r)\/([^/?#]+)/);
    if (match?.[1]) setReportId(decodeURIComponent(match[1]));
  }, [pathname, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<OpenFeedbackOptions>).detail || {};
      setStatus('idle');
      setErrorMsg('');
      setTicketId('');
      setCategory(detail.category || 'content_wrong');
      setMessage(detail.message || '');
      setReportId(detail.reportId || '');
      if (detail.pageUrl) setPageUrl(detail.pageUrl);
      else if (typeof window !== 'undefined') setPageUrl(window.location.href);
      setOpen(true);
      void trackClientEvent({
        eventName: 'feedback_widget_opened',
        page: pathname || undefined,
        meta: {
          preset: detail.category || 'programmatic',
          hasReportId: Boolean(detail.reportId),
        },
      });
    };
    window.addEventListener(OPEN_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(OPEN_EVENT, onOpen as EventListener);
  }, [pathname]);

  if (hideOnAdmin) return null;

  const resetForm = () => {
    setCategory('content_wrong');
    setMessage('');
    setReportId('');
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
    if (isBlankStructuredFeedback(message)) {
      setStatus('error');
      setErrorMsg('请写清楚具体问题，不要只提交空模板');
      return;
    }
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
          reportId: reportId.trim() || undefined,
          context: {
            pathname: pathname || null,
            reportId: reportId.trim() || null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            viewport:
              typeof window !== 'undefined'
                ? { w: window.innerWidth, h: window.innerHeight }
                : null,
          },
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
        meta: {
          category,
          hasUrl: Boolean(pageUrl.trim()),
          hasReportId: Boolean(reportId.trim()),
        },
      });
    } catch (error) {
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : '提交失败，请稍后重试');
    }
  };

  return (
    <>
      {/* One compact launcher. Sit above report chapter-dock / action rail. */}
      <div
        className={`fixed z-[60] ${
          onReportPage
            ? 'bottom-20 left-4 right-auto lg:bottom-6'
            : 'bottom-20 right-4 lg:bottom-6 lg:right-6'
        }`}
      >
        <button
          type="button"
          onClick={() => handleOpen(onReportPage ? 'content_wrong' : 'message')}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 text-[12px] font-semibold text-[color:var(--ink-2)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]"
          aria-label="报错或留言"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          反馈
          <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--signal-strong)]" />
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
                  无需登录。我们会在后台收集并定期修正（用神、身强弱、页面故障等）。
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
                      运营后台会看到类型、页面、报告 ID 与说明，用于后续修正。
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
                  <span className="text-[12px] font-semibold text-[color:var(--ink-2)]">
                    报告 ID
                    <span className="ml-1 font-normal text-[color:var(--ink-4)]">（可选，方便我们对照盘）</span>
                  </span>
                  <input
                    type="text"
                    value={reportId}
                    onChange={(e) => setReportId(e.target.value)}
                    placeholder="例如 result 链接里的 id"
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
                    placeholder="例如：我的盘是丙戌辛丑甲辰乙丑，系统说身偏旺喜金土，但我认为身弱应喜水木。期望：……"
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
