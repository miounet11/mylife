// v5-D61 社区详情页 /community/[slug]
// v5-D69 bumpView 改走客户端 ping（卸载同步写）；getBySlug 走 forumPublicCache 60s TTL。
// 注：保留 force-dynamic 因为 page 依赖 searchParams.lang（force-static + searchParams 会被 Next 自动 opt-out）。
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  forumUserOperations,
} from '@/lib/database';
import { forumPublicCache } from '@/lib/forum-public-cache';
import {
  FORUM_BASE,
  FORUM_LABEL,
  getCategoryLabel,
  getIndustryLabel,
  buildQAPageJsonLd,
  buildBreadcrumbJsonLd,
  describeQuestion,
} from '@/lib/forum/seo';
import { detectLocaleFromQuery, toLocale } from '@/lib/i18n/zh-locale';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import ForumViewPing from '@/components/forum-view-ping';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = searchParams ? await searchParams : {};
  const locale = detectLocaleFromQuery(sp.lang);
  const q = forumPublicCache.getBySlug(slug);
  if (!q) return { title: '提问不存在' };
  const title = toLocale(q.title, locale);
  const bodySnippet = toLocale(q.body.slice(0, 110) + (q.body.length > 110 ? '…' : ''), locale);
  const desc = `${bodySnippet} · ${toLocale(describeQuestion(q), locale)}`;
  const url = `https://www.life-kline.com${FORUM_BASE}/${q.slug}`;
  return {
    title: `${title} | ${toLocale(FORUM_LABEL, locale)}`,
    description: desc,
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
    openGraph: {
      title,
      description: desc,
      url,
      type: 'article',
      publishedTime: q.publishedAt || undefined,
      locale: locale === 'zh-Hant' ? 'zh_TW' : 'zh_CN',
      alternateLocale: locale === 'zh-Hant' ? ['zh_CN'] : ['zh_TW', 'zh_HK'],
    },
    keywords: q.tags.join(','),
  };
}

