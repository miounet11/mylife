import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroRelatedLinks from '@/components/astro/astro-related-links';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '十二星座详解｜太阳星座百科｜人生K线',
  description:
    '白羊至双鱼十二太阳星座：关键词、优势盲点、事业关系、世界易结构桥接与黄历节奏提示。',
  path: '/astro/signs',
});

export default function AstroSignsIndexPage() {
  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <AnalyticsPageView eventName="astro_signs_index" page="/astro/signs" meta={{ surfaceKey: 'astro_signs' }} />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="Astro · Signs"
          title="十二星座"
          description="太阳星座描述内核目标与生命主轴。细分请看 48 星区；对外第一印象请看上升。"
          actions={
            <>
              <Link href="/astro" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                星座首页
              </Link>
              <Link href="/astro/zones" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                48星区
              </Link>
              <Link href="/astro/rising" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                上升
              </Link>
            </>
          }
        />
        <PageIllustrationStrip surface="astro/signs" title="星座图解" compact limit={1} />
        <ul className="grid gap-3 sm:grid-cols-2">
          {ASTRO_SIGNS.map((s) => (
            <li key={s.key}>
              <Link
                href={`/astro/signs/${s.key}`}
                className="block rounded-2xl border border-[color:var(--hairline)] bg-white p-4 no-underline shadow-sm transition hover:border-[color:var(--brand)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[18px] font-black text-[color:var(--ink-1)]">
                      {s.symbol} {s.zh}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
                      {s.en} · {s.start}–{s.end} · {s.element}象 · {s.modality}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[color:var(--brand)]">详解</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">{s.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] text-[color:var(--ink-4)]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <AstroRelatedLinks />
      </div>
    </AppPage>
  );
}
