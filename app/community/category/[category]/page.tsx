// v5-D63 社区分类页 /community/category/[category]
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  forumQuestionOperations,
  forumUserOperations,
} from '@/lib/database';
import { CATEGORIES, SEO_KEYWORDS, CATEGORY_FAQ } from '@/lib/forum/templates';
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

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ page?: string; lang?: string }>;
}

const PAGE_SIZE = 30;

// ========== 静态路由：12 类目硬编码 ==========
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.key === category);
  if (!cat) return { title: '类目不存在' };
  const keywords = SEO_KEYWORDS[category] || [];
  const desc = `${cat.label} 真实命理提问与专业老师解读 · ${cat.topics.slice(0, 4).join('、')} · 每日新增提问，覆盖${keywords.slice(0, 5).join('、')}等高频命题。`;
  const url = `https://www.life-kline.com${FORUM_BASE}/category/${category}`;
  return {
    title: `${cat.label} · ${FORUM_LABEL}`,
    description: desc,
    alternates: {
      canonical: url,
      languages: {
        'zh-CN': url,
        'zh-Hant': `${url}?lang=zh-Hant`,
        'x-default': url,
      },
    },
    keywords: keywords.join(','),
    openGraph: {
      title: `${cat.label} | ${FORUM_LABEL}`,
      description: desc,
      url,
      type: 'website',
    },
  };
}

