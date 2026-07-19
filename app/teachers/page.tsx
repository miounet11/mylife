import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import TeacherPicker from '@/components/teachers/teacher-picker';
import AnalyticsPageView from '@/components/analytics-page-view';
import {
  buildTeacherChatHref,
  getTeacher,
  listTeachers,
  type TeacherId,
} from '@/lib/teachers';
import { teacherIdFromFollowupIntent } from '@/lib/chat-entry';
import { CapabilityIllustrationPanel } from '@/components/content/capability-illustration-panel';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { teachersHubCopy } from '@/lib/i18n/hub-copy';
import {
  teacherCapabilitySurface,
} from '@/lib/page-illustrations/capability-map';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';

export const metadata: Metadata = {
  title: '请老师 | 人生K线',
  description: '按问题选择老师：事业、财务、关系、节律、时机、地理与实践等。',
  alternates: { canonical: '/teachers' },
};

const INTENT_SHORTCUT_KEYS: Array<{
  intent: keyof ReturnType<typeof teachersHubCopy>['intents'];
  teacherId: TeacherId;
}> = [
  { intent: 'career', teacherId: 'career' },
  { intent: 'wealth', teacherId: 'wealth' },
  { intent: 'relationship', teacherId: 'relationship' },
  { intent: 'timing', teacherId: 'timing' },
  { intent: 'health', teacherId: 'health' },
  { intent: 'practice', teacherId: 'practice' },
];

interface TeachersPageProps {
  searchParams?: Promise<{
    intent?: string;
    reportId?: string;
    source?: string;
    highlight?: string;
    lang?: string;
  }>;
}

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
  const sp = searchParams ? await searchParams : {};
  const intent = `${sp.intent || ''}`.trim();
  const reportId = `${sp.reportId || ''}`.trim() || undefined;
  const source = `${sp.source || 'teachers_gallery'}`.trim();
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = teachersHubCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);
  const highlightId = (`${sp.highlight || ''}`.trim() ||
    teacherIdFromFollowupIntent(intent)) as TeacherId | string;
  const recommended = getTeacher(highlightId);
  const more = listTeachers({ tier: ['p1', 'p2'], galleryOnly: true });

  const recommendedHref = buildTeacherChatHref({
    teacherId: recommended.id,
    reportId,
    source: intent ? `${source}:intent:${intent}` : source,
  });

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.ctaGenerate, compact: true }}>
      <AnalyticsPageView
        eventName="teachers_page_viewed"
        page="/teachers"
        meta={{
          surfaceKey: 'teachers',
          intent: intent || null,
          reportId: reportId || null,
          highlight: recommended.id,
        }}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <header className="border-b border-[color:var(--hairline)] pb-4">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--ink-1)]">
            {copy.title}
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
            {copy.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <Link
              href="/analyze"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              {copy.ctaGenerate}
            </Link>
            <Link
              href={buildTeacherChatHref({
                teacherId: 'overview',
                reportId,
                source: `${source}:direct_opening`,
              })}
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              {copy.linkOverviewOpen}
            </Link>
            <Link
              href="/profile"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              {copy.linkProfile}
            </Link>
          </div>
        </header>

        <PageIllustrationStrip
          surface="teachers/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '顾问分工',
            'zh-Hant': '顧問分工',
            en: 'Advisor roles',
          })}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />

        {/* Intent → recommended consultant opening + capability diagram */}
        <section className="space-y-3 border-y border-[color:var(--hairline)] py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{copy.intentEyebrow}</div>
              <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
                {intent
                  ? `${copy.currentIntentPrefix} · ${recommended.name}`
                  : `${copy.recommendedPrefix} · ${recommended.name}`}
              </h2>
              <p className="mt-1 max-w-xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
                {recommended.tagline}
                {reportId ? ` · ${copy.withReportCtx}` : ` · ${copy.withoutReportCtx}`}
              </p>
            </div>
            <Link
              href={recommendedHref}
              className="shrink-0 text-[13px] font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              {copy.startOpening}
            </Link>
          </div>
          <CapabilityIllustrationPanel
            surface={teacherCapabilitySurface(recommended.id)}
            teacherId={recommended.id}
            compact
            priority
            showCopy
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {INTENT_SHORTCUT_KEYS.map((item) => {
              const active = highlightId === item.teacherId || intent === item.intent;
              const href = `/teachers?intent=${encodeURIComponent(item.intent)}${
                reportId ? `&reportId=${encodeURIComponent(reportId)}` : ''
              }&source=${encodeURIComponent(source)}`;
              return (
                <Link
                  key={item.intent}
                  href={href}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-medium no-underline transition hover:no-underline ${
                    active
                      ? 'border-[color:var(--ink-1)] bg-[color:var(--ink-1)] text-white'
                      : 'border-[color:var(--hairline)] bg-white text-[color:var(--ink-3)] hover:border-[color:var(--hairline-strong)] hover:text-[color:var(--ink-1)]'
                  }`}
                >
                  {copy.intents[item.intent]}
                </Link>
              );
            })}
          </div>
        </section>

        <TeacherPicker
          variant="gallery"
          title={copy.galleryTitle}
          reportId={reportId}
          source={source}
          subtitle={copy.gallerySubtitle}
        />

        {more.length ? (
          <section>
            <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">{copy.moreTitle}</h2>
            <ul className="mt-2 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
              {more.map((t) => (
                <li key={t.id}>
                  <Link
                    href={buildTeacherChatHref({
                      teacherId: t.id,
                      reportId,
                      source,
                    })}
                    className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
                  >
                    <span className="text-[13px] text-[color:var(--ink-1)] hover:underline">
                      {t.name}
                    </span>
                    <span className="truncate text-[12px] text-[color:var(--ink-5)]">
                      {t.tagline}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppPage>
  );
}
