import { Crown, Sparkles } from 'lucide-react';
import type { ToolDefinition } from '@/lib/tools';

export default function ToolEditorialPanel({
  tool,
}: {
  tool: ToolDefinition;
}) {
  if (!tool.featuredBadge || !tool.signaturePromise || !tool.decisionLens || !tool.premiumWhyNow) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="section-label">
          <Crown className="h-3.5 w-3.5" />
          编辑精选
        </div>
        <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-strong)]">
          {tool.featuredBadge}
        </span>
      </div>

      <div className="intro-copy mt-4 max-w-3xl">
        这里给出为什么这个工具值得优先看，以及它最适合解决哪类核心判断问题。
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="text-sm font-semibold text-[color:var(--ink)]">工具亮点</div>
          <div className="mt-3 text-sm text-[color:var(--ink)]">{tool.signaturePromise}</div>
        </div>
        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="text-sm font-semibold text-[color:var(--ink)]">核心决策视角</div>
          <div className="mt-3 text-sm text-[color:var(--ink)]">{tool.decisionLens}</div>
        </div>
        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Sparkles className="h-4 w-4" />
            当前时机
          </div>
          <div className="mt-3 text-sm text-[color:var(--ink)]">{tool.premiumWhyNow}</div>
        </div>
      </div>
    </section>
  );
}
