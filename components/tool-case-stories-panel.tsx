import { ShieldAlert, Sparkles } from 'lucide-react';
import type { ToolDefinition } from '@/lib/tools';

export default function ToolCaseStoriesPanel({
  tool,
  title = '案例化示例',
  description = '这些是按用户常见场景整理的示例，用来帮助理解这个工具的真实价值，不替代医疗、法律或投资等专业意见。',
}: {
  tool: ToolDefinition;
  title?: string;
  description?: string;
}) {
  if (!tool.caseStories.length) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            {title}
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">别人为什么会连续用这个工具</h2>
          <p className="mt-3 max-w-3xl text-xs leading-6 text-[color:var(--muted)]">{description}</p>
        </div>
        <div className="hidden rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)] md:block">
          示例重点是让用户快速代入
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {tool.caseStories.map((story) => (
          <article key={story.title} className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{story.persona}</div>
            <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{story.title}</h3>
            <div className="mt-4 space-y-3 text-xs leading-6 text-[color:var(--muted)]">
              <p>{story.scenario}</p>
              <p>{story.action}</p>
              <p className="text-[color:var(--ink)]">{story.outcome}</p>
            </div>
            <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
              {story.payoff}
            </div>
          </article>
        ))}
      </div>

      {tool.category === 'health' ? (
        <div className="mt-5 flex items-start gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50/90 p-4 text-xs leading-6 text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          健康类内容仅用于风险提醒、恢复排序和就医决策辅助，不能替代医生面诊、检查和治疗方案。
        </div>
      ) : null}
    </section>
  );
}
