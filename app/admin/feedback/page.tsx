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
    <div className="page-shell min-h-screen bg-[color:var(--bg-sunken)]">
      <AdminHeader />
      <main className="page-frame py-8 pb-16">
        <div className="mb-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            Feedback
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[color:var(--ink-1)] md:text-3xl">
            用户反馈 / 报错
          </h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            匿名留言与报错入口汇总。用户看不到运营邮箱；新提交会尝试邮件通知运营。
          </p>
        </div>
        <AdminFeedbackClient initialItems={items} initialCounts={counts} />
      </main>
      <AdminFooter />
    </div>
  );
}
