import NewsletterManager from '@/components/newsletter-manager';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata = {
  title: '邮件更新与订阅管理 | 人生K线',
  description: '管理知识文章、公开案例、产品更新等邮件订阅状态，可查询、恢复或退订。',
};

export default function UpdatesPage() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="section-label">邮件与留存</div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              公开内容要长期积累，
              <span className="font-serif text-[color:var(--accent-strong)]">订阅也必须可控。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里负责管理内容更新邮件。用户可以主动恢复订阅，也可以随时退订，降低对公开内容站的反感和流失。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {['查询订阅状态', '恢复内容更新', '一键退订邮件'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <NewsletterManager />
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source="updates_page"
            title="直接订阅高价值更新"
            description="如果你只是想接收知识文章、案例和产品迭代通知，可以直接在这里完成订阅。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
