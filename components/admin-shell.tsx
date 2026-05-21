'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BarChart3, FileText, Package, Repeat2, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import { cn } from '@/lib/utils';

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const adminNavItems: AdminNavItem[] = [
  { href: '/admin/usage',            label: '频率留存',   icon: Repeat2 },
  { href: '/admin/analytics',        label: '经营分析',   icon: BarChart3 },
  { href: '/admin/content',          label: '内容后台',   icon: FileText },
  { href: '/admin/premium-services', label: '增值服务',   icon: Package },
];

export function AdminHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--hairline)] bg-[color:var(--paper)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/usage"
            className="inline-flex items-center gap-2 text-sm font-black tracking-tight text-[color:var(--ink-1)]"
            aria-label="人生K线 管理后台"
          >
            <ShieldCheck className="h-4 w-4 text-[color:var(--brand-strong)]" />
            <span>人生K线 · 管理后台</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="管理后台导航">
          {adminNavItems.map((item) => {
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
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--ink-1)]"
          >
            <ArrowLeft className="h-4 w-4" />
            回到产品
          </Link>
        </div>
      </div>

      {/* 中小屏：横向滚动导航 */}
      <div className="scrollbar-none border-t border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] md:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {adminNavItems.map((item) => {
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
    </header>
  );
}

export function AdminFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]/60">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-[color:var(--ink-4)] sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>© {year} 人生K线 · 管理后台 · 仅限授权管理员访问</div>
        <div className="flex items-center gap-3">
          <Link href="/admin/usage" className="hover:text-[color:var(--ink-1)]">频率留存</Link>
          <Link href="/admin/analytics" className="hover:text-[color:var(--ink-1)]">经营分析</Link>
          <Link href="/admin/content" className="hover:text-[color:var(--ink-1)]">内容后台</Link>
          <Link href="/admin/premium-services" className="hover:text-[color:var(--ink-1)]">增值服务</Link>
        </div>
      </div>
    </footer>
  );
}
