export const fetchCache = 'force-no-store';
export const revalidate = 0;

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze-workspace';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import { getAuthSession } from '@/lib/auth';
import { buildUpdatesSummary } from '@/lib/updates-summary';

export const metadata = {
  title: '开始排盘 | 人生K线',
  description: '统一查看已有测算记录，并继续录入新的出生信息进行分析。',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AnalyzePage() {
  const session = await getAuthSession();
  const initialAuthenticated = !!session.authenticated && !!session.user?.id;
  const initialSummary = initialAuthenticated && session.user?.id
    ? buildUpdatesSummary({
        userId: session.user.id,
        email: session.user.email,
      })
    : null;

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="analyze_page_viewed" page="/analyze" meta={{ surface: 'workspace' }} />
      <SiteHeader ctaHref="/cases" ctaLabel="查看案例" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <UpdatesStatusPanel
          title="开始新测算前，先看已有进度"
          description="如果你已经有报告或升级任务，这里会先把当前状态给你，避免重复进入同一份结果。"
          initialAuthenticated={initialAuthenticated}
          initialSummary={initialSummary}
        />

        <AnalyzeWorkspace />
      </main>

      <SiteFooter />
    </div>
  );
}
