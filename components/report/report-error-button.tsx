'use client';

import { AlertTriangle } from 'lucide-react';
import { openSiteFeedback, type OpenFeedbackOptions } from '@/components/site-feedback-widget';

type Props = {
  category?: OpenFeedbackOptions['category'];
  reportId?: string;
  label?: string;
  presetMessage?: string;
  className?: string;
  compact?: boolean;
};

/**
 * Inline 报错入口 — 打开全局反馈弹窗并预填分类/上下文。
 */
export default function ReportErrorButton({
  category = 'content_wrong',
  reportId,
  label = '报错',
  presetMessage,
  className = '',
  compact = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={() =>
        openSiteFeedback({
          category,
          reportId,
          message:
            presetMessage ||
            (reportId
              ? `报告/页面结论有误，请排查。\n报告ID：${reportId}\n\n我发现的问题：\n`
              : '我发现的问题：\n'),
        })
      }
      className={
        className ||
        (compact
          ? 'inline-flex items-center gap-1 rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[color:var(--ink-3)] hover:border-amber-400 hover:text-amber-900'
          : 'inline-flex h-8 items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-white px-3 text-[12px] font-semibold text-[color:var(--ink-3)] shadow-sm hover:border-amber-400 hover:text-amber-900')
      }
      aria-label="提交报错反馈"
    >
      <AlertTriangle className={compact ? 'h-3 w-3 text-amber-600' : 'h-3.5 w-3.5 text-amber-600'} />
      {label}
    </button>
  );
}
