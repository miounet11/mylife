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
        <Link href="/docs" className="action-secondary mb-5 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Docs
        </Link>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)] lg:items-start">
          <div>
            <div className="section-label">
              <BookOpenText className="h-3.5 w-3.5" />
              {category?.title || 'Docs'}
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
              {doc.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="product-chip">{doc.priority}</span>
              <span className="product-chip">
                <Clock3 className="h-3.5 w-3.5" />
                {doc.readTime}
              </span>
              {doc.tags.map((tag) => (
                <span key={tag} className="product-chip">{tag}</span>
              ))}
            </div>
          </div>

          <aside className="workspace-panel-muted p-4">
            <div className="text-sm font-black text-[color:var(--ink)]">入口</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.entryHrefs.map((item, index) => (
                <Link key={item.href} href={item.href} className={index === 0 ? 'action-primary' : 'action-secondary'}>
                  {item.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.28fr)] lg:items-start">
          <article className="space-y-5">
            {doc.sections.map((section) => (
              <section key={section.title} className="workspace-panel p-5 md:p-6">
                <h2 className="text-2xl font-black text-[color:var(--ink)]">{section.title}</h2>
                {section.lead ? <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{section.lead}</p> : null}

                {section.bullets?.length ? (
                  <div className="mt-4 grid gap-2">
                    {section.bullets.map((item) => (
                      <div key={item} className="flex gap-3 rounded-lg bg-white/82 px-4 py-3 text-sm leading-6 text-[color:var(--ink)]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.steps?.length ? (
                  <div className="mt-4 grid gap-3">
                    {section.steps.map((step, index) => (
                      <div key={`${section.title}-${step.title}`} className="rounded-lg border border-[color:var(--line)] bg-white/86 p-4">
                        <div className="flex items-center gap-3">
                          <div className="route-index">{String(index + 1).padStart(2, '0')}</div>
                          <h3 className="font-bold text-[color:var(--ink)]">{step.title}</h3>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{step.body}</p>
                        {step.tips?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {step.tips.map((tip) => (
                              <span key={tip} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
                                {tip}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {step.href && step.action ? (
                          <Link href={step.href} className="action-secondary mt-4 inline-flex">
                            {step.action}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.callout ? (
                  <div className="mt-4 rounded-lg border border-[rgba(18,125,111,0.28)] bg-[color:var(--accent-soft)] p-4">
                    <div className="font-bold text-[color:var(--accent-strong)]">{section.callout.title}</div>
                    <div className="mt-2 text-sm leading-7 text-[color:var(--ink)]">{section.callout.body}</div>
                    {section.callout.href && section.callout.action ? (
                      <Link href={section.callout.href} className="action-secondary mt-4 inline-flex">
                        {section.callout.action}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ))}

            {doc.faq.length ? (
              <section className="workspace-panel p-5 md:p-6">
                <h2 className="text-2xl font-black text-[color:var(--ink)]">FAQ</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {doc.faq.map((item) => (
                    <div key={item.question} className="rounded-lg bg-white/86 p-4">
                      <div className="font-bold text-[color:var(--ink)]">{item.question}</div>
                      <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.answer}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="workspace-panel-muted p-4">
              <div className="text-sm font-black text-[color:var(--ink)]">相关文档</div>
              <div className="mt-3 grid gap-2">
                {relatedDocs.map((item) => (
                  <Link key={item.slug} href={`/docs/${item.slug}`} className="interactive-card rounded-lg px-3 py-3 text-sm font-semibold text-[color:var(--ink)]">
                    {item.shortTitle}
                  </Link>
                ))}
              </div>
            </div>

            <div className="workspace-panel-muted p-4">
              <div className="text-sm font-black text-[color:var(--ink)]">全部文档</div>
              <div className="mt-3 grid gap-2">
                {listProductDocRoutes().slice(0, 8).map((route) => {
                  const item = getProductDocBySlug(route.replace('/docs/', ''));
                  return item ? (
                    <Link key={route} href={route} className="interactive-card rounded-lg px-3 py-2 text-sm font-semibold text-[color:var(--ink)]">
                      {item.shortTitle}
                    </Link>
                  ) : null;
                })}
                <Link href="/docs" className="action-secondary mt-2">
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
