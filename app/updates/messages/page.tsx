import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import EmailMessageCenter from '@/components/email-message-center';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getAuthSession } from '@/lib/auth';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { messagesPageCopy } from '@/lib/i18n/updates-copy';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface EmailMessagesPageProps {
  searchParams?: Promise<{
    email?: string;
    message?: string;
    lang?: string;
  }>;
}

export async function generateMetadata({ searchParams }: EmailMessagesPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = messagesPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/updates/messages', locale),
    locale,
    noIndex: true,
  });
}

export default async function EmailMessagesPage({ searchParams }: EmailMessagesPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(resolved.lang);
  const copy = messagesPageCopy(uiLocale);
  const session = await getAuthSession();
  const currentEmail = session.user?.email || resolved.email?.trim().toLowerCase() || '';
  const initialMessageId = resolved.message?.trim() || '';

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta }}>
      <AnalyticsPageView
        eventName="email_messages_page_viewed"
        page="/updates/messages"
        meta={{
          authenticated: session.authenticated,
          hasEmail: !!currentEmail,
        }}
      />
      <FocusHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <Link href="/updates" className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
              {copy.linkSubscription}
            </Link>
            {!session.authenticated ? (
              <Link href="/login?next=%2Fupdates%2Fmessages" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
                {copy.linkLogin}
              </Link>
            ) : null}
          </>
        }
      />
      <EmailMessageCenter
        initialEmail={currentEmail}
        autoLoad={!!currentEmail}
        initialMessageId={initialMessageId}
        locale={uiLocale}
      />
    </AppPage>
  );
}
