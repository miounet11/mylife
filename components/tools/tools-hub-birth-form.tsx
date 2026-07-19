'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  birthDateInputMax,
  birthDateInputMin,
  validateBirthDateString,
} from '@/lib/birth-date-validate';
import { loadRememberedBirthForm, saveRememberedBirthForm } from '@/lib/birth-form-storage';
import { trackClientEvent } from '@/lib/analytics-client';
import { toolsHubCopy } from '@/lib/i18n/hub-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';
import {
  formatPlaceWithLongitude,
  getQuickPickCities,
  resolveCityLongitude,
} from '@/lib/geo/city-longitudes';
import { calculateTrueSolarTime } from '@/lib/solar-time';

const DEFAULT_TOOL = 'timing-yearly-window';
const TOOL_RUN_TIMEOUT_MS = 45_000;

/**
 * Tools hub conversion form: fill birth → run primary free tool immediately.
 */
export default function ToolsHubBirthForm({
  toolSlug = DEFAULT_TOOL,
  source = 'tools_hub_inline_birth',
  locale: localeProp,
}: {
  toolSlug?: string;
  source?: string;
  /** Optional override; defaults to locale from LocaleProvider. */
  locale?: SiteLocale;
}) {
  const router = useRouter();
  const { locale: ctxLocale } = useLocale();
  const locale = localeProp || ctxLocale;
  const copy = useMemo(() => toolsHubCopy(locale).form, [locale]);

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const quickCities = useMemo(() => getQuickPickCities().slice(0, 6), []);
  const resolvedLon = useMemo(() => resolveCityLongitude(birthPlace), [birthPlace]);
  const trueSolarHint = useMemo(() => {
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !resolvedLon) return null;
    const [y, m, d] = birthDate.split('-').map(Number);
    const [hh, mm] = (birthTime || '12:00').split(':').map((n) => Number(n) || 0);
    try {
      const st = calculateTrueSolarTime(y, m, d, hh, mm, 0, resolvedLon.longitude, 8);
      const sign = st.correctionMinutes >= 0 ? '+' : '−';
      const absMin = Math.abs(Math.round(st.correctionMinutes));
      const hhmm = `${String(st.hour).padStart(2, '0')}:${String(st.minute).padStart(2, '0')}`;
      return copy.trueSolarApprox(sign, absMin, hhmm);
    } catch {
      return null;
    }
  }, [birthDate, birthTime, resolvedLon, copy]);

  useEffect(() => {
    const remembered = loadRememberedBirthForm();
    if (!remembered) return;
    setBirthDate(remembered.birthDate);
    setBirthTime(remembered.birthTime || '12:00');
    setGender(remembered.gender);
    if (remembered.birthPlace) setBirthPlace(remembered.birthPlace);
    setHint(copy.rememberedHint);
  }, [copy.rememberedHint]);

  const validation = birthDate ? validateBirthDateString(birthDate) : null;
  const canSubmit = Boolean(validation?.ok) && !submitting;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const check = validateBirthDateString(birthDate);
    if (!check.ok) {
      setError(check.message || copy.invalidBirthDate);
      return;
    }

    setSubmitting(true);
    setError('');
    void trackClientEvent({
      eventName: 'tool_run_started',
      page: '/tools',
      meta: {
        phase: 'client_intent',
        confirmed: false,
        toolSlug,
        birthOnly: true,
        source,
      },
    });

    try {
      const place = birthPlace.trim();
      saveRememberedBirthForm({
        birthDate: check.dateKey || birthDate,
        birthTime: birthTime || '12:00',
        gender,
        ...(place ? { birthPlace: place } : {}),
      });

      const { response, data: payload } = await fetchJsonWithTimeout<any>('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug,
          birthDate: check.dateKey || birthDate,
          birthTime: birthTime || '12:00',
          gender,
          ...(place ? { birthPlace: place } : {}),
          attribution: {
            eventName: 'tool_run_started',
            page: '/tools',
            source,
            toolSlug,
            timestamp: new Date().toISOString(),
          },
        }),
        timeoutMs: TOOL_RUN_TIMEOUT_MS,
        timeoutReason: 'tool-run-timeout',
      });

      if (!response.ok || !payload?.success) {
        setError(payload?.error || copy.runFailed);
        return;
      }

      const sessionId = payload.data?.sessionId;
      if (!sessionId) {
        setError(copy.missingSession);
        return;
      }
      router.push(`/tool-result/${sessionId}?source=${encodeURIComponent(source)}`);
    } catch (err) {
      setError(isAbortLikeError(err) ? copy.timeout : copy.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
    >
      <div className="text-[14px] font-semibold text-[color:var(--ink-1)]">{copy.title}</div>
      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
        {copy.description}
      </p>
      {hint ? <p className="birth-form-hint mt-2">{hint}</p> : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="birth-form-label sm:col-span-1">
          {copy.birthDate} <span className="text-[color:var(--alert)]">*</span>
          <input
            type="date"
            required
            min={birthDateInputMin()}
            max={birthDateInputMax()}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="birth-form-control"
          />
        </label>
        <label className="birth-form-label">
          {copy.birthTime}
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="birth-form-control"
          />
        </label>
        <label className="birth-form-label">
          {copy.gender}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value === 'female' ? 'female' : 'male')}
            className="birth-form-control"
          >
            <option value="male">{copy.male}</option>
            <option value="female">{copy.female}</option>
          </select>
        </label>
      </div>

      <div className="mt-2">
        <label className="birth-form-label">
          {copy.birthPlace}
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder={copy.birthPlacePlaceholder}
            className="birth-form-control"
          />
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {quickCities.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() =>
                setBirthPlace(
                  formatPlaceWithLongitude(
                    locale === 'en' ? city.en || city.zh : city.zh,
                    city.longitude,
                  ),
                )
              }
              className="rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5 text-[11px] text-[color:var(--ink-3)] transition hover:border-[color:var(--ink-1)] hover:text-[color:var(--ink-1)]"
            >
              {locale === 'en' ? city.en || city.zh : city.zh}
            </button>
          ))}
        </div>
        {trueSolarHint ? (
          <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">
            {trueSolarHint}
            <span className="ml-1">{copy.trueSolarEngineNote}</span>
          </p>
        ) : null}
      </div>

      {birthDate && validation && !validation.ok ? (
        <p className="mt-2 text-[12px] text-[color:var(--alert)]">{validation.message}</p>
      ) : null}
      {error ? (
        <p className="mt-2 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-[12px] text-[color:var(--alert)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-3 inline-flex h-10 min-h-[var(--control-h)] w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--ink-1)] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {copy.submitting}
          </>
        ) : (
          copy.submit
        )}
      </button>
    </form>
  );
}
