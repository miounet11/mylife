'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Bot,
  ClipboardList,
  LayoutDashboard,
  Mail,
  MessageSquare,
  MessageSquareWarning,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AuthStatus from '@/components/auth-status';
import { cn } from '@/lib/utils';

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shorter label for the mobile strip */
  shortLabel?: string;
};

/** Only routes that exist under app/admin/* */
const adminNavItems: AdminNavItem[] = [
  { href: '/admin/dashboard', label: '总览', icon: LayoutDashboard },
  { href: '/admin/chat-ops', label: '对话运营', shortLabel: '对话', icon: MessageSquare },
  { href: '/admin/chat-eval', label: '评测导出', shortLabel: '评测', icon: ClipboardList },
  { href: '/admin/accuracy-eval', label: '偏差样本', shortLabel: '偏差', icon: ClipboardList },
  { href: '/admin/product-funnel', label: '产品漏斗', shortLabel: '漏斗', icon: BarChart3 },
  { href: '/admin/email-ops', label: '邮件投递', shortLabel: '邮件', icon: Mail },
  { href: '/admin/feedback', label: '用户反馈', shortLabel: '反馈', icon: MessageSquareWarning },
  { href: '/admin/users', label: '用户', icon: Users },
  { href: '/admin/llm', label: 'LLM', icon: Bot },
];

export function AdminHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (pathname || '').startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--hairline)] bg-[color:var(--paper)]/95 backdrop-blur-xl">
      <div className="page-frame flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-black tracking-tight text-[color:var(--ink-1)]"
            aria-label="人生K线 管理后台"
          >
            <ShieldCheck className="h-4 w-4 text-[color:var(--brand-strong)]" />
            <span className="hidden sm:inline">人生K线 · 管理后台</span>
            <span className="sm:hidden">管理后台</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="管理后台导航">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-2.5 text-[13px] font-semibold transition',
                  active
                    ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                    : 'text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
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
            <span className="hidden sm:inline">回到产品</span>
            <span className="sm:hidden">产品</span>
          </Link>
        </div>
      </div>

      {/* Always-visible strip under xl (nav is too wide for tablet) */}
      <div className="scrollbar-none border-t border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] xl:hidden">
        <div className="page-frame flex gap-1 overflow-x-auto py-2">
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
                {item.shortLabel || item.label}
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
      <div className="page-frame flex flex-col items-start justify-between gap-2 py-6 text-xs text-[color:var(--ink-4)] sm:flex-row sm:items-center">
        <div>© {year} 人生K线 · 管理后台 · 仅限授权管理员访问</div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/dashboard" className="hover:text-[color:var(--ink-1)]">
            总览
          </Link>
          <Link href="/admin/chat-ops" className="hover:text-[color:var(--ink-1)]">
            对话运营
          </Link>
          <Link href="/admin/email-ops" className="hover:text-[color:var(--ink-1)]">
            邮件
          </Link>
          <Link href="/admin/users" className="hover:text-[color:var(--ink-1)]">
            用户
          </Link>
          <Link href="/admin/llm" className="hover:text-[color:var(--ink-1)]">
            LLM
          </Link>
          <Link href="/admin/feedback" className="hover:text-[color:var(--ink-1)]">
            反馈
          </Link>
        </div>
      </div>
    </footer>
  );
}
