'use client';

import { EngineLockStrip } from '@/components/engine-surface/engine-lock-strip';
import type { ChatExperienceContext } from '@/lib/chat-context';
import type { ChatIntentPreset } from '@/lib/chat-intent';
import type { ReportActionSuggestion } from '@/lib/report-v2';

type Props = {
  context: ChatExperienceContext;
  intentPreset?: ChatIntentPreset | null;
  onPromptClick: (question: string) => void;
  onSaveSuggestedEvent?: (item: ReportActionSuggestion) => void;
  disabled?: boolean;
  savingEventKey?: string | null;
  savedEventKeys?: string[];
};

export function ContextCard({
  context,
  intentPreset,
  onPromptClick,
  onSaveSuggestedEvent,
  disabled,
  savingEventKey,
  savedEventKeys,
}: Props) {
  const report = context.report;
  const prompts = (context.suggestedPrompts || []).filter(Boolean).slice(0, 4);
  const drafts = (context.suggestedEventDrafts || []).slice(0, 2);

  if (!report && !prompts.length && !context.summary) return null;

  return (
    <section className="space-y-2">
      <EngineLockStrip
        surface={report ? 'chatBound' : 'chatUnbound'}
        note={
          intentPreset
            ? `${intentPreset.entryLabel} · 对话只解释这些结构，不另起一套算法`
            : undefined
        }
        extraHref={report?.id ? `/result/${encodeURIComponent(report.id)}#engine-surface` : undefined}
        facts={
          report
            ? [
                { label: '日主', value: report.dayMaster, mono: true },
                { label: '格局', value: report.pattern },
                { label: '用神', value: (report.yongShen || []).join('、') },
                { label: '大运', value: report.currentDaYun, mono: true },
                { label: '流年', value: report.currentLiuNian, mono: true },
              ]
            : []
        }
      />

      {report?.bestWindow || report?.riskWindow ? (
        <p className="mt-1.5 text-[11px] leading-[1.45] text-[color:var(--ink-4)]">
          {report.bestWindow ? `窗口 ${report.bestWindow}` : ''}
          {report.bestWindow && report.riskWindow ? ' · ' : ''}
          {report.riskWindow ? `谨慎 ${report.riskWindow}` : ''}
        </p>
      ) : null}

      {prompts.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {prompts.map((q) => (
            <button
              key={q}
              type="button"
              disabled={disabled}
              onClick={() => onPromptClick(q)}
              className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2.5 py-1 text-left text-[11px] text-[color:var(--ink-2)] hover:border-[color:var(--ink-3)] disabled:opacity-50"
            >
              {q.length > 36 ? `${q.slice(0, 34)}…` : q}
            </button>
          ))}
        </div>
      ) : null}

      {drafts.length && onSaveSuggestedEvent ? (
        <div className="mt-2 space-y-1">
          {drafts.map((item) => {
            const key = `${item.title}|${item.date || ''}`;
            const saved = savedEventKeys?.includes(key);
            return (
              <button
                key={key}
                type="button"
                disabled={disabled || saved || savingEventKey === key}
                onClick={() => onSaveSuggestedEvent(item)}
                className="block text-[11px] text-[color:var(--ink-3)] underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
              >
                {saved ? '已记事件' : savingEventKey === key ? '写入中…' : `记下「${item.title}」`}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
