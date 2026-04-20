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
              邮箱登录
            </h1>
          </div>

          <LoginFlow nextHref={nextHref} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
