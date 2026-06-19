// v5-D61 社区列表页 /community
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import { Metadata } from 'next';
import {
  forumUserOperations,
} from '@/lib/database';
import { forumPublicCache } from '@/lib/forum-public-cache';
import { CATEGORIES, INDUSTRIES } from '@/lib/forum/templates';
import {
  FORUM_BASE,
  FORUM_LABEL,
  getCategoryLabel,
  getIndustryLabel,
} from '@/lib/forum/seo';
import { detectLocaleFromQuery, toLocale } from '@/lib/i18n/zh-locale';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';

export const metadata: Metadata = {
  title: `${FORUM_LABEL} · 命理 Q&A 社区`,
  description: '世界易学说命理社区。每天 300+ 真实命理提问与官方解读，覆盖八字、紫微、六爻、奇门、择日、风水、塔罗、占星、面相、姓名学。',
  alternates: {
    canonical: 'https://www.life-kline.com/community',
    languages: {
      'zh-CN': 'https://www.life-kline.com/community',
      'zh-Hant': 'https://www.life-kline.com/community?lang=zh-Hant',
      'zh-TW': 'https://www.life-kline.com/community?lang=zh-Hant',
      'zh-HK': 'https://www.life-kline.com/community?lang=zh-Hant',
      'x-default': 'https://www.life-kline.com/community',
    },
  },
  openGraph: {
    title: '世界易学说社区 · 每日命理 Q&A',
    description: '八字 / 紫微 / 六爻 / 奇门 / 择日 / 塔罗 — 真实问题，专业老师解答。',
    url: 'https://www.life-kline.com/community',
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: ['zh_TW', 'zh_HK'],
  },
};

interface PageProps {
  searchParams?: Promise<{
    category?: string;
    industry?: string;
    page?: string;
    lang?: string;
  }>;
}

const PAGE_SIZE = 30;

