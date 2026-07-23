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
};

export default function LoginForm({
  locale: localeProp,
  nextOverride,
  compact = false,
  onSuccess,
}: LoginFormProps) {
  const { locale: ctxLocale } = useLocale();
  const locale: SiteLocale = localeProp || ctxLocale || 'zh-CN';
  const copy = useMemo(() => loginFormCopy(locale), [locale]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = nextOverride || searchParams.get('next') || '/profile';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRequired, setAdminRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ email: normalized, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || copy.sendFailed);
      setEmail(normalized);
      setAdminRequired(!!data.adminPasswordRequired);
      setStep('code');
      const devHint = data.devCode ? `${copy.devCodePrefix}${data.devCode}` : '';
      setMessage(`${data.message || copy.codeSentDefault}${devHint}`);
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || copy.verifyFailed);
      try {
        localStorage.setItem('life-kline:lead-email', normalized);
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
                setMessage(null);
              }}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              {copy.changeEmail}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void requestCode()}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              {copy.resendCode}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
