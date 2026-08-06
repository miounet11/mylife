import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import JsonLd from '@/components/seo/json-ld';
import ArticleGeoLead from '@/components/seo/article-geo-lead';
import { docsArticleCopy, presentDocContent } from '@/lib/i18n/docs-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { DOC_CONTENT, DOC_ENTRIES } from '@/lib/portal-nav';
import {
  articleSeo,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  withLocalePrefix,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

const DOC_GEO: Record<
  string,
  { answerSummary: string; intents: string[]; entities: string[]; faqs: Array<{ q: string; a: string }> }
> = {
  'birth-info': {
    answerSummary:
      '填写出生信息时：先确定要解决的问题类型，再补齐公历日期、时辰与出生地。时辰未知可继续，但时柱权重会降低；地点用于真太阳时校正，影响边界时辰的归属。',
    intents: ['八字出生信息怎么填', '时辰未知能排盘吗', '出生地点影响八字吗'],
    entities: ['生辰', '时辰', '出生地', '真太阳时', '可信度', '排盘'],
    faqs: [
      { q: '时辰不知道怎么办？', a: '可勾选时辰未知继续；系统会降低时柱权重并在报告中标注边界。' },
      { q: '地点必须精确到区吗？', a: '越精确越好，用于经度时差与真太阳时；至少到城市级。' },
      { q: '为什么要先选问题？', a: '问题类型决定报告侧重点与工具下钻路径，避免一次信息过载。' },
    ],
  },
  'true-solar-time': {
    answerSummary:
      '真太阳时根据出生地经度，把钟表时间换算为当地太阳位置对应的时辰，用于四柱排盘。在时辰交界附近影响最大；非边界时段通常不改变大结构。人生K线默认开启校正并标注依据。',
    intents: ['真太阳时是什么', '真太阳时怎么算', '时辰交界怎么排盘'],
    entities: ['真太阳时', '经度', '时柱', '时区', '排盘校正'],
    faqs: [
      { q: '一定要开真太阳时吗？', a: '默认开启以贴近太阳时；边界时辰建议保留校正。' },
      { q: '会改变日柱吗？', a: '主要影响时柱；极端边界也可能牵动细节，大结构通常仍稳定。' },
      { q: '报告里能看到吗？', a: '会标注校正依据，便于判断可信度。' },
    ],
  },
  'read-first-report': {
    answerSummary:
      '第一份报告建议三段读：先确认核心结论是否回答你的问题，再落 1–3 个可验证动作，最后用事件记录与追问做反馈。不要一次吞下全部术语。',
    intents: ['如何读八字报告', '人生K线报告怎么看', '第一份命理报告读法'],
    entities: ['报告读法', '核心结论', '可验证动作', '事件反馈', '人生K线'],
    faqs: [
      { q: '先看哪一屏？', a: '先看核心结论与阶段定位，确认是否对准你的问题。' },
      { q: '术语看不懂怎么办？', a: '先忽略名词，抓住「主轴—窗口—动作—验证」四段。' },
      { q: '如何验证准不准？', a: '把动作写成可观察检查点，用事件日历或回访对照。' },
    ],
  },
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const chrome = docsArticleCopy(locale);
  const doc = presentDocContent(slug, locale);
  if (!doc) return { title: chrome.metaFallback };
  const geo = DOC_GEO[slug];
  const description =
    geo?.answerSummary
    || doc.sections.map(([, body]) => body).join('').slice(0, 140)
    || doc.title;
  return articleSeo({
    title: doc.title,
    summary: description,
    path: withLocalePrefix(`/docs/${slug}`, locale),
    type: 'knowledge',
    locale,
    canonicalPath: `/docs/${slug}`,
    answerSummary: geo?.answerSummary || description,
    searchIntents: geo?.intents,
    entityKeywords: geo?.entities,
    keywords: [doc.title, '使用文档', '人生K线', ...(geo?.entities || [])],
  });
}

export default async function DocArticlePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const chrome = docsArticleCopy(locale);
  if (!DOC_CONTENT[slug]) notFound();
  const doc = presentDocContent(slug, locale);
  if (!doc) notFound();

  const geo = DOC_GEO[slug];
  const related = DOC_ENTRIES.filter((e) => !e.href.endsWith(`/${slug}`)).slice(0, 4);
  const faqs = geo?.faqs || [];

  return (
    <AppPage header={{ ctaHref: '/docs', ctaLabel: chrome.headerCta }}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '文档', path: '/docs' },
          { name: doc.title, path: `/docs/${slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: doc.title,
          description: geo?.answerSummary || doc.title,
          path: `/docs/${slug}`,
          keywords: geo?.entities || [doc.title, '文档'],
          abstract: geo?.answerSummary,
          about: geo?.entities,
          inLanguage: locale === 'en' ? 'en-US' : 'zh-CN',
        })}
      />
      {faqs.length ? (
        <JsonLd
          data={buildFaqJsonLd(faqs.map((f) => ({ question: f.q, answer: f.a })))}
        />
      ) : null}
      <AnalyticsPageView
        eventName="docs_article_viewed"
        page={`/docs/${slug}`}
        meta={{ surfaceKey: 'docs', slug, title: doc.title, geoReady: Boolean(geo) }}
      />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <FocusHero eyebrow={chrome.eyebrow} title={doc.title} description={geo?.answerSummary} />
        <ArticleGeoLead
          answerSummary={geo?.answerSummary}
          searchIntents={geo?.intents}
          entityKeywords={geo?.entities}
          title="这篇文档在回答什么"
        />
        <article className="fb-card space-y-4 p-4 md:p-6">
          {doc.sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">{heading}</h2>
              <p className="mt-2 text-[13px] leading-[1.65] text-[color:var(--ink-3)]">{body}</p>
            </section>
          ))}

          {faqs.length > 0 ? (
            <section>
              <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">常见问题</h2>
              <div className="mt-2 divide-y divide-[color:var(--hairline)] rounded-xl border border-[color:var(--hairline)]">
                {faqs.map((f) => (
                  <details key={f.q} className="group px-3 py-2.5">
                    <summary className="cursor-pointer list-none text-[13px] font-semibold text-[color:var(--ink-1)] marker:content-none [&::-webkit-details-marker]:hidden">
                      {f.q}
                    </summary>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section>
              <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">相关文档</h2>
              <ul className="mt-2 space-y-1">
                {related.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13px] text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                      {item.title}
                    </Link>
                    {item.description ? (
                      <span className="mt-0.5 block text-[11px] text-[color:var(--ink-5)]">{item.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/analyze" className="fb-btn fb-btn-primary inline-flex h-9 px-4 text-sm hover:no-underline">
              {chrome.practiceCta}
            </Link>
            <Link href="/docs" className="fb-btn inline-flex h-9 px-4 text-sm hover:no-underline">
              全部文档
            </Link>
          </div>
        </article>
      </div>
    </AppPage>
  );
}
