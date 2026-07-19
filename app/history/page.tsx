import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import HistoryClient from '@/components/history/history-client';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { historyPageCopy } from '@/lib/i18n/history-copy';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface HistoryPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: HistoryPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = historyPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/history', locale),
    locale,
    noIndex: true,
  });
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = historyPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta, compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkTools}
              </Link>
              <Link href="/profile" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkProfile}
              </Link>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkPredictions}
              </Link>
            </>
          }
        />
        <PageIllustrationStrip
          surface="history/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '历史回看',
            'zh-Hant': '歷史回看',
            en: 'History review',
          })}
          compact
          limit={1}
          locale={illustLocale}
        />
        <HistoryClient locale={uiLocale} />
      </div>
    </AppPage>
  );
}
