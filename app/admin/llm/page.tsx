import Link from 'next/link';
import { AdminFooter, AdminHeader } from '@/components/admin-shell';
import LlmProviderConsole from '@/components/llm-provider-console';
import { requireAdminUser } from '@/lib/auth';
import { getAdminOpsDashboardSnapshot } from '@/lib/admin-ops-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminLlmPage() {
  await requireAdminUser('/admin/llm');
  const snap = getAdminOpsDashboardSnapshot();
  const failRate =
    snap.analytics.llmAttempts24h > 0
      ? ((snap.analytics.llmFail24h / snap.analytics.llmAttempts24h) * 100).toFixed(1)
      : null;

  return (
    <div className="page-shell min-h-screen bg-[color:var(--bg-sunken)]">
      <AdminHeader />
      <main className="page-frame mx-auto max-w-5xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="text-[12px] font-semibold text-[color:var(--brand)] hover:no-underline">
            ← 返回看板
          </Link>
          <h1 className="mt-2 text-3xl font-black text-[color:var(--ink-1)]">LLM 设置</h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            管理提供商、模型与开关。密钥仅管理员可见（脱敏展示）。
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-1">
              24h 调用 {snap.analytics.llmAttempts24h}
            </span>
            <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-1">
              24h 失败 {snap.analytics.llmFail24h}
              {failRate ? `（${failRate}%）` : ''}
            </span>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-6">
          <LlmProviderConsole />
        </div>
      </main>
      <AdminFooter />
    </div>
  );
}
