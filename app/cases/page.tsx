import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getCaseStudies } from '@/lib/content-store';

export const metadata = {
  title: '公开案例库 | 人生K线',
  description: '通过升学、事业、婚恋等真实场景案例，解释命理产品到底解决什么问题。',
};

export const dynamic = 'force-dynamic';

export default function CasesPage() {
  const caseStudies = getCaseStudies();
  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="cases_page_viewed" page="/cases" meta={{ surfaceKey: 'cases_page', contentType: 'case' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              场景化案例
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              用户不是来学术语，
              <span className="font-serif text-[color:var(--accent-strong)]">而是来解决具体问题。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              案例页把产品价值翻译成真实情境，既适合新用户理解，也适合持续扩展成高质量的内容资产。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {['升学与焦虑判断', '职业换岗与时机窗口', '关系推进与风险节奏'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {caseStudies.map((item) => (
            <ContentCardLink
              key={item.slug}
              href={`/cases/${item.slug}`}
              page="/cases"
              meta={{
                surfaceKey: 'cases_page',
                contentType: 'case',
                slug: item.slug,
                title: item.title,
                category: item.scenario,
                tags: item.tags,
              }}
              className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
            >
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
              <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                查看案例
                <ArrowRight className="h-4 w-4" />
              </div>
            </ContentCardLink>
          ))}
        </section>

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="案例页转化"
            sourceKey="cases_page"
            contentMeta={{ contentType: 'case', surfaceKey: 'cases_page' }}
            title="案例看完，马上测自己的命盘和阶段"
            description="案例负责证明产品能解决真实问题，真正的用户转化不该再绕回首页。这里就可以直接带着生日进入分析。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
