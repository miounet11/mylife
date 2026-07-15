'use client';

/**
 * Report email capture — save-first funnel (Notion/Linear/Duolingo patterns).
 *
 * Principles:
 * 1. Value first: only ask after the user has seen report content.
 * 2. Save framing over "newsletter": progress/identity, not spam.
 * 3. One field + one primary action (Substack/Stripe low friction).
 * 4. Soft dismiss, never block reading.
 * 5. Dual benefit: archive report + optional timing alerts in one submit.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { REPORT_SUBSCRIPTION_TAGS } from '@/lib/email-subscription-focus';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

export type ReportEmailCaptureLocale = 'zh-CN' | 'zh-Hant' | 'en';
export type ReportEmailCaptureVariant = 'inline' | 'sticky';

type Props = {
  reportId: string;
  surfaceKey: string;
  locale?: ReportEmailCaptureLocale;
  variant?: ReportEmailCaptureVariant;
  /** sticky: wait for scrollY before showing. default 120 */
  scrollRevealPx?: number;
  /** sticky: min distinct report visits before show. default 1 (was 3) */
  visitThreshold?: number;
  className?: string;
};

const GLOBAL_SUBSCRIBED_KEY = 'newsletter-subscribed';
const DISMISS_KEY = 'lk-email-capture-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const VISIT_KEY = 'lk-report-visited-ids';
const TIMEOUT_MS = 12_000;

type ApiResponse = { success?: boolean; error?: string };

function pick(locale: ReportEmailCaptureLocale | undefined) {
  if (locale === 'en') {
    return {
      eyebrow: 'Save your report',
      title: 'Don’t lose this reading when you close the tab',
      body: 'Link an email to keep this report, reopen it on any device, and get light timing reminders when windows approach.',
      benefits: ['Cross-device archive', 'Free timing alerts', 'Cancel anytime'],
      placeholder: 'you@email.com',
      cta: 'Save with email',
      ctaBusy: 'Saving…',
      expand: 'Save this report',
      free: 'Free · no password required · unsubscribe anytime',
      trust: 'We only use email for report recovery and the alerts you opt into.',
      doneTitle: 'Report linked to your email',
      doneBody: 'We saved the association and will send a confirmation if delivery is enabled. Sign in with the same email to reopen it later.',
      doneLogin: 'Sign in / claim account',
      doneMessages: 'Email inbox',
      fail: 'Could not save. Please try again.',
      timeout: 'Request timed out. Please retry.',
      close: 'Dismiss for 7 days',
      invalid: 'Enter a valid email',
    };
  }
  if (locale === 'zh-Hant') {
    return {
      eyebrow: '保存這份報告',
      title: '關掉標籤頁前，先把報告掛到郵箱',
      body: '綁定郵箱後可跨裝置找回本報告，並在關鍵窗口到來前收到輕量提醒。不開會員也能用。',
      benefits: ['跨裝置歸檔', '節點輕提醒', '隨時可退訂'],
      placeholder: 'you@email.com',
      cta: '用郵箱保存',
      ctaBusy: '保存中…',
      expand: '保存這份報告',
      free: '免費 · 無需密碼 · 隨時可退訂',
      trust: '僅用於報告找回與你勾選的提醒，不會當成廣告清單。',
      doneTitle: '已掛到你的郵箱',
      doneBody: '我們已記錄關聯；若郵件通道可用會發確認信。之後用同一郵箱登入即可回看。',
      doneLogin: '登入 / 認領帳號',
      doneMessages: '郵件中心',
      fail: '保存失敗，請重試',
      timeout: '等待超時，請稍後重試',
      close: '7 天內不再顯示',
      invalid: '請輸入有效郵箱',
    };
  }
  return {
    eyebrow: '保存这份报告',
    title: '关掉标签页前，先把报告挂到邮箱',
    body: '绑定邮箱后可跨设备找回本报告，并在关键窗口到来前收到轻量提醒。不开会员也能用。',
    benefits: ['跨设备归档', '节点轻提醒', '随时可退订'],
    placeholder: 'you@email.com',
    cta: '用邮箱保存',
    ctaBusy: '保存中…',
    expand: '保存这份报告',
    free: '免费 · 无需密码 · 随时可退订',
    trust: '仅用于报告找回与你勾选的提醒，不会当成广告清单。',
    doneTitle: '已挂到你的邮箱',
    doneBody: '我们已记录关联；若邮件通道可用会发确认信。之后用同一邮箱登录即可回看。',
    doneLogin: '登录 / 认领账号',
    doneMessages: '邮件中心',
    fail: '保存失败，请重试',
    timeout: '等待超时，请稍后重试',
    close: '7 天内不再显示',
    invalid: '请输入有效邮箱',
  };
}

