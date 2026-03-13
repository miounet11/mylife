import ContentAdminConsole from '@/components/content-admin-console';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { requireAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  await requireAdminUser('/admin/content');

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/admin/analytics" ctaLabel="经营后台" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="space-y-5">
            <div className="section-label">内容后台</div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              内容站能不能长期做大，
              <span className="font-serif text-[color:var(--accent-strong)]">取决于你能不能持续运营内容库。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里统一维护知识文章、案例内容和行业/城市/组织洞察。所有公开页面都会优先读取数据库内容，不再依赖手工改代码发版。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {['知识内容', '案例内容', 'SEO 实体页'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <ContentAdminConsole />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
