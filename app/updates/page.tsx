import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import DailyWindowStrip from '@/components/daily/daily-window-strip';
import SubscriptionSettingsPanel from '@/components/subscription-settings-panel';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import PwaInstallHint from '@/components/pwa/install-hint';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

export const metadata: Metadata = {
  title: '订阅与更新中心',
  description: '管理运势提醒、月度更新与邮件订阅偏好。',
  robots: { index: false, follow: false },
};

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const en = isEnglishUiLocale(uiLocale);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: en ? 'Start analysis' : '开始分析' }}>
      <div className="mx-auto max-w-3xl px-4 pt-5 md:pt-6">
        <DailyWindowStrip compact source="updates_daily_strip" locale={uiLocale} />
      </div>
      <FocusHero
        eyebrow={en ? 'Updates' : '更新中心'}
        title={en ? 'Subscription & email preferences' : '订阅设置与邮件偏好'}
        description={
          en
            ? 'Control daily reminders, monthly windows, and report update mail. Messages archive on-site so you can follow up anytime.'
            : '控制日常提醒、月度窗口与报告更新通知；所有邮件都会在站内归档，可随时追问。'
        }
        actions={
          <Link href="/updates/messages" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            {en ? 'Mail center' : '邮件中心'}
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-4">
        <PageIllustrationStrip
          surface="updates/hub"
          title={en ? 'Message types' : '消息类型'}
          compact
          limit={1}
        />
      </div>
      <div id="my-updates-center">
        <SubscriptionSettingsPanel />
      </div>
      <PwaInstallHint />
    </AppPage>
  );
}
