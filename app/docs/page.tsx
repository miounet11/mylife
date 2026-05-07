import Link from 'next/link';
import { ArrowRight, BookOpenText, FileQuestion, LibraryBig, Search, ShieldCheck } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getProductDocBySlug,
  listProductDocsByCategory,
  productDocCategories,
  productDocGlossary,
  productDocPlaybooks,
  type ProductDocCategoryKey,
} from '@/lib/product-docs';
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

export const revalidate = 3600;

export function generateMetadata() {
  return createPublicContentMetadata({
    title: 'Docs | 人生K线',
    description: '人生K线产品文档中心：快速开始、出生信息、报告读法、工具、追问、档案、订阅、隐私与安全边界。',
    path: '/docs',
    type: 'website',
    keywords: ['人生K线 Docs', '使用文档', '报告读法', '出生信息', '工具中心'],
  });
}

const categoryIcons: Record<ProductDocCategoryKey, typeof BookOpenText> = {
  start: Search,
  workflows: LibraryBig,
  reading: BookOpenText,
  account: FileQuestion,
  safety: ShieldCheck,
};

export default function DocsPage() {
  const schemas = [
    createCollectionPageSchema({
      headline: '人生K线 Docs',
      description: '人生K线产品文档中心：快速开始、出生信息、报告读法、工具、追问、档案、订阅、隐私与安全边界。',
      path: '/docs',
      keywords: ['人生K线 Docs', '使用文档', '产品文档', '报告读法'],
    }),
    createBreadcrumbSchema([
      { name: '首页', path: '/' },
      { name: 'Docs', path: '/docs' },
    ]),
    createItemListSchema(
      '人生K线 Docs',
      productDocCategories.flatMap((category) => listProductDocsByCategory(category.key))
        .map((doc, index) => ({
          name: doc.title,
          path: `/docs/${doc.slug}`,
          position: index + 1,
        })),
    ),
  ];

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="docs_page_viewed" page="/docs" meta={{ surfaceKey: 'docs_index' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始填写" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.36fr)] lg:items-end">
          <div>
            <div className="section-label">
              <BookOpenText className="h-3.5 w-3.5" />
              Docs
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
              产品文档
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/docs/quick-start" className="action-primary action-main">
              快速开始
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/docs/privacy-safety" className="action-secondary">
              隐私安全
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          {productDocPlaybooks.map((playbook) => (
            <div key={playbook.title} className="workspace-panel-muted p-4">
              <div className="text-sm font-black text-[color:var(--ink)]">{playbook.title}</div>
              <div className="mt-3 grid gap-2">
                {playbook.docSlugs.map((slug) => {
                  const doc = getProductDocBySlug(slug);

                  if (!doc) {
                    return null;
                  }

                  return (
                    <Link key={slug} href={`/docs/${slug}`} className="text-sm font-semibold text-[color:var(--accent-strong)]">
                      {doc.shortTitle}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 space-y-7">
          {productDocCategories.map((category) => {
            const Icon = categoryIcons[category.key];
            const docs = listProductDocsByCategory(category.key);

            return (
              <section key={category.key} id={category.key} className="scroll-mt-28">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[color:var(--accent-strong)]" />
                  <h2 className="text-xl font-black text-[color:var(--ink)]">{category.title}</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {docs.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="soft-card rounded-xl p-4 transition hover:border-[color:var(--accent)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="product-chip">{doc.priority}</span>
                        <span className="text-xs font-semibold text-[color:var(--muted)]">{doc.readTime}</span>
                      </div>
                      <h3 className="mt-4 text-xl font-black text-[color:var(--ink)]">{doc.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="action-guide mt-4 inline-flex items-center gap-2">
                        查看文档
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </section>

        <section className="mt-10 workspace-panel p-5 md:p-6">
          <div className="section-label">术语</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {productDocGlossary.map((item) => (
              <div key={item.term} className="rounded-lg border border-[color:var(--line)] bg-white/82 p-4">
                <div className="font-bold text-[color:var(--ink)]">{item.term}</div>
                <div className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.definition}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
