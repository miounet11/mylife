'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';

interface SessionState {
  authenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string | null;
    role: 'guest' | 'user' | 'admin';
  } | null;
}

export default function AuthStatus() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await response.json();
        setSession({
          authenticated: !!data.authenticated,
          user: data.user || null,
        });
      } catch {
        setSession({ authenticated: false, user: null });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="h-7 w-7 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)] md:h-9 md:w-20" />
    );
  }

  if (!session?.authenticated || !session.user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-7 items-center gap-1 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-2 text-xs font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--ink-1)] md:h-9 md:gap-1.5 md:px-3 md:text-sm"
      >
        <UserRound className="h-3.5 w-3.5 md:hidden" aria-hidden />
        <span className="md:hidden">登录</span>
        <span className="hidden md:inline">邮箱登录</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 md:gap-1.5">
      {session.user.role === 'admin' && (
        <Link
          href="/admin/content"
          aria-label="内容后台"
          className="inline-flex h-7 items-center gap-1 rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] px-2 text-xs font-semibold text-[color:var(--signal-strong)] transition hover:border-[color:var(--signal)] md:h-9 md:gap-1.5 md:px-3"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hidden md:inline">后台</span>
        </Link>
      )}
      <Link
        href="/profile"
        aria-label="进入档案"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] md:h-9 md:w-auto md:max-w-[180px] md:gap-1.5 md:px-3 md:text-xs md:font-semibold"
      >
        <UserRound className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden truncate md:inline" title={session.user.email || session.user.name}>
          {session.user.email || session.user.name}
        </span>
      </Link>
      <button
        type="button"
        onClick={logout}
        aria-label="退出登录"
        title="退出"
        className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)] transition hover:border-[color:var(--alert)] hover:text-[color:var(--alert)] md:h-9 md:w-9"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}