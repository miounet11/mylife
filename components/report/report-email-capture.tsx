'use client';

/**
 * Report email bind — real OTP registration (not newsletter-only).
 *
 * Flow:
 * 1. Email → request OTP (+ soft newsletter capture so we keep the lead if they drop off)
 * 2. 6-digit code → verify → session + guest merge + claim report
 * 3. Done: account bound; optional membership CTA
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
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
  /** sticky: min distinct report visits before show. default 1 */
  visitThreshold?: number;
  className?: string;
};

const GLOBAL_SUBSCRIBED_KEY = 'newsletter-subscribed';
const AUTH_BOUND_KEY = 'lk-email-bound';
const DISMISS_KEY = 'lk-email-capture-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const VISIT_KEY = 'lk-report-visited-ids';
const TIMEOUT_MS = 12_000;
const RESEND_COOLDOWN_SEC = 60;

type ApiResponse = {
  success?: boolean;
  error?: string;
  warning?: string;
  message?: string;
  emailSent?: boolean;
  devCode?: string;
  adminPasswordRequired?: boolean;
  user?: { id?: string; email?: string };
  reportClaimed?: boolean;
};

function pick(locale: ReportEmailCaptureLocale | undefined) {
  if (locale === 'en') {
    return {
      eyebrow: 'Bind email · save this report',
      title: 'Don’t lose this reading when you close the tab',
      body: 'One email code binds your account, saves this report across devices, and lets us reach you later. No password.',
      benefits: ['Save this report', 'Cross-device restore', 'Stay in touch'],
      placeholder: 'you@email.com',
      cta: 'Send code',
      ctaBusy: 'Sending…',
      expand: 'Bind email to save',
      free: 'Free · no password · about 1 minute',
      trust: 'Email is for save/login and alerts you opt into — not an ad list.',
      codeLabel: '6-digit code',
      codeSentPrefix: 'Code sent to',
      verifyCta: 'Finish binding',
      verifyBusy: 'Binding…',
      resend: 'Resend code',
      resendWait: 's until resend',
      changeEmail: 'Use a different email',
      spamHint: 'No code? Check spam/promotions, or resend.',
      doneTitle: 'Email bound — report saved to your account',
      doneBody: 'You’re signed in. Reopen this report anytime with the same email.',
      doneLogin: 'Claim free membership',
      doneProfile: 'My profile',
      fail: 'Could not complete. Please try again.',
      timeout: 'Request timed out. Please retry.',
      close: 'Dismiss for 7 days',
      invalid: 'Enter a valid email',
      deliveryFailed: 'Email not delivered. Check the address or retry shortly.',
    };
  }
  if (locale === 'zh-Hant') {
    return {
      eyebrow: '綁定郵箱 · 保存本報告',
      title: '關掉標籤頁前，用驗證碼綁定',
      body: '一封驗證碼即可完成綁定：保存本報告、跨裝置回看，並方便後續召回。無需密碼。',
      benefits: ['保存本報告', '跨裝置找回', '保持持續關係'],
      placeholder: 'you@email.com',
      cta: '發送驗證碼',
      ctaBusy: '發送中…',
      expand: '綁定郵箱保存',
      free: '免費 · 無需密碼 · 約 1 分鐘',
      trust: '僅用於保存/登入與你勾選的提醒，不會當成廣告清單。',
      codeLabel: '6 位驗證碼',
      codeSentPrefix: '驗證碼已發送至',
      verifyCta: '完成綁定',
      verifyBusy: '綁定中…',
      resend: '重新發送',
      resendWait: '秒後可重發',
      changeEmail: '換個郵箱',
      spamHint: '未收到？請查看垃圾郵件/推廣箱，或點重新發送。',
      doneTitle: '已綁定 · 報告已掛到你的帳號',
      doneBody: '你已登入。之後用同一郵箱即可跨裝置回看本報告。',
      doneLogin: '領取會員',
      doneProfile: '我的資料',
      fail: '未能完成，請重試',
      timeout: '等待超時，請稍後重試',
      close: '7 天內不再顯示',
      invalid: '請輸入有效郵箱',
      deliveryFailed: '郵件未送達，請檢查郵箱或稍後重試',
    };
  }
  return {
    eyebrow: '绑定邮箱 · 保存本报告',
    title: '关掉标签页前，用验证码绑定',
    body: '一封验证码即可完成绑定：保存本报告、跨设备回看，并方便后续召回。无需密码。',
    benefits: ['保存本报告', '跨设备找回', '保持持续关系'],
    placeholder: 'you@email.com',
    cta: '发送验证码',
    ctaBusy: '发送中…',
    expand: '绑定邮箱保存',
    free: '免费 · 无需密码 · 约 1 分钟',
    trust: '仅用于保存/登录与你勾选的提醒，不会当成广告清单。',
    codeLabel: '6 位验证码',
    codeSentPrefix: '验证码已发送至',
    verifyCta: '完成绑定',
    verifyBusy: '绑定中…',
    resend: '重新发送',
    resendWait: '秒后可重发',
    changeEmail: '换个邮箱',
    spamHint: '未收到？请查看垃圾邮件/推广箱，或点重新发送。',
    doneTitle: '已绑定 · 报告已挂到你的账号',
    doneBody: '你已登录。之后用同一邮箱即可跨设备回看本报告。',
    doneLogin: '领取会员',
    doneProfile: '我的资料',
    fail: '未能完成，请重试',
    timeout: '等待超时，请稍后重试',
    close: '7 天内不再显示',
    invalid: '请输入有效邮箱',
    deliveryFailed: '邮件未送达，请检查邮箱或稍后重试',
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
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hint, setHint] = useState('');
  const [hidden, setHidden] = useState(variant === 'sticky');
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(variant === 'inline');
  const [resendIn, setResendIn] = useState(0);
  const [reportClaimed, setReportClaimed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only hide when this browser already completed OTP bind (not soft newsletter alone).
    if (localStorage.getItem(AUTH_BOUND_KEY) === '1') {
      setDismissed(true);
      return;
    }

    try {
      const stored = localStorage.getItem('life-kline:lead-email')?.trim().toLowerCase() || '';
      if (stored.includes('@')) setEmail(stored);
    } catch {
      // ignore
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
      meta: { surfaceKey, reportId, variant, locale, mode: 'otp_bind' },
    });
  }, [dismissed, hidden, locale, reportId, surfaceKey, variant]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

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
      meta: { surfaceKey, reportId, variant, step },
    });
  };

  const softCaptureLead = async (normalized: string) => {
    // Best-effort: keep email even if user abandons OTP mid-way.
    try {
      await fetchJsonWithTimeout<ApiResponse>('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          source: surfaceKey,
          reportId,
          tags: [...REPORT_SUBSCRIPTION_TAGS],
        }),
        timeoutMs: TIMEOUT_MS,
        timeoutReason: 'report-email-soft-capture-timeout',
      });
    } catch {
      // non-blocking
    }
  };

  const requestCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setStatus('error');
      setErrorMsg(ui.invalid);
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    setHint('');
    try {
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        meta: {
          reportId,
          target: 'report_email_otp_request',
          source: surfaceKey,
          variant,
        },
      });

      // Soft lead capture in parallel (does not replace OTP).
      void softCaptureLead(normalized);

      const { response, data } = await fetchJsonWithTimeout<ApiResponse>('/api/auth/request-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          locale,
          source: surfaceKey,
          reportId,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
        timeoutMs: TIMEOUT_MS,
        timeoutReason: 'report-email-otp-request-timeout',
      });

      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.warning || ui.fail);
      }
      if (data.emailSent === false && !data.devCode) {
        throw new Error(data.warning || ui.deliveryFailed);
      }

      setEmail(normalized);
      setStep('code');
      setResendIn(RESEND_COOLDOWN_SEC);
      setHint(
        data.devCode
          ? `${data.message || ''} dev:${data.devCode}`
          : data.message || ui.spamHint,
      );
      try {
        localStorage.setItem('life-kline:lead-email', normalized);
      } catch {
        /* ignore */
      }
      setStatus('idle');
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

  const verifyCode = async () => {
    const normalized = email.trim().toLowerCase();
    const digits = code.replace(/\D/g, '').slice(0, 6);
    if (digits.length < 6) {
      setStatus('error');
      setErrorMsg(ui.fail);
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
          target: 'report_email_otp_verify',
          source: surfaceKey,
          variant,
        },
      });

      const { response, data } = await fetchJsonWithTimeout<ApiResponse>('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          code: digits,
          source: surfaceKey,
          reportId,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
        timeoutMs: TIMEOUT_MS,
        timeoutReason: 'report-email-otp-verify-timeout',
      });

      if (!response.ok || data.success === false) {
        throw new Error(data.error || ui.fail);
      }

      setReportClaimed(!!data.reportClaimed);
      setStep('done');
      setStatus('idle');
      try {
        localStorage.setItem('life-kline:lead-email', normalized);
        localStorage.setItem(GLOBAL_SUBSCRIBED_KEY, 'done');
        localStorage.setItem(AUTH_BOUND_KEY, '1');
      } catch {
        /* ignore */
      }
      void trackClientEvent({
        eventName: 'newsletter_subscribed',
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        meta: {
          surfaceKey,
          reportId,
          source: 'report_email_otp_bind',
          variant,
          locale,
          framing: 'otp_bind',
          reportClaimed: !!data.reportClaimed,
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

  if (step === 'done') {
    return (
      <div className={`${shellClass} ${className}`.trim()} id={variant === 'inline' ? 'subscribe' : undefined}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--success)]" />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[color:var(--ink-1)]">{ui.doneTitle}</p>
            <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">
              {ui.doneBody}
              {reportClaimed ? (locale === 'en' ? ' Report linked.' : ' 本报告已关联。') : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/membership?source=report_email_otp&email=${encodeURIComponent(email.trim())}&reportId=${encodeURIComponent(reportId)}&claim=1#membership-claim`}
                className="fb-btn fb-btn-primary h-8 px-3 text-[12px] font-semibold hover:no-underline"
              >
                {ui.doneLogin}
              </Link>
              <Link
                href="/profile"
                className="fb-btn h-8 px-3 text-[12px] font-medium hover:no-underline"
              >
                {ui.doneProfile}
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
              meta: { surfaceKey, reportId, variant, mode: 'otp_bind' },
            });
          }}
          className="fb-btn fb-btn-primary mt-3.5 h-9 w-full gap-1.5 text-[13px] font-semibold sm:w-auto sm:px-4"
        >
          <Lock className="h-3.5 w-3.5" />
          {ui.expand}
        </button>
      ) : step === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void requestCode();
          }}
          className="mt-3.5 space-y-2"
        >
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
              {status === 'submitting' ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {ui.ctaBusy}
                </span>
              ) : (
                ui.cta
              )}
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
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode();
          }}
          className="mt-3.5 space-y-2"
        >
          <p className="text-[12px] text-[color:var(--ink-3)]">
            {ui.codeSentPrefix}{' '}
            <span className="font-semibold text-[color:var(--ink-1)]">{email}</span>
          </p>
          {hint ? <p className="text-[11px] text-[color:var(--ink-4)]">{hint}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              autoComplete="one-time-code"
              placeholder={ui.codeLabel}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={status === 'submitting'}
              className="fb-input h-10 min-w-0 flex-1 px-3 text-[13px] tracking-[0.25em]"
              aria-label={ui.codeLabel}
            />
            <button
              type="submit"
              disabled={status === 'submitting' || code.length < 6}
              className="fb-btn fb-btn-primary h-10 shrink-0 px-4 text-[13px] font-semibold disabled:opacity-50"
            >
              {status === 'submitting' ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {ui.verifyBusy}
                </span>
              ) : (
                ui.verifyCta
              )}
            </button>
          </div>
          {errorMsg ? (
            <p className="text-[12px] font-semibold text-[color:var(--alert)]">{errorMsg}</p>
          ) : null}
          <p className="text-[11px] leading-[1.45] text-[color:var(--ink-4)]">{ui.spamHint}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <button
              type="button"
              disabled={status === 'submitting'}
              onClick={() => {
                setStep('email');
                setCode('');
                setErrorMsg('');
                setHint('');
                setResendIn(0);
              }}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              {ui.changeEmail}
            </button>
            <button
              type="button"
              disabled={status === 'submitting' || resendIn > 0}
              onClick={() => void requestCode()}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              {resendIn > 0 ? `${resendIn}${ui.resendWait}` : ui.resend}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
