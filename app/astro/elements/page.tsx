import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { ELEMENT_CATALOG, signsForElement } from '@/lib/astro/elements-catalog';
import { todayIsoLocal } from '@/lib/astro/daily-window';
import { getSignByKey } from '@/lib/astro/signs-data';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '四象元素｜火土风水星座群组日运｜人生K线',
  description: '按火土风水四象聚合十二星座，结合万年历引擎给出群组日运与世界易桥接。',
  path: '/astro/elements',
});

export default function ElementsIndexPage() {
  const today = todayIsoLocal();
  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="Astro · Elements"
          title="四象元素"
          description="火土风水四象把十二星座收成群组节奏；每日分数来自通书×元素队列引擎。"
          actions={
            <Link href={`/astro/day/${today}`} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              今日总入口
            </Link>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {ELEMENT_CATALOG.map((e) => {
            const members = signsForElement(e.zh)
              .map((k) => getSignByKey(k)?.zh)
              .filter(Boolean);
            return (
              <li key={e.slug}>
                <Link
                  href={`/astro/elements/${e.slug}/day/${today}`}
                  className="block rounded-2xl border border-[color:var(--hairline)] bg-white p-4 no-underline shadow-sm hover:border-[color:var(--brand)]/40"
                >
                  <div className="text-[18px] font-black text-[color:var(--ink-1)]">
                    {e.zh}象 · {e.en}
                  </div>
                  <p className="mt-2 text-[13px] text-[color:var(--ink-3)]">{e.blurb}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">{members.join('、')}</p>
                  <p className="mt-2 text-[12px] font-semibold text-[color:var(--brand)]">查看今日群组运势 →</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </AppPage>
  );
}
