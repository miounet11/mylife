'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';
import { FocusHero } from '@/components/layout/focus-hero';
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
  const [intent, setIntent] = useState<IntentKey>(() => normalizeAnalyzeIntent(urlIntent || 'career'));
  const [relation, setRelation] = useState<RelationKey>('self');
  const [name, setName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryBanner, setEntryBanner] = useState<string | null>(null);
  const [timeTouched, setTimeTouched] = useState(false);

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

    const payload = {
      birthDate,
      birthTime: timeUnknown ? '12:00' : birthTime,
      birthPlace: birthPlace.trim() || copy.defaultPlace,
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
    };

    /** Deploy/restart may return 502/503/504 once — retry once after short wait. */
    async function postAnalyze(attempt: number): Promise<Response> {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if ([502, 503, 504].includes(res.status) && attempt < 1) {
          await new Promise((r) => setTimeout(r, 1600));
          return postAnalyze(attempt + 1);
        }
        return res;
      } catch (networkErr) {
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 1600));
          return postAnalyze(attempt + 1);
        }
        throw networkErr;
      }
    }

    try {
      // Primary funnel: full engine + LLM + quality audit (not the thin /api/report agentic-only path).
      const res = await postAnalyze(0);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data.error ||
          data.message ||
          (res.status === 502 || res.status === 503
            ? '服务刚在更新，请再点一次生成'
            : copy.errors.generateFailed);
        throw new Error(msg);
      }

      const reportId = data?.reportId || data?.meta?.reportId;
      if (reportId) {
        window.location.href = `/result/${reportId}?source=${encodeURIComponent(resolvedSource)}&intent=${encodeURIComponent(intent)}&lang=${encodeURIComponent(locale)}`;
        return;
      }

      throw new Error(copy.errors.missingId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.errors.retry);
    } finally {
      setLoading(false);
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
            <FocusHero
              embedded
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
                </label>

                <label className="space-y-2">
                  <span className={fieldLabel}>{copy.birthPlace}</span>
                  <input
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder={copy.placePlaceholder}
                    className="fb-input h-10 min-h-[var(--control-h)] w-full px-3 text-[13px]"
                  />
                  <p className={fieldHint}>{copy.placeHint}</p>
                </label>

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
                { href: '/tools/timing-yearly-window?source=home_birth_quick', label: '年度主窗口' },
                { href: '/tools/daily-sign?source=home_birth_quick', label: '今日一签' },
                { href: '/tools/career-role-fit?source=home_birth_quick', label: '岗位匹配' },
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