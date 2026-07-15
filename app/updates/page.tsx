import type { Metadata } from 'next';
import Link from 'next/link';
import SubscriptionSettingsPanel from '@/components/subscription-settings-panel';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';

export const metadata: Metadata = {
  title: '订阅与更新中心',
  description: '管理运势提醒、月度更新与邮件订阅偏好。',
  robots: { index: false, follow: false },
};

export default function UpdatesPage() {
  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始分析' }}>
      <FocusHero
        eyebrow="更新中心"
        title="订阅设置与邮件偏好"
        description="控制日常提醒、月度窗口与报告更新通知；所有邮件都会在站内归档，可随时追问。"
        actions={
          <Link href="/updates/messages" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            邮件中心
          </Link>
        }
      />
      <div id="my-updates-center">
        <SubscriptionSettingsPanel />
      </div>
    </AppPage>
  );
}