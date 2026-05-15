import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, FileQuestion, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { resolveLegacyContentShortlink } from '@/lib/public-content-shortlink';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: '公开链接已失效 | 人生K线',
    description: '这个公开链接可能已过期、未公开或对应内容已删除。',
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function LegacyContentShortlinkPage({ params }: PageProps) {
  const { id } = await params;
  const resolution = resolveLegacyContentShortlink(id);

  if (resolution.type === 'redirect') redirect(resolution.href);

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="重新生成判断" />
      <main className="page-frame flex min-h-[68vh] items-center py-12 md:py-16">
        <section className="mx-auto w-full max-w-2xl rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 text-center shadow-sm md:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-[color:var(--ink-1)] md:text-3xl">
            这个公开链接暂时不可访问
          </h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-3)]">
            它可能已经过期、未公开，或对应内容已删除。为了保护隐私，这里不会展示原始姓名、生日、出生时间、出生地等信息。
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            {[
              { href: '/reports', title: '看公开结果库', desc: '浏览已匿名处理的结构判断。', icon: FileQuestion },
              { href: '/analyze', title: '重新生成判断', desc: '用你的信息生成自己的阶段建议。', icon: Sparkles },
              { href: '/tools', title: '使用单项工具', desc: '按事业、关系、财富等问题继续拆。', icon: ArrowRight },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)]"
                >
                  <Icon className="h-4 w-4 text-[color:var(--brand-strong)]" />
                  <div className="mt-3 text-sm font-black text-[color:var(--ink-1)]">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">{item.desc}</div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
