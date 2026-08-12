import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionsShowcase from '@/components/dimensions/dimensions-showcase';
import JourneyStrip from '@/components/content/journey-strip';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FeatureImmersionHero } from '@/components/brand/feature-immersion-hero';
import ToolEntryLink from '@/components/tools/tool-entry-link';
import ToolsHubBirthForm from '@/components/tools/tools-hub-birth-form';
import SecondSystemRail from '@/components/product/second-system-rail';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { toolsHubCopy } from '@/lib/i18n/hub-copy';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import {
  presentToolEntries,
  presentToolHubGroups,
  presentToolIntentMatches,
  toolCategoryMetaCopy,
} from '@/lib/i18n/tools-catalog-copy';
import { TOOL_ENTRIES } from '@/lib/portal-nav';
import { TOOL_CATEGORY_META, type ToolCategoryKey } from '@/lib/portal-tools';
import { withLocalePrefix } from '@/lib/seo';
import { buildTeacherChatHref } from '@/lib/teachers';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import { getToolSeoGeoPack } from '@/lib/tools/tool-seo-geo';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

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
  const pack = getPageSeoGeoPack('/tools');
  return metadataFromPagePack('/tools', {
    title: pack?.title || seo.title,
    description: pack?.description || seo.description,
    path: withLocalePrefix('/tools', locale),
    locale,
  });
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = toolsHubCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);
  const seoPack = getToolSeoGeoPack('tools');
  const hubPack = getPageSeoGeoPack('/tools');
  const intentMatches = presentToolIntentMatches(uiLocale);
  const hubGroups = presentToolHubGroups(uiLocale);

  return (
    <AppPage
      header={{
        ctaHref: '/tools/timing-yearly-window',
        ctaLabel: copy.ctaBirth,
        compact: true,
      }}
    >
      {hubPack ? <PageJsonLd pack={hubPack} /> : null}
      {seoPack ? <ToolJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page="/tools"
        meta={{ surfaceKey: 'tools', funnel: 'tools_hub', geoReady: true, reorganized: true }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FeatureImmersionHero
          surfaceKey="tools"
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          compact
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

        {/* 1 · Intent match — strongest path to the right tool */}
        <section
          className="rounded-[var(--radius-md)] border border-[color:var(--ink-1)] bg-[color:var(--paper)] p-4 md:p-5"
          aria-labelledby="tools-intent-title"
        >
          <div className="min-w-0">
            <h2 id="tools-intent-title" className="text-[15px] font-semibold text-[color:var(--ink-1)]">
              {copy.intentTitle}
            </h2>
            <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{copy.intentDesc}</p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {intentMatches.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col rounded-[10px] border border-[color:var(--hairline)] bg-white px-3.5 py-3 no-underline transition hover:border-[color:var(--ink-1)] hover:no-underline"
              >
                <span className="text-[14px] font-semibold text-[color:var(--ink-1)] group-hover:underline">
                  {item.label}
                </span>
                <span className="mt-1 text-[11px] leading-snug text-[color:var(--ink-5)]">
                  → {item.hint}
                </span>
              </Link>
            ))}
          </div>
        </section>

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

        {/* 2 · Conversion path (birth-quick) */}
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

        {/* 3 · Grouped catalog */}
        <section className="space-y-5" aria-labelledby="tools-groups-title">
          <div>
            <h2 id="tools-groups-title" className="text-[14px] font-semibold text-[color:var(--ink-1)]">
              {copy.groupsTitle}
            </h2>
          </div>
          {hubGroups.map((group) => (
            <div
              key={group.key}
              id={`group-${group.key}`}
              className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
            >
              <div className="mb-2">
                <h3 className="text-[13px] font-semibold text-[color:var(--ink-1)]">{group.title}</h3>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
                  {group.description}
                </p>
              </div>
              <EntryLinkGrid items={group.tools} />
            </div>
          ))}
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
          <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">{copy.askTeachers}</h2>
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
          <div className="mb-1">
            <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">{copy.byTheme}</h2>
            {'byThemeDesc' in copy && copy.byThemeDesc ? (
              <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">{copy.byThemeDesc}</p>
            ) : null}
          </div>
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

        <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{copy.footerNote}</p>

        {seoPack ? <ToolSeoGeoSection pack={seoPack} compact /> : null}
        <PageSeoGeoSection pathOrSlug="/tools" compact />
      </div>
    </AppPage>
  );
}
