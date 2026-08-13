'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import ResultCtaLink from '@/components/result-cta-link';
import LocaleSwitcher from '@/components/i18n/locale-switcher';
import { useLocale } from '@/components/i18n/locale-provider';
import TextScaleToggle from '@/components/text-scale-toggle';
import ToolEntryLink from '@/components/tools/tool-entry-link';
import { BrandLockup } from '@/components/brand/brand-lockup';
import { getPriorityGrowthToolLinks } from '@/lib/tools';
import { cn } from '@/lib/utils';

type NavItem = { href: string; labelKey: string };

/**
 * Primary nav — keep short so users find the right surface fast.
 * Tools hub owns discovery of individual tools; profile owns predictions.
 */
const primaryNavItems: NavItem[] = [
  { href: '/analyze', labelKey: 'navAnalyze' },
  { href: '/tools', labelKey: 'navTools' },
  { href: '/dimensions', labelKey: 'navDimensions' },
  { href: '/knowledge', labelKey: 'navKnowledge' },
  { href: '/teachers', labelKey: 'navTeachers' },
  { href: '/profile', labelKey: 'navProfile' },
];

/** Daily / high-intent shortcuts (lg+ only). */
const secondaryNavItems: Array<{ href: string; labelKey: string }> = [
  { href: '/almanac', labelKey: 'navAlmanac' },
  { href: '/astro', labelKey: 'navAstro' },
  { href: '/hehun', labelKey: 'navHehun' },
  { href: '/tools/naming', labelKey: 'navNaming' },
  { href: '/cases', labelKey: 'navCases' },
  { href: '/events', labelKey: 'navEvents' },
];

/** Always-visible quick entry (also shown in compact header on sm+) */
const BIRTH_QUICK_HREF = '/tools/timing-yearly-window';
const SPACE_LAB_HREF = '/tools/fengshui-space';

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
  const { t, L } = useLocale();
  const resolvedCta = ctaLabel ? L(ctaLabel) : t('ctaStart');

  const isActive = (href: string) => {
    const pathOnly = (href || '').split('?')[0] || href;
    const path = pathname || '';
    if (pathOnly === '/') return path === '/';
    // Exact segment match for /chat vs /profile (avoid soft-nav stale highlight confusion)
    if (pathOnly === '/chat') return path === '/chat' || path.startsWith('/chat/');
    if (pathOnly === '/profile') return path === '/profile' || path.startsWith('/profile/');
    return path === pathOnly || path.startsWith(`${pathOnly}/`);
  };

  const ctaClass =
    'inline-flex h-9 min-h-[var(--control-h)] items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand)] px-3.5 text-[14px] font-medium text-white no-underline transition hover:bg-[color:var(--brand-strong)] hover:no-underline';

  const birthQuickLabel = t('birthQuick');

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--hairline-strong)] bg-[color:var(--paper)] shadow-sm">
      {/* Top bar — Astro-style light utility chrome */}
      <div className="border-b border-[color:var(--hairline)] bg-[color:var(--bg)]">
        <div className="page-frame flex h-14 items-center gap-3">
          <BrandLockup size={26} />

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
              className="fb-input h-8 w-full border-[color:var(--hairline)] bg-[color:var(--paper)] pl-8 pr-3 text-[13px] text-[color:var(--ink-1)] placeholder:text-[color:var(--ink-4)]"
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

      {/* Primary nav strip — Astro navy bar */}
      <div className="bg-[color:var(--nav-bar)] text-[color:var(--nav-bar-ink)]">
        <div className="page-frame scrollbar-none flex min-h-11 items-center gap-0.5 overflow-x-auto py-1">
          <nav className="flex min-w-0 items-center gap-0.5" aria-label="core">
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-3 text-[length:var(--text-caption)] font-medium no-underline transition hover:no-underline sm:text-[14px]',
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-[color:var(--nav-bar-muted)] hover:bg-white/10 hover:text-white',
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <ToolEntryLink
              href={BIRTH_QUICK_HREF}
              source="header_birth_quick"
              title={birthQuickLabel}
              className={cn(
                'hidden h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-2.5 text-[13px] font-medium no-underline transition hover:no-underline sm:inline-flex',
                isActive(BIRTH_QUICK_HREF)
                  ? 'bg-white/15 text-white'
                  : 'text-[color:var(--nav-bar-muted)] hover:bg-white/10 hover:text-white',
              )}
            >
              {birthQuickLabel}
            </ToolEntryLink>
            <ToolEntryLink
              href={`${SPACE_LAB_HREF}?source=header_space`}
              source="header_space"
              title={t('navSpace')}
              className={cn(
                'inline-flex h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-2.5 text-[13px] font-semibold no-underline transition hover:no-underline',
                isActive(SPACE_LAB_HREF)
                  ? 'bg-white/15 text-white'
                  : 'text-white/90 hover:bg-white/10 hover:text-white',
              )}
            >
              {t('navSpace')}
            </ToolEntryLink>
            {!compact ? (
              <>
                <span className="mx-1.5 hidden h-4 w-px shrink-0 bg-white/20 lg:block" />
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'hidden h-10 min-h-[var(--control-h)] shrink-0 items-center whitespace-nowrap rounded-[var(--radius)] px-2.5 text-[length:var(--text-caption)] font-medium no-underline transition hover:no-underline lg:inline-flex',
                      isActive(item.href)
                        ? 'text-white'
                        : 'text-[color:var(--nav-bar-muted)] hover:bg-white/10 hover:text-white',
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
