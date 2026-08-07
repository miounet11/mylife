import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroLookup from '@/components/astro/astro-lookup';
import AstroRelatedLinks from '@/components/astro/astro-related-links';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';
import { RISING_PROFILES } from '@/lib/astro/rising-data';
import { ASTRO_ZONES_48 } from '@/lib/astro/zones-48';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = (() => {
  const pack = getPageSeoGeoPack('/astro');
  if (pack) return metadataFromPagePack('/astro');
  return buildPageMetadata({
    title: '星座百科｜十二星座·48星区·上升星座｜人生K线',
    description:
      '独立星座板块：十二太阳星座详解、48星区细分、上升星座第一印象；可查生日定位，并关联世界易、黄历与结构报告。',
    path: '/astro',
  });
})();

export default function AstroHubPage() {
  const seoPack = getPageSeoGeoPack('/astro');

  return (
    <AppPage header={{ ctaHref: '/analyze?source=astro', ctaLabel: '结构报告', compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="astro_hub_viewed"
        page="/astro"
        meta={{ surfaceKey: 'astro', zones: ASTRO_ZONES_48.length }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="星座板块 · 覆盖扩展"
          title="十二星座 · 48星区 · 上升"
          description="参考星座站内容广度：太阳定内核，48星区细分出生段落，上升写第一印象。与世界易结构语言、黄历日节奏、八字报告交叉使用——扩展覆盖，不作恐吓定命。"
          actions={
            <>
              <Link
                href="/astro/signs"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                十二星座
              </Link>
              <Link
                href="/astro/zones"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                48星区
              </Link>
              <Link
                href="/astro/rising"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                上升星座
              </Link>
              <Link
                href="/world-yi"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                世界易
              </Link>
              <Link
                href="/almanac"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                万年历
              </Link>
            </>
          }
          footer={
            <span>
              {ASTRO_SIGNS.length} 星座 · {ASTRO_ZONES_48.length} 星区 · {RISING_PROFILES.length} 上升
            </span>
          }
        />

        <AstroLookup source="astro_hub" />

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: '/astro/signs',
              title: '十二星座',
              desc: '元素、模式、事业关系与世界易桥接',
              n: `${ASTRO_SIGNS.length} 篇`,
            },
            {
              href: '/astro/zones',
              title: '48 星区',
              desc: '每座四区，交界气质与行动提示',
              n: `${ASTRO_ZONES_48.length} 区`,
            },
            {
              href: '/astro/rising',
              title: '上升星座',
              desc: '第一印象、社交面具与角色呈现',
              n: `${RISING_PROFILES.length} 型`,
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4 no-underline shadow-sm transition hover:border-[color:var(--brand)]/40"
            >
              <div className="text-[11px] font-bold text-[color:var(--brand)]">{c.n}</div>
              <div className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">{c.title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{c.desc}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">十二星座速览</h2>
            <Link
              href="/astro/signs"
              className="text-[12px] text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              全部 →
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {ASTRO_SIGNS.map((s) => (
              <li key={s.key}>
                <Link
                  href={`/astro/signs/${s.key}`}
                  className="flex items-center gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 no-underline transition hover:border-[color:var(--brand)]/40"
                >
                  <span className="text-[18px]" aria-hidden>
                    {s.symbol}
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-[color:var(--ink-1)]">{s.zh}</span>
                    <span className="block text-[10px] text-[color:var(--ink-5)]">
                      {s.start}–{s.end}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <AstroRelatedLinks />
        <PageSeoGeoSection pathOrSlug="/astro" />
      </div>
    </AppPage>
  );
}
