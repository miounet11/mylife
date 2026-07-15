import { requireAdminUser } from '@/lib/auth';
import { AdminFooter, AdminHeader } from '@/components/admin-shell';
import AdminFeedbackClient from '@/components/admin/admin-feedback-client';
import {
  countSiteFeedbackByStatus,
  listSiteFeedback,
} from '@/lib/user-feedback-store';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  await requireAdminUser('/admin/feedback');
  const items = listSiteFeedback({ limit: 100, status: 'all' });
  const counts = countSiteFeedbackByStatus();

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h1 className="text-xl font-black tracking-tight text-[color:var(--ink-1)]">用户反馈 / 报错</h1>
          <p className="mt-1 text-sm text-[color:var(--ink-3)]">
            匿名留言与报错入口汇总。用户看不到运营邮箱；新提交会尝试邮件通知运营。
          </p>
        </div>
        <AdminFeedbackClient initialItems={items} initialCounts={counts} />
      </main>
      <AdminFooter />
    </div>
  );
}
