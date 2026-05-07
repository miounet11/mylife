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
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <BookOpenText className="h-3 w-3" />
              Docs
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              产品文档
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
              快速开始、报告读法、工具用法、追问规则、订阅与隐私边界。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              href="/docs/quick-start"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              快速开始
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/privacy-safety"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              隐私安全
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          {productDocPlaybooks.map((playbook) => (
            <div
              key={playbook.title}
              className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                {playbook.title}
              </div>
              <div className="mt-3 space-y-1">
                {playbook.docSlugs.map((slug) => {
                  const doc = getProductDocBySlug(slug);
                  if (!doc) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/docs/${slug}`}
                      className="block text-sm font-semibold text-[color:var(--ink-2)] hover:text-[color:var(--brand-strong)]"
                    >
                      {doc.shortTitle}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 space-y-8">
          {productDocCategories.map((category) => {
            const Icon = categoryIcons[category.key];
            const docs = listProductDocsByCategory(category.key);

            return (
              <section key={category.key} id={category.key} className="scroll-mt-28">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[color:var(--brand-strong)]" />
                  <h2 className="text-lg font-black text-[color:var(--ink-1)]">
                    {category.title}
                  </h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {docs.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-4)]">
                          {doc.priority}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-[color:var(--ink-5)]">
                          {doc.readTime}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-bold leading-snug text-[color:var(--ink-1)]">
                        {doc.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 text-[10px] font-semibold text-[color:var(--ink-4)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--ink-4)] group-hover:gap-1.5 group-hover:text-[color:var(--brand-strong)] transition-all">
                        查看文档
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            术语
          </div>
          <h2 className="mt-2 text-lg font-black text-[color:var(--ink-1)]">系统词汇表</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {productDocGlossary.map((item) => (
              <div
                key={item.term}
                className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3"
              >
                <div className="font-bold text-[color:var(--ink-1)]">{item.term}</div>
                <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
                  {item.definition}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
