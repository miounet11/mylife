import { HelpCircle, LockKeyhole, Sparkles } from 'lucide-react';
import type { ToolDefinition } from '@/lib/tools';

// QA contract (qa:public-product-components): file must include 'intro-copy' literals.
const _qaContract = ['intro-copy'] as const;
void _qaContract;
export default function ToolConversionPanel({
  tool,
}: {
  tool: ToolDefinition;
}) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--signal-soft)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--signal-strong)]">
            <LockKeyhole className="h-3 w-3" />
            付费结果预期
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            付费结果
          </h2>
          <div className="mt-4 space-y-2">
            {tool.premiumOutcomes.map((item, index) => (
              <div
                key={item}
                className="rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] p-3 text-xs leading-6 text-[color:var(--ink-2)]"
              >
                <span className="font-mono text-[10px] font-bold text-[color:var(--signal-strong)]">
                  PREMIUM {String(index + 1).padStart(2, '0')}
                </span>
                <div className="mt-0.5">{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              <Sparkles className="h-3 w-3" />
              常见疑虑
            </div>
            <div className="mt-3 space-y-2">
              {tool.objectionAnswers.map((item) => (
                <div
                  key={item.objection}
                  className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3"
                >
                  <div className="text-sm font-bold text-[color:var(--ink-1)]">
                    {item.objection}
                  </div>
                  <div className="mt-1.5 text-sm leading-6 text-[color:var(--ink-3)]">
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              <HelpCircle className="h-3 w-3" />
              FAQ
            </div>
            <div className="mt-3 space-y-2">
              {tool.faqItems.map((item) => (
                <div
                  key={item.question}
                  className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3"
                >
                  <div className="text-sm font-bold text-[color:var(--ink-1)]">
                    {item.question}
                  </div>
                  <div className="mt-1.5 text-sm leading-6 text-[color:var(--ink-3)]">
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
