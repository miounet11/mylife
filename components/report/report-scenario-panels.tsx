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
      card: 'border-emerald-200 bg-emerald-50/70',
      chip: 'bg-emerald-100 text-emerald-800',
    };
  }
  if (status === 'caution') {
    return {
      card: 'border-amber-200 bg-amber-50/70',
      chip: 'bg-amber-100 text-amber-900',
    };
  }
  return {
    card: 'border-[color:var(--line)] bg-white/84',
    chip: 'bg-slate-100 text-[color:var(--muted)]',
  };
}

export default function ReportScenarioPanels({ section }: ReportScenarioPanelsProps) {
  const panels = (section.panels || []).slice(0, 4);

  return (
    <section className="soft-card rounded-[1.75rem] p-5" aria-label="场景判断面板">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">场景判断板</div>
      <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">按板块拆开的判断与动作</h3>

      {section.summary ? (
        <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{compactCopy(section.summary, 92)}</p>
      ) : null}

      {panels.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="list" aria-label="场景判断卡片">
          {panels.map((panel) => {
            const tone = statusTone(panel.status);
            return (
              <article key={panel.key} role="listitem" className={`rounded-[1.2rem] border px-4 py-4 ${tone.card}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{compactCopy(panel.title, 10) || '场景'}</div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.chip}`}>
                    {compactCopy(panel.scoreLabel, 10) || '评分 --'}
                  </span>
                </div>

                <div className="mt-2 rounded-xl bg-white/75 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
                  <span className="font-semibold text-[color:var(--muted)]">结论：</span>
                  {compactCopy(panel.verdict, 42) || '先稳住节奏。'}
                </div>

                <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">
                  <span className="font-semibold text-[color:var(--muted)]">理由：</span>
                  {compactCopy(panel.reason, 58) || '当前依据仍在补样本，先按主线推进。'}
                </div>

                <div className="mt-1 text-xs leading-6 text-[color:var(--ink)]">
                  <span className="font-semibold text-[color:var(--muted)]">动作：</span>
                  {compactCopy(panel.action, 58) || '先执行一个最小可验证动作。'}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
          暂无场景面板，先按驾驶舱主线推进，并持续记录验证反馈。
        </div>
      )}
    </section>
  );
}