export default async function CommunityPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const category = sp.category?.trim() || '';
  const industry = sp.industry?.trim() || '';
  const pageNum = Math.max(1, Number(sp.page || 1));
  const offset = (pageNum - 1) * PAGE_SIZE;
  const locale = detectLocaleFromQuery(sp.lang);
  const T = (s: string) => toLocale(s, locale);

  const list = forumPublicCache.listVisible({
    limit: PAGE_SIZE,
    offset,
    category: category || undefined,
    industry: industry || undefined,
  });
  const total = forumPublicCache.countVisible({
    category: category || undefined,
    industry: industry || undefined,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const todayCount = forumPublicCache.countToday();

  // 拉取作者
  const authorIds = Array.from(new Set(list.map((q) => q.authorId)));
  const authorMap = new Map<string, ReturnType<typeof forumUserOperations.getById>>();
  authorIds.forEach((id) => {
    authorMap.set(id, forumUserOperations.getById(id));
  });

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/community"
        meta={{ surfaceKey: 'community_index', category: category || null, industry: industry || null }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="生成我的报告" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            世界易学说社区 · 命理 Q&A 门户
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[22px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              每日 300+ 真实命理提问与解读
            </h1>
            <p className="mt-1 text-[13px] leading-[1.4] text-[color:var(--fb-ink-2)] max-w-[640px]">
              覆盖八字、紫微斗数、六爻、奇门遁甲、择日、风水堪舆、姓名学、面相手相、占星、塔罗。
              提问者隐去敏感信息，专业老师与官方答主解答。
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">今日 {todayCount} 条新提问</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">总 {total} 条</span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          {/* 中流：题目列表 */}
          <div className="order-2 space-y-2 lg:order-none">
            {/* 分类 chip 横滚 */}
            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                按主题筛选
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
                <CategoryChip href={FORUM_BASE} active={!category} label="全部" />
                {CATEGORIES.map((c) => (
                  <CategoryChip
                    key={c.key}
                    href={`${FORUM_BASE}?category=${c.key}`}
                    active={category === c.key}
                    label={c.label}
                  />
                ))}
              </div>
            </div>

            {list.length === 0 ? (
              <div className="fb-card p-6 text-center text-[13px] text-[color:var(--fb-ink-3)]">
                暂无提问，稍后回来看看。
              </div>
            ) : (
              list.map((q) => {
                const author = authorMap.get(q.authorId);
                return (
                  <article key={q.id} className="fb-card hover:border-[color:var(--fb-blue)]">
                    <div className="px-3 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Avatar seed={author?.avatarSeed || ''} />
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-[12px] font-bold text-[color:var(--fb-ink-1)] truncate"
                            title={`${author?.displayName || '匿名用户'}${author?.province || author?.city ? ` · ${author?.province || ''}${author?.city || ''}` : ''}`}
                          >
                            {author?.displayName || '匿名用户'}
                            <span className="ml-1.5 font-normal text-[color:var(--fb-ink-3)]">· {author?.province || ''}{author?.city || ''}</span>
                          </div>
                          <div
                            className="text-xs text-[color:var(--fb-ink-3)] truncate"
                            title={`${author?.occupation || ''} · ${timeAgo(q.publishedAt)}`}
                          >
                            {author?.occupation || ''} · {timeAgo(q.publishedAt)}
                          </div>
                        </div>
                      </div>

                      <Link href={`${FORUM_BASE}/${q.slug}${locale === 'zh-Hant' ? '?lang=zh-Hant' : ''}`} className="block group">
                        <h2 className="text-[15px] font-bold text-[color:var(--fb-ink-1)] leading-[1.35] group-hover:text-[color:var(--fb-blue-link)]">
                          {T(q.title)}
                        </h2>
                        <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)] line-clamp-2">
                          {T(q.body.replace(/\n/g, ' '))}
                        </p>
                      </Link>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded-[2px] bg-[color:var(--fb-blue)] px-1.5 py-0.5 font-bold text-white">
                          {getCategoryLabel(q.category)}
                        </span>
                        <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 font-semibold text-[#1d2129]">
                          {getIndustryLabel(q.industry)}
                        </span>
                        {q.tags.slice(0, 3).map((t: string) => (
                          <span key={t} className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 font-semibold text-[#1d2129]">
                            #{t}
                          </span>
                        ))}
                        <span className="w-full flex justify-between text-xs text-[color:var(--fb-ink-3)] lg:w-auto lg:ml-auto lg:justify-end">
                          {q.answerCount} 答 · {q.viewCount} 阅读
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            {/* 分页 */}
            {totalPages > 1 ? (
              <Pagination basePath={FORUM_BASE} page={pageNum} totalPages={totalPages} extraQuery={[
                category ? `category=${category}` : '',
                industry ? `industry=${industry}` : '',
              ].filter(Boolean).join('&')} />
            ) : null}
          </div>

          {/* 右栏 */}
          <aside className="order-first space-y-3 lg:order-none">
            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                按行业筛选
              </div>
              <div className="px-3 py-2 max-h-[360px] overflow-y-auto">
                <Link href={FORUM_BASE} className={`block px-2 py-1 text-[12px] ${!industry ? 'font-bold text-[color:var(--fb-blue-link)]' : 'text-[color:var(--fb-ink-2)] hover:text-[color:var(--fb-blue-link)]'}`}>
                  全部行业
                </Link>
                {INDUSTRIES.slice(0, 30).map((i) => (
                  <Link
                    key={i.key}
                    href={`${FORUM_BASE}?industry=${i.key}`}
                    className={`block px-2 py-1 text-[12px] ${industry === i.key ? 'font-bold text-[color:var(--fb-blue-link)]' : 'text-[color:var(--fb-ink-2)] hover:text-[color:var(--fb-blue-link)]'}`}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                自己也想问？
              </div>
              <div className="px-3 py-3 text-[12px] text-[color:var(--fb-ink-2)] leading-[1.5]">
                生成你的命盘后，在结果页发起结构追问，带回完整的命盘片段。
                <Link href="/analyze" className="mt-2 inline-flex h-7 items-center rounded-[2px] bg-[color:var(--fb-blue)] px-3 text-[12px] font-bold text-white hover:bg-[#365899]">
                  开始判断
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function CategoryChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-flex items-center rounded-[2px] bg-[color:var(--fb-blue)] px-2 py-0.5 text-xs font-bold text-white'
          : 'inline-flex items-center rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-2 py-0.5 text-xs font-semibold text-[#1d2129] hover:bg-[#ebedf0]'
      }
    >
      {label}
    </Link>
  );
}

function Avatar({ seed }: { seed: string }) {
  // 用 seed 生成颜色块 + 首字母
  const initials = (seed || '?').slice(0, 1).toUpperCase();
  const hue = Array.from(seed || '?').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white"
      style={{ background: `hsl(${hue}, 40%, 45%)` }}
    >
      {initials}
    </span>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}

function Pagination({ basePath, page, totalPages, extraQuery }: { basePath: string; page: number; totalPages: number; extraQuery: string }) {
  const buildHref = (p: number) => {
    const qs = [extraQuery, `page=${p}`].filter(Boolean).join('&');
    return `${basePath}?${qs}`;
  };
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="inline-flex h-7 items-center rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-2.5 text-[12px] font-semibold text-[#1d2129] hover:bg-[#ebedf0]">
          上一页
        </Link>
      ) : null}
      <span className="text-[12px] text-[color:var(--fb-ink-3)]">第 {page} / {totalPages} 页</span>
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="inline-flex h-7 items-center rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-2.5 text-[12px] font-semibold text-[#1d2129] hover:bg-[#ebedf0]">
          下一页
        </Link>
      ) : null}
    </div>
  );
}
