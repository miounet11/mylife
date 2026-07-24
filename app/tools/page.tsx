import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionsShowcase from '@/components/dimensions/dimensions-showcase';
import JourneyStrip from '@/components/content/journey-strip';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import ToolEntryLink from '@/components/tools/tool-entry-link';
import ToolsHubBirthForm from '@/components/tools/tools-hub-birth-form';
import SecondSystemRail from '@/components/product/second-system-rail';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { toolsHubCopy } from '@/lib/i18n/hub-copy';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import {
  presentToolEntries,
  toolCategoryMetaCopy,
} from '@/lib/i18n/tools-catalog-copy';
import { TOOL_ENTRIES } from '@/lib/portal-nav';
import { TOOL_CATEGORY_META, type ToolCategoryKey } from '@/lib/portal-tools';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';
import { buildTeacherChatHref } from '@/lib/teachers';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import { getToolSeoGeoPack } from '@/lib/tools/tool-seo-geo';

const CONSULTANT_IDS = [
  'career',
  'timing',
  'wealth',
] as const satisfies ReadonlyArray<keyof ReturnType<typeof toolsHubCopy>['consultants']>;

const CATEGORY_KEYS = Object.keys(TOOL_CATEGORY_META) as ToolCategoryKey[];

interface ToolsPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const seo = toolsHubCopy(locale).seo;
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: withLocalePrefix('/tools', locale),
    locale,
    keywords: seo.keywords,
  });
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = toolsHubCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);
  const seoPack = getToolSeoGeoPack('tools');
  return (
    <AppPage
      header={{
        ctaHref: '/tools/timing-yearly-window',
        ctaLabel: copy.ctaBirth,
        compact: true,
      }}
    >
      {seoPack ? <ToolJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page="/tools"
        meta={{ surfaceKey: 'tools', funnel: 'tools_hub', geoReady: true }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <ToolEntryLink
                href="/tools/timing-yearly-window"
                source="tools_hub_hero"
                title={copy.heroYearly}
                className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                {copy.heroYearly}
              </ToolEntryLink>
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkDimensions}
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkFullReport}
              </Link>
              <Link href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkHehun}
              </Link>
            </>
          }
        />

        <JourneyStrip active="tools" locale={uiLocale} />

        <PageIllustrationStrip
          surface="tools/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '工具怎么用',
            'zh-Hant': '工具怎麼用',
            en: 'How tools work',
          })}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />

        <ToolsHubBirthForm />

        {/* 转化主路径 */}
        <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">{copy.threeStepsTitle}</h2>
              <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
                {copy.threeStepsDesc}
              </p>
            </div>
            <ToolEntryLink
              href="/tools/timing-yearly-window"
              source="tools_hub_primary_cta"
              title={copy.yearlyWindowTitle}
              className="inline-flex h-10 min-h-[var(--control-h)] shrink-0 items-center justify-center rounded-[var(--radius)] bg-[color:var(--ink-1)] px-4 text-[13px] font-medium text-white no-underline hover:bg-black hover:no-underline"
            >
              {copy.startYearlyCta}
            </ToolEntryLink>
          </div>

          <ul className="mt-4 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {copy.birthQuick.map((item) => (
              <li key={item.href}>
                <ToolEntryLink
                  href={item.href}
                  title={item.title}
                  description={item.desc}
                  source="tools_hub_birth_quick"
                  titleClassName={
                    'primary' in item && item.primary
                      ? 'text-[14px] font-semibold text-[color:var(--ink-1)]'
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        <DimensionsShowcase
          title={copy.scenesTitle}
          description={copy.scenesDesc}
          limit={6}
          source="tools_hub"
          compact
        />

        <SecondSystemRail locale={uiLocale} source="tools_hub" />

        <section className="space-y-2">
          <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">
            {copy.askTeachers}
          </h2>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {CONSULTANT_IDS.map((teacherId) => (
              <Link
                key={teacherId}
                href={buildTeacherChatHref({
                  teacherId,
                  source: 'tools_hub_consultant',
                })}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
              >
                {copy.consultants[teacherId]}
              </Link>
            ))}
            <Link
              href="/teachers"
              className="text-[12px] text-[color:var(--ink-5)] underline-offset-2 hover:text-[color:var(--ink-3)] hover:underline"
            >
              {copy.allConsultants}
            </Link>
          </nav>
        </section>

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">{copy.recommendedTools}</h2>
          <EntryLinkGrid items={presentToolEntries(TOOL_ENTRIES, uiLocale)} />
        </section>

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">{copy.byTheme}</h2>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {CATEGORY_KEYS.map((key) => {
              const meta = toolCategoryMetaCopy(uiLocale, key);
              return (
                <li key={key}>
                  <Link
                    href={`/tools/category/${key}?source=tools_hub_category`}
                    className="group flex flex-col gap-0.5 py-2.5 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="text-[13px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                      {meta.title}
                    </span>
                    <span className="min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right">
                      {meta.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          {copy.footerNote}
        </p>

        {seoPack ? <ToolSeoGeoSection pack={seoPack} compact /> : null}
      </div>
    </AppPage>
  );
}
