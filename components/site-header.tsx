'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import ResultCtaLink from '@/components/result-cta-link';
import LocaleSwitcher from '@/components/i18n/locale-switcher';
import { useLocale } from '@/components/i18n/locale-provider';
import TextScaleToggle from '@/components/text-scale-toggle';
import { getPriorityGrowthToolLinks } from '@/lib/tools';
import { cn } from '@/lib/utils';

type NavItem = { href: string; labelKey: string };

const primaryNavItems: NavItem[] = [
  { href: '/analyze', labelKey: 'navWorkbench' },
  { href: '/dimensions', labelKey: 'navDimensions' },
  { href: '/tools', labelKey: 'navTools' },
  { href: '/teachers', labelKey: 'navTeachers' },
  { href: '/knowledge', labelKey: 'navKnowledge' },
  { href: '/predictions', labelKey: 'navPredictions' },
  { href: '/chat', labelKey: 'navChat' },
  { href: '/profile', labelKey: 'navProfile' },
];

const secondaryNavItems: Array<{ href: string; labelKey: string }> = [
  { href: '/cases', labelKey: 'navCases' },
  { href: '/events', labelKey: 'navEvents' },
  { href: '/annual-review', labelKey: 'navAnnual' },
  { href: '/docs', labelKey: 'navDocs' },
];

/** Always-visible quick entry (compact header 也显示) */
const BIRTH_QUICK_HREF = '/tools/timing-yearly-window';
const BIRTH_QUICK_LABEL = '填生日测';

const priorityGrowthHeaderLinks = getPriorityGrowthToolLinks('header_priority_growth');

interface SiteHeaderProps {
  ctaHref?: string;
  ctaLabel?: string;
  compact?: boolean;
  ctaAnalytics?: {
    page: string;
    target: string;
    meta?: Record<string, unknown>;
  };
}

export default function SiteHeader({
  ctaHref = '/analyze',
  ctaLabel,
  compact = false,
  ctaAnalytics,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { t, L, locale } = useLocale();
  const resolvedCta = ctaLabel ? L(ctaLabel) : t('ctaStart');

  const isActive = (href: string) =>
    href === '/' ? pathname === href : pathname === href || (pathname || '').startsWith(`${href}/`);

  const ctaClass =
    'inline-flex h-9 min-h-[var(--control-h)] items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--ink-1)] px-3.5 text-[14px] font-medium text-white no-underline transition hover:bg-black hover:no-underline';

  const brandName = t('brandName');
  // 避免中文品牌名被错误切片成多行「人 / K / 线」
  const brandMain =
    locale === 'en' ? (
      <>
        Life <span className="font-serif">K</span>-Line
      </>
    ) : (
      <span className="whitespace-nowrap">{brandName || '人生K线'}</span>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--hairline)] bg-[color:var(--paper)]/95 backdrop-blur-md">
      {/* Top bar — Linear-style light chrome */}
      <div className="border-b border-[color:var(--hairline)]">
        <div className="page-frame flex h-14 items-center gap-3">
          <Link
            href="/"
            aria-label={t('brandAria')}
            className="flex shrink-0 items-center gap-2.5 text-[color:var(--ink-1)] hover:opacity-90 hover:no-underline"
          >
            <span className="brand-mark text-[13px] leading-none">
              <span className="font-serif">K</span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[14px] font-semibold tracking-[-0.02em]">{brandMain}</span>
              <span
                className="mt-0.5 text-[10px] font-medium uppercase text-[color:var(--ink-4)]"
                style={{ letterSpacing: '0.14em' }}
              >
                LIFE KLINE
              </span>
            </span>
          </Link>

          <form
            action="/community/search"
            method="get"
            className="relative ml-2 hidden min-w-0 max-w-md flex-1 md:block"
            role="search"
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--ink-4)]" />
            <input
              type="text"
              name="q"
              placeholder={t('searchPlaceholder')}
              className="fb-input h-8 w-full pl-8 pr-3 text-[13px] text-[color:var(--ink-1)] placeholder:text-[color:var(--ink-4)]"
              aria-label={t('navSearch')}
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <TextScaleToggle variant="light" className="hidden sm:inline-flex" />
            <LocaleSwitcher variant="light" className="hidden sm:inline-flex" />
            <AuthStatus />
            <Link
              href="/community/search"
              aria-label={t('navSearch')}
              className="inline-flex h-9 w-9 min-h-[var(--control-h)] min-w-[var(--control-h)] items-center justify-center rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-2)] transition hover:bg-[color:var(--bg-sunken)] md:hidden"
            >
              <Search className="h-4 w-4" />
            </Link>
            {ctaAnalytics ? (
              <ResultCtaLink
                href={ctaHref}
                page={ctaAnalytics.page}
                target={ctaAnalytics.target}
                className={ctaClass}
                meta={{ surface: 'site_header', ...ctaAnalytics.meta }}
              >
                {resolvedCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </ResultCtaLink>
            ) : (
              <Link href={ctaHref} className={ctaClass}>
                {resolvedCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary nav strip */}
      <div className="bg-[color:var(--paper)]">
        <div className="page-frame scrollbar-none flex min-h-11 items-center gap-0.5 overflow-x-auto py-1">
          <nav className="flex min-w-0 items-center gap-0.5" aria-label="core">
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);
              const label =
                item.labelKey === 'navTeachers' ? '请老师' : t(item.labelKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-3 text-[length:var(--text-caption)] font-medium no-underline transition hover:no-underline sm:text-[14px]',
                    active
                      ? 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-1)]'
                      : 'text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]',
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href={BIRTH_QUICK_HREF}
              className={cn(
                'hidden h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-2.5 text-[13px] font-medium no-underline transition hover:no-underline sm:inline-flex',
                isActive(BIRTH_QUICK_HREF)
                  ? 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-1)]'
                  : 'text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]',
              )}
              title="无报告也可填生日即时测算"
            >
              {BIRTH_QUICK_LABEL}
            </Link>
            {!compact ? (
              <>
                <span className="mx-1.5 hidden h-4 w-px shrink-0 bg-[color:var(--hairline)] lg:block" />
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'hidden h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-2.5 text-[length:var(--text-caption)] font-medium no-underline transition hover:no-underline lg:inline-flex',
                      isActive(item.href)
                        ? 'text-[color:var(--ink-1)]'
                        : 'text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-2)]',
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
                {priorityGrowthHeaderLinks.slice(0, 1).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hidden h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-2.5 text-[length:var(--text-caption)] font-medium text-[color:var(--ink-4)] no-underline transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-2)] hover:no-underline xl:inline-flex"
                  >
                    {L(item.shortLabel)}
                  </Link>
                ))}
                <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:hidden">
                  <TextScaleToggle variant="light" />
                  <LocaleSwitcher variant="light" />
                </div>
              </>
            ) : (
              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:hidden">
                <TextScaleToggle variant="light" />
                <LocaleSwitcher variant="light" />
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
