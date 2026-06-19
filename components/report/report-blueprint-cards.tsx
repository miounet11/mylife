import type { ReportBlueprintSection } from '@/lib/report-types';

interface ReportBlueprintCardsProps {
  section: ReportBlueprintSection;
}

function compactCopy(value?: string, maxLength = 56) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

export default function ReportBlueprintCards({ section }: ReportBlueprintCardsProps) {
  const cards = [
    {
      key: 'typeLabel',
      label: '结构类型',
      value: compactCopy(section.typeLabel, 36),
      tone: 'border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]',
      labelColor: 'text-[color:var(--ink-4)]',
    },
    {
      key: 'strongestAdvantage',
      label: '最强优势',
      value: compactCopy(section.strongestAdvantage),
      tone: 'border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.06)]',
      labelColor: 'text-[color:var(--data-up)]',
    },
    {
      key: 'recurringRisk',
      label: '反复风险',
      value: compactCopy(section.recurringRisk),
      tone: 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]',
      labelColor: 'text-[color:var(--signal-strong)]',
    },
    {
      key: 'usefulDirection',
      label: '顺势方向',
      value: compactCopy(section.usefulDirection),
      tone: 'border-[color:var(--env)] bg-[color:var(--env-soft)]',
      labelColor: 'text-[color:var(--env)]',
    },
    {
      key: 'unsuitablePattern',
      label: '不适配模式',
      value: compactCopy(section.unsuitablePattern),
      tone: 'border-[color:var(--alert)] bg-[color:var(--alert-soft)]',
      labelColor: 'text-[color:var(--alert)]',
    },
  ] as const;

  const compactFacts = (section.facts || []).map((item) => compactCopy(item, 34)).filter(Boolean).slice(0, 3);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
      aria-label="核心结构卡片"
    >
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
        结构蓝图
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.key} className={`rounded-[var(--radius)] border px-3 py-3 ${card.tone}`}>
            <div className={`font-mono text-xs font-bold uppercase tracking-wider ${card.labelColor}`}>
              {card.label}
            </div>
            <div className="mt-1.5 text-xs font-bold leading-5 text-[color:var(--ink-1)]">
              {card.value || '信息待补充，先按驾驶舱判断推进。'}
            </div>
          </article>
        ))}
      </div>

      {compactFacts.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {compactFacts.map((fact) => (
            <span
              key={fact}
              className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 text-xs font-semibold text-[color:var(--ink-4)]"
            >
              {fact}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
