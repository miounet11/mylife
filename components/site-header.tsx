'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Images,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  UserRound,
  Wrench,
  BookOpenText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import ResultCtaLink from '@/components/result-cta-link';
import { getPriorityGrowthToolLinks } from '@/lib/tools';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryNavItems: NavItem[] = [
  { href: '/analyze', label: '判断工作台', icon: LayoutDashboard },
  { href: '/chat', label: '结构追问', icon: MessageSquareText },
  { href: '/tools', label: '工具中心', icon: Wrench },
  { href: '/events', label: '事件日历', icon: CalendarDays },
  { href: '/profile', label: '我的档案', icon: UserRound },
  { href: '/docs', label: 'Docs', icon: BookOpenText },
];

const priorityGrowthHeaderLinks = getPriorityGrowthToolLinks('header_priority_growth');

interface SiteHeaderProps {
  ctaHref?: string;
  ctaLabel?: string;
  ctaAnalytics?: {
    page: string;
    target: string;
    meta?: Record<string, unknown>;
  };
}

export default function SiteHeader({
  ctaHref = '/analyze',
  ctaLabel = '立即开始',
  ctaAnalytics,
}: SiteHeaderProps) {
  const pathname = usePathname();

  const isActive = (href: string) => href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="回到人生K线首页">
          <div className="brand-mark">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-black text-[color:var(--ink)]">人生K线</div>
            <div className="hidden text-xs text-[color:var(--muted)] sm:block">结构判断工作台</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="核心产品导航">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'smooth-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
                  isActive(item.href)
                    ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                    : 'text-[color:var(--muted)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--ink)]'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <AuthStatus />
          {ctaAnalytics ? (
            <ResultCtaLink
              href={ctaHref}
              page={ctaAnalytics.page}
              target={ctaAnalytics.target}
              className="action-primary action-main smooth-button px-4 py-2.5 text-sm"
              meta={{
                surface: 'site_header',
                ...ctaAnalytics.meta,
              }}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </ResultCtaLink>
          ) : (
            <Link href={ctaHref} className="action-primary action-main smooth-button px-4 py-2.5 text-sm">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="scrollbar-none hidden border-t border-[color:var(--line)] bg-white/72 px-4 py-2 md:block xl:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'smooth-button inline-flex whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                  isActive(item.href)
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                    : 'border-[color:var(--line)] bg-white text-[color:var(--muted)]'
                )}
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[color:var(--line)] bg-[rgba(245,239,229,0.78)] px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs sm:text-sm">
          <Link
            href="/world-yi"
            className="inline-flex min-w-0 items-center gap-2 font-black text-[color:var(--accent-strong)]"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="truncate">世界易</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto whitespace-nowrap">
            {priorityGrowthHeaderLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full bg-white/80 px-3 py-1.5 font-semibold text-[color:var(--ink)]">
                {item.shortLabel}
              </Link>
            ))}
            <Link href="/chat" className="rounded-full bg-white/80 px-3 py-1.5 font-semibold text-[color:var(--ink)]">
              结构追问
            </Link>
            <Link href="/visual-assets" className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 font-semibold text-[color:var(--ink)]">
              <Images className="h-3.5 w-3.5" />
              图片说明库
            </Link>
            <Link href="/docs/structured-chat" className="rounded-full bg-white/80 px-3 py-1.5 font-semibold text-[color:var(--ink)]">
              使用方法
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
