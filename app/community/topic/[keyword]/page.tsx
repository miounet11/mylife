// v5-D64 关键词主题落地页 /community/topic/[keyword]
// 把 SEO_KEYWORDS 池里 70+ 关键词全部转为可索引的 SEO landing。
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  forumUserOperations,
} from '@/lib/database';
import { forumPublicCache } from '@/lib/forum-public-cache';
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
  params: Promise<{ keyword: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

// 反查关键词所属类目
function findCategoryForKeyword(keyword: string): string | null {
  for (const [cat, kws] of Object.entries(SEO_KEYWORDS)) {
    if (kws.includes(keyword)) return cat;
  }
  return null;
}

// 全部关键词扁平
function getAllKeywords(): Array<{ keyword: string; category: string }> {
  const out: Array<{ keyword: string; category: string }> = [];
  for (const [cat, kws] of Object.entries(SEO_KEYWORDS)) {
    for (const k of kws) out.push({ keyword: k, category: cat });
  }
  return out;
}

// 静态生成全部关键词页（70+）
export function generateStaticParams() {
  return getAllKeywords().map((k) => ({ keyword: encodeURIComponent(k.keyword) }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { keyword: rawKw } = await params;
  const keyword = decodeURIComponent(rawKw);
  const cat = findCategoryForKeyword(keyword);
  if (!cat) return { title: '主题不存在' };
  const sp = searchParams ? await searchParams : {};
  const locale = detectLocaleFromQuery(sp.lang);
  const catLabel = getCategoryLabel(cat);
  const title = locale === 'zh-Hant' ? toLocale(`${keyword} · ${catLabel}主題`, locale) : `${keyword} · ${catLabel} 主题`;
  const desc = `${keyword}相关真实命理提问与官方解读，${catLabel}主题门户。每日新增提问，覆盖核心命题与高频疑问。`;
  const url = `https://www.life-kline.com${FORUM_BASE}/topic/${encodeURIComponent(keyword)}`;
  return {
    title: `${title} | ${FORUM_LABEL}`,
    description: locale === 'zh-Hant' ? toLocale(desc, locale) : desc,
    alternates: {
      canonical: url,
      languages: {
        'zh-CN': url,
        'zh-Hant': `${url}?lang=zh-Hant`,
        'zh-TW': `${url}?lang=zh-Hant`,
        'zh-HK': `${url}?lang=zh-Hant`,
        'x-default': url,
      },
    },
    keywords: keyword,
    openGraph: {
      title,
      description: locale === 'zh-Hant' ? toLocale(desc, locale) : desc,
      url,
      type: 'website',
      locale: locale === 'zh-Hant' ? 'zh_TW' : 'zh_CN',
      alternateLocale: locale === 'zh-Hant' ? ['zh_CN'] : ['zh_TW', 'zh_HK'],
    },
  };
}

export default async function CommunityTopicPage({ params, searchParams }: PageProps) {
  const { keyword: rawKw } = await params;
  const keyword = decodeURIComponent(rawKw);
  const cat = findCategoryForKeyword(keyword);
  if (!cat) return notFound();
  const sp = searchParams ? await searchParams : {};
  const locale = detectLocaleFromQuery(sp.lang);
  const T = (s: string) => toLocale(s, locale);

  const catObj = CATEGORIES.find((c) => c.key === cat)!;
  const catLabel = catObj.label;

  // 用 LIKE 匹配标题/正文含此关键词的提问（最多 30 条）
  const matched = forumPublicCache.searchTitle(keyword, 30);
  // 兜底：如果该关键词暂未匹配到题目，回退到该类目最近 30 条
  const list = matched.length > 0 ? matched : forumPublicCache.listVisible({ category: cat, limit: 30 });

  const authorIds = Array.from(new Set(list.map((q) => q.authorId)));
  const authorMap = new Map<string, ReturnType<typeof forumUserOperations.getById>>();
  authorIds.forEach((id) => authorMap.set(id, forumUserOperations.getById(id)));

  // 同类其他关键词（内链）
  const peerKeywords = (SEO_KEYWORDS[cat] || []).filter((k) => k !== keyword).slice(0, 12);

  // 选取与关键词相关的 1-2 条 FAQ（如果类目 FAQ 提到关键词的话）
  const faqs = (CATEGORY_FAQ[cat] || []).slice(0, 3);

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${keyword} · ${catLabel}`,
    url: `https://www.life-kline.com${FORUM_BASE}/topic/${encodeURIComponent(keyword)}`,
    description: `${keyword} 相关命理提问列表`,
    inLanguage: locale === 'zh-Hant' ? 'zh-Hant' : 'zh-CN',
    about: { '@type': 'Thing', name: keyword },
    isPartOf: {
      '@type': 'WebSite',
      name: FORUM_LABEL,
      url: `https://www.life-kline.com${FORUM_BASE}`,
    },
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
      { '@type': 'ListItem', position: 3, name: catLabel, item: `https://www.life-kline.com${FORUM_BASE}/category/${cat}` },
      { '@type': 'ListItem', position: 4, name: keyword, item: `https://www.life-kline.com${FORUM_BASE}/topic/${encodeURIComponent(keyword)}` },
    ],
  };
  const faqLd = faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }} />
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}
      <AnalyticsPageView
        eventName="content_card_clicked"
        page={`/community/topic/${keyword}`}
        meta={{ surfaceKey: 'community_topic', keyword, category: cat }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="生成我的报告" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <nav className="text-[12px] text-[color:var(--fb-ink-3)] mb-2">
          <Link href="/" className="hover:underline">{T('首页')}</Link>
          <span className="mx-1">›</span>
          <Link href={FORUM_BASE} className="hover:underline">{T(FORUM_LABEL)}</Link>
          <span className="mx-1">›</span>
          <Link href={`${FORUM_BASE}/category/${cat}`} className="hover:underline">{T(catLabel)}</Link>
          <span className="mx-1">›</span>
          <span className="font-semibold text-[color:var(--fb-ink-2)]">{T(keyword)}</span>
        </nav>

        {/* HERO */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            {T(`${keyword} · ${catLabel} 专题`)}
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[24px] md:text-[26px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              {T(`${keyword}：常见疑问与真实案例`)}
            </h1>
            <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)] max-w-[720px]">
              {T(`本页聚合社区内与「${keyword}」相关的真实命理提问与官方解读。所有内容均经隐私脱敏处理，由专业老师与官方答主提供解答。${catLabel}主题门户提供更系统的内容入口。`)}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
              <span className="rounded-[2px] bg-[color:var(--fb-blue)] px-1.5 py-0.5 font-bold text-white">
                {T(catLabel)}
              </span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">
                {T(`${list.length} 条相关提问`)}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-2">
            {list.length === 0 ? (
              <div className="fb-card p-6 text-center text-[13px] text-[color:var(--fb-ink-3)]">
                {T(`暂无与「${keyword}」直接相关的提问，去`)}
                <Link href={`${FORUM_BASE}/category/${cat}`} className="ml-1 font-semibold text-[color:var(--fb-blue-link)] hover:underline">
                  {T(`${catLabel}主题门户`)}
                </Link>
                {T('看看吧。')}
              </div>
            ) : (
              list.map((q) => {
                const author = authorMap.get(q.authorId);
                return (
                  <article key={q.id} className="fb-card hover:border-[color:var(--fb-blue)]">
                    <div className="px-3 py-3">
                      <div className="text-[11px] text-[color:var(--fb-ink-3)] mb-1.5">
                        <span className="font-semibold text-[color:var(--fb-ink-1)]">{author?.displayName || (locale === 'zh-Hant' ? '匿名用戶' : '匿名用户')}</span>
                        {' · '}{T(author?.occupation || '')}
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
                          {T(getCategoryLabel(q.category))}
                        </span>
                        <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 font-semibold text-[#1d2129]">
                          {T(getIndustryLabel(q.industry))}
                        </span>
                        <span className="ml-auto text-[11px] text-[color:var(--fb-ink-3)]">
                          {q.answerCount} {T('答')} · {q.viewCount} {T('阅读')}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            {/* FAQ 段 */}
            {faqs.length ? (
              <section className="fb-card overflow-hidden mt-4">
                <div className="border-b border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                  {T(`关于 ${catLabel} · 常见问题`)}
                </div>
                <div className="divide-y divide-[color:var(--fb-border)]">
                  {faqs.map((f, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-start gap-2 text-[14px] font-bold text-[color:var(--fb-ink-1)]">
                        <span className="text-[color:var(--fb-blue)] shrink-0">Q.</span>
                        <span className="flex-1">{T(f.q)}</span>
                      </div>
                      <div className="mt-1.5 pl-6 text-[13px] leading-[1.7] text-[color:var(--fb-ink-2)]">
                        {T(f.a)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 跨关键词内链段 */}
            {peerKeywords.length ? (
              <section className="fb-card overflow-hidden mt-3">
                <div className="border-b border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                  {T(`${catLabel} · 相关主题`)}
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-1.5 text-[12px]">
                  {peerKeywords.map((k) => (
                    <Link key={k} href={`${FORUM_BASE}/topic/${encodeURIComponent(k)}`}
                      className="rounded-[2px] border border-[#dddfe2] bg-white px-2 py-0.5 font-semibold text-[#365899] hover:bg-[#f5f6f7]">
                      {T(k)}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* 右栏 */}
          <aside className="space-y-3">
            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                {T('其他命理主题')}
              </div>
              <div className="divide-y divide-[color:var(--fb-border)]">
                {CATEGORIES.filter((c) => c.key !== cat).slice(0, 8).map((c) => (
                  <Link key={c.key} href={`${FORUM_BASE}/category/${c.key}`}
                    className="block px-3 py-2 text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:bg-[#f5f6f7]">
                    {T(c.label)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] bg-[color:var(--fb-blue)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                {T('开始你的判断')}
              </div>
              <div className="px-3 py-3 text-[12px] text-[color:var(--fb-ink-2)] leading-[1.5]">
                {T('1 分钟生成你的命盘，对照本主题的真实案例。')}
                <Link href="/analyze" className="mt-2 inline-flex h-7 items-center rounded-[2px] bg-[color:var(--fb-blue)] px-3 text-[12px] font-bold text-white hover:bg-[#365899]">
                  {T('开始判断')}
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