function recordVisitAndCount(reportId: string): number {
  try {
    const raw = window.localStorage.getItem(VISIT_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids)) return 1;
    if (!ids.includes(reportId)) {
      ids.push(reportId);
      const trimmed = ids.slice(-50);
      window.localStorage.setItem(VISIT_KEY, JSON.stringify(trimmed));
      return trimmed.length;
    }
    return ids.length;
  } catch {
    return 1;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ReportEmailCapture({
  reportId,
  surfaceKey,
  locale = 'zh-CN',
  variant = 'inline',
  scrollRevealPx = 120,
  visitThreshold = 1,
  className = '',
}: Props) {
  const ui = useMemo(() => pick(locale), [locale]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hidden, setHidden] = useState(variant === 'sticky');
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(variant === 'inline');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const globalDone = localStorage.getItem(GLOBAL_SUBSCRIBED_KEY) === 'done';
    if (globalDone) {
      setDismissed(true);
      return;
    }

    const dismissedAtRaw = localStorage.getItem(DISMISS_KEY);
    if (dismissedAtRaw) {
      const ts = Number.parseInt(dismissedAtRaw, 10);
      if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) {
        setDismissed(true);
        return;
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    if (variant === 'sticky') {
      const visitCount = recordVisitAndCount(reportId);
      if (visitCount < visitThreshold) {
        setDismissed(true);
        return;
      }
      const onScroll = () => {
        if (window.scrollY >= scrollRevealPx) setHidden(false);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }

    setHidden(false);
    return undefined;
  }, [reportId, scrollRevealPx, variant, visitThreshold]);

  useEffect(() => {
    if (dismissed || hidden) return;
    void trackClientEvent({
      eventName: 'email_capture_impression',
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      meta: { surfaceKey, reportId, variant, locale },
    });
  }, [dismissed, hidden, locale, reportId, surfaceKey, variant]);

  if (dismissed || hidden) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    void trackClientEvent({
      eventName: 'email_capture_dismissed',
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      meta: { surfaceKey, reportId, variant },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setStatus('error');
      setErrorMsg(ui.invalid);
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        meta: {
          reportId,
          target: 'report_email_capture_submit',
          source: surfaceKey,
          variant,
        },
      });

      const { response, data } = await fetchJsonWithTimeout<ApiResponse>('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          source: surfaceKey,
          reportId,
          tags: [...REPORT_SUBSCRIPTION_TAGS],
        }),
        timeoutMs: TIMEOUT_MS,
        timeoutReason: 'report-email-capture-timeout',
      });
      if (!response.ok || data.success === false) {
        throw new Error(data.error || ui.fail);
      }
      setStatus('done');
      try {
        localStorage.setItem(GLOBAL_SUBSCRIBED_KEY, 'done');
      } catch {
        /* ignore */
      }
      void trackClientEvent({
        eventName: 'newsletter_subscribed',
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        meta: {
          surfaceKey,
          reportId,
          source: 'report_email_capture',
          variant,
          locale,
          framing: 'save_first',
        },
      });
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        isAbortLikeError(err)
          ? ui.timeout
          : err instanceof Error
            ? err.message
            : ui.fail,
      );
    }
  };

  const shellClass =
    variant === 'sticky'
      ? 'fb-card fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[color:var(--brand)] p-4 shadow-[0_-14px_34px_rgba(0,0,0,0.10)] md:bottom-6 md:right-6 md:left-auto md:w-[380px]'
      : 'fb-card relative overflow-hidden border-t-2 border-t-[color:var(--brand)] p-4 md:p-5';

  if (status === 'done') {
    return (
      <div className={`${shellClass} ${className}`.trim()} id={variant === 'inline' ? 'subscribe' : undefined}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--success)]" />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[color:var(--ink-1)]">{ui.doneTitle}</p>
            <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{ui.doneBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/login?email=${encodeURIComponent(email.trim())}&source=report_email_capture&reportId=${encodeURIComponent(reportId)}`}
                className="fb-btn fb-btn-primary h-8 px-3 text-[12px] font-semibold hover:no-underline"
              >
                {ui.doneLogin}
              </Link>
              <Link
                href={`/updates/messages?email=${encodeURIComponent(email.trim())}`}
                className="fb-btn h-8 px-3 text-[12px] font-medium hover:no-underline"
              >
                {ui.doneMessages}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shellClass} ${className}`.trim()} id={variant === 'inline' ? 'subscribe' : undefined}>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={ui.close}
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink-4)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]"
      >
        ×
      </button>

      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
        <Mail className="h-3.5 w-3.5" />
        {ui.eyebrow}
      </div>
      <h3 className="mt-1.5 max-w-[34ch] text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[color:var(--ink-1)] md:text-[16px]">
        {ui.title}
      </h3>
      <p className="mt-1.5 max-w-[48ch] text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{ui.body}</p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {ui.benefits.map((item) => (
          <li
            key={item}
            className="inline-flex h-6 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 text-[11px] font-medium text-[color:var(--ink-2)]"
          >
            <Sparkles className="h-3 w-3 text-[color:var(--brand-strong)]" />
            {item}
          </li>
        ))}
      </ul>

      {!expanded ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            void trackClientEvent({
              eventName: 'email_capture_expanded',
              page: typeof window !== 'undefined' ? window.location.pathname : undefined,
              meta: { surfaceKey, reportId, variant },
            });
          }}
          className="fb-btn fb-btn-primary mt-3.5 h-9 w-full gap-1.5 text-[13px] font-semibold sm:w-auto sm:px-4"
        >
          <Lock className="h-3.5 w-3.5" />
          {ui.expand}
        </button>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-3.5 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder={ui.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'submitting'}
              className="fb-input h-10 min-w-0 flex-1 px-3 text-[13px]"
              aria-label={ui.placeholder}
            />
            <button
              type="submit"
              disabled={status === 'submitting' || !email.trim()}
              className="fb-btn fb-btn-primary h-10 shrink-0 px-4 text-[13px] font-semibold disabled:opacity-50"
            >
              {status === 'submitting' ? ui.ctaBusy : ui.cta}
            </button>
          </div>
          {errorMsg ? (
            <p className="text-[12px] font-semibold text-[color:var(--alert)]">{errorMsg}</p>
          ) : null}
          <p className="flex items-start gap-1.5 text-[11px] leading-[1.45] text-[color:var(--ink-4)]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-strong)]" />
            <span>
              {ui.free}
              <span className="text-[color:var(--ink-5)]"> · {ui.trust}</span>
            </span>
          </p>
        </form>
      )}
    </div>
  );
}
