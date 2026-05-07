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
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            延伸阅读
          </div>
          <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)] md:text-2xl">
            把工具变成内容资产
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
            看完工具后继续进入世界易母体系、知识、洞察和案例，把一次判断变成长期资产。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['/world-yi', '世界易'],
            ['/knowledge', '知识库'],
            ['/insights', '洞察中心'],
            ['/cases', '案例库'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={appendSourceToHref(href, source)}
              className="inline-flex h-8 items-center rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr_0.95fr]">
        <div className="grid gap-3">
          <Link
            href={appendSourceToHref('/world-yi', source)}
            className="group block rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)]"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              世界易总入口
            </div>
            <div className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
              先进入母体系，再读方法、案例和环境观察
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-strong)] group-hover:gap-1.5 transition-all">
              进入世界易
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={appendSourceToHref(`/knowledge/${article.slug}`, source)}
              className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)]"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                {article.category}
              </div>
              <div className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
                {article.title}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--ink-4)] group-hover:gap-1.5 group-hover:text-[color:var(--brand-strong)] transition-all">
                阅读文章
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-3">
          {insights.map((item) => (
            <Link
              key={item.slug}
              href={appendSourceToHref(`/insights/${item.type}/${item.slug}`, source)}
              className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:-translate-y-px hover:border-[color:var(--signal)]"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
                {getEntityTypeLabel(item.type)}
              </div>
              <div className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
                {item.title}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--ink-4)] group-hover:gap-1.5 group-hover:text-[color:var(--signal-strong)] transition-all">
                查看洞察
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-3">
          {cases.map((item) => (
            <Link
              key={item.slug}
              href={appendSourceToHref(`/cases/${item.slug}`, source)}
              className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)]"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                {item.scenario}
              </div>
              <div className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
                {item.title}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--ink-4)] group-hover:gap-1.5 group-hover:text-[color:var(--brand-strong)] transition-all">
                查看案例
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
