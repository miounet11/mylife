'use client';

import Link from 'next/link';
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
    <section className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--brand-strong)]">
            引擎锁定
          </p>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
            {intentPreset ? `${intentPreset.entryLabel} · ` : ''}
            对话只解释这些结构，不另起一套算法
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          {report?.id ? (
            <Link
              href={`/result/${encodeURIComponent(report.id)}#engine-surface`}
              className="font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              报告结构台
            </Link>
          ) : (
            <Link href="/analyze" className="font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              去排盘
            </Link>
          )}
          <Link href="/engines" className="text-[color:var(--ink-4)] underline-offset-2 hover:underline">
            15 套引擎
          </Link>
        </div>
      </div>

      {report ? (
        <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[color:var(--ink-2)]">
          <Fact label="日主" value={report.dayMaster} mono />
          <Fact label="格局" value={report.pattern} />
          <Fact label="用神" value={(report.yongShen || []).join('、') || '—'} />
          <Fact label="大运" value={report.currentDaYun} mono />
          <Fact label="流年" value={report.currentLiuNian} mono />
        </dl>
      ) : (
        <p className="mt-2 text-[12px] text-[color:var(--ink-5)]">未绑定报告 · 不编造日主用神</p>
      )}

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

function Fact({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  const text = `${value || ''}`.trim() || '—';
  return (
    <div className="inline-flex items-baseline gap-1">
      <dt className="text-[color:var(--ink-5)]">{label}</dt>
      <dd className={mono ? 'font-mono font-semibold' : 'font-semibold'}>{text}</dd>
    </div>
  );
}
