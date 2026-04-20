import Link from 'next/link';
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
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              高价值需求不能只收集，
              <span className="font-serif text-[color:var(--accent-strong)]">必须被持续跟进、沉淀和转化。</span>
            </h1>
            <div className="action-guide">主动作</div>
            <div className="action-strip flex flex-col gap-3 sm:flex-row">
              <a href="#premium-service-console" className="action-primary">
                进入跟进队列
              </a>
              <Link href="/admin/analytics" className="action-secondary">
                查看漏斗指标
              </Link>
              <Link href="/admin/content" className="action-secondary">
                回到内容后台
              </Link>
            </div>
            <div className="intro-copy max-w-3xl">
              结果页沉淀出来的深度需求会在这里统一接单、跟进、交付和收口，不再分散在聊天和备注里。
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: '主入口', value: '需求跟进台', helper: '先看待处理、处理中和已完成的专项需求' },
              { label: '主动作', value: '更新状态', helper: '每个需求单都直接标记状态、优先级和跟进备注' },
              { label: '主结果', value: '回看报告', helper: '带着原始问题和结果页上下文继续推进交付' },
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
                <div className="mt-2 intro-copy">{item.helper}</div>
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
