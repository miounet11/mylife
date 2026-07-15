import Link from 'next/link';
import { AdminFooter, AdminHeader } from '@/components/admin-shell';
import { requireAdminUser } from '@/lib/auth';
import { listAdminUsers } from '@/lib/admin-ops-dashboard';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{
    q?: string;
    kind?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminUser('/admin/users');
  const sp = searchParams ? await searchParams : {};
  const q = `${sp.q || ''}`.trim();
  const kindRaw = `${sp.kind || 'all'}`;
  const kind = (['all', 'guest', 'registered', 'admin'].includes(kindRaw)
    ? kindRaw
    : 'all') as 'all' | 'guest' | 'registered' | 'admin';
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 30;
  const { total, items } = listAdminUsers({
    q,
    kind,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const kindTabs = [
    { key: 'all', label: '全部' },
    { key: 'registered', label: '注册用户' },
    { key: 'guest', label: '临时 Guest' },
    { key: 'admin', label: '管理员' },
  ] as const;

  function hrefFor(next: { q?: string; kind?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextKind = next.kind ?? kind;
    const nextPage = next.page ?? page;
    if (nextQ) params.set('q', nextQ);
    if (nextKind && nextKind !== 'all') params.set('kind', nextKind);
    if (nextPage > 1) params.set('page', String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : '/admin/users';
  }

  return (
    <div className="page-shell min-h-screen bg-[color:var(--bg-sunken)]">
      <AdminHeader />
      <main className="page-frame mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/admin/dashboard" className="text-[12px] font-semibold text-[color:var(--brand)] hover:no-underline">
              ← 返回看板
            </Link>
            <h1 className="mt-2 text-3xl font-black text-[color:var(--ink-1)]">用户与临时会话</h1>
            <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
              注册邮箱、Guest 临时用户、测算与工具次数。分页查询，避免全表加载。
            </p>
          </div>
          <div className="text-[12px] text-[color:var(--ink-4)]">共 {total} 人 · 第 {page}/{totalPages} 页</div>
        </div>

        <form className="mb-4 flex flex-col gap-2 sm:flex-row" action="/admin/users" method="get">
          <input type="hidden" name="kind" value={kind} />
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索邮箱 / 名称 / user id"
            className="h-10 flex-1 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm"
          />
          <button type="submit" className="fb-btn fb-btn-primary h-10 px-4 text-sm">
            搜索
          </button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          {kindTabs.map((tab) => (
            <Link
              key={tab.key}
              href={hrefFor({ kind: tab.key, page: 1 })}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold hover:no-underline ${
                kind === tab.key
                  ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                  : 'border border-[color:var(--hairline)] text-[color:var(--ink-3)]'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)]">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead className="bg-[color:var(--bg-elevated)] text-[10px] uppercase tracking-wide text-[color:var(--ink-4)]">
              <tr>
                <th className="px-3 py-2.5">类型</th>
                <th className="px-3 py-2.5">邮箱 / ID</th>
                <th className="px-3 py-2.5">名称</th>
                <th className="px-3 py-2.5 text-right">报告</th>
                <th className="px-3 py-2.5 text-right">工具</th>
                <th className="px-3 py-2.5">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[color:var(--ink-4)]">
                    无匹配用户
                  </td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr key={user.id} className="border-t border-[color:var(--hairline)]">
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          user.kind === 'admin'
                            ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                            : user.kind === 'guest'
                              ? 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]'
                              : 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
                        }`}
                      >
                        {user.kind}
                      </span>
                    </td>
                    <td className="max-w-[280px] truncate px-3 py-2.5 font-semibold text-[color:var(--ink-1)]">
                      {user.email || user.id}
                    </td>
                    <td className="px-3 py-2.5 text-[color:var(--ink-3)]">{user.name || '—'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{user.fortune_count}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{user.tool_count}</td>
                    <td className="px-3 py-2.5 text-[color:var(--ink-4)]">{user.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={hrefFor({ page: Math.max(1, page - 1) })}
            className={`text-[12px] font-semibold ${page <= 1 ? 'pointer-events-none text-[color:var(--ink-5)]' : 'text-[color:var(--brand)]'} hover:no-underline`}
          >
            ← 上一页
          </Link>
          <div className="text-[12px] text-[color:var(--ink-4)]">
            {page} / {totalPages}
          </div>
          <Link
            href={hrefFor({ page: Math.min(totalPages, page + 1) })}
            className={`text-[12px] font-semibold ${page >= totalPages ? 'pointer-events-none text-[color:var(--ink-5)]' : 'text-[color:var(--brand)]'} hover:no-underline`}
          >
            下一页 →
          </Link>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
}
