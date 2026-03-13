'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/knowledge', label: '知识库' },
  { href: '/insights', label: '洞察中心' },
  { href: '/analyze', label: '开始分析' },
  { href: '/chat', label: 'AI 咨询' },
  { href: '/events', label: '事件日历' },
  { href: '/profile', label: '我的档案' },
  { href: '/cases', label: '案例库' },
  { href: '/updates', label: '邮件更新' },
];

interface SiteHeaderProps {
  ctaHref?: string;
  ctaLabel?: string;
}

export default function SiteHeader({
  ctaHref = '/analyze',
  ctaLabel = '立即开始',
}: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-[color:var(--surface)]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_14px_30px_rgba(14,116,144,0.28)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight text-[color:var(--ink)]">人生K线</div>
            <div className="text-xs text-[color:var(--muted)]">真太阳时命理分析</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                    : 'text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--ink)]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <AuthStatus />
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--accent-strong)]"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="scrollbar-none border-t border-white/50 px-4 py-2 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  active
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                    : 'border-[color:var(--line)] bg-white text-[color:var(--muted)]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
