import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getFeaturedCaseStudies } from '@/lib/content-store';

export const metadata: Metadata = {
  title: '公开报告样例',
  description: '通过案例与知识专题理解世界易报告的结构读法，保护隐私的公开内容入口。',
  alternates: { canonical: '/reports' },
};

export default function ReportsPage() {
  const samples = getFeaturedCaseStudies(4);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '生成我的报告', compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="公开内容"
          title="先理解结构读法"
          description="可通过案例与文档理解报告结构；登录后可在历史记录查看已归档报告。"
          actions={
            <>
              <Link href="/history" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                我的报告历史
              </Link>
              <Link href="/docs/read-first-report" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                报告读法
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                生成报告
              </Link>
            </>
          }
        />
        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">结构样例</h2>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {samples.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/cases/${item.slug}`}
                  className="block py-2.5 text-[14px] font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppPage>
  );
}
