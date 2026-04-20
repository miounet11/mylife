import { HelpCircle, LockKeyhole, Sparkles } from 'lucide-react';
import type { ToolDefinition } from '@/lib/tools';

export default function ToolConversionPanel({
  tool,
}: {
  tool: ToolDefinition;
}) {
  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="section-label">
            <LockKeyhole className="h-3.5 w-3.5" />
            付费结果预期
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">付费结果</h2>
          <div className="intro-copy mt-5 grid gap-3">
            {tool.premiumOutcomes.map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-white/82 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
              <Sparkles className="h-4 w-4" />
              常见问题
            </div>
            <div className="mt-4 grid gap-3">
              {tool.objectionAnswers.map((item) => (
                <div key={item.objection} className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.objection}</div>
                  <div className="mt-2 text-sm text-[color:var(--ink)]">{item.answer}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </div>
            <div className="mt-4 grid gap-3">
              {tool.faqItems.map((item) => (
                <div key={item.question} className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.question}</div>
                  <div className="mt-2 text-sm text-[color:var(--ink)]">{item.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
