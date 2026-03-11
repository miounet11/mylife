import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getEntityInsightByTypeAndSlug,
  getEntityInsightsByType,
} from '@/lib/content-store';
import { entityTypeLabels, type EntityInsightType } from '@/lib/content';

interface PageProps {
  params: Promise<{ type: string; slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { type, slug } = await params;
  const insight = getEntityInsightByTypeAndSlug(type, slug);
  if (!insight) {
    return { title: '洞察未找到 | 人生K线' };
  }

  return {
    title: insight.seoTitle,
    description: insight.seoDescription,
  };
}

export default async function InsightDetailPage({ params }: PageProps) {
  const { type, slug } = await params;
  const insight = getEntityInsightByTypeAndSlug(type, slug);
  if (!insight) notFound();

  const related = getEntityInsightsByType(insight.type as EntityInsightType)
    .filter((item) => item.slug !== insight.slug)
    .slice(0, 2);

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.98fr_0.72fr]">
          <article className="glass-panel rounded-[2rem] p-6 md:p-8">
            <Link href="/insights" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
              <ArrowLeft className="h-4 w-4" />
              返回洞察中心
            </Link>

            <div className="mt-6 section-label">
              <Sparkles className="h-3.5 w-3.5" />
              {entityTypeLabels[insight.type]}
            </div>
            <h1 className="mt-5 text-4xl font-black text-[color:var(--ink)] md:text-5xl">{insight.title}</h1>
            <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">{insight.name}</p>
            <p className="mt-5 text-base leading-8 text-[color:var(--muted)]">{insight.excerpt}</p>

            <div className="mt-8 space-y-8">
              {insight.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-bold text-[color:var(--ink)]">{section.title}</h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.title}-${index}`} className="text-base leading-8 text-[color:var(--ink)]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <div className="space-y-5">
            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">继续阅读</div>
              <div className="mt-4 space-y-4">
                {related.length > 0 ? (
                  related.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/insights/${item.type}/${item.slug}`}
                      className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-[color:var(--muted)]">
                    当前类型下还在持续扩充，后续会加入更多同主题实体页面。
                  </p>
                )}
              </div>
            </div>

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">这类页面的作用</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--ink)]">
                <p>承接具体搜索意图，而不是只依赖工具页流量。</p>
                <p>把结果页里的职业、城市、组织话题延伸成长期内容。</p>
                <p>让首页、结果页、案例页和知识页形成更强的内链网络。</p>
              </div>
            </div>

            <NewsletterSignup
              source={`insight_article:${insight.type}:${insight.slug}`}
              title="订阅实体洞察更新"
              description="当我们新增更多行业、城市和组织节奏内容时，直接发送到你的邮箱。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
