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

        {/* Guest benefits — why login matters */}
        <div className="fb-card space-y-3 rounded-[var(--radius-sm)] p-4">
          <h3 className="text-[13px] font-medium leading-[1.5] text-[color:var(--ink-1)]">
            绑定邮箱后可以
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-[13px] leading-[1.5] text-[color:var(--ink-3)]">
              <span className="mt-0.5 shrink-0 text-[color:var(--ink-1)]">&#10003;</span>
              <span>跨设备同步报告，手机/电脑随时查看</span>
            </li>
            <li className="flex items-start gap-2 text-[13px] leading-[1.5] text-[color:var(--ink-3)]">
              <span className="mt-0.5 shrink-0 text-[color:var(--ink-1)]">&#10003;</span>
              <span>保存历次分析结果，追踪运势变化趋势</span>
            </li>
            <li className="flex items-start gap-2 text-[13px] leading-[1.5] text-[color:var(--ink-3)]">
              <span className="mt-0.5 shrink-0 text-[color:var(--ink-1)]">&#10003;</span>
              <span>管理订阅与会员权益，不会丢失进度</span>
            </li>
          </ul>
        </div>

        {/*
         * Social proof / trust signal
         * Note: the number is illustrative; adjust to real analytics when available.
         */}
        <p className="text-center text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
          已有超过 10,000 位用户通过邮箱保存分析报告&ensp;&middot;&ensp;数据加密传输
        </p>

        <Suspense fallback={<div className="py-4 text-sm text-[color:var(--ink-5)]">加载中…</div>}>
          <LoginForm />
        </Suspense>

        {/* Continue as guest — preserve the guest→email funnel */}
        <p className="text-center">
          <Link
            href="/analyze"
            className="text-[13px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
          >
            先不绑定，以访客身份继续使用
          </Link>
        </p>
      </div>
    </AppPage>
  );
}
