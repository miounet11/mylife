import type { Metadata } from 'next';
import Link from 'next/link';
import AnnualReviewPageBody from '@/components/annual-review/annual-review-page-body';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';

export const metadata: Metadata = {
  title: '年度复盘｜命中率与校准',
  description: '汇总预测反馈与人生事件，查看年度命中率、亮点与下一年校准建议。',
  robots: { index: false, follow: false },
  alternates: { canonical: '/annual-review' },
};

export default function AnnualReviewPage() {
  return (
    <AppPage header={{ ctaHref: '/profile', ctaLabel: '我的档案', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="复盘"
          title="年度命中率回顾"
          description="汇总预测回访与人生事件：哪些判断贴近现实，哪些领域需要收敛。"
          actions={
            <>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                预测回访
              </Link>
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                十维度
              </Link>
              <Link href="/profile/events" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                人生事件
              </Link>
            </>
          }
        />
        <PageIllustrationStrip surface="annual-review/hub" title="复盘闭环" compact limit={1} />

        <AnnualReviewPageBody />

        <section className="border-t border-[color:var(--hairline)] pt-4">
          <h2 className="text-[13px] font-medium text-[color:var(--ink-1)]">复盘如何生效</h2>
          <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
            年度复盘会写入长期档案，并在下次报告生成时影响表达重点与保守程度。
          </p>
          <Link
            href="/analyze"
            className="mt-2 inline-block text-[13px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            生成新报告
          </Link>
        </section>
      </div>
    </AppPage>
  );
}
