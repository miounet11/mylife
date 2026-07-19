'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  birthDateInputMax,
  birthDateInputMin,
  validateBirthDateString,
} from '@/lib/birth-date-validate';
import { loadRememberedBirthForm, saveRememberedBirthForm } from '@/lib/birth-form-storage';
import { trackClientEvent } from '@/lib/analytics-client';
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
}: {
  toolSlug?: string;
  source?: string;
}) {
  const router = useRouter();
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
      return `真太阳时约 ${sign}${absMin} 分 · ${hhmm}`;
    } catch {
      return null;
    }
  }, [birthDate, birthTime, resolvedLon]);

  useEffect(() => {
    const remembered = loadRememberedBirthForm();
    if (!remembered) return;
    setBirthDate(remembered.birthDate);
    setBirthTime(remembered.birthTime || '12:00');
    setGender(remembered.gender);
    if (remembered.birthPlace) setBirthPlace(remembered.birthPlace);
    setHint('已填入本机记住的出生信息，可直接运行。');
  }, []);

  const validation = birthDate ? validateBirthDateString(birthDate) : null;
  const canSubmit = Boolean(validation?.ok) && !submitting;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const check = validateBirthDateString(birthDate);
    if (!check.ok) {
      setError(check.message || '请填写有效出生日期');
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
        setError(payload?.error || '运行失败，请稍后再试');
        return;
      }

      const sessionId = payload.data?.sessionId;
      if (!sessionId) {
        setError('结果已生成但缺少会话 ID，请重试');
        return;
      }
      router.push(`/tool-result/${sessionId}?source=${encodeURIComponent(source)}`);
    } catch (err) {
      setError(isAbortLikeError(err) ? '运行等待时间过长，请稍后重试' : '网络异常，暂时无法运行');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
    >
      <div className="text-[14px] font-semibold text-[color:var(--ink-1)]">本页直接测</div>
      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
        填出生信息，即时跑「年度主窗口」；无需先出完整报告。
      </p>
      {hint ? <p className="birth-form-hint mt-2">{hint}</p> : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="birth-form-label sm:col-span-1">
          出生日期 <span className="text-[color:var(--alert)]">*</span>
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
          时辰
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="birth-form-control"
          />
        </label>
        <label className="birth-form-label">
          性别
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value === 'female' ? 'female' : 'male')}
            className="birth-form-control"
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>
      </div>

      <div className="mt-2">
        <label className="birth-form-label">
          出生地（可选，用于真太阳时）
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="例如：上海 或 成都 · 104.1°E"
            className="birth-form-control"
          />
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {quickCities.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => setBirthPlace(formatPlaceWithLongitude(city.zh, city.longitude))}
              className="rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5 text-[11px] text-[color:var(--ink-3)] transition hover:border-[color:var(--ink-1)] hover:text-[color:var(--ink-1)]"
            >
              {city.zh}
            </button>
          ))}
        </div>
        {trueSolarHint ? (
          <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">
            {trueSolarHint}
            <span className="ml-1">· 引擎在地点可解析时按经度估算真太阳时</span>
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
            重算中…
          </>
        ) : (
          '用出生信息测年度主窗口'
        )}
      </button>
    </form>
  );
}
