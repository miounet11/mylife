import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getFeaturedKnowledgeArticles, getKnowledgeArticleBySlug } from '@/lib/content-store';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getKnowledgeArticleBySlug(slug);
  if (!article) {
    return {
      title: '文章未找到 | 人生K线',
    };
  }

  return {
    title: article.seoTitle,
    description: article.seoDescription,
  };
}

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getKnowledgeArticleBySlug(slug);
  if (!article) notFound();

  const related = getFeaturedKnowledgeArticles(3).filter((item) => item.slug !== article.slug).slice(0, 2);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.seoTitle,
    description: article.seoDescription,
    articleSection: article.category,
    keywords: article.tags.join(', '),
    mainEntityOfPage: `https://www.life-kline.com/knowledge/${article.slug}`,
    url: `https://www.life-kline.com/knowledge/${article.slug}`,
    author: {
      '@type': 'Organization',
      name: '人生K线',
    },
    publisher: {
      '@type': 'Organization',
      name: '人生K线',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.life-kline.com/icon.svg',
      },
    },
  };

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_article_viewed"
        page={`/knowledge/${article.slug}`}
        meta={{
          surfaceKey: `knowledge_article:${article.slug}`,
          contentType: 'knowledge',
          slug: article.slug,
          title: article.title,
          category: article.category,
          tags: article.tags,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_0.7fr]">
          <article className="glass-panel rounded-[2rem] p-6 md:p-8">
            <Link href="/knowledge" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
              <ArrowLeft className="h-4 w-4" />
              返回知识库
            </Link>

            <div className="mt-6 section-label">
              <Sparkles className="h-3.5 w-3.5" />
              {article.category}
            </div>

            <h1 className="mt-5 text-4xl font-black text-[color:var(--ink)] md:text-5xl">{article.title}</h1>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-[color:var(--muted)]">
              <Clock3 className="h-4 w-4" />
              {article.readTime}
            </div>
            <p className="mt-5 text-base leading-8 text-[color:var(--muted)]">{article.excerpt}</p>

            <div className="mt-8 space-y-8">
              {article.sections.map((section) => (
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
            <ContentQuickAnalyzePanel
              sourceLabel="文章页就近测算"
              sourceKey={`knowledge_article:${article.slug}`}
              contentMeta={{
                contentType: 'knowledge',
                surfaceKey: `knowledge_article:${article.slug}`,
                slug: article.slug,
                title: article.title,
                category: article.category,
                tags: article.tags,
              }}
              title="看懂原理之后，直接测自己的生日"
              description="文章负责解释方法，下一步应该立刻回到你自己的命盘。这里填生日和时间，分析页会自动带入。"
            />

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">相关文章</div>
              <div className="mt-4 space-y-4">
                {related.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/knowledge/${item.slug}`}
                    page={`/knowledge/${article.slug}`}
                    meta={{
                      surfaceKey: `knowledge_article:${article.slug}`,
                      targetSurfaceKey: `knowledge_article:${item.slug}`,
                      contentType: 'knowledge',
                      slug: item.slug,
                      title: item.title,
                      category: item.category,
                      tags: item.tags,
                    }}
                    className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                  >
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</div>
                  </ContentCardLink>
                ))}
              </div>
            </div>

            <NewsletterSignup
              source={`knowledge_article:${article.slug}`}
              title="订阅内容更新"
              description="当知识库新增深度文章、案例与结果页最佳实践时，第一时间收到更新。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
