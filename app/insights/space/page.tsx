import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import JsonLd from '@/components/seo/json-ld';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';
import { listSpaceSeoClusters, listSpaceSeoScenarios } from '@/lib/fengshui/space/seo-catalog';
import { spaceSeoCoverage } from '@/lib/fengshui/space/seo-report';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo';

export const metadata: Metadata = metadataFromPagePack('/insights/space');

export default function SpaceSeoHubPage() {
  const clusters = listSpaceSeoClusters();
  const all = listSpaceSeoScenarios();
  const coverage = spaceSeoCoverage();
  const seoPack = getPageSeoGeoPack('/insights/space');

  return (
    <AppPage
      header={{ ctaHref: '/tools/fengshui-space?source=space_seo_hub', ctaLabel: '打开空间场', compact: true }}
    >
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '洞察', path: '/insights' },
          { name: '空间场报告', path: '/insights/space' },
        ])}
      />
      <JsonLd
        data={buildItemListJsonLd(
          '空间场结构报告',
          all.slice(0, 40).map((s) => ({ name: s.title, path: `/insights/space/${s.slug}` })),
        )}
      />
      <AnalyticsPageView
        eventName="space_seo_hub_viewed"
        page="/insights/space"
        meta={{ reports: all.length, coverage: coverage.ratio, geoReady: true }}
      />

      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="空间场 · 公开结构报告"
          title="先对照常见户型与选址，再进工作台改成你的"
          description={`${all.length} 篇由同一套空间场引擎生成的结构示意：户型、朝向、铺面、城市与人宅合参。用来回答具体决策，不是吉凶标签。`}
          actions={
            <>
              <Link
                href="/tools/fengshui-space?source=space_seo_hub"
                className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                打开工作台
              </Link>
              <Link href="/tools/fengshui-simulator" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                商铺五行快测
              </Link>
              <Link href="/insights" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                城市洞察
              </Link>
            </>
          }
        />

        {clusters.map((group) => (
          <section key={group.cluster}>
            <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">
              {group.title}
              <span className="ml-2 text-[12px] font-normal text-[color:var(--ink-5)]">{group.items.length}</span>
            </h2>
            <ul className="mt-2 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
              {group.items.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/insights/space/${s.slug}`}
                    className="block py-2.5 no-underline hover:no-underline"
                  >
                    <div className="text-[14px] font-medium text-[color:var(--ink-1)] hover:underline">{s.title}</div>
                    <p className="mt-0.5 text-[12px] leading-snug text-[color:var(--ink-5)]">{s.angle}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {seoPack ? <PageSeoGeoSection pack={seoPack} compact /> : null}
      </div>
    </AppPage>
  );
}
