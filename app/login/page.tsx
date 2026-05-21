import { redirect } from 'next/navigation';
import LoginFlow from '@/components/login-flow';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getAuthSession } from '@/lib/auth';

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextHref = params.next || '/profile';
  const session = await getAuthSession();

  if (session.authenticated) {
    redirect(nextHref);
  }

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-8 pb-16 md:py-12">
        <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="space-y-3 pt-2">
            <div className="text-[12px] font-bold text-[color:var(--fb-blue-link)]">账号体系</div>
            <h1 className="text-[24px] font-bold leading-[1.2] text-[color:var(--fb-ink-1)]">
              邮箱登录
            </h1>
            <p className="text-[14px] leading-[1.5] text-[color:var(--fb-ink-2)]">
              使用邮箱登录后，可保存命盘档案、订阅命理提醒邮件、
              收藏文章与案例；不登录也可以正常使用所有判断与追问功能。
            </p>
            <ul className="space-y-1.5 pt-1 text-[13px] text-[color:var(--fb-ink-3)]">
              <li>· 同一邮箱可管理多个档案（自己 / 关心的人）</li>
              <li>· 退订链接随邮件附带，随时一键退订</li>
              <li>· 不向第三方共享任何邮箱与生辰数据</li>
            </ul>
          </div>

          <div className="fb-card p-5 md:p-6">
            <LoginFlow nextHref={nextHref} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
