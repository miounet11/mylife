import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type StepKey = 'dimensions' | 'analyze' | 'predictions' | 'tools' | 'content';

const STEPS_BASE = [
  {
    href: '/dimensions?source=journey_strip',
    match: '/dimensions',
    labelZh: '十维度',
    labelEn: '10 Dimensions',
    activeKey: 'dimensions' as const,
  },
  {
    href: '/analyze?source=journey_strip',
    match: '/analyze',
    labelZh: '完整报告',
    labelEn: 'Full report',
    activeKey: 'analyze' as const,
  },
  {
    href: '/predictions?source=journey_strip',
    match: '/predictions',
    labelZh: '预测回访',
    labelEn: 'Predictions',
    activeKey: 'predictions' as const,
  },
  {
    href: '/tools?source=journey_strip',
    match: '/tools',
    labelZh: '工具',
    labelEn: 'Tools',
    activeKey: 'tools' as const,
  },
  {
    href: '/knowledge?source=journey_strip',
    match: '/knowledge',
    labelZh: '知识库',
    labelEn: 'Knowledge',
    activeKey: 'content' as const,
  },
] as const;

function journeyAriaLabel(locale?: SiteLocale | string | null): string {
  if (locale === 'en' || `${locale || ''}`.toLowerCase().startsWith('en')) {
    return 'Product path';
  }
  const zh = '产品路径';
  if (locale === 'zh-Hant') return toSiteLocaleText(zh, 'zh-Hant');
  return zh;
}

function stepLabel(
  step: (typeof STEPS_BASE)[number],
  locale?: SiteLocale | string | null,
): string {
  if (locale === 'en' || `${locale || ''}`.toLowerCase().startsWith('en')) {
    return step.labelEn;
  }
  if (locale === 'zh-Hant') return toSiteLocaleText(step.labelZh, 'zh-Hant');
  return step.labelZh;
}

/** Compact product path as text links — no numbered icon cells. */
export default function JourneyStrip({
  active = 'dimensions',
  locale,
}: {
  active?: StepKey;
  locale?: SiteLocale | string | null;
}) {
  return (
    <nav
      aria-label={journeyAriaLabel(locale)}
      className="mb-5 flex flex-wrap gap-x-4 gap-y-1 border-b border-[color:var(--hairline)] pb-3 text-[13px]"
    >
      {STEPS_BASE.map((step) => {
        const isActive = active === step.activeKey;
        return (
          <Link
            key={step.match}
            href={step.href}
            className={
              isActive
                ? 'font-medium text-[color:var(--ink-1)] no-underline'
                : 'text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline'
            }
            aria-current={isActive ? 'page' : undefined}
          >
            {stepLabel(step, locale)}
          </Link>
        );
      })}
    </nav>
  );
}
