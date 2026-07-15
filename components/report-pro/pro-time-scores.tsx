import type { ProTimeScore } from '@/lib/report-pro-view';
import ProScoreBar from '@/components/report-pro/pro-score-bar';

const LEVEL_LABEL = {
  good: '较顺',
  ok: '平稳',
  caution: '宜守',
} as const;

export default function ProTimeScores({ scores }: { scores: ProTimeScore[] }) {
  if (!scores.length) return null;

  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div>
        <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">时间打分</h2>
        <p className="mt-0.5 max-w-xl text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
          本月 / 今年 / 明年。分数是推进成本，不是命运好坏。
        </p>
      </div>

      <div className="mt-3 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {scores.map((s) => (
          <article key={s.key} className="py-3 sm:px-4 sm:first:pl-0 sm:last:pr-0">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-[14px] font-medium text-[color:var(--ink-1)]">{s.label}</div>
                <div className="text-[11px] text-[color:var(--ink-5)]">{s.sublabel}</div>
              </div>
              <span className="text-[11px] text-[color:var(--ink-5)]">{LEVEL_LABEL[s.level]}</span>
            </div>
            <div className="mt-2">
              <ProScoreBar score10={s.score10} />
            </div>
            <p className="mt-2 text-[12px] leading-[1.55] text-[color:var(--ink-2)]">{s.tip}</p>
            <p className="mt-1.5 text-[11px] leading-[1.45] text-[color:var(--ink-5)]">
              {s.level === 'good'
                ? '适合：小步推进 1 件主线并设验证点'
                : s.level === 'caution'
                  ? '适合：收尾、对齐、减并行，少硬性摊牌'
                  : '适合：按计划稳推，重大决定先问「两周能否验证」'}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-[1.5] text-[color:var(--ink-5)]">
        明年分高也不宜现在梭哈；布局可提前，加码仍要落在可验证窗口。
      </p>
    </section>
  );
}
