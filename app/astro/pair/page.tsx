import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '十二星座配对矩阵｜协作边界与元素结构｜人生K线',
  description: '星座两两配对：元素生克、模式节奏、资料库倾向与世界易关系分科，结构参考非宿命。',
  path: '/astro/pair',
});

export default function PairIndexPage() {
  return (
    <AppPage header={{ ctaHref: '/hehun', ctaLabel: '合婚双盘', compact: true }}>
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="Astro · Pair"
          title="星座配对矩阵"
          description="选两个星座看协作结构。关系结论仍以八字合婚与世界易边界模型为准。"
          actions={
            <>
              <Link href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                合婚双盘
              </Link>
              <Link href="/world-yi/domains/relationship" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                关系分科
              </Link>
            </>
          }
        />
        <p className="text-[13px] text-[color:var(--ink-4)]">先点左侧星座，再点右侧，或从下表快速进入（已规范化顺序）。</p>
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--hairline)] bg-white p-3">
          <table className="w-full min-w-[640px] text-center text-[11px]">
            <thead>
              <tr>
                <th className="p-1" />
                {ASTRO_SIGNS.map((s) => (
                  <th key={s.key} className="p-1 font-semibold text-[color:var(--ink-4)]">
                    {s.zh.replace('座', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASTRO_SIGNS.map((a, i) => (
                <tr key={a.key}>
                  <th className="p-1 text-left font-semibold">{a.zh.replace('座', '')}</th>
                  {ASTRO_SIGNS.map((b, j) => {
                    const [ka, kb] = i <= j ? [a.key, b.key] : [b.key, a.key];
                    return (
                      <td key={b.key} className="p-0.5">
                        <Link
                          href={`/astro/pair/${ka}/${kb}`}
                          className="block rounded border border-[color:var(--hairline)] px-1 py-1.5 no-underline hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]/40"
                        >
                          ·
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppPage>
  );
}
