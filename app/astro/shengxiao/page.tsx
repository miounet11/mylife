import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { todayIsoLocal } from '@/lib/astro/daily-window';
import { SHENGXIAO_CATALOG } from '@/lib/astro/shengxiao-catalog';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '十二生肖日运｜地支冲合×万年历｜人生K线',
  description: '属鼠至属猪：用流日地支冲合与通书引擎匹配日节奏，并桥接黄历与结构报告。',
  path: '/astro/shengxiao',
});

export default function ShengxiaoIndexPage() {
  const today = todayIsoLocal();
  return (
    <AppPage header={{ ctaHref: '/almanac', ctaLabel: '万年历', compact: true }}>
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="Astro · 生肖"
          title="十二生肖日运"
          description="生肖地支 × 流日冲合 + 通书宜忌。作节奏参考，本命年/冲太岁为近似提示而非恐吓。"
          actions={
            <>
              <Link href="/almanac" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                今日黄历
              </Link>
              <Link href="/astro" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                星座查询
              </Link>
            </>
          }
        />
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {SHENGXIAO_CATALOG.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/astro/shengxiao/${s.slug}/day/${today}`}
                className="block rounded-xl border border-[color:var(--hairline)] bg-white p-3 text-center no-underline hover:border-[color:var(--brand)]/40"
              >
                <div className="text-[18px] font-black text-[color:var(--ink-1)]">{s.zh}</div>
                <div className="text-[10px] text-[color:var(--ink-5)]">
                  {s.branch} · {s.en}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppPage>
  );
}
