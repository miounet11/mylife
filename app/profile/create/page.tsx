'use client';

import Link from 'next/link';
import { ArrowRight, FolderHeart, LineChart, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export default function CreateProfilePage() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="重新判断" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              档案入口优化
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              档案入口
            </h1>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <ActionCard
                icon={FolderHeart}
                title="查看现有档案"
                description="如果你已经做过分析、工具或订阅，这里可以直接回到自己的长期记录。"
                href="/profile"
                label="进入档案"
              />
              <ActionCard
                icon={LineChart}
                title="先完成第一次分析"
                description="先补齐出生信息，生成第一份结果后，个人档案和后续更新才会真正有内容。"
                href="/analyze"
                label="开始分析"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  href,
  label,
}: {
  icon: typeof FolderHeart;
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{title}</h2>
      {description ? <p className="mt-2 text-sm text-[color:var(--muted)]">{description}</p> : null}
      <Link href={href} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-5">
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
