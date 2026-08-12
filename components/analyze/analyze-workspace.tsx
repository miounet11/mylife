'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';
import { FeatureImmersionHero } from '@/components/brand/feature-immersion-hero';
import { PortalLayout } from '@/components/layout/portal-layout';
import { PortalRailLeft, PortalRailRight } from '@/components/analyze/portal-rail';
import FreeMembershipClaimBanner from '@/components/membership/free-membership-claim-banner';
import type { SystemCapabilityStats } from '@/lib/system-capability-stats';
import { trackFunnel } from '@/components/funnel-tracker';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/locale-provider';
import { funnelCopy } from '@/lib/i18n/funnel-copy';
import { buildTeacherChatHref } from '@/lib/teachers';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import {
  formatPlaceWithLongitude,
  getQuickPickCities,
  resolveCityLongitude,
  type CityLongitude,
} from '@/lib/geo/city-longitudes';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { loadRememberedBirthForm, saveRememberedBirthForm } from '@/lib/birth-form-storage';

const INTENT_KEYS = ['career', 'wealth', 'relationship', 'yearly'] as const;
type IntentKey = (typeof INTENT_KEYS)[number];

const RELATION_KEYS = [
  'self',
  'spouse',
  'child',
  'parent',
  'sibling',
  'friend',
  'colleague',
  'other',
] as const;
type RelationKey = (typeof RELATION_KEYS)[number];

/** Map deep-link intents (tools/content) onto workspace keys. */
export function normalizeAnalyzeIntent(raw: string | null | undefined): IntentKey {
  const value = `${raw || ''}`.trim().toLowerCase();
  if (value === 'career' || value === 'wealth' || value === 'relationship' || value === 'yearly') {
    return value;
  }
  if (/wealth|money|finance|财|投资|理财/.test(value)) return 'wealth';
  if (/relation|marriage|love|婚|恋|情感|家庭/.test(value)) return 'relationship';
  if (/year|annual|timing|event|流年|大运|窗口|择时/.test(value)) return 'yearly';
  if (/career|job|work|事业|职业|岗位|跳槽/.test(value)) return 'career';
  return 'career';
}

