'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  LayoutDashboard,
  MessageSquareText,
  UserRound,
  Users,
  Wrench,
  BookOpenText,
  Search,
  Sparkles,
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
  { href: '/analyze', label: '工作台', icon: LayoutDashboard },
  { href: '/chat',    label: '结构追问', icon: MessageSquareText },
  { href: '/community', label: '社区', icon: Users },
  { href: '/tools',   label: '工具中心', icon: Wrench },
  { href: '/events',  label: '事件日历', icon: CalendarDays },
  { href: '/profile', label: '我的档案', icon: UserRound },
  { href: '/docs',    label: '文档', icon: BookOpenText },
];

const portalSubLinks = [
  { href: '/world-yi',      label: '世界易' },
  { href: '/knowledge',     label: '知识库' },
  { href: '/cases',         label: '案例库' },
  { href: '/reports',       label: '公开结果' },
  { href: '/insights',      label: '洞察' },
  { href: '/visual-assets', label: '图片库' },
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
    <header className="sticky top-0 z-50">
      {/* Row 1 : FB 蓝顶栏（chrome） */}
      <div className="fb-chrome border-b border-[#1e3160]">
        <div className="mx-auto flex h-[42px] max-w-7xl items-center gap-4 px-3 sm:px-4 lg:px-6">
          <Link
            href="/"
            aria-label="回到人生K线首页"
            className="flex shrink-0 items-center gap-2 text-white hover:opacity-90"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-white/12 text-[15px] font-black leading-none">
              <span className="font-serif">K</span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight">
                人生<span className="font-serif">K</span>线
              </span>
              <span
                className="mt-0.5 text-[9px] font-semibold uppercase opacity-80"
                style={{ letterSpacing: '0.18em' }}
              >
                LIFE KLINE
              </span>
            </span>
          </Link>

          <form
            action="/community/search"
            method="get"
            className="relative ml-1 hidden min-w-0 max-w-[420px] flex-1 md:block"
            role="search"
          >
            <input
              type="text"
              name="q"
              placeholder="搜索：八字 / 紫微 / 六爻 / 风水 / 塔罗 …"
              className="h-7 w-full rounded-[2px] border border-[#29487d] bg-white px-2 pr-7 text-[13px] text-[color:var(--fb-ink-1)] placeholder:text-[color:var(--fb-ink-4)] focus:border-white focus:outline-none"
              aria-label="站内搜索"
            />
            <Search className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--fb-ink-3)]" />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2 text-white">
            <div className="hidden md:block">
              <AuthStatus />
            </div>
            {ctaAnalytics ? (
              <ResultCtaLink
                href={ctaHref}
                page={ctaAnalytics.page}
                target={ctaAnalytics.target}
                className="inline-flex h-7 items-center gap-1 rounded-[2px] border border-[#29487d] bg-[#4267b2] px-3 text-[13px] font-bold text-white hover:bg-[#365899]"
                meta={{ surface: 'site_header', ...ctaAnalytics.meta }}
              >
                {ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </ResultCtaLink>
            ) : (
              <Link
                href={ctaHref}
                className="inline-flex h-7 items-center gap-1 rounded-[2px] border border-[#29487d] bg-[#4267b2] px-3 text-[13px] font-bold text-white hover:bg-[#365899]"
              >
                {ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 : 白底主导航 */}
      <div className="border-b border-[color:var(--fb-border)] bg-white">
        <div className="scrollbar-none mx-auto flex h-10 max-w-7xl items-center gap-1 overflow-x-auto px-3 sm:px-4 lg:px-6">
          <nav className="flex items-center gap-0.5" aria-label="核心产品导航">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 px-3 text-[13px] font-semibold no-underline hover:no-underline',
                    active
                      ? 'border-b-2 border-[color:var(--fb-blue)] text-[color:var(--fb-blue-link-hover)]'
                      : 'border-b-2 border-transparent text-[color:var(--fb-ink-2)] hover:text-[color:var(--fb-blue-link-hover)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Row 3 : 易学栏目副带 */}
      <div className="border-b border-[color:var(--fb-border)] bg-[#f6f7f9]">
        <div className="mx-auto flex h-9 max-w-7xl items-center gap-4 px-3 sm:px-4 lg:px-6">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[color:var(--fb-blue)]" aria-hidden />
          <div className="scrollbar-none flex min-w-0 items-center gap-3 overflow-x-auto whitespace-nowrap text-[12px]">
            {portalSubLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'shrink-0 font-semibold no-underline hover:underline',
                    active
                      ? 'text-[color:var(--fb-blue-link-hover)]'
                      : 'text-[color:var(--fb-blue-link)]',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <span className="text-[color:var(--fb-ink-4)]">·</span>
            {priorityGrowthHeaderLinks.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 font-semibold text-[color:var(--fb-ink-3)] no-underline hover:text-[color:var(--fb-blue-link)] hover:underline"
              >
                {item.shortLabel}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
