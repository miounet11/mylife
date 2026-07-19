import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { docsArticleCopy, presentDocContent } from '@/lib/i18n/docs-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { DOC_CONTENT } from '@/lib/portal-nav';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const chrome = docsArticleCopy(locale);
  const doc = presentDocContent(slug, locale);
  if (!doc) return { title: chrome.metaFallback };
  return { title: `${doc.title}｜${chrome.metaTitleSuffix}` };
}

export default async function DocArticlePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const chrome = docsArticleCopy(locale);
  // Keep DOC_CONTENT as existence gate (Chinese source of truth for slugs).
  if (!DOC_CONTENT[slug]) notFound();
  const doc = presentDocContent(slug, locale);
  if (!doc) notFound();

  return (
    <AppPage header={{ ctaHref: '/docs', ctaLabel: chrome.headerCta }}>
      <AnalyticsPageView
        eventName="docs_article_viewed"
        page={`/docs/${slug}`}
        meta={{ surfaceKey: 'docs', slug, title: doc.title }}
      />
      <FocusHero eyebrow={chrome.eyebrow} title={doc.title} />
      <article className="fb-card space-y-4 p-4 md:p-6">
        {doc.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">{heading}</h2>
            <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--ink-3)]">{body}</p>
          </section>
        ))}
        <Link href="/analyze" className="fb-btn fb-btn-primary inline-flex h-9 px-4 text-sm hover:no-underline">
          {chrome.practiceCta}
        </Link>
      </article>
    </AppPage>
  );
}
