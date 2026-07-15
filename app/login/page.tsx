import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';

export const metadata: Metadata = {
  title: '登录｜绑定邮箱保存报告',
  description: '使用邮箱验证码登录，保存报告、管理订阅与档案资料。',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AppPage header={{ ctaHref: '/membership', ctaLabel: '0 元领会员', compact: true }} showFooter={false}>
      <div className="mx-auto max-w-md space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="账户"
          title="邮箱验证码登录"
          description="登录后可保存报告、管理订阅，并在活动期内 0 元开通会员。"
          actions={
            <>
              <Link href="/membership" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                会员说明
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                先排盘
              </Link>
            </>
          }
        />
        <Suspense fallback={<div className="py-4 text-sm text-[color:var(--ink-5)]">加载中…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </AppPage>
  );
}
