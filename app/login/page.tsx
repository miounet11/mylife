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

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="space-y-5">
            <div className="section-label">账号体系</div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              把一次游客访问，
              <span className="font-serif text-[color:var(--accent-strong)]">变成可持续沉淀的用户关系。</span>
            </h1>
            <p className="intro-copy">
              邮箱登录会把你的分析结果、历史记录、事件管理和订阅状态绑定到正式账号。管理员邮箱还可以直接进入内容后台维护知识、案例和 SEO 实体页。
            </p>
            <div className="intro-panel">
              完成两步：获取验证码 → 验证并登录。
            </div>
          </div>

          <LoginFlow nextHref={nextHref} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
