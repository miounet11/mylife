'use client';

import { SectionHeader } from '@/components/layout/section-header';

const STEPS = [
  { anchor: '#cockpit', label: '核心结论', detail: '确认报告是否回答了你的核心问题。' },
  { anchor: '#current-state', label: '当前状态', detail: '对照时位信号与现实处境。' },
  { anchor: '#rhythm', label: '阶段节奏', detail: '理解当前处于哪个阶段窗口。' },
  { anchor: '#actions', label: '下一步动作', detail: '把判断落成 1–3 个可验证动作。' },
  { anchor: '#validation', label: '验证反馈', detail: '用事件日历记录节点，回测判断。' },
];

export default function ReportReadingPath() {
  return (
    <section className="fb-card p-5 md:p-6">
      <SectionHeader
        eyebrow="读法"
        title="5 分钟阅读路径"
        description="按顺序展开，避免一次消化全部术语。"
      />
      <ol className="mt-4 space-y-2">
        {STEPS.map((step, index) => (
          <li key={step.anchor}>
            <a
              href={step.anchor}
              className="flex gap-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3.5 py-3 transition hover:border-[color:var(--hairline-strong)] hover:bg-[color:var(--bg-sunken)]/50 hover:no-underline"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-soft)] text-[12px] font-semibold text-[color:var(--brand-strong)]">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
                  {step.label}
                </div>
                <div className="mt-0.5 text-[13px] leading-[1.5] text-[color:var(--ink-3)]">{step.detail}</div>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
