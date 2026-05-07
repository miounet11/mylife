import Link from 'next/link';
import { ArrowRight, Milestone } from 'lucide-react';
import { getToolDefinition, type ToolDefinition } from '@/lib/tools';

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
  description: _description = '',
}: {
  tool: ToolDefinition;
  title?: string;
  description?: string;
}) {
  const items = [tool, ...tool.nextToolSlugs.map((slug) => getToolDefinition(slug)).filter(Boolean)] as ToolDefinition[];
  const reasons = journeyReasonMap[tool.category];

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="section-label">
        <Milestone className="h-3.5 w-3.5" />
        {title}
      </div>
      <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">测算路径</h2>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        {items.map((item, index) => (
          <div key={item.slug} className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">STEP {index + 1}</div>
            <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{item.shortTitle}</div>
            <div className="mt-3 text-sm text-[color:var(--muted)]">{reasons[index] || '补齐上下文'}</div>
            <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
              {item.freeValueLine}
            </div>
            <Link
              href={item.slug === tool.slug ? `/tools/${item.slug}` : `/tools/${item.slug}?from=${encodeURIComponent(tool.slug)}`}
              className="action-secondary mt-4"
            >
              {item.slug === tool.slug ? '查看当前工具' : '进入下一步'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
