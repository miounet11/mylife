import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import EmailMessageCenter from '@/components/email-message-center';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getAuthSession } from '@/lib/auth';

export const metadata = {
  title: '邮件中心 | 人生K线',
  description: '查看运势提醒与报告邮件发送记录，继续追问并获得专业回复。',
  robots: { index: false, follow: false },
};

export default async function EmailMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    email?: string;
    message?: string;
  }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const session = await getAuthSession();
  const currentEmail = session.user?.email || resolved.email?.trim().toLowerCase() || '';
  const initialMessageId = resolved.message?.trim() || '';

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始分析' }}>
      <AnalyticsPageView
        eventName="email_messages_page_viewed"
        page="/updates/messages"
        meta={{
          authenticated: session.authenticated,
          hasEmail: !!currentEmail,
        }}
      />
      <FocusHero
        eyebrow="邮件中心"
        title="我的邮件与专业回复"
        description="这里归档你收到的运势提醒、报告更新和系统通知。任何一封邮件都可以继续追问，我们会用专业引擎结合 LLM 表达层给出回复。"
        actions={
          <>
            <Link href="/updates" className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
              订阅设置
            </Link>
            {!session.authenticated ? (
              <Link href="/login?next=%2Fupdates%2Fmessages" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
                登录后自动加载
              </Link>
            ) : null}
          </>
        }
      />
      <EmailMessageCenter
        initialEmail={currentEmail}
        autoLoad={!!currentEmail}
        initialMessageId={initialMessageId}
      />
    </AppPage>
  );
}