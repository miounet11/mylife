import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroRelatedLinks from '@/components/astro/astro-related-links';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { RISING_PROFILES, RISING_HOUR_TABLE } from '@/lib/astro/rising-data';
import { SIGN_BY_KEY } from '@/lib/astro/signs-data';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '上升星座查询与详解｜十二上升｜人生K线',
  description:
    '上升星座（ASC）是出生时东方地平线升起的星座，约每两小时一换。提供十二上升第一印象、社交面具，以及地方时粗算表。',
  path: '/astro/rising',
});

export default function AstroRisingIndexPage() {
  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <AnalyticsPageView eventName="astro_rising_index" page="/astro/rising" meta={{ surfaceKey: 'astro_rising' }} />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="Astro · Rising / ASC"
          title="上升星座"
          description="太阳写内核，月亮写情绪，上升写你走进房间的第一印象与人生剧本的「第一宫」。精确计算需要出生时刻 + 地点；下列为教育用粗算与气质百科。"
          actions={
            <>
              <Link href="/astro" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                生日查询
              </Link>
              <Link
                href="/tools/zodiac"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                写入数据底座
              </Link>
              <Link href="/docs/true-solar-time" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                真太阳时
              </Link>
            </>
          }
        />

        <ul className="grid gap-3 sm:grid-cols-2">
          {RISING_PROFILES.map((r) => (
            <li key={r.key}>
              <Link
                href={`/astro/rising/${r.key}`}
                className="block rounded-2xl border border-[color:var(--hairline)] bg-white p-4 no-underline shadow-sm transition hover:border-[color:var(--brand)]/40"
              >
                <div className="text-[16px] font-black text-[color:var(--ink-1)]">
                  {SIGN_BY_KEY[r.key].symbol} 上升{r.zh}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
                  {r.firstImpression}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[14px] font-bold text-[color:var(--ink-1)]">地方时粗算表（教育用）</h2>
          <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
            以约 05:00 对应白羊上升为启发式起点，每 2 小时进一座。纬度、季节与真太阳时会改变结果，请以专业星盘为准。
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[color:var(--hairline)] text-[color:var(--ink-5)]">
                  <th className="py-2 pr-3 font-semibold">地方时约</th>
                  <th className="py-2 font-semibold">粗算上升</th>
                </tr>
              </thead>
              <tbody>
                {RISING_HOUR_TABLE.map((row) => (
                  <tr key={row.from} className="border-b border-[color:var(--hairline)]/70">
                    <td className="py-2 pr-3 tabular-nums text-[color:var(--ink-3)]">
                      {String(row.from).padStart(2, '0')}:00 – {String(row.to).padStart(2, '0')}:00
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/astro/rising/${row.key}`}
                        className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
                      >
                        {SIGN_BY_KEY[row.key].zh}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <AstroRelatedLinks />
      </div>
    </AppPage>
  );
}
