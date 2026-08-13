import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { FeatureImmersionHero } from '@/components/brand/feature-immersion-hero';
import { AppPage } from '@/components/layout/app-page';
import SystemCapabilityPanel from '@/components/system-capability-panel';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';
import { withLocalePrefix } from '@/lib/seo';
import { getSystemCapabilityStats } from '@/lib/system-capability-stats';
import { ENGINE_DISPLAY_LAYERS } from '@/lib/engine-surface/display-policy';
import {
  SYSTEM_ENGINE_FAMILY_LABEL,
  engineCapabilityLine,
  getSystemEngineCatalog,
  type SystemEngineFamily,
} from '@/lib/system-engines';

interface EnginesPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: EnginesPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const pack = getPageSeoGeoPack('/engines');
  return metadataFromPagePack('/engines', {
    title: pack?.title || '系统引擎｜15 套命理计算能力｜人生K线',
    description:
      pack?.description
      || '人生K线把排盘、用神、大运、K线、合婚、通书等计算做成同一套系统能力，而不是口号。',
    path: withLocalePrefix('/engines', locale),
    locale,
  });
}

const FAMILY_ORDER: SystemEngineFamily[] = ['natal', 'tool', 'time'];

export default async function EnginesPage({ searchParams }: EnginesPageProps) {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const catalog = getSystemEngineCatalog();
  const stats = getSystemCapabilityStats();
  const seoPack = getPageSeoGeoPack('/engines');

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始测算', compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="engines_page_viewed"
        page="/engines"
        meta={{ engineCount: catalog.count, locale, geoReady: true }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FeatureImmersionHero
          surfaceKey="docs"
          eyebrow="系统能力"
          title={engineCapabilityLine()}
          description="同一套出生输入，走同一条计算链：四柱 → 用神 → 大运 → 人生K线，再分到合婚、起名、通书、十维。这里列出的是会出分、出盘、出窗口的引擎，不是营销口号。"
          compact
          actions={
            <>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                用引擎排一盘
              </Link>
              <Link href="/docs" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                输入与读法
              </Link>
            </>
          }
        />

        <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          命盘主链 {catalog.natal} · 专项工具 {catalog.tool} · 时间层 {catalog.time}
          <span className="mx-1.5 text-[color:var(--ink-6)]">·</span>
          用神引擎 {catalog.yongShenVersion}
        </p>

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">界面怎么展示</h2>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {ENGINE_DISPLAY_LAYERS.map((layer) => (
              <li key={layer.mode} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="text-[14px] font-medium text-[color:var(--ink-1)]">{layer.title}</span>
                <span className="min-w-0 text-[12px] leading-[1.45] text-[color:var(--ink-5)] sm:max-w-[68%] sm:text-right">
                  {layer.body}
                  <span className="ml-1 text-[color:var(--ink-6)]">（{layer.surfaces}）</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {FAMILY_ORDER.map((family) => {
          const rows = catalog.byFamily[family];
          return (
            <section key={family}>
              <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">
                {SYSTEM_ENGINE_FAMILY_LABEL[family]}
              </h2>
              <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
                {rows.map((engine) => (
                  <li key={engine.id}>
                    <Link
                      href={engine.href}
                      className="group flex flex-col gap-0.5 py-3 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                    >
                      <span className="min-w-0">
                        <span className="text-[14px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                          {engine.name}
                        </span>
                        <span className="ml-2 font-mono text-[11px] text-[color:var(--ink-5)]">
                          {engine.version}
                        </span>
                      </span>
                      <span className="min-w-0 text-[12px] leading-[1.45] text-[color:var(--ink-5)] sm:max-w-[58%] sm:truncate sm:text-right">
                        {engine.role}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <SystemCapabilityPanel stats={stats} />
        <PageSeoGeoSection pathOrSlug="/engines" />
      </div>
    </AppPage>
  );
}
