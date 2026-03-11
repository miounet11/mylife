import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock3, Sparkles } from 'lucide-react';
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

  return (
    <div className="page-shell">
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
            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">相关文章</div>
              <div className="mt-4 space-y-4">
                {related.map((item) => (
                  <Link key={item.slug} href={`/knowledge/${item.slug}`} className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</div>
                  </Link>
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
