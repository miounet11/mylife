'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    return <div className="hidden h-10 w-24 rounded-full bg-white/60 md:block" />;
  }

  if (!session?.authenticated || !session.user) {
    return (
      <Link
        href="/login"
        className="hidden rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:text-[color:var(--ink)] md:inline-flex"
      >
        邮箱登录
      </Link>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      {session.user.role === 'admin' && (
        <Link
          href="/admin/content"
          className="rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--ink)]"
        >
          内容后台
        </Link>
      )}
      <Link
        href="/profile"
        className="rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--ink)]"
      >
        {session.user.email || session.user.name}
      </Link>
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--muted)]"
      >
        退出
      </button>
    </div>
  );
}
