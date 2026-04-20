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
      tone: 'border-[color:var(--line)] bg-white/84',
    },
    {
      key: 'strongestAdvantage',
      label: '最强优势',
      value: compactCopy(section.strongestAdvantage),
      tone: 'border-emerald-200 bg-emerald-50/75',
    },
    {
      key: 'recurringRisk',
      label: '反复风险',
      value: compactCopy(section.recurringRisk),
      tone: 'border-amber-200 bg-amber-50/75',
    },
    {
      key: 'usefulDirection',
      label: '顺势方向',
      value: compactCopy(section.usefulDirection),
      tone: 'border-sky-200 bg-sky-50/70',
    },
    {
      key: 'unsuitablePattern',
      label: '不适配模式',
      value: compactCopy(section.unsuitablePattern),
      tone: 'border-rose-200 bg-rose-50/70',
    },
  ] as const;

  const compactFacts = (section.facts || []).map((item) => compactCopy(item, 34)).filter(Boolean).slice(0, 3);

  return (
    <section className="soft-card rounded-[1.75rem] p-5" aria-label="核心结构卡片">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">结构蓝图</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.key} className={`rounded-[1.3rem] border px-4 py-4 ${card.tone}`}>
            <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{card.label}</div>
            <div className="mt-2 text-sm font-semibold leading-6 text-[color:var(--ink)]">
              {card.value || '信息待补充，先按驾驶舱判断推进。'}
            </div>
          </article>
        ))}
      </div>

      {compactFacts.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {compactFacts.map((fact) => (
            <span key={fact} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-[color:var(--muted)]">
              {fact}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
