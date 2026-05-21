'use client';

import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export default function CreateProfilePage() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="重新判断" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            档案入口
          </div>
          <div className="px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-[22px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
                  档案入口
                </h1>
                <p className="mt-1 text-[13px] leading-[1.4] text-[color:var(--fb-ink-2)] max-w-[640px]">
                  如果你已经做过分析，进入档案直接续接；如果还没有，先完成第一份分析再回来。
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end md:shrink-0">
                <Link
                  href="/analyze"
                  className="inline-flex h-7 items-center rounded-[2px] bg-[color:var(--fb-blue)] px-3 text-[13px] font-bold text-white hover:bg-[color:var(--fb-blue-strong)] hover:no-underline"
                >
                  开始分析
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex h-7 items-center rounded-[2px] border border-[color:var(--fb-border-strong)] bg-[#f5f6f7] px-3 text-[13px] font-bold text-[color:var(--fb-ink-1)] no-underline hover:bg-[#ebedf0] hover:no-underline"
                >
                  进入档案
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-2 md:grid-cols-2">
          <ActionCard
            title="查看现有档案"
            description="如果你已经做过分析、工具或订阅，这里可以直接回到自己的长期记录。"
            href="/profile"
            label="进入档案"
          />
          <ActionCard
            title="先完成第一次分析"
            description="先补齐出生信息，生成第一份结果后，个人档案和后续更新才会真正有内容。"
            href="/analyze"
            label="开始分析"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-[#dddfe2] bg-white p-3 hover:border-[color:var(--fb-blue)] no-underline hover:no-underline"
    >
      <div className="text-[14px] font-bold text-[color:var(--fb-ink-1)]">{title}</div>
      {description ? (
        <div className="mt-0.5 text-[12px] text-[color:var(--fb-ink-3)]">{description}</div>
      ) : null}
      <div className="mt-2 text-[12px] font-bold text-[color:var(--fb-blue-link)]">{label} →</div>
    </Link>
  );
}
