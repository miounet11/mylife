'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/components/i18n/locale-provider';
import { AppPage } from '@/components/layout/app-page';
import { AlertBanner } from '@/components/layout/alert-banner';
import { FocusHero } from '@/components/layout/focus-hero';
import { PortalLayout } from '@/components/layout/portal-layout';
import { ProfileRailRight } from '@/components/profile/profile-rail';
import FreeMembershipClaimBanner from '@/components/membership/free-membership-claim-banner';
import AccountSecurityCard from '@/components/auth/account-security-card';
import AnalyticsPageView from '@/components/analytics-page-view';
import ResultCtaLink from '@/components/result-cta-link';
import ProgressiveProfileHub from '@/components/profile/progressive-profile-hub';
import CohortMemoryCard from '@/components/profile/cohort-memory-card';
import ResumeBar from '@/components/resume-bar';
import ToolHistoryPanel from '@/components/tool-history-panel';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import { profilePageCopy } from '@/lib/i18n/profile-copy';
import { buildTeacherChatHref } from '@/lib/teachers';
import {
  formatFortuneBirthLine,
  formatFortunePillars,
  profileDisplayName,
} from '@/lib/profile-page';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import { resolveResumeTarget } from '@/lib/resume-target';
import { appendSourceToHref } from '@/lib/source-url';
import { toEventViewModels, type EventTransportRecord } from '@/lib/event-view';
import { abortControllerRef, fetchJsonWithTimeout } from '@/lib/utils';

const ImportantEvents = dynamic(() => import('@/components/important-events'), {
  loading: () => <EventsSkeleton />,
});

type ProfileResponse = {
  success: boolean;
  data?: {
    user: Record<string, unknown>;
    fortunes: Record<string, unknown>[];
    events: EventTransportRecord[];
  };
  user?: Record<string, unknown>;
  fortunes?: Record<string, unknown>[];
  events?: EventTransportRecord[];
  error?: string;
};

type UpdatesSummaryResponse = {
  success: boolean;
  authenticated?: boolean;
  data?: {
    email?: string | null;
    subscription?: {
      email: string;
      status: string;
      source?: string;
      tags?: string[];
      updatedAt?: string | null;
    } | null;
    reportCount?: number;
    activeUpgradeCount?: number;
    completedUpgradeCount?: number;
    latestReport?: {
      id: string;
      name?: string | null;
      qualityScore?: number | null;
      qualityGrade?: string | null;
    } | null;
    latestDigest?: {
      id: string;
      cycleKey?: string | null;
      status?: string | null;
      reason?: string | null;
      reportId?: string | null;
      createdAt?: string | null;
    } | null;
  } | null;
};

const PROFILE_HISTORY_TIMEOUT_MS = 12_000;
const PROFILE_UPDATES_SUMMARY_TIMEOUT_MS = 5_000;

