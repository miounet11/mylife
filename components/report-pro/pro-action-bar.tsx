import type { ProNowAction } from '@/lib/report-pro-view';

/** 唯一行动条：现在最该做 / 最别做 + 为什么 + 如何验证（壳层淡化，语义保留） */
export default function ProActionBar({ action }: { action: ProNowAction }) {
  return (
    <section
      id="pro-action"
      className="scroll-mt-header border-y border-[color:var(--hairline)]"
    >
      <div className="py-2.5 text-[12px] font-medium text-[color:var(--ink-5)]">
        现在怎么做
        {action.focusWindow ? (
          <span className="ml-2 font-normal">· 关注 {action.focusWindow}</span>
        ) : null}
      </div>
      <div className="grid gap-0 border-t border-[color:var(--hairline)] md:grid-cols-2">
        <div className="border-b border-[color:var(--hairline)] py-4 md:border-b-0 md:border-r md:pr-5">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">现在最该做</div>
          <p className="mt-2 text-[14px] font-medium leading-[1.65] text-[color:var(--ink-1)]">
            {action.doThis}
          </p>
          {action.whyDo ? (
            <p className="mt-2 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
              <span className="text-[color:var(--ink-3)]">为什么：</span>
              {action.whyDo}
            </p>
          ) : null}
        </div>
        <div className="py-4 md:pl-5">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">现在最别做</div>
          <p className="mt-2 text-[14px] font-medium leading-[1.65] text-[color:var(--ink-1)]">
            {action.avoidThis}
          </p>
          {action.whyAvoid ? (
            <p className="mt-2 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
              <span className="text-[color:var(--ink-3)]">为什么：</span>
              {action.whyAvoid}
            </p>
          ) : null}
        </div>
      </div>
      {action.verifyHint ? (
        <div className="border-t border-[color:var(--hairline)] py-2.5 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          <span className="text-[color:var(--ink-3)]">如何知道做对了：</span>
          {action.verifyHint}
        </div>
      ) : null}
    </section>
  );
}
