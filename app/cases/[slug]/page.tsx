import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getCaseStudyBySlug } from '@/lib/content-store';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const item = getCaseStudyBySlug(slug);
  if (!item) {
    return { title: '案例未找到 | 人生K线' };
  }

  return {
    title: item.seoTitle,
    description: item.seoDescription,
  };
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getCaseStudyBySlug(slug);
  if (!item) notFound();

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.98fr_0.72fr]">
          <article className="glass-panel rounded-[2rem] p-6 md:p-8">
            <Link href="/cases" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
              <ArrowLeft className="h-4 w-4" />
              返回案例库
            </Link>

            <div className="mt-6 section-label">
              <Sparkles className="h-3.5 w-3.5" />
              {item.scenario}
            </div>
            <h1 className="mt-5 text-4xl font-black text-[color:var(--ink)] md:text-5xl">{item.title}</h1>
            <p className="mt-5 text-base leading-8 text-[color:var(--muted)]">{item.excerpt}</p>

            <div className="mt-8 space-y-8">
              {item.sections.map((section) => (
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
              <div className="text-sm font-semibold text-[color:var(--muted)]">这类案例的价值</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--ink)]">
                <p>它能把抽象命理结果翻译成真实场景。</p>
                <p>它能提升新用户对产品价值的理解速度。</p>
                <p>它能成为长期可累积、可搜索、可分享的内容资产。</p>
              </div>
            </div>

            <NewsletterSignup
              source={`case_article:${item.slug}`}
              title="订阅案例更新"
              description="当我们新增更有代表性的升学、事业、婚恋案例时，直接发到你的邮箱。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
