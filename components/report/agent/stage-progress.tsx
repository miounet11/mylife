'use client';

import type { AgentRun } from '@/lib/agentic-report/types';

const STAGES = [
  { key: 'engine', label: '命盘底座' },
  { key: 'agents', label: '结构定性' },
  { key: 'merge', label: '阶段定位' },
  { key: 'review', label: '交叉校验' },
] as const;

export default function ReportStageProgress({ run }: { run: AgentRun }) {
  const rate = Math.round((run.successRate || 0) * 100);

  return (
    <section className="fb-card p-4 md:p-5">
      <div className="lk-section-eyebrow">生成进度</div>
      <h2 className="mt-1 text-base font-bold text-[color:var(--ink-1)]">判断依据链路</h2>
      <div className="mt-3 lk-progress">
        {STAGES.map((stage, index) => {
          const done = index < 2 || rate >= 60;
          const active = index === 2 && rate < 100;
          return (
            <div key={stage.key} className="flex items-center gap-2">
              {index > 0 ? <div className={`lk-progress-line ${done ? 'is-done' : ''}`} /> : null}
              <div className={`lk-progress-step ${done ? 'is-done' : active ? 'is-active' : ''}`}>
                <span className="lk-progress-dot" />
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-[color:var(--ink-4)]">
        Agent 成功率 {rate}% · 耗时 {(run.durationMs / 1000).toFixed(1)}s
      </p>
    </section>
  );
}