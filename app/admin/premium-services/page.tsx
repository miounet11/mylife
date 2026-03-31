import AdminPremiumServiceConsole from '@/components/admin-premium-service-console';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { requireAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminPremiumServicesPage() {
  await requireAdminUser('/admin/premium-services');

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/admin/analytics" ctaLabel="经营后台" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="space-y-5">
            <div className="section-label">专项服务后台</div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              高价值需求不能只收集，
              <span className="font-serif text-[color:var(--accent-strong)]">必须被持续跟进、沉淀和转化。</span>
            </h1>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              这里统一处理结果页沉淀出来的深度需求。状态、优先级、联系备注和用户通知都在同一个后台闭环里完成。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {['事件推演', '断事专项', '事件剖析 / 梅花易'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <AdminPremiumServiceConsole />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