export default async function CommunityCategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.key === category);
  if (!cat) return notFound();
  const sp = searchParams ? await searchParams : {};
  const pageNum = Math.max(1, Number(sp.page || 1));
  const offset = (pageNum - 1) * PAGE_SIZE;
  const locale = detectLocaleFromQuery(sp.lang);
  const T = (s: string) => toLocale(s, locale);

  const list = forumQuestionOperations.listVisible({
    limit: PAGE_SIZE,
    offset,
    category,
  });
  const total = forumQuestionOperations.countVisible({ category });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const authorIds = Array.from(new Set(list.map((q) => q.authorId)));
  const authorMap = new Map<string, ReturnType<typeof forumUserOperations.getById>>();
  authorIds.forEach((id) => authorMap.set(id, forumUserOperations.getById(id)));

  const keywords = SEO_KEYWORDS[category] || [];
  const faqs = CATEGORY_FAQ[category] || [];

  // FAQPage JSON-LD（高 SEO 价值）
  const faqLd = faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  // 类目级 FAQ + CollectionPage JSON-LD
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat.label} · ${FORUM_LABEL}`,
    url: `https://www.life-kline.com${FORUM_BASE}/category/${category}`,
    description: `${cat.label} 主题命理 Q&A 列表`,
    inLanguage: 'zh-CN',
    hasPart: list.slice(0, 10).map((q) => ({
      '@type': 'Question',
      name: q.title,
      url: `https://www.life-kline.com${FORUM_BASE}/${q.slug}`,
    })),
  };
  const bcLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.life-kline.com' },
      { '@type': 'ListItem', position: 2, name: FORUM_LABEL, item: `https://www.life-kline.com${FORUM_BASE}` },
      { '@type': 'ListItem', position: 3, name: cat.label, item: `https://www.life-kline.com${FORUM_BASE}/category/${category}` },
    ],
  };

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }} />
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}
      <AnalyticsPageView
        eventName="content_card_clicked"
        page={`/community/category/${category}`}
        meta={{ surfaceKey: 'community_category', category }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="生成我的报告" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* breadcrumb */}
        <nav className="text-[12px] text-[color:var(--fb-ink-3)] mb-2">
          <Link href="/" className="hover:underline">首页</Link>
          <span className="mx-1">›</span>
          <Link href={FORUM_BASE} className="hover:underline">{FORUM_LABEL}</Link>
          <span className="mx-1">›</span>
          <span className="font-semibold text-[color:var(--fb-ink-2)]">{cat.label}</span>
        </nav>

        {/* HERO */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            {cat.label} · 主题门户
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[24px] md:text-[26px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              {T(`${cat.label}：${cat.topics.slice(0, 3).join(' · ')}`)}
            </h1>
            <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)] max-w-[640px]">
              {T(`聚焦 ${cat.label} 的真实命理提问与专业老师解读。覆盖 ${cat.topics.join('、')} 等核心命题，提问者隐去敏感信息，每条问题均有官方与社区双重解读。`)}
            </p>
            {keywords.length ? (
              <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
                {keywords.slice(0, 8).map((k) => (
                  <Link key={k} href={`${FORUM_BASE}/search?q=${encodeURIComponent(k)}`}
                    className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 font-semibold text-[#365899] hover:bg-[#ebedf0]">
                    {k}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">
                共 {total} 条提问
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          {/* 列表 */}
          <div className="space-y-2">
            {list.length === 0 ? (
              <div className="fb-card p-6 text-center text-[13px] text-[color:var(--fb-ink-3)]">
                此类目暂无提问，稍后回来看看。
              </div>
            ) : (
              list.map((q) => {
                const author = authorMap.get(q.authorId);
                return (
                  <article key={q.id} className="fb-card hover:border-[color:var(--fb-blue)]">
                    <div className="px-3 py-3">
                      <div className="text-[11px] text-[color:var(--fb-ink-3)] mb-1.5">
                        <span className="font-semibold text-[color:var(--fb-ink-1)]">{author?.displayName || '匿名用户'}</span>
                        {' · '}{author?.occupation || ''}{' · '}{author?.province || ''}{author?.city || ''}
                      </div>
                      <Link href={`${FORUM_BASE}/${q.slug}${locale === 'zh-Hant' ? '?lang=zh-Hant' : ''}`} className="block group">
                        <h2 className="text-[15px] font-bold text-[color:var(--fb-ink-1)] leading-[1.35] group-hover:text-[color:var(--fb-blue-link)]">
                          {T(q.title)}
                        </h2>
                        <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)] line-clamp-2">
                          {T(q.body.replace(/\n/g, ' '))}
                        </p>
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="rounded-[2px] bg-[color:var(--fb-blue)] px-1.5 py-0.5 font-bold text-white">
                          {getCategoryLabel(q.category)}
                        </span>
                        <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 font-semibold text-[#1d2129]">
                          {getIndustryLabel(q.industry)}
                        </span>
                        <span className="ml-auto text-[11px] text-[color:var(--fb-ink-3)]">
                          {q.answerCount} 答 · {q.viewCount} 阅读
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-2 py-4">
                {pageNum > 1 ? (
                  <Link href={`${FORUM_BASE}/category/${category}?page=${pageNum - 1}`}
                    className="inline-flex h-7 items-center rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-2.5 text-[12px] font-semibold text-[#1d2129] hover:bg-[#ebedf0]">
                    上一页
                  </Link>
                ) : null}
                <span className="text-[12px] text-[color:var(--fb-ink-3)]">第 {pageNum} / {totalPages} 页</span>
                {pageNum < totalPages ? (
                  <Link href={`${FORUM_BASE}/category/${category}?page=${pageNum + 1}`}
                    className="inline-flex h-7 items-center rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-2.5 text-[12px] font-semibold text-[#1d2129] hover:bg-[#ebedf0]">
                    下一页
                  </Link>
                ) : null}
              </div>
            ) : null}

            {/* 类目 FAQ — 长内容 + FAQPage schema */}
            {faqs.length ? (
              <section className="fb-card overflow-hidden mt-4">
                <div className="border-b border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                  {T(`关于 ${cat.label} · 常见问题`)}
                </div>
                <div className="divide-y divide-[color:var(--fb-border)]">
                  {faqs.map((f, i) => (
                    <details key={i} className="group" open={i === 0}>
                      <summary className="flex cursor-pointer items-start gap-2 px-4 py-3 text-[14px] font-bold text-[color:var(--fb-ink-1)] hover:bg-[#f5f6f7]">
                        <span className="text-[color:var(--fb-blue)] shrink-0">Q.</span>
                        <span className="flex-1">{T(f.q)}</span>
                      </summary>
                      <div className="px-4 pb-3 pl-9 text-[13px] leading-[1.7] text-[color:var(--fb-ink-2)]">
                        {T(f.a)}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 内链 SEO 段：跨类目导流 */}
            <section className="fb-card overflow-hidden mt-3">
              <div className="border-b border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                {T('相关命理主题')}
              </div>
              <div className="px-4 py-3 text-[13px] leading-[1.7] text-[color:var(--fb-ink-2)]">
                {T(`${cat.label} 是命理判断中的一个切面。如果你对其他角度也感兴趣，可以浏览：`)}
                <span className="ml-1">
                  {CATEGORIES.filter((c) => c.key !== category).slice(0, 6).map((c, idx, arr) => (
                    <span key={c.key}>
                      <Link href={`${FORUM_BASE}/category/${c.key}`}
                        className="font-semibold text-[color:var(--fb-blue-link)] hover:underline">
                        {T(c.label)}
                      </Link>
                      {idx < arr.length - 1 ? '、' : '。'}
                    </span>
                  ))}
                </span>
              </div>
            </section>
          </div>

          {/* 右栏：其它分类 */}
          <aside className="space-y-3">
            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                其他命理主题
              </div>
              <div className="divide-y divide-[color:var(--fb-border)]">
                {CATEGORIES.filter((c) => c.key !== category).map((c) => (
                  <Link key={c.key} href={`${FORUM_BASE}/category/${c.key}`}
                    className="block px-3 py-2 text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:bg-[#f5f6f7]">
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] bg-[color:var(--fb-blue)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                自己也想问？
              </div>
              <div className="px-3 py-3 text-[12px] text-[color:var(--fb-ink-2)] leading-[1.5]">
                1 分钟生成你的命盘，对照本类目高频命题。
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
