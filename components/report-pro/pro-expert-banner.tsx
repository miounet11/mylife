import Link from 'next/link';

/**
 * 专业版入口：排盘、命理分析细目、结构证据等参考
 */
export default function ProExpertBanner({
  expertHref,
  massHref,
  mode,
}: {
  expertHref?: string;
  massHref?: string;
  /** 报告页底部入口 vs 专业页顶栏 */
  mode: 'entry' | 'header';
}) {
  if (mode === 'header') {
    return (
      <section className="border-y border-[color:var(--hairline)] py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[12px] font-medium text-[color:var(--ink-5)]">专业参考</div>
            <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">
              专业排盘与命理细读
            </h2>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
              四柱细盘、大运流年、用神推导与证据层，供排盘核对与专业研判。需要结论与行动时，请返回主报告。
            </p>
          </div>
          {massHref ? (
            <Link
              href={massHref}
              className="shrink-0 text-[13px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              返回主报告
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section id="expert-edition" className="scroll-mt-header border-y border-[color:var(--hairline)] py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">专业参考</div>
          <p className="mt-0.5 text-[13px] text-[color:var(--ink-2)]">
            排盘细目、用神推导与结构证据
          </p>
        </div>
        {expertHref ? (
          <Link
            href={expertHref}
            className="shrink-0 text-[13px] text-[color:var(--ink-1)] underline-offset-2 hover:underline"
          >
            打开专业版
          </Link>
        ) : null}
      </div>
    </section>
  );
}
