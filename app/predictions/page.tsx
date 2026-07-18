import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import PredictionsListPage from '@/components/predictions/predictions-list-page';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '预测回访',
  description: '对照报告中的时间窗判断，记录命中、部分命中或未命中，帮助系统持续校准。',
  path: '/predictions',
  noIndex: true,
});

export default function PredictionsPage() {
  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: '十维度', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="验证"
          title="预测回访"
          description="报告与十维度中的时间窗判断会归档到这里。到期前后对照现实节点反馈。"
          actions={
            <>
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                十维度
              </Link>
              <Link href="/annual-review" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                年度复盘
              </Link>
              <Link href="/history" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                报告历史
              </Link>
            </>
          }
        />
        <PageIllustrationStrip surface="predictions/revisit" title="回访闭环" compact limit={1} />
        <Suspense
          fallback={
            <div className="py-8 text-center text-[13px] text-[color:var(--ink-5)]">加载预测清单…</div>
          }
        >
          <PredictionsListPage />
        </Suspense>
      </div>
    </AppPage>
  );
}
