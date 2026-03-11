import Link from 'next/link';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getKnowledgeArticles } from '@/lib/content-store';

export const metadata = {
  title: '命理知识库 | 人生K线',
  description: '围绕真太阳时、命盘结构、结果阅读和决策应用建立长期可积累的知识内容。',
};

export const dynamic = 'force-dynamic';

export default function KnowledgePage() {
  const knowledgeArticles = getKnowledgeArticles();
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              长期内容资产
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              知识库不是附属页，
              <span className="font-serif text-[color:var(--accent-strong)]">而是站点长期价值的一部分。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里专门解释真太阳时、报告阅读、命理辅助决策等高价值主题。它既服务真实用户，也承担 SEO 与品牌可信度建设。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {['真太阳时与排盘精度', '普通用户如何读报告', '职业与关系场景应用', '公开结果页与内容增长策略'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {knowledgeArticles.map((article) => (
            <Link key={article.slug} href={`/knowledge/${article.slug}`} className="soft-card rounded-[1.75rem] p-6 transition hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                <BookOpen className="h-3.5 w-3.5" />
                {article.category}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{article.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{article.excerpt}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                阅读全文
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source="knowledge_page"
            title="订阅命理知识与站点更新"
            description="适合希望长期追踪命理内容、公开案例与产品迭代的人。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
