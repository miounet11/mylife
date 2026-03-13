export const fetchCache = 'force-no-store';
export const revalidate = 0;

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyzeWorkspace from '@/components/analyze-workspace';

export const metadata = {
  title: '开始排盘 | 人生K线',
  description: '统一查看已有测算记录，并继续录入新的出生信息进行分析。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AnalyzePage() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/cases" ctaLabel="查看案例" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <AnalyzeWorkspace />
      </main>

      <SiteFooter />
    </div>
  );
}
