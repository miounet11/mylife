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
import {
  teacherCapabilitySurface,
} from '@/lib/page-illustrations/capability-map';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';

export const metadata: Metadata = {
  title: '请老师 | 人生K线',
  description: '按问题选择老师：事业、财务、关系、节律、时机、地理与实践等。',
  alternates: { canonical: '/teachers' },
};

const INTENT_SHORTCUTS: Array<{ intent: string; label: string; teacherId: TeacherId }> = [
  { intent: 'career', label: '事业方向', teacherId: 'career' },
  { intent: 'wealth', label: '财务取舍', teacherId: 'wealth' },
  { intent: 'relationship', label: '关系决策', teacherId: 'relationship' },
  { intent: 'timing', label: '时机窗口', teacherId: 'timing' },
  { intent: 'health', label: '节律健康', teacherId: 'health' },
  { intent: 'practice', label: '验证复盘', teacherId: 'practice' },
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
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成报告', compact: true }}>
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
            请老师
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
            一位老师专一事。有报告时会带上你的盘与记录；不预填长问题，老师先开场。
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <Link
              href="/analyze"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              生成报告
            </Link>
            <Link
              href={buildTeacherChatHref({
                teacherId: 'overview',
                reportId,
                source: `${source}:direct_opening`,
              })}
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              总览开场
            </Link>
            <Link
              href="/profile"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              我的资料
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
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">按意图开场</div>
              <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
                {intent
                  ? `当前意图 · ${recommended.name}`
                  : `推荐 · ${recommended.name}`}
              </h2>
              <p className="mt-1 max-w-xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
                {recommended.tagline}
                {reportId ? ' · 已带报告上下文' : ' · 暂无报告时也可先开场'}
              </p>
            </div>
            <Link
              href={recommendedHref}
              className="shrink-0 text-[13px] font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              开始开场 →
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
            {INTENT_SHORTCUTS.map((item) => {
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
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>

        <TeacherPicker
          variant="gallery"
          title="常用"
          reportId={reportId}
          source={source}
          subtitle="点老师进入顾问卡开场（一键议题 / 一键开口）"
        />

        {more.length ? (
          <section>
            <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">更多</h2>
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
