// v5-D62 社区搜索页 /community/search
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { forumQuestionOperations, forumUserOperations } from '@/lib/database';
import {
  FORUM_BASE,
  FORUM_LABEL,
  getCategoryLabel,
  getIndustryLabel,
} from '@/lib/forum/seo';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';

interface PageProps {
  searchParams?: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const q = (sp.q || '').trim();
  return {
    title: q ? `搜索「${q}」 · ${FORUM_LABEL}` : `搜索 · ${FORUM_LABEL}`,
    description: q ? `${FORUM_LABEL} 内关于「${q}」的真实命理提问与官方解读。` : '搜索世界易学说社区命理提问。',
    robots: { index: false, follow: true },
  };
}

export default async function CommunitySearchPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const q = (sp.q || '').trim();
  const results = q ? forumQuestionOperations.searchTitle(q, 50) : [];

  const authorIds = Array.from(new Set(results.map((r) => r.authorId)));
  const authorMap = new Map<string, ReturnType<typeof forumUserOperations.getById>>();
  authorIds.forEach((id) => authorMap.set(id, forumUserOperations.getById(id)));

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/community/search"
        meta={{ surfaceKey: 'community_search', query: q, resultCount: results.length }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="生成我的报告" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="fb-card mb-3 overflow-hidden">
          <div className="border-b border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
            社区搜索
          </div>
          <div className="px-4 py-3">
            <form action="/community/search" method="get" className="flex items-center gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="输入关键词：八字、紫微、风水、塔罗…"
                className="h-9 flex-1 rounded-[2px] border border-[#dddfe2] bg-white px-3 text-[14px] text-[color:var(--fb-ink-1)] placeholder:text-[color:var(--fb-ink-4)] focus:border-[color:var(--fb-blue)] focus:outline-none"
                aria-label="搜索关键词"
                autoFocus
              />
              <button type="submit" className="inline-flex h-9 items-center rounded-[2px] bg-[color:var(--fb-blue)] px-4 text-[13px] font-bold text-white hover:bg-[#365899]">
                搜索
              </button>
            </form>
            {q ? (
              <div className="mt-2 text-[12px] text-[color:var(--fb-ink-3)]">
                关键词「<span className="font-semibold text-[color:var(--fb-ink-1)]">{q}</span>」匹配到 {results.length} 条提问
              </div>
            ) : (
              <div className="mt-2 text-[12px] text-[color:var(--fb-ink-3)]">
                输入命理关键词搜索社区真实提问。例：「破财」「桃花」「事业转型」「孩子学业」。
              </div>
            )}
          </div>
        </section>

        {q && results.length === 0 ? (
          <div className="fb-card p-6 text-center text-[13px] text-[color:var(--fb-ink-3)]">
            未找到匹配「{q}」的提问。试试更通用的词，或去
            <Link href={FORUM_BASE} className="ml-1 font-semibold text-[color:var(--fb-blue-link)] hover:underline">
              社区首页
            </Link>
            浏览。
          </div>
        ) : null}

        <div className="space-y-2">
          {results.map((r) => {
            const author = authorMap.get(r.authorId);
            return (
              <article key={r.id} className="fb-card hover:border-[color:var(--fb-blue)]">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2 mb-1.5 text-xs text-[color:var(--fb-ink-3)]">
                    <span className="font-semibold text-[color:var(--fb-ink-1)]">{author?.displayName || '匿名用户'}</span>
                    <span>·</span>
                    <span>{author?.occupation || ''}</span>
                  </div>
                  <Link href={`${FORUM_BASE}/${r.slug}`} className="block group">
                    <h2 className="text-[15px] font-bold text-[color:var(--fb-ink-1)] leading-[1.35] group-hover:text-[color:var(--fb-blue-link)]">
                      {highlight(r.title, q)}
                    </h2>
                    <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)] line-clamp-2">
                      {highlight(r.body.replace(/\n/g, ' ').slice(0, 200), q)}
                    </p>
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-[2px] bg-[color:var(--fb-blue)] px-1.5 py-0.5 font-bold text-white">
                      {getCategoryLabel(r.category)}
                    </span>
                    <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 font-semibold text-[#1d2129]">
                      {getIndustryLabel(r.industry)}
                    </span>
                    <span className="ml-auto text-xs text-[color:var(--fb-ink-3)]">
                      {r.answerCount} 答 · {r.viewCount} 阅读
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// 高亮匹配片段
function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeReg(q)})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-[#fff3a0] text-[color:var(--fb-ink-1)] rounded-[1px] px-0.5">{p}</mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