export default function AnalyzeWorkspace({
  stats,
  activePath = '/analyze',
  source = 'analyze_workspace',
  initialIntent,
  initialSource,
}: {
  stats: SystemCapabilityStats;
  activePath?: string;
  source?: string;
  /** Server-passed URL intent (optional; client searchParams also applied). */
  initialIntent?: string | null;
  initialSource?: string | null;
}) {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const copy = useMemo(() => funnelCopy(locale), [locale]);
  const intentOptions = useMemo(
    () => INTENT_KEYS.map((key) => ({ key, label: copy.intent[key] })),
    [copy],
  );
  const relationOptions = useMemo(
    () => RELATION_KEYS.map((key) => ({ key, label: copy.relation[key] })),
    [copy],
  );

  const urlIntent = searchParams.get('intent') || initialIntent || '';
  const urlSource = searchParams.get('source') || searchParams.get('from') || initialSource || '';
  const resolvedSource = useMemo(
    () => `${urlSource || source || 'analyze_workspace'}`.trim() || 'analyze_workspace',
    [urlSource, source],
  );

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [timeUnknown, setTimeUnknown] = useState(false);
  /** 晚子时(23:00–23:59)是否按次日日柱（sect1）。默认不换日（sect2），与主流排盘一致。 */
  const [lateZiNextDay, setLateZiNextDay] = useState(false);
  const [intent, setIntent] = useState<IntentKey>(() => normalizeAnalyzeIntent(urlIntent || 'career'));
  const [relation, setRelation] = useState<RelationKey>('self');
  const [name, setName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState<{
    progress: number;
    label: string;
    detail?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entryBanner, setEntryBanner] = useState<string | null>(null);
  const [timeTouched, setTimeTouched] = useState(false);

  const quickCities = useMemo(() => getQuickPickCities(), []);
  const resolvedLon = useMemo(() => resolveCityLongitude(birthPlace), [birthPlace]);

  /** Educational client preview only — engine applies true solar when hour known + place resolves. */
  const trueSolarPreview = useMemo(() => {
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !resolvedLon) return null;
    if (timeUnknown) return null;
    const [y, m, d] = birthDate.split('-').map(Number);
    const [hh, mm] = (birthTime || '12:00').split(':').map((n) => Number(n) || 0);
    if (!y || !m || !d) return null;
    try {
      const st = calculateTrueSolarTime(y, m, d, hh, mm, 0, resolvedLon.longitude, 8);
      const sign = st.correctionMinutes >= 0 ? '+' : '−';
      const absMin = Math.abs(Math.round(st.correctionMinutes));
      const hhmm = `${String(st.hour).padStart(2, '0')}:${String(st.minute).padStart(2, '0')}`;
      return {
        label: `真太阳时约 ${sign}${absMin} 分 · ${hhmm}`,
        labelEn: `True solar ~ ${sign}${absMin} min · ${hhmm}`,
        correctionMinutes: st.correctionMinutes,
      };
    } catch {
      return null;
    }
  }, [birthDate, birthTime, resolvedLon, timeUnknown]);

  const activeCityId = useMemo(() => {
    if (!birthPlace) return null;
    const hit = quickCities.find(
      (c) => birthPlace.includes(c.zh) || birthPlace.toLowerCase().includes(c.en.toLowerCase()),
    );
    return hit?.id ?? null;
  }, [birthPlace, quickCities]);

  const step = birthDate && (timeUnknown || birthTime) && birthPlace ? 2 : birthDate ? 1 : 0;
  const canSubmit = !!birthDate && !!birthPlace;

  useEffect(() => {
    // Prefill from deep links (knowledge / tools / chat / dimensions)
    const nextIntent = normalizeAnalyzeIntent(searchParams.get('intent') || initialIntent);
    setIntent(nextIntent);

    const place = searchParams.get('birthPlace') || searchParams.get('place');
    if (place) setBirthPlace(place);

    const date = searchParams.get('birthDate') || searchParams.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setBirthDate(date);

    const time = searchParams.get('birthTime') || searchParams.get('time');
    if (time && /^\d{1,2}:\d{2}/.test(time)) setBirthTime(time.slice(0, 5));

    const g = searchParams.get('gender');
    if (g === 'male' || g === 'female') setGender(g);

    const n = searchParams.get('name');
    if (n) setName(n.slice(0, 32));

    if (searchParams.get('timeUnknown') === '1' || searchParams.get('unknowhour') === '1') {
      setTimeUnknown(true);
    }

    // Local remembered defaults fill only fields the URL did not provide
    const remembered = loadRememberedBirthForm();
    if (remembered) {
      if (!date && remembered.birthDate) setBirthDate(remembered.birthDate);
      if (!time && remembered.birthTime) setBirthTime(remembered.birthTime);
      if (g !== 'male' && g !== 'female' && remembered.gender) setGender(remembered.gender);
      if (!place && remembered.birthPlace) setBirthPlace(remembered.birthPlace);
      if (!n && remembered.name) setName(remembered.name.slice(0, 32));
    }

    const from = searchParams.get('from') || searchParams.get('source') || initialSource || '';
    if (from.includes('chat')) {
      setEntryBanner(copy.banner.chat);
    } else if (from.includes('knowledge') || from.includes('content') || from.includes('case') || from.includes('insight')) {
      setEntryBanner(copy.banner.content);
    } else if (from.includes('tool') || from.includes('dimension')) {
      setEntryBanner(copy.banner.tool);
    } else {
      setEntryBanner(null);
    }
  }, [searchParams, initialIntent, initialSource, copy]);

  function pickCity(city: CityLongitude) {
    setBirthPlace(formatPlaceWithLongitude(city.zh, city.longitude));
  }

  useEffect(() => {
    trackFunnel('report_page_view', {
      source: resolvedSource,
      intent,
      has_prefill: urlIntent || urlSource ? 'true' : 'false',
    });
  }, [resolvedSource, intent, urlIntent, urlSource]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();
        if (data?.user?.email) {
          setSessionEmail(data.user.email);
          setEmail((current) => current || data.user.email);
        }
        // Prefill name from session when URL didn't provide one
        if (data?.user?.name && !searchParams.get('name')) {
          setName((current) => current || String(data.user.name).slice(0, 32));
        }
      } catch {
        // ignore
      }
    };
    void loadSession();
  }, [searchParams]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    // exact only when user set a time or we already know accuracy; else range (not over-trust hour).
    const resolvedAccuracy = timeUnknown
      ? 'unknown'
      : timeTouched || (birthTime && birthTime !== '12:00')
        ? 'exact'
        : 'range';
    const relationLabel = relationOptions.find((item) => item.key === relation)?.label || copy.relation.self;
    trackFunnel('report_generate_click', {
      intent,
      time_unknown: timeUnknown ? 'true' : 'false',
      path: 'analyze',
      source: resolvedSource,
      relation,
    });

    const resolvedPlace = birthPlace.trim() || copy.defaultPlace;
    const clockTime = timeUnknown ? '12:00' : birthTime;
    const payload = {
      birthDate,
      birthTime: clockTime,
      birthPlace: resolvedPlace,
      gender,
      intent,
      name: name.trim() || copy.guestName,
      email: email.trim() || sessionEmail || undefined,
      birthAccuracy: resolvedAccuracy,
      source: resolvedSource,
      unknowhour: timeUnknown ? 1 : 0,
      relation,
      relationLabel,
      locale,
      // Engine options: keep clock time identity aligned with what user typed
      longitude: resolvedLon?.longitude,
      useSolarTime: !timeUnknown && Boolean(resolvedLon?.longitude),
      useSeparateZiHour: !timeUnknown && lateZiNextDay,
      timezone: 8,
    };

    saveRememberedBirthForm({
      birthDate,
      birthTime: timeUnknown ? '12:00' : birthTime,
      gender,
      name: name.trim(),
      birthPlace: resolvedPlace,
    });

    /** Progressive NDJSON analyze (Experience Kernel T0→T1 feel). Fallback to JSON if stream unsupported. */
    async function postAnalyzeStream(attempt: number): Promise<string> {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-analyze-stream': '1',
            Accept: 'application/x-ndjson',
          },
          body: JSON.stringify(payload),
        });
        if ([502, 503, 504].includes(res.status) && attempt < 1) {
          await new Promise((r) => setTimeout(r, 1600));
          return postAnalyzeStream(attempt + 1);
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg =
            (data as { error?: string; message?: string }).error ||
            (data as { message?: string }).message ||
            (res.status === 502 || res.status === 503
              ? '服务刚在更新，请再点一次生成'
              : copy.errors.generateFailed);
          throw new Error(msg);
        }

        const contentType = `${res.headers.get('content-type') || ''}`;
        // Non-stream fallback (proxy stripped NDJSON)
        if (!contentType.includes('ndjson') && !contentType.includes('stream')) {
          const data = await res.json().catch(() => ({}));
          const reportId = (data as { reportId?: string })?.reportId;
          if (reportId) return reportId;
          throw new Error(copy.errors.missingId);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error(copy.errors.generateFailed);
        const decoder = new TextDecoder();
        let buffer = '';
        let reportId = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let event: {
              type?: string;
              progress?: number;
              label?: string;
              detail?: string;
              reportId?: string;
              error?: string;
            };
            try {
              event = JSON.parse(trimmed);
            } catch {
              continue;
            }
            if (event.type === 'stage') {
              setStreamProgress({
                progress: typeof event.progress === 'number' ? event.progress : 0,
                label: event.label || '分析进行中',
                detail: event.detail,
              });
            } else if (event.type === 'complete' && event.reportId) {
              reportId = event.reportId;
            } else if (event.type === 'error') {
              throw new Error(event.error || copy.errors.generateFailed);
            }
          }
        }
        if (!reportId) throw new Error(copy.errors.missingId);
        return reportId;
      } catch (networkErr) {
        if (attempt < 1 && networkErr instanceof TypeError) {
          await new Promise((r) => setTimeout(r, 1600));
          return postAnalyzeStream(attempt + 1);
        }
        throw networkErr;
      }
    }

    try {
      setStreamProgress({ progress: 2, label: '正在提交测算…' });
      const reportId = await postAnalyzeStream(0);
      window.location.href = `/result/${reportId}?source=${encodeURIComponent(resolvedSource)}&intent=${encodeURIComponent(intent)}&lang=${encodeURIComponent(locale)}`;
      return;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.errors.retry);
    } finally {
      setLoading(false);
      setStreamProgress(null);
    }
  }

  const fieldLabel = 'text-[12px] font-medium text-[color:var(--ink-2)]';
  const fieldHint = 'text-[12px] leading-[1.45] text-[color:var(--ink-5)]';
  const chipBase =
    'rounded-[var(--radius)] border px-2.5 py-1.5 text-[12px] font-medium transition';
  const chipActive =
    'border-[color:var(--ink-1)] bg-[color:var(--ink-1)] text-white';
  const chipIdle =
    'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--hairline-strong)] hover:text-[color:var(--ink-1)]';

  /** 站内导航：就是链接，不要花图标 */
  const quietLink =
    'text-[13px] text-[color:var(--ink-2)] underline-offset-2 transition hover:text-[color:var(--ink-1)] hover:underline';
  const muteNote = 'text-[12px] leading-[1.55] text-[color:var(--ink-5)]';

  return (
    <PortalLayout
      left={<PortalRailLeft activePath={activePath} />}
      right={<PortalRailRight />}
      main={
        <div className="mx-auto w-full max-w-[var(--content-max)] space-y-4 md:space-y-5">
          {entryBanner ? (
            <p className={cn('rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-2', muteNote)}>
              {entryBanner}
            </p>
          ) : null}

          <FreeMembershipClaimBanner source="analyze_workspace" compact />

          <PageIllustrationStrip
            surface="home/workspace"
            title="使用路径"
            compact
            limit={1}
            className="mb-1"
          />

          {/* Linear-clean：有报告用户直接进顾问开场，不打断排盘主路径 */}
          <section className="border-y border-[color:var(--hairline)] py-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">顾问</div>
                <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
                  已有报告？直接开场
                </h2>
                <p className="mt-1 max-w-xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
                  不预填长问题。老师先开场，点议题或一键开口即可追问
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <Link
                  href={buildTeacherChatHref({
                    teacherId: 'overview',
                    source: 'home_consultant_opening',
                  })}
                  className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
                >
                  总览开场 →
                </Link>
                <Link
                  href="/teachers"
                  className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
                >
                  全部老师
                </Link>
              </div>
            </div>
          </section>

          {/* 主表单：页面唯一重块 */}
          <section id="analyze-workspace" className="fb-card overflow-hidden">
            <FeatureImmersionHero
              surfaceKey="analyze"
              priority
              compact
              className="mb-0 [&>div:last-child]:px-4 md:[&>div:last-child]:px-5"
              eyebrow={copy.heroEyebrow}
              title={copy.heroTitle}
              description={
                <span className="text-[13px] leading-[1.55] text-[color:var(--ink-5)] md:text-[14px]">
                  {copy.heroDescription}
                </span>
              }
              footer={
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                  <Link href="/docs/birth-info" className={quietLink}>
                    {copy.howTo}
                  </Link>
                  <span className="text-[color:var(--ink-5)]">·</span>
                  <Link href="/docs/true-solar-time" className={quietLink}>
                    {copy.trueSolar}
                  </Link>
                </div>
              }
            />

            <div className="px-4 py-5 md:px-5 md:py-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <span className={fieldLabel}>{copy.birthTime}</span>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="fb-input h-10 min-h-[var(--control-h)] w-full px-3 text-[13px]"
                    />
                    {!timeUnknown ? (
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => {
                          setBirthTime(e.target.value);
                          setTimeTouched(true);
                        }}
                        className="fb-input h-10 min-h-[var(--control-h)] w-full px-3 text-[13px]"
                      />
                    ) : null}
                  </div>
                  <label className="mt-1 flex items-center gap-2 text-[12px] text-[color:var(--ink-3)]">
                    <input
                      type="checkbox"
                      checked={timeUnknown}
                      onChange={(e) => setTimeUnknown(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[color:var(--hairline-strong)]"
                    />
                    {copy.timeUnknown}
                  </label>
                  {!timeUnknown ? (
                    <label className="mt-1.5 flex items-start gap-2 text-[12px] leading-snug text-[color:var(--ink-3)]">
                      <input
                        type="checkbox"
                        checked={lateZiNextDay}
                        onChange={(e) => {
                          setLateZiNextDay(e.target.checked);
                          setShowAdvanced(true);
                        }}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[color:var(--hairline-strong)]"
                      />
                      <span>
                        晚子时换日
                        <span className="mt-0.5 block text-[11px] text-[color:var(--ink-5)]">
                          勾选后，当日 23:00–23:59 按次日日柱排盘（早子时仍属次日）。默认不换日。
                        </span>
                      </span>
                    </label>
                  ) : null}
                </label>

                <div className="space-y-2">
                  <span className={fieldLabel}>{copy.birthPlace}</span>
                  <input
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder={copy.placePlaceholder}
                    className="fb-input h-10 min-h-[var(--control-h)] w-full px-3 text-[13px]"
                    aria-label={copy.birthPlace}
                  />
                  <div>
                    <div className={cn('mb-1.5', fieldHint)}>{copy.cityQuickPick}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickCities.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => pickCity(city)}
                          className={cn(
                            chipBase,
                            activeCityId === city.id ? chipActive : chipIdle,
                          )}
                        >
                          {locale === 'en' ? city.en : city.zh}
                        </button>
                      ))}
                    </div>
                  </div>
                  {timeUnknown ? (
                    <p className={fieldHint}>{copy.trueSolarSkippedUnknownHour}</p>
                  ) : trueSolarPreview ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          chipBase,
                          'border-[color:var(--hairline-strong)] bg-[color:var(--bg-sunken)]/60 text-[color:var(--ink-2)]',
                        )}
                        title={copy.trueSolarAppliedNote}
                      >
                        {locale === 'en' ? trueSolarPreview.labelEn : trueSolarPreview.label}
                      </span>
                      <span className={fieldHint}>{copy.trueSolarAppliedNote}</span>
                    </div>
                  ) : birthPlace.trim() && !resolvedLon ? (
                    <p className={fieldHint}>{copy.trueSolarNeedPlace}</p>
                  ) : (
                    <p className={fieldHint}>{copy.placeHint}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <span className={fieldLabel}>{copy.gender}</span>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGender(value)}
                        className={cn(
                          'h-10 min-h-[var(--control-h)] flex-1 rounded-[var(--radius)] border text-[13px] font-medium transition',
                          gender === value ? chipActive : chipIdle,
                        )}
                      >
                        {value === 'male' ? copy.male : copy.female}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className={fieldLabel}>{copy.whoseChart}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {relationOptions.map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      onClick={() => setRelation(tag.key)}
                      className={cn(chipBase, relation === tag.key ? chipActive : chipIdle)}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className={fieldLabel}>{copy.themeLabel}</div>
                  <Link
                    href={`/dimensions?source=analyze_intent_${intent}`}
                    className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                  >
                    {copy.dimensionsShortcut}
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {intentOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setIntent(option.key)}
                      className={cn(chipBase, intent === option.key ? chipActive : chipIdle)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 p-3.5 md:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-[color:var(--ink-2)]">
                      {copy.emailStripTitle}
                    </div>
                    <p className={cn('mt-1', fieldHint)}>{copy.emailStripBody}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-[color:var(--ink-5)]">可选</span>
                </div>
                <label className="mt-3 block space-y-1.5">
                  <span className="sr-only">{copy.emailRecommend}</span>
                  <input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={copy.emailPlaceholder}
                    className="fb-input h-9 w-full px-3 text-[13px]"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="mt-5 flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-3)] transition hover:text-[color:var(--ink-1)]"
              >
                <ChevronDown className={cn('h-3.5 w-3.5 transition', showAdvanced ? 'rotate-180' : '')} />
                {copy.advanced}
              </button>

              {showAdvanced ? (
                <div className="mt-3 grid gap-4 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 p-3.5 md:grid-cols-2 md:p-4">
                  <label className="space-y-2 md:col-span-2">
                    <span className={fieldLabel}>{copy.nameOptional}</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      className="fb-input h-9 w-full px-3 text-[13px]"
                    />
                  </label>
                  <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 text-[12px] leading-[1.5] text-[color:var(--ink-3)] md:col-span-2">
                    {copy.solarDefault}
                  </div>
                </div>
              ) : null}

              {error ? (
                <AlertBanner className="mt-4 text-[13px] font-medium">{error}</AlertBanner>
              ) : null}

              {loading && streamProgress ? (
                <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)]/70 px-3 py-3">
                  <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[color:var(--signal-strong)]">
                    <span>{streamProgress.label}</span>
                    <span className="font-mono tabular-nums">
                      {Math.min(99, Math.max(0, streamProgress.progress))}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--paper)]">
                    <div
                      className="h-full rounded-full bg-[color:var(--signal)] transition-all duration-300"
                      style={{
                        width: `${Math.min(99, Math.max(4, streamProgress.progress))}%`,
                      }}
                    />
                  </div>
                  {streamProgress.detail ? (
                    <p className="mt-2 text-[11px] leading-[1.5] text-[color:var(--ink-4)]">
                      {streamProgress.detail}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] leading-[1.5] text-[color:var(--ink-4)]">
                      先锁定命盘结构，再完善正文与行动清单——无需等待全部完成再离开。
                    </p>
                  )}
                </div>
              ) : null}

              <div className="lk-sticky-cta">
                <button
                  type="button"
                  disabled={!canSubmit || loading}
                  onClick={() => void handleSubmit()}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? copy.submitLoading : canSubmit ? copy.submitReady : copy.submitDisabled}
                  {!loading && canSubmit ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
                <p className="mt-2 text-center text-[11px] leading-relaxed text-[color:var(--ink-5)]">
                  报告将给出你的{' '}
                  <span className="font-semibold text-[color:var(--ink-3)]">人生 K 线</span>
                  （事业 / 财 / 关系 / 健康多年趋势）+ 结构判断与行动建议。
                  {' '}
                  <a
                    href="#life-kline-showcase"
                    className="underline-offset-2 hover:underline"
                  >
                    先看示例曲线
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* 下游入口：合并为一块，避免多卡片错位堆叠 */}
          <section
            aria-label="继续探索"
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-4 py-4 md:px-5"
          >
            <div className="text-[12px] font-medium text-[color:var(--ink-5)]">填生日即可测</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {[
                { href: '/tools/naming?source=home_birth_quick', label: '起名工坊' },
                { href: '/tools/fengshui-space?source=home_birth_quick', label: '空间场' },
                { href: '/tools/physiognomy?source=home_birth_quick', label: '面相' },
                { href: '/tools/palmistry?source=home_birth_quick', label: '手相' },
                { href: '/hehun?source=home_birth_quick', label: '合婚双盘' },
                { href: '/tools?source=home_birth_quick', label: '全部工具' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13px] font-medium text-[color:var(--ink-2)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-[color:var(--hairline)] pt-3">
              <div className="text-[12px] font-medium text-[color:var(--ink-5)]">站点入口</div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {[
                  { href: '/dimensions', label: copy.openDimensions || '十维度' },
                  { href: '/teachers', label: '请老师' },
                  { href: '/predictions', label: copy.predictions || '预测回访' },
                  { href: '/events', label: '事件日历' },
                  { href: '/knowledge', label: copy.knowledge || '知识库' },
                  { href: '/cases', label: '案例' },
                  { href: '/profile', label: '资料' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className={quietLink}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {copy.tools?.length ? (
              <div className="mt-4 border-t border-[color:var(--hairline)] pt-3">
                <div className="text-[12px] font-medium text-[color:var(--ink-5)]">常用工具</div>
                <ul className="mt-1 divide-y divide-[color:var(--hairline)]">
                  {copy.tools.slice(0, 4).map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
                      >
                        <span className="text-[13px] text-[color:var(--ink-1)] group-hover:underline">
                          {item.title}
                        </span>
                        <span className={cn('shrink-0', muteNote)}>{item.cta || '打开'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {copy.faq?.length ? (
            <section className="px-0.5">
              <div className={cn('mb-2', muteNote)}>{copy.faqTitle || '说明'}</div>
              <dl className="space-y-3">
                {copy.faq.slice(0, 4).map(([q, a]) => (
                  <div key={q}>
                    <dt className="text-[13px] font-medium text-[color:var(--ink-3)]">{q}</dt>
                    <dd className={cn('mt-1', muteNote)}>{a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {/* stats 仅淡化一行数字，不作花哨面板 */}
          {stats ? (
            <p className={cn('px-0.5', muteNote)}>
              {[
                stats.publishedKnowledgeCount != null
                  ? `知识 ${stats.publishedKnowledgeCount}`
                  : null,
                stats.publishedCaseCount != null ? `案例 ${stats.publishedCaseCount}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </div>
      }
    />
  );
}