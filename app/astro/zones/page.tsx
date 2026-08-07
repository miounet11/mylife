import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroRelatedLinks from '@/components/astro/astro-related-links';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';
import { ASTRO_ZONES_48, getZonesBySign } from '@/lib/astro/zones-48';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '48星区百科｜十二星座四区细分｜人生K线',
  description:
    '将十二星座细分为 48 星区：每座四区（约 7–8 日），含交界气质与行动提示。比太阳星座更细的出生段落定位。',
  path: '/astro/zones',
});

export default function AstroZonesIndexPage() {
  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <AnalyticsPageView
        eventName="astro_zones_index"
        page="/astro/zones"
        meta={{ surfaceKey: 'astro_zones', count: ASTRO_ZONES_48.length }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="Astro · 48 Zones"
          title="48 星区"
          description="参考星座站「细分星区」体验：每个太阳星座按日期切四区，初段带交界余韵，末段渗入下一座。仍属表达层细分，不是精确星历。"
          actions={
            <>
              <Link href="/astro" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                查询生日
              </Link>
              <Link href="/astro/signs" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                十二星座
              </Link>
              <Link href="/world-yi" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                世界易
              </Link>
            </>
          }
          footer={<span>共 {ASTRO_ZONES_48.length} 区</span>}
        />

        {ASTRO_SIGNS.map((s) => {
          const zones = getZonesBySign(s.key);
          return (
            <section key={s.key} className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">
                  {s.symbol} {s.zh}
                  <span className="ml-2 text-[12px] font-normal text-[color:var(--ink-5)]">
                    {s.start}–{s.end}
                  </span>
                </h2>
                <Link
                  href={`/astro/signs/${s.key}`}
                  className="text-[12px] text-[color:var(--brand)] underline-offset-2 hover:underline"
                >
                  星座总览
                </Link>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {zones.map((z) => (
                  <li key={z.id}>
                    <Link
                      href={`/astro/zones/${z.id}`}
                      className="block h-full rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 no-underline transition hover:border-[color:var(--brand)]/40"
                    >
                      <div className="text-[10px] font-bold text-[color:var(--brand)]">
                        #{z.index}
                      </div>
                      <div className="mt-0.5 text-[13px] font-bold text-[color:var(--ink-1)]">{z.title}</div>
                      <div className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">
                        {z.start} – {z.end}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[color:var(--ink-4)]">
                        {z.summary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <AstroRelatedLinks />
      </div>
    </AppPage>
  );
}
