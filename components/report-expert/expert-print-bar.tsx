'use client';

import { trackProductEvent } from '@/lib/product-analytics';

/** 专业排盘纸：浏览器打印 / 另存 PDF */
export default function ExpertPrintBar({
  sheetOnlyHint,
  reportId,
}: {
  sheetOnlyHint?: boolean;
  reportId?: string;
}) {
  return (
    <section id="ex-print" className="scroll-mt-header no-print border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">排盘纸导出</h2>
          <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
            打印时自动隐藏导航与操作按钮，优先保留排盘纸摘要与核心表。可在系统对话框中选择「存储为 PDF」。
            {sheetOnlyHint ? ' 若只需一页摘要，可在打印设置里勾选「仅当前页」或缩放适应。' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <a
            href="#ex-print-sheet"
            className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            预览摘要页
          </a>
          <button
            type="button"
            onClick={() => {
              trackProductEvent('expert_print_clicked', { reportId: reportId || '' });
              if (typeof window !== 'undefined') window.print();
            }}
            className="text-[color:var(--ink-1)] underline-offset-2 hover:underline"
          >
            打印 / 导出 PDF
          </button>
        </div>
      </div>
    </section>
  );
}
