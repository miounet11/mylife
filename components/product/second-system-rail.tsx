import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { cn } from '@/lib/utils';

/**
 * Lightweight “second system” product entry.
 * Primary path: 合婚 (real dual-chart tool). Secondary: real community/knowledge
 * surfaces only — no fake engines for 六爻/紫微/奇门.
 */

type RailLocale = SiteLocale | string | null | undefined;

type Copy = {
  title: string;
  description: string;
  hehunTitle: string;
  hehunDesc: string;
  hehunCta: string;
  liuyaoTitle: string;
  liuyaoDesc: string;
  ziweiTitle: string;
  ziweiDesc: string;
  moreLabel: string;
};

function pickLocale(locale: RailLocale): 'zh-CN' | 'zh-Hant' | 'en' {
  const v = `${locale || 'zh-CN'}`.toLowerCase();
  if (v.startsWith('en')) return 'en';
  if (v.includes('hant') || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-mo') return 'zh-Hant';
  return 'zh-CN';
}

const COPY: Record<'zh-CN' | 'zh-Hant' | 'en', Copy> = {
  'zh-CN': {
    title: '不止八字',
    description: '主路径仍是八字与人生K线；关系对照已有合婚双盘，其他术数先走讨论与知识，不假装有完整引擎。',
    hehunTitle: '合婚双盘',
    hehunDesc: '双方生日即时对盘：日主、夫妻宫、用忌与大运同步。',
    hehunCta: '对盘',
    liuyaoTitle: '六爻教育起卦',
    liuyaoDesc: '三枚铜钱排本卦/变卦结构；不自动断事。',
    ziweiTitle: '紫微教育排盘',
    ziweiDesc: '公历/农历输入；命宫/主星与生年四化示意，不含大限。',
    moreLabel: '更多术数规划中',
  },
  'zh-Hant': {
    title: '不止八字',
    description: '主路徑仍是八字與人生K線；關係對照已有合婚雙盤，其他術數先走討論與知識，不假裝有完整引擎。',
    hehunTitle: '合婚雙盤',
    hehunDesc: '雙方生日即時對盤：日主、夫妻宮、用忌與大運同步。',
    hehunCta: '對盤',
    liuyaoTitle: '六爻教育起卦',
    liuyaoDesc: '三枚銅錢排本卦/變卦結構；不自動斷事。',
    ziweiTitle: '紫微教育排盤',
    ziweiDesc: '公曆/農曆輸入；命宮/主星與生年四化示意，不含大限。',
    moreLabel: '更多術數規劃中',
  },
  en: {
    title: 'Beyond Bazi',
    description:
      'Core product stays Bazi + Life K-Line. Dual-chart matching is live; educational casts are structure-only — no fake full judgment engines.',
    hehunTitle: 'Dual-chart match',
    hehunDesc: 'Both birth dates: day master, spouse palace, yongji, and dayun sync.',
    hehunCta: 'Compare',
    liuyaoTitle: 'Six-line educational cast',
    liuyaoDesc: 'Three-coin method → primary/changed hexagram structure only.',
    ziweiTitle: 'Ziwei educational chart',
    ziweiDesc: 'Solar/lunar input; palaces, main stars, year sihua (no decade luck).',
    moreLabel: 'More systems planned',
  },
};

/** Secondary surfaces: educational tools (honest scope). */
const SECONDARY_ENTRIES = [
  {
    href: '/tools/liuyao-cast',
    titleKey: 'liuyaoTitle' as const,
    descKey: 'liuyaoDesc' as const,
  },
  {
    href: '/tools/ziwei-edu',
    titleKey: 'ziweiTitle' as const,
    descKey: 'ziweiDesc' as const,
  },
] as const;

export default function SecondSystemRail({
  locale,
  className,
  source = 'second_system_rail',
}: {
  locale?: RailLocale;
  className?: string;
  source?: string;
}) {
  const copy = COPY[pickLocale(locale)];
  const withSource = (href: string) =>
    `${href}${href.includes('?') ? '&' : '?'}source=${encodeURIComponent(source)}`;

  return (
    <section
      className={cn('space-y-2', className)}
      aria-labelledby="second-system-rail-title"
    >
      <div className="min-w-0">
        <h2
          id="second-system-rail-title"
          className="text-[14px] font-semibold text-[color:var(--ink-1)]"
        >
          {copy.title}
        </h2>
        <p className="mt-0.5 max-w-xl text-[12px] leading-[1.45] text-[color:var(--ink-5)]">
          {copy.description}
        </p>
      </div>

      <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        <li>
          <Link
            href={withSource('/hehun')}
            className="group flex flex-col gap-0.5 py-2.5 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <span className="text-[13px] font-semibold text-[color:var(--ink-1)] group-hover:underline">
              {copy.hehunTitle}
              <span className="ml-2 text-[11px] font-normal text-[color:var(--ink-5)]">
                {copy.hehunCta}
              </span>
            </span>
            <span className="min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right">
              {copy.hehunDesc}
            </span>
          </Link>
        </li>

        {SECONDARY_ENTRIES.map((item) => (
          <li key={item.href}>
            <Link
              href={withSource(item.href)}
              className="group flex flex-col gap-0.5 py-2.5 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="text-[13px] font-medium text-[color:var(--ink-2)] group-hover:underline">
                {copy[item.titleKey]}
              </span>
              <span className="min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right">
                {copy[item.descKey]}
              </span>
            </Link>
          </li>
        ))}

        <li
          className="py-2.5 text-[12px] text-[color:var(--ink-5)]"
          aria-disabled="true"
        >
          {copy.moreLabel}
        </li>
      </ul>
    </section>
  );
}
