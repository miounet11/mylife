import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  getFeaturedCaseStudies,
  getFeaturedEntityInsights,
  getFeaturedKnowledgeArticles,
  isPublicKnowledgeEntry,
  listPublishedManagedContentEntriesByType,
} from '@/lib/content-store';
import { getEntityTypeLabel } from '@/lib/content';
import { appendSourceToHref } from '@/lib/source-url';

export default function RelatedContent({ source }: { source?: string }) {
  const worldYiArticles = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry) && entry.slug.startsWith('world-yi-'))
    .slice(0, 3);
  const articles = worldYiArticles.length > 0 ? worldYiArticles : getFeaturedKnowledgeArticles(3);
  const cases = getFeaturedCaseStudies(2);
  const insights = getFeaturedEntityInsights(2);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="section-label">延伸阅读</div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">把工具变成内容资产</h2>
          <div className="intro-copy mt-3 max-w-3xl">
            看完工具后继续进入世界易母体系、知识、洞察和案例，才能把一次判断变成长期资产。
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={appendSourceToHref('/world-yi', source)} className="action-secondary">
            查看世界易
          </Link>
          <Link href={appendSourceToHref('/knowledge', source)} className="action-secondary">
            查看知识库
          </Link>
          <Link href={appendSourceToHref('/insights', source)} className="action-secondary">
            查看洞察中心
          </Link>
          <Link href={appendSourceToHref('/cases', source)} className="action-secondary">
            查看案例库
          </Link>
        </div>
      </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr_0.95fr]">
          <div className="grid gap-4">
            <Link href={appendSourceToHref('/world-yi', source)} className="glass-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">世界易总入口</div>
              <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">先进入母体系，再读方法、案例和环境观察</div>
              <div className="action-guide mt-4 inline-flex items-center gap-2">
                进入世界易
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
            {articles.map((article) => (
              <Link key={article.slug} href={appendSourceToHref(`/knowledge/${article.slug}`, source)} className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{article.category}</div>
              <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{article.title}</div>
              <div className="action-guide mt-4 inline-flex items-center gap-2">
                阅读文章
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-4">
          {insights.map((item) => (
            <Link
              key={item.slug}
              href={appendSourceToHref(`/insights/${item.type}/${item.slug}`, source)}
              className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
            >
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{getEntityTypeLabel(item.type)}</div>
              <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
              <div className="action-guide mt-4 inline-flex items-center gap-2">
                查看洞察
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-4">
          {cases.map((item) => (
            <Link key={item.slug} href={appendSourceToHref(`/cases/${item.slug}`, source)} className="glass-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
              <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
              <div className="action-guide mt-4 inline-flex items-center gap-2">
                查看案例
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
