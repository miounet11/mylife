import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { DOC_CONTENT } from '@/lib/portal-nav';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOC_CONTENT[slug];
  if (!doc) return { title: '文档' };
  return { title: `${doc.title}｜文档` };
}

export default async function DocArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const doc = DOC_CONTENT[slug];
  if (!doc) notFound();

  return (
    <AppPage header={{ ctaHref: '/docs', ctaLabel: '全部文档' }}>
      <AnalyticsPageView
        eventName="docs_article_viewed"
        page={`/docs/${slug}`}
        meta={{ surfaceKey: 'docs', slug, title: doc.title }}
      />
      <FocusHero eyebrow="文档" title={doc.title} />
      <article className="fb-card space-y-4 p-4 md:p-6">
        {doc.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">{heading}</h2>
            <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--ink-3)]">{body}</p>
          </section>
        ))}
        <Link href="/analyze" className="fb-btn fb-btn-primary inline-flex h-9 px-4 text-sm hover:no-underline">
          去工作台实践
        </Link>
      </article>
    </AppPage>
  );
}