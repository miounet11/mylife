import Link from 'next/link';
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
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              内容站能不能长期做大，
              <span className="font-serif text-[color:var(--accent-strong)]">取决于你能不能持续运营内容库。</span>
            </h1>
            <div className="action-guide">主动作</div>
            <div className="action-strip flex flex-col gap-3 sm:flex-row">
              <a href="#content-operations-console" className="action-primary">
                进入内容工作台
              </a>
              <a href="#content-editor-panel" className="action-secondary">
                直接去编辑器
              </a>
              <Link href="/admin/analytics" className="action-secondary">
                查看经营指标
              </Link>
            </div>
            <div className="intro-copy max-w-3xl">
              统一管理知识、案例和洞察内容，并把热点抓取、自动补稿、人工精修和发布决策放在同一条操作链里。
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: '主入口', value: '内容工作台', helper: '先看待修内容、跳出页和工具联动缺口' },
              { label: '主动作', value: '批量协同编排', helper: '一批内容一次性挂到同一条测算路径里' },
              { label: '主结果', value: '内容编辑器', helper: '生成后立刻精修、发布和补联动字段' },
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-[var(--radius-md)] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
                <div className="mt-2 intro-copy">{item.helper}</div>
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
