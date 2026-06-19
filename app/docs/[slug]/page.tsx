import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, BookOpenText, CheckCircle2, Clock3 } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getProductDocBySlug,
  getProductDocCategory,
  listProductDocRoutes,
  listRelatedProductDocs,
  productDocs,
} from '@/lib/product-docs';
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getProductDocBySlug(slug);

  if (!doc) {
    return {
      title: 'Docs | 人生K线',
    };
  }

  return createPublicContentMetadata({
    title: `${doc.title} | Docs | 人生K线`,
    description: doc.summary,
    path: `/docs/${doc.slug}`,
    type: 'article',
    keywords: doc.tags,
    publishedTime: doc.updatedAt,
    modifiedTime: doc.updatedAt,
    section: getProductDocCategory(doc.category)?.title || 'Docs',
    tags: doc.tags,
  });
}

export function generateStaticParams() {
  return productDocs.map((doc) => ({
    slug: doc.slug,
  }));
}

export default async function ProductDocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getProductDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const category = getProductDocCategory(doc.category);
  const relatedDocs = listRelatedProductDocs(doc.relatedSlugs, { currentSlug: doc.slug, limit: 4 });
  const schemas = [
    createArticleSchema({
      headline: doc.title,
      description: doc.summary,
      path: `/docs/${doc.slug}`,
      articleSection: category?.title || 'Docs',
      keywords: doc.tags,
      datePublished: doc.updatedAt,
      dateModified: doc.updatedAt,
      inLanguage: 'zh-CN',
      abstract: doc.summary,
      about: doc.tags,
      isAccessibleForFree: true,
    }),
    createBreadcrumbSchema([
      { name: '首页', path: '/' },
      { name: 'Docs', path: '/docs' },
      { name: doc.title, path: `/docs/${doc.slug}` },
    ]),
  ];

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="docs_article_viewed" page={`/docs/${doc.slug}`} meta={{ surfaceKey: `docs:${doc.slug}`, tags: doc.tags }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始填写" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <Link
          href="/docs"
          className="mb-5 inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Docs
        </Link>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <BookOpenText className="h-3 w-3" />
              {category?.title || 'Docs'}
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              {doc.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-4)]">
                {doc.priority}
              </span>
              <span className="inline-flex h-5 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 font-mono text-xs font-semibold text-[color:var(--ink-4)]">
                <Clock3 className="h-3 w-3" />
                {doc.readTime}
              </span>
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 text-xs font-semibold text-[color:var(--ink-4)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">入口</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.entryHrefs.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    index === 0
                      ? 'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]'
                      : 'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]'
                  }
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.28fr)] lg:items-start">
          <article className="space-y-4">
            {doc.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6"
              >
                <h2 className="text-lg font-black text-[color:var(--ink-1)] md:text-xl">{section.title}</h2>
                {section.lead ? (
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">{section.lead}</p>
                ) : null}

                {section.bullets?.length ? (
                  <div className="mt-3 grid gap-1.5">
                    {section.bullets.map((item) => (
                      <div
                        key={item}
                        className="flex gap-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-sm leading-6 text-[color:var(--ink-2)]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-strong)]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.steps?.length ? (
                  <div className="mt-3 grid gap-2">
                    {section.steps.map((step, index) => (
                      <div
                        key={`${section.title}-${step.title}`}
                        className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-soft)] font-mono text-xs font-black text-[color:var(--brand-strong)]">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <h3 className="font-bold text-[color:var(--ink-1)]">{step.title}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">{step.body}</p>
                        {step.tips?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {step.tips.map((tip) => (
                              <span
                                key={tip}
                                className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-1.5 text-xs font-semibold text-[color:var(--ink-4)]"
                              >
                                {tip}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {step.href && step.action ? (
                          <Link
                            href={step.href}
                            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                          >
                            {step.action}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.callout ? (
                  <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4">
                    <div className="font-bold text-[color:var(--brand-strong)]">{section.callout.title}</div>
                    <div className="mt-1.5 text-sm leading-6 text-[color:var(--ink-2)]">
                      {section.callout.body}
                    </div>
                    {section.callout.href && section.callout.action ? (
                      <Link
                        href={section.callout.href}
                        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                      >
                        {section.callout.action}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ))}

            {doc.faq.length ? (
              <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
                <h2 className="text-lg font-black text-[color:var(--ink-1)] md:text-xl">FAQ</h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {doc.faq.map((item) => (
                    <div
                      key={item.question}
                      className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3"
                    >
                      <div className="text-sm font-bold text-[color:var(--ink-1)]">{item.question}</div>
                      <div className="mt-1.5 text-sm leading-6 text-[color:var(--ink-3)]">{item.answer}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="space-y-3 xl:sticky sticky-top-header">
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">相关文档</div>
              <div className="mt-3 space-y-1">
                {relatedDocs.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 text-sm font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]"
                  >
                    {item.shortTitle}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">全部文档</div>
              <div className="mt-3 space-y-1">
                {listProductDocRoutes().slice(0, 8).map((route) => {
                  const item = getProductDocBySlug(route.replace('/docs/', ''));
                  return item ? (
                    <Link
                      key={route}
                      href={route}
                      className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 text-sm font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]"
                    >
                      {item.shortTitle}
                    </Link>
                  ) : null;
                })}
                <Link
                  href="/docs"
                  className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                >
                  文档中心
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
