'use client';

import Link from 'next/link';
import { ArrowRight, FolderHeart, LineChart, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export default function CreateProfilePage() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="重新测算" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              档案入口优化
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              档案不是单独创建的，
              <span className="font-serif text-[color:var(--accent-strong)]">而是从分析结果自然沉淀出来。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              旧逻辑会把用户直接重定向，体验像断层。现在这里明确告诉用户，档案来自已有分析、事件和趋势的持续积累。
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <ActionCard
                icon={FolderHeart}
                title="查看现有档案"
                description="如果你已经做过分析，直接进入档案页查看趋势、事件和历史记录。"
                href="/profile"
                label="进入档案"
              />
              <ActionCard
                icon={LineChart}
                title="先完成第一次分析"
                description="如果还没有结果，先去测算。档案会在结果、事件和咨询中逐步形成。"
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
    <div className="soft-card rounded-[1.75rem] p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
