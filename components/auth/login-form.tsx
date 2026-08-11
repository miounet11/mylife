'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useLocale } from '@/components/i18n/locale-provider';
import { AlertBanner } from '@/components/layout/alert-banner';
import { loginFormCopy } from '@/lib/i18n/login-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

type LoginFormProps = {
  locale?: SiteLocale;
  /** Override `?next=` (e.g. embed on membership page). */
  nextOverride?: string;
  /** Compact chrome when embedded inside another page. */
  compact?: boolean;
  /**
   * If set, called after successful verify instead of full navigation.
   * Use for in-page bind → auto-claim flows.
   */
  onSuccess?: (email: string) => void;
  /** Analytics / subscription source (e.g. membership_claim, report_bind). */
  source?: string;
  /** When binding from a report, claim this fortune onto the account. */
  reportId?: string;
};

const RESEND_COOLDOWN_SEC = 60;

export default function LoginForm({
  locale: localeProp,
  nextOverride,
  compact = false,
  onSuccess,
  source: sourceProp,
  reportId: reportIdProp,
}: LoginFormProps) {
  const { locale: ctxLocale } = useLocale();
  const locale: SiteLocale = localeProp || ctxLocale || 'zh-CN';
  const copy = useMemo(() => loginFormCopy(locale), [locale]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = nextOverride || searchParams.get('next') || '/profile';
  const reportId =
    reportIdProp ||
    searchParams.get('reportId')?.trim() ||
    searchParams.get('report')?.trim() ||
    '';
  const source =
    sourceProp ||
    searchParams.get('source')?.trim() ||
    (reportId ? 'report_bind' : 'login');

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRequired, setAdminRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const googleHref = useMemo(() => {
    const q = new URLSearchParams();
    if (nextPath) q.set('next', nextPath);
    if (reportId) q.set('reportId', reportId);
    q.set('source', source || 'google');
    return `/api/auth/google?${q.toString()}`;
  }, [nextPath, reportId, source]);

  useEffect(() => {
    const fromQuery = searchParams.get('email')?.trim().toLowerCase() || '';
    if (fromQuery.includes('@')) {
      setEmail(fromQuery);
      return;
    }
    try {
      const stored = localStorage.getItem('life-kline:lead-email')?.trim().toLowerCase() || '';
      if (stored.includes('@')) setEmail(stored);
    } catch {
      // ignore
    }
  }, [searchParams]);

  useEffect(() => {
    const err = searchParams.get('error')?.trim() || '';
    if (!err) return;
    if (err === 'google_denied') {
      setError(copy.googleDenied);
      return;
    }
    if (err.startsWith('google')) {
      setError(copy.googleError);
    }
  }, [searchParams, copy.googleDenied, copy.googleError]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const isMembershipNext =
    nextPath.includes('/membership') || nextPath.includes('membership');

  async function requestCode() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const normalized = email.trim().toLowerCase();
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          locale,
          source,
          reportId: reportId || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : '/login',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.warning || copy.sendFailed);
      }
      // Only advance when mail was sent (or dev returned success with warning).
      if (data.emailSent === false && !data.devCode) {
        throw new Error(data.warning || copy.deliveryFailed);
      }
      setEmail(normalized);
      setAdminRequired(!!data.adminPasswordRequired);
      setStep('code');
      setResendIn(RESEND_COOLDOWN_SEC);
      const devHint = data.devCode ? `${copy.devCodePrefix}${data.devCode}` : '';
      const domain = normalized.split('@')[1] || '';
      const isGmail =
        domain === 'gmail.com' ||
        domain === 'googlemail.com' ||
        domain.endsWith('.gmail.com');
      const apiGmailHint =
        typeof data.gmailHint === 'string' && data.gmailHint.trim()
          ? ` ${data.gmailHint.trim()}`
          : '';
      const gmailHint =
        apiGmailHint ||
        (isGmail && copy.gmailDeliverabilityHint ? ` ${copy.gmailDeliverabilityHint}` : '');
      setMessage(`${data.message || copy.codeSentDefault}${devHint}${gmailHint}`);
      try {
        localStorage.setItem('life-kline:lead-email', normalized);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.sendFailed);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    try {
      const normalized = email.trim().toLowerCase();
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          code,
          adminPassword: adminRequired ? adminPassword : undefined,
          source,
          reportId: reportId || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : '/login',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || copy.verifyFailed);
      try {
        localStorage.setItem('life-kline:lead-email', normalized);
        localStorage.setItem('newsletter-subscribed', 'done');
      } catch {
        // ignore
      }
      if (onSuccess) {
        onSuccess(normalized);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.verifyFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'border-y border-[color:var(--hairline)] py-5'}>
      {!compact ? (
        <>
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {copy.benefits.map((item) => (
              <li
                key={item}
                className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 text-[11px] font-medium text-[color:var(--ink-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mb-4 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{copy.emailWhy}</p>
        </>
      ) : (
        <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{copy.emailWhy}</p>
      )}

      {isMembershipNext ? (
        <p className="mb-3 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{copy.membershipNextHint}</p>
      ) : null}

      {message ? <AlertBanner tone="success" className="mb-3 text-xs">{message}</AlertBanner> : null}
      {error ? <AlertBanner className="mb-3 text-xs">{error}</AlertBanner> : null}

      {step === 'email' ? (
        <div className="space-y-3">
          <a
            href={googleHref}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-white text-sm font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
          >
            <GoogleMark />
            {copy.googleSignIn}
          </a>
          <div className="flex items-center gap-2 text-[11px] text-[color:var(--ink-5)]">
            <span className="h-px flex-1 bg-[color:var(--hairline)]" />
            {copy.googleOrEmail}
            <span className="h-px flex-1 bg-[color:var(--hairline)]" />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void requestCode();
            }}
            className="space-y-3"
          >
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[color:var(--ink-2)]">{copy.emailLabel}</span>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                autoFocus={!compact}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                className="fb-input h-11 w-full px-3 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {copy.sendCode}
            </button>
            <p className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-4)]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-strong)]" />
              {copy.sendCodeHint}
            </p>
          </form>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode();
          }}
          className="space-y-3"
        >
          <p className="text-[13px] text-[color:var(--ink-5)]">
            {copy.codeSentPrefix}{' '}
            <span className="font-medium text-[color:var(--ink-1)]">{email}</span>
          </p>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[color:var(--ink-2)]">{copy.codeLabel}</span>
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="fb-input h-11 w-full px-3 text-sm tracking-[0.3em]"
            />
          </label>
          {adminRequired ? (
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[color:var(--ink-2)]">
                {copy.adminPasswordLabel}
              </span>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="fb-input h-11 w-full px-3 text-sm"
              />
            </label>
          ) : null}
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isMembershipNext ? copy.loginContinueMembership : copy.loginContinue}
          </button>
          <p className="text-[11px] leading-[1.45] text-[color:var(--ink-4)]">{copy.spamHint}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
                setMessage(null);
                setResendIn(0);
              }}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              {copy.changeEmail}
            </button>
            <button
              type="button"
              disabled={loading || resendIn > 0}
              onClick={() => void requestCode()}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              {resendIn > 0 ? `${resendIn}${copy.resendWait}` : copy.resendCode}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
