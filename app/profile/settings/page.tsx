import type { Metadata } from 'next';
import Link from 'next/link';
import ProfileSettingsPanel from '@/components/profile-settings-panel';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getAuthSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: '测算资料设置｜人生K线',
  description: '修改出生基础信息、补充职业与目标资料，让报告和运势提醒更贴近你的真实处境。',
  alternates: { canonical: '/profile/settings' },
};

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ fortuneId?: string; tab?: string; highlight?: string }>;
}) {
  // Guest cookie identity is created by API routes / client session, not RSC page render.
  // Next.js 15 forbids cookie writes during Server Component render.
  const session = await getAuthSession();
  const params = await searchParams;

  return (
    <AppPage
      header={{ ctaHref: '/analyze', ctaLabel: '开始分析', compact: true }}
      showFooter={false}
      mainClassName="page-frame max-w-3xl py-6 pb-20 md:py-8 md:pb-24"
    >
      <div className="space-y-5 px-4 md:px-0">
        <FocusHero
          eyebrow="测算资料"
          title="出生信息与补充资料"
          description={
            session.authenticated
              ? '修改出生信息会触发排盘重算；补充资料只影响建议表达，不改变四柱结构。'
              : '未登录也可管理本浏览器会话内的档案。登录后可跨设备同步。'
          }
          actions={
            <>
              <Link href="/profile" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                返回档案
              </Link>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                请老师补充
              </Link>
            </>
          }
        />
        <ProfileSettingsPanel
          initialFortuneId={params.fortuneId || ''}
          initialTab={params.tab || ''}
          initialHighlight={params.highlight || ''}
        />
      </div>
    </AppPage>
  );
}