export default async function CommunityDetailPage({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = searchParams ? await searchParams : {};
  const locale = detectLocaleFromQuery(sp.lang);
  const T = (s: string) => toLocale(s, locale);
  const q = forumPublicCache.getBySlug(slug);
  if (!q) return notFound();
  // v5-D69 bumpView 改走客户端 ForumViewPing；这里不再同步写。

  const author = forumUserOperations.getById(q.authorId);
  const answers = forumPublicCache.listAnswers(q.id);
  const responderIds = Array.from(new Set(answers.map((a) => a.authorId)));
  const responderMap = new Map<string, ReturnType<typeof forumUserOperations.getById>>();
  responderIds.forEach((id) => responderMap.set(id, forumUserOperations.getById(id)));

  const qaSchema = buildQAPageJsonLd(q, answers);
  const bcSchema = buildBreadcrumbJsonLd(q);

  // 同类相关 4 条
  const related = forumPublicCache.listVisible({ category: q.category, limit: 5 })
    .filter((r) => r.id !== q.id)
    .slice(0, 4);

  return (
    <div className="page-shell">
      <ForumViewPing slug={q.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
      <AnalyticsPageView eventName="knowledge_article_viewed" page={`${FORUM_BASE}/${q.slug}`} meta={{ surfaceKey: 'community_detail', category: q.category, industry: q.industry }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="生成我的报告" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* breadcrumb */}
        <nav className="text-[12px] text-[color:var(--fb-ink-3)] mb-2">
          <Link href="/" className="hover:underline">首页</Link>
          <span className="mx-1">›</span>
          <Link href={FORUM_BASE} className="hover:underline">{FORUM_LABEL}</Link>
          <span className="mx-1">›</span>
          <Link href={`${FORUM_BASE}?category=${q.category}`} className="hover:underline">{getCategoryLabel(q.category)}</Link>
        </nav>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            {/* 题目卡 */}
            <article className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar seed={author?.avatarSeed || ''} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[color:var(--fb-ink-1)]">
                      {author?.displayName || '匿名用户'}
                      <span className="ml-1.5 text-[12px] font-normal text-[color:var(--fb-ink-3)]">· {author?.province || ''}{author?.city || ''}</span>
                    </div>
                    <div className="text-xs text-[color:var(--fb-ink-3)]">
                      {author?.occupation || ''} · {timeAgo(q.publishedAt)} 提问
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4">
                <h1 className="text-[20px] font-bold text-[color:var(--fb-ink-1)] leading-[1.3] mb-2">
                  {T(q.title)}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                  <span className="rounded-[2px] bg-[color:var(--fb-blue)] px-1.5 py-0.5 font-bold text-white">
                    {getCategoryLabel(q.category)}
                  </span>
                  <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 font-semibold text-[#1d2129]">
                    {getIndustryLabel(q.industry)}
                  </span>
                  {q.tags.map((t: string) => (
                    <Link key={t} href={`${FORUM_BASE}?tag=${encodeURIComponent(t)}`} className="rounded-[2px] border border-[#dddfe2] bg-white px-1.5 py-0.5 font-semibold text-[#365899] hover:bg-[#f5f6f7]">
                      #{t}
                    </Link>
                  ))}
                </div>
                <div className="prose-fb text-[14px] leading-[1.6] text-[color:var(--fb-ink-1)] whitespace-pre-line">
                  {T(q.body)}
                </div>
                {q.metadata.visibilityMask?.length ? (
                  <div className="mt-3 rounded-[2px] border border-[#dddfe2] bg-[#fdfdfd] px-2.5 py-2 text-xs text-[color:var(--fb-ink-3)]">
                    提问者隐去：{q.metadata.visibilityMask.join('、')}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 border-t border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2 text-xs text-[color:var(--fb-ink-3)]">
                <span>{q.viewCount} 阅读</span>
                <span>·</span>
                <span>{answers.length} 答</span>
                <Link href="/analyze" className="ml-auto inline-flex h-7 items-center rounded-[2px] bg-[color:var(--fb-blue)] px-3 text-[12px] font-bold text-white hover:bg-[#365899] hover:no-underline">
                  自己也来一份命盘
                </Link>
              </div>
            </article>

            {/* 答列表 */}
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)] px-1 pt-1">
              {answers.length} 条解读
            </div>

            {answers.length === 0 ? (
              <div className="fb-card p-4 text-[13px] text-[color:var(--fb-ink-3)] text-center">
                官方与社区解读正在准备，1-3 小时内会陆续放出，刷新查看。
              </div>
            ) : answers.map((a) => {
              const r = responderMap.get(a.authorId);
              return (
                <article key={a.id} id={`a-${a.id}`} className={`fb-card overflow-hidden ${a.isOfficial ? 'border-t-2 border-[color:var(--fb-blue)]' : ''}`}>
                  <div className="border-b border-[color:var(--fb-border)] bg-white px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar seed={r?.avatarSeed || ''} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[color:var(--fb-ink-1)]">
                          {r?.displayName || '匿名'}
                          {a.isOfficial ? (
                            <span className="ml-1.5 inline-flex items-center rounded-[2px] bg-[color:var(--fb-blue)] px-1 py-0.5 text-xs font-bold text-white">
                              官方答主
                            </span>
                          ) : r?.role === 'master' ? (
                            <span className="ml-1.5 inline-flex items-center rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1 py-0.5 text-xs font-semibold text-[#1d2129]">
                              专业老师
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-[color:var(--fb-ink-3)]">
                          {r?.bio || ''} · {timeAgo(a.publishedAt)} 解读 · 距提问 {a.responseDelayMinutes} 分钟
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-[color:var(--fb-ink-3)]">
                        ▲ {a.upvoteCount}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="prose-fb text-[14px] leading-[1.6] text-[color:var(--fb-ink-1)] whitespace-pre-line">
                      {T(a.body)}
                    </div>
                  </div>
                </article>
              );
            })}

            {/* 底部强引流卡（黄峥锚） */}
            <div className="fb-card overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
              <div className="px-4 py-4 bg-gradient-to-b from-white to-[#f5f6f7]">
                <div className="text-[15px] font-bold text-[color:var(--fb-ink-1)] mb-1">
                  你的命盘里也有同样的格局吗？
                </div>
                <div className="text-[12px] text-[color:var(--fb-ink-3)] mb-3 leading-[1.5]">
                  1 分钟生成你的命盘，自动比对此题主的关键节点。免登录、免费、永久保存。
                </div>
                <Link href="/analyze" className="inline-flex h-9 items-center rounded-[2px] bg-[color:var(--fb-blue)] px-4 text-[13px] font-bold text-white hover:bg-[#365899] hover:no-underline">
                  生成我的命盘 →
                </Link>
              </div>
            </div>
          </div>

          {/* 右栏：相关 + CTA */}
          <aside className="space-y-3">
            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--fb-ink-3)]">
                相关 {getCategoryLabel(q.category)}
              </div>
              <div className="divide-y divide-[color:var(--fb-border)]">
                {related.map((r) => (
                  <Link key={r.id} href={`${FORUM_BASE}/${r.slug}`} className="block px-3 py-2 hover:bg-[#f5f6f7]">
                    <div className="text-[12px] font-bold text-[color:var(--fb-ink-1)] line-clamp-2 leading-[1.35]">
                      {r.title}
                    </div>
                    <div className="text-xs text-[color:var(--fb-ink-3)] mt-0.5">
                      {r.answerCount} 答 · {timeAgo(r.publishedAt)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="fb-card overflow-hidden">
              <div className="border-b border-[color:var(--fb-border)] bg-[color:var(--fb-blue)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                关于隐私
              </div>
              <div className="px-3 py-3 text-[12px] leading-[1.5] text-[color:var(--fb-ink-2)]">
                提问者出生信息、姓名、城市等敏感字段由作者自行决定隐藏程度。我们不公开任何用户的真实身份信息。
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Avatar({ seed, size = 28 }: { seed: string; size?: number }) {
  const initials = (seed || '?').slice(0, 1).toUpperCase();
  const hue = Array.from(seed || '?').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{ background: `hsl(${hue}, 40%, 45%)`, width: size, height: size, fontSize: size * 0.45 }}
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
