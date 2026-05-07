'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  LayoutDashboard,
  MessageSquareText,
  UserRound,
  Wrench,
  BookOpenText,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import ResultCtaLink from '@/components/result-cta-link';
import { BrandLockup } from '@/components/ui/brand-lockup';
import { Button } from '@/components/ui/button';
import { getPriorityGrowthToolLinks } from '@/lib/tools';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// 决策台导航 = 工作台 / 追问 / 工具 / 事件 / 档案 / 文档（6 项，与原一致）
const primaryNavItems: NavItem[] = [
  { href: '/analyze', label: '工作台', icon: LayoutDashboard },
  { href: '/chat',    label: '结构追问', icon: MessageSquareText },
  { href: '/tools',   label: '工具中心', icon: Wrench },
  { href: '/events',  label: '事件日历', icon: CalendarDays },
  { href: '/profile', label: '我的档案', icon: UserRound },
  { href: '/docs',    label: '文档', icon: BookOpenText },
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

  const isActive = (href: string) =>
    href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--hairline)] bg-[color:var(--paper)]/92 backdrop-blur-xl">
      {/* 主行：brand · 主导航 · 用户态 + CTA */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLockup size="md" withSubtitle ariaLabel="回到人生K线首页" />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="核心产品导航">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3 text-sm font-semibold transition',
                  active
                    ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                    : 'text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden md:block">
            <AuthStatus />
          </div>
          {ctaAnalytics ? (
            <ResultCtaLink
              href={ctaHref}
              page={ctaAnalytics.page}
              target={ctaAnalytics.target}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
              meta={{ surface: 'site_header', ...ctaAnalytics.meta }}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </ResultCtaLink>
          ) : (
            <Link
              href={ctaHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* 中屏副栏：横向滚动主导航（< lg, ≥ md）*/}
      <div className="scrollbar-none hidden border-t border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] md:block lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-semibold transition',
                  active
                    ? 'bg-[color:var(--brand-soft-2)] text-[color:var(--brand-strong)]'
                    : 'text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)]',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 副带：世界易入口 · 优先增长工具（仅大屏，独立 band） */}
      <div className="hidden border-t border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]/72 lg:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/world-yi"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            世界易系统
          </Link>
          <div className="scrollbar-none flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap">
            {priorityGrowthHeaderLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]"
              >
                {item.shortLabel}
              </Link>
            ))}
            <Link
              href="/visual-assets"
              className="inline-flex shrink-0 items-center rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]"
            >
              图片库
            </Link>
            <Link
              href="/docs/structured-chat"
              className="inline-flex shrink-0 items-center rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]"
            >
              使用方法
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
