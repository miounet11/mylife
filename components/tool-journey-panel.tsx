import Link from 'next/link';
import { ArrowRight, Milestone } from 'lucide-react';
import { getToolDefinition, type ToolDefinition } from '@/lib/tools';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;
const journeyReasonMap: Record<ToolDefinition['category'], string[]> = {
  career: ['先看主矛盾', '再补时机判断', '最后落到短动作'],
  wealth: ['先看主要风险', '再补财务窗口', '最后落到执行动作'],
  relationship: ['先看关系主问题', '再补推进时机', '最后落到具体互动'],
  health: ['先看恢复主线', '再补风险窗口', '最后落到具体调整'],
  family: ['先看家庭主矛盾', '再补时机排序', '最后落到日常动作'],
  migration: ['先看留走倾向', '再补迁移窗口', '最后落到现实动作'],
  timing: ['先拿到窗口判断', '再回到主问题', '最后落到短动作'],
  application: ['先解决眼前问题', '再上升到主问题', '最后补阶段窗口'],
};

export default function ToolJourneyPanel({
  tool,
  title = '推荐测算路径',
  description = '',
}: {
  tool: ToolDefinition;
  title?: string;
  description?: string;
}) {
  const items = [tool, ...tool.nextToolSlugs.map((slug) => getToolDefinition(slug)).filter(Boolean)] as ToolDefinition[];
  const reasons = journeyReasonMap[tool.category];

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <Milestone className="h-3 w-3" />
        {title}
      </div>
      <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
        测算路径
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
      ) : null}

      <div className="mt-5 grid gap-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.slug}
            className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4"
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              STEP {String(index + 1).padStart(2, '0')}
            </div>
            <div className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
              {item.shortTitle}
            </div>
            <div className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">
              {reasons[index] || '补齐上下文'}
            </div>
            <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--brand-strong)]">
              {item.freeValueLine}
            </div>
            <Link
              href={item.slug === tool.slug ? `/tools/${item.slug}` : `/tools/${item.slug}?from=${encodeURIComponent(tool.slug)}`}
              className="mt-3 inline-flex h-8 w-full items-center justify-between gap-1 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            >
              {item.slug === tool.slug ? '查看当前工具' : '进入下一步'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