export default function ProfilePage() {
  const { locale } = useLocale();
  const copy = useMemo(() => profilePageCopy(locale), [locale]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [fortunes, setFortunes] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<EventTransportRecord[]>([]);
  const [updatesSummary, setUpdatesSummary] = useState<UpdatesSummaryResponse['data'] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const historyControllerRef = { current: null as AbortController | null };
    const updatesControllerRef = { current: null as AbortController | null };

    const loadHistory = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileResponse>('/api/history', {
          cache: 'no-store',
          timeoutMs: PROFILE_HISTORY_TIMEOUT_MS,
          timeoutReason: 'profile-history-timeout',
          controllerRef: historyControllerRef,
        });
        if (cancelled) return;

        if (!response.ok || !data.success) {
          setError(data.error || '__load_failed__');
          return;
        }

        setUser(data.data?.user || data.user || null);
        setFortunes(data.data?.fortunes || data.fortunes || []);
        setEvents(data.data?.events || data.events || []);
      } catch {
        if (!cancelled) setError('__network__');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadUpdatesSummary = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<UpdatesSummaryResponse>('/api/updates/summary', {
          cache: 'no-store',
          timeoutMs: PROFILE_UPDATES_SUMMARY_TIMEOUT_MS,
          timeoutReason: 'profile-updates-summary-timeout',
          controllerRef: updatesControllerRef,
        });
        if (!cancelled && response.ok && data.success) {
          setUpdatesSummary(data.data || null);
        }
      } catch {
        // optional
      }
    };

    void loadHistory();
    void loadUpdatesSummary();

    return () => {
      cancelled = true;
      abortControllerRef(historyControllerRef, 'profile-page-unmounted');
      abortControllerRef(updatesControllerRef, 'profile-page-unmounted');
    };
  }, []);

  const displayError =
    error === '__load_failed__'
      ? copy.loadFailed
      : error === '__network__'
        ? copy.networkError
        : error;

  const mappedEvents = useMemo(() => toEventViewModels(events || []), [events]);

  const latestFortune = fortunes[0] as Record<string, unknown> | undefined;
  const latestResultId = latestFortune?.id ? String(latestFortune.id) : undefined;
  const pageSource = 'profile_page';
  const displayName = profileDisplayName(user, latestFortune);
  const pillarSummary = formatFortunePillars(latestFortune);
  const birthLine = formatFortuneBirthLine(latestFortune);

  const resumeTarget = useMemo(() => {
    if (!fortunes.length && !events.length) return null;
    return resolveResumeTarget({
      recentChat: [],
      events: (events as any[]) || [],
      reports: (fortunes as any[]) || [],
    });
  }, [fortunes, events]);

  const sourceCtaStrategy = buildSourceCtaStrategy(pageSource);
  const latestReportHref = latestResultId
    ? appendSourceToHref(`/result/${latestResultId}`, pageSource)
    : '/analyze';
  const profileChatHref = latestResultId
    ? buildReportContinueChatHref({
        reportId: latestResultId,
        teacher: 'overview',
        source: pageSource,
        ctaStrategyKey: sourceCtaStrategy.strategyKey,
        sourceFamily: sourceCtaStrategy.sourceFamily,
      })
    : buildTeacherChatHref({
        teacherId: 'overview',
        source: `${pageSource || 'profile'}_opening`,
      });
  const settingsHref = latestResultId
    ? `/profile/settings?fortuneId=${encodeURIComponent(latestResultId)}`
    : '/profile/settings';
  const hasProfileData = fortunes.length > 0 || mappedEvents.length > 0;
  const ctaMeta = {
    source: pageSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
    reportId: latestResultId || null,
  };

  return (
    <AppPage
      header={{
        ctaHref: latestResultId ? latestReportHref : '/analyze',
        ctaLabel: latestResultId ? copy.headerCtaOpen : copy.headerCtaAsk,
        ctaAnalytics: {
          page: '/profile',
          target: latestResultId ? 'profile_header_latest_report' : 'profile_header_analyze',
          meta: ctaMeta,
        },
      }}
    >
      <div data-page="profile" className="w-full min-w-0">
        <AnalyticsPageView
          eventName="profile_page_viewed"
          page="/profile"
          meta={{
            hasProfileData,
            fortuneCount: fortunes.length,
            eventCount: mappedEvents.length,
            hasSubscription: !!updatesSummary?.subscription,
          }}
        />

        <FocusHero
          eyebrow={copy.heroEyebrow}
          title={hasProfileData && displayName ? displayName : hasProfileData ? copy.heroTitle : copy.heroTitleEmpty}
          description={
            hasProfileData ? (
              <div className="space-y-1">
                {pillarSummary ? (
                  <div className="font-mono text-[14px] text-[color:var(--ink-2)]">{pillarSummary}</div>
                ) : null}
                {birthLine ? <div className="text-[13px] text-[color:var(--ink-4)]">{birthLine}</div> : null}
                <div>{copy.heroDescription}</div>
              </div>
            ) : (
              copy.heroDescriptionEmpty
            )
          }
          actions={
            <>
              <ResultCtaLink
                href={latestReportHref}
                page="/profile"
                target={latestResultId ? 'profile_hero_latest_report' : 'profile_hero_analyze'}
                className="font-semibold text-[color:var(--ink-1)] underline-offset-2 hover:underline"
                meta={{ ...ctaMeta, surface: 'profile_hero' }}
              >
                {latestResultId ? copy.openLatestReport : copy.startAnalyze}
              </ResultCtaLink>
              {latestResultId ? (
                <ResultCtaLink
                  href={profileChatHref}
                  page="/profile"
                  target="profile_hero_chat"
                  className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                  meta={{ ...ctaMeta, surface: 'profile_hero', mode: 'opening' }}
                >
                  {copy.consultantOpen}
                </ResultCtaLink>
              ) : null}
              <ResultCtaLink
                href={settingsHref}
                page="/profile"
                target="profile_hero_settings"
                className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                meta={{ ...ctaMeta, surface: 'profile_hero' }}
              >
                {copy.editProfile}
              </ResultCtaLink>
            </>
          }
        />

        {resumeTarget ? <ResumeBar target={resumeTarget} surface="profile" /> : null}

        <PortalLayout
          main={
            <div className="space-y-5">
              {displayError ? <AlertBanner>{displayError}</AlertBanner> : null}

              <FreeMembershipClaimBanner source="profile_page" compact />
              <AccountSecurityCard />

              {hasProfileData ? (
                <ProgressiveProfileHub fortuneId={latestResultId} compact quiet />
              ) : null}
              {hasProfileData && latestResultId ? <CohortMemoryCard reportId={latestResultId} /> : null}

              {hasProfileData && latestResultId ? (
                <section className="border-y border-[color:var(--hairline)] py-4">
                  <div className="text-[12px] font-medium text-[color:var(--ink-5)]">
                    {copy.tileLatestReport}
                  </div>
                  <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">
                    {displayName || copy.defaultReportName}
                  </h2>
                  {pillarSummary ? (
                    <p className="mt-1 font-mono text-[13px] text-[color:var(--ink-2)]">{pillarSummary}</p>
                  ) : null}
                  {birthLine ? (
                    <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">{birthLine}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                    <ResultCtaLink
                      href={latestReportHref}
                      page="/profile"
                      target="profile_resume_report"
                      className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
                      meta={ctaMeta}
                    >
                      {copy.openLatestReport}
                    </ResultCtaLink>
                    <ResultCtaLink
                      href={profileChatHref}
                      page="/profile"
                      target="profile_resume_chat"
                      className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
                      meta={{ ...ctaMeta, mode: 'opening' }}
                    >
                      {copy.consultantOpen}
                    </ResultCtaLink>
                    <ResultCtaLink
                      href={appendSourceToHref('/profile/events', pageSource)}
                      page="/profile"
                      target="profile_resume_events"
                      className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
                      meta={{ eventCount: mappedEvents.length }}
                    >
                      {copy.lifeEventsBackfill}
                    </ResultCtaLink>
                  </div>
                </section>
              ) : null}

              {fortunes.length > 1 ? (
                <section>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">
                      {copy.archivesTitle}
                    </h2>
                    <ResultCtaLink
                      href={settingsHref}
                      page="/profile"
                      target="profile_manage_archives"
                      className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:underline"
                    >
                      {copy.manageArchives}
                    </ResultCtaLink>
                  </div>
                  <ul className="divide-y divide-[color:var(--hairline)] border-y border-[color:var(--hairline)]">
                    {fortunes.slice(0, 6).map((row) => {
                      const fortune = row as Record<string, unknown>;
                      const id = String(fortune.id || '');
                      const name = profileDisplayName(user, fortune) || copy.defaultReportName;
                      const pillars = formatFortunePillars(fortune);
                      const birth = formatFortuneBirthLine(fortune);
                      return (
                        <li key={id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-[color:var(--ink-1)]">{name}</div>
                            <div className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
                              {[pillars, birth].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          {id ? (
                            <ResultCtaLink
                              href={appendSourceToHref(`/result/${id}`, pageSource)}
                              page="/profile"
                              target="profile_archive_open"
                              className="shrink-0 text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:underline"
                              meta={{ reportId: id }}
                            >
                              {copy.openLatestReport}
                            </ResultCtaLink>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {hasProfileData ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <Suspense fallback={<EventsSkeleton />}>
                      <ImportantEvents
                        events={mappedEvents}
                        source={pageSource}
                        ctaStrategyKey={sourceCtaStrategy.strategyKey}
                        sourceFamily={sourceCtaStrategy.sourceFamily}
                      />
                    </Suspense>
                  </div>
                  <div className="lg:col-span-1">
                    <ToolHistoryPanel
                      compact
                      title={copy.toolHistoryTitle}
                      description={copy.toolHistoryDescription}
                      limit={5}
                    />
                  </div>
                </div>
              ) : null}

              {hasProfileData ? (
                <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
                  <ResultCtaLink
                    href={appendSourceToHref('/dimensions', pageSource)}
                    page="/profile"
                    target="profile_more_dimensions"
                    className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                  >
                    {copy.dimensionsLink}
                  </ResultCtaLink>
                  <ResultCtaLink
                    href={appendSourceToHref('/events', pageSource)}
                    page="/profile"
                    target="profile_more_events"
                    className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                  >
                    {copy.manageEvents}
                  </ResultCtaLink>
                  <ResultCtaLink
                    href={appendSourceToHref('/history', pageSource)}
                    page="/profile"
                    target="profile_more_history"
                    className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                  >
                    {copy.viewHistory}
                  </ResultCtaLink>
                  <ResultCtaLink
                    href={user?.email ? '/updates' : '/login?next=%2Fupdates'}
                    page="/profile"
                    target="profile_more_updates"
                    className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                  >
                    {copy.updatesTitle}
                  </ResultCtaLink>
                  <ResultCtaLink
                    href="/learn"
                    page="/profile"
                    target="profile_more_learn"
                    className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                  >
                    {copy.rail.deepLearnMap}
                  </ResultCtaLink>
                </nav>
              ) : null}
            </div>
          }
          right={
            <ProfileRailRight
              latestReportHref={latestReportHref}
              chatHref={profileChatHref}
              settingsHref={settingsHref}
              hasReport={!!latestResultId}
              locale={locale}
            />
          }
        />
      </div>
    </AppPage>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-[var(--radius)] bg-[color:var(--hairline-strong)]"
        />
      ))}
    </div>
  );
}
