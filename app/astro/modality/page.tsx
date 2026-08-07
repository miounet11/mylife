import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { MODALITY_CATALOG, signsForModality } from '@/lib/astro/elements-catalog';
import { todayIsoLocal } from '@/lib/astro/daily-window';
import { getSignByKey } from '@/lib/astro/signs-data';
import { currentYearMonth } from '@/lib/astro/month-engine';
import { currentIsoWeekId } from '@/lib/astro/week-engine';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '基本固定变动宫｜十二星座模式群组｜人生K线',
  description: '按基本/固定/变动三模式看启动、持守与调节节奏，叠万年历引擎日运。',
  path: '/astro/modality',
});

export default function ModalityIndexPage() {
  const today = todayIsoLocal();
  const weekId = currentIsoWeekId();
  const ym = currentYearMonth();
  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero eyebrow="Astro · Modality" title="三模式（宫）" description="基本开局、固定持守、变动调节——与流日通书叠加看日/周节奏。" />
        <ul className="grid gap-3 sm:grid-cols-3">
          {MODALITY_CATALOG.map((m) => (
            <li key={m.slug}>
              <div className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
                <div className="text-[16px] font-black">{m.zh}宫</div>
                <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">{m.blurb}</p>
                <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">
                  {signsForModality(m.zh)
                    .map((k) => getSignByKey(k)?.zh)
                    .join('、')}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-semibold">
                  <Link href={`/astro/modality/${m.slug}/day/${today}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
                    今日
                  </Link>
                  <Link href={`/astro/modality/${m.slug}/week/${weekId}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
                    本周
                  </Link>
                  <Link href={`/astro/modality/${m.slug}/month/${ym}`} className="text-[color:var(--ink-3)] underline-offset-2 hover:underline">
                    月历
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppPage>
  );
}
