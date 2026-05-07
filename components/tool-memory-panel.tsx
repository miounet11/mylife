import Link from 'next/link';
import { ArrowRight, Database, History } from 'lucide-react';
import type { ToolMemorySummary } from '@/lib/tool-context';

export default function ToolMemoryPanel({
  memory,
  title = '你的历史上下文',
  description: _description = '',
}: {
  memory: ToolMemorySummary | null;
  title?: string;
  description?: string;
}) {
  if (!memory) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-label">
            <Database className="h-3.5 w-3.5" />
            {title}
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">历史上下文</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="text-sm font-semibold text-[color:var(--ink)]">已继承内容</div>
          <p className="mt-3 text-sm text-[color:var(--ink)]">{memory.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {memory.focusAreas.map((item) => (
              <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <History className="h-4 w-4" />
            最近几次工具记录
          </div>
          <div className="mt-4 grid gap-3">
            {memory.recentSessions.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.toolTitle}</div>
                  <Link href={`/tool-result/${item.id}`} className="action-secondary">
                    查看结果
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-2 text-sm text-[color:var(--ink)]">
                  {item.recommendedAction || item.headline}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
