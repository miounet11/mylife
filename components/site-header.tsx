'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import ResultCtaLink from '@/components/result-cta-link';
import { cn } from '@/lib/utils';

const primaryNavItems = [
  { href: '/analyze', label: '进入判断' },
  { href: '/chat', label: '结构追问' },
  { href: '/events', label: '事件日历' },
  { href: '/profile', label: '我的档案' },
];

const secondaryNavItems = [
  { href: '/world-yi', label: '世界易' },
  { href: '/knowledge', label: '知识库' },
  { href: '/tools', label: '工具中心' },
  { href: '/cases', label: '案例库' },
  { href: '/visual-assets', label: '图片库' },
  { href: '/updates', label: '邮件更新' },
];

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
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-[color:var(--surface-strong)]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_10px_22px_rgba(178,149,93,0.18)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight text-[color:var(--ink)]">人生K线</div>
            <div className="text-xs text-[color:var(--muted)]">人生判断 · 结构追问 · 事件落地</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'smooth-button rounded-full px-4 py-2 text-sm font-medium transition',
                isActive(item.href)
                  ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                  : 'text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--ink)]'
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mx-2 h-5 w-px bg-[color:var(--line)]" />
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'smooth-button rounded-full px-3 py-2 text-sm font-medium transition',
                isActive(item.href)
                  ? 'bg-white text-[color:var(--ink)]'
                  : 'text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--ink)]'
              )}
            >
              {item.label}
            </Link>
          ))}
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

      <div className="scrollbar-none border-t border-[color:var(--line)] px-4 py-2 xl:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {[...primaryNavItems, ...secondaryNavItems].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'smooth-button whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition',
                isActive(item.href)
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                  : 'border-[color:var(--line)] bg-white text-[color:var(--muted)]'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
