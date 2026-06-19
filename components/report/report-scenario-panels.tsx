import type { ReportScenarioPanelSection } from '@/lib/report-types';

interface ReportScenarioPanelsProps {
  section: ReportScenarioPanelSection;
}

function compactCopy(value?: string, maxLength = 68) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function statusTone(status: ReportScenarioPanelSection['panels'][number]['status']) {
  if (status === 'push') {
    return {
      card: 'border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.06)]',
      chip: 'border-[color:var(--data-up)] bg-[color:var(--paper)] text-[color:var(--data-up)]',
    };
  }
  if (status === 'caution') {
    return {
      card: 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]',
      chip: 'border-[color:var(--signal)] bg-[color:var(--paper)] text-[color:var(--signal-strong)]',
    };
  }
  return {
    card: 'border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]',
    chip: 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)]',
  };
}

export default function ReportScenarioPanels({ section }: ReportScenarioPanelsProps) {
  const panels = (section.panels || []).slice(0, 4);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
      aria-label="场景判断面板"
    >
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
        场景判断板
      </div>
      <h3 className="mt-1.5 text-base font-black leading-snug text-[color:var(--ink-1)] md:text-lg">
        按板块拆开的判断与动作
      </h3>

      {section.summary ? (
        <p className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">
          {compactCopy(section.summary, 92)}
        </p>
      ) : null}

      {panels.length > 0 ? (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2" role="list" aria-label="场景判断卡片">
          {panels.map((panel) => {
            const tone = statusTone(panel.status);
            return (
              <article
                key={panel.key}
                role="listitem"
                className={`rounded-[var(--radius)] border px-3 py-3 ${tone.card}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                    {compactCopy(panel.title, 10) || '场景'}
                  </div>
                  <span
                    className={`inline-flex h-5 items-center rounded-[var(--radius-sm)] border px-1.5 font-mono text-xs font-bold tabular-nums ${tone.chip}`}
                  >
                    {compactCopy(panel.scoreLabel, 10) || '评分 --'}
                  </span>
                </div>

                <div className="mt-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--ink-2)]">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    结论
                  </span>
                  <div className="mt-0.5">{compactCopy(panel.verdict, 42) || '先稳住节奏。'}</div>
                </div>

                <div className="mt-2 text-xs leading-5">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    理由
                  </span>
                  <div className="mt-0.5 text-[color:var(--ink-3)]">
                    {compactCopy(panel.reason, 58) || '当前依据仍在补样本，先按主线推进。'}
                  </div>
                </div>

                <div className="mt-1.5 text-xs leading-5">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                    动作
                  </span>
                  <div className="mt-0.5 text-[color:var(--ink-2)]">
                    {compactCopy(panel.action, 58) || '先执行一个最小可验证动作。'}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-xs leading-5 text-[color:var(--ink-4)]">
          暂无场景面板，先按驾驶舱主线推进，并持续记录验证反馈。
        </div>
      )}
    </section>
  );
}
