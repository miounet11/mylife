import Link from 'next/link';
import { ArrowRight, CalendarClock, CheckCircle2, Compass } from 'lucide-react';
import {
  type ChatContextState,
  type IntentPreset,
  type SuggestedEventDraft,
  mapEventTypeLabel,
  mapImpactLabel,
} from '@/components/ai-assistant-chat/chat-helpers';
import {
  CorrectionPromptButton,
  QuickQuestionButton,
} from '@/components/ai-assistant-chat/chat-buttons';

interface ContextCardProps {
  context: ChatContextState;
  intentPreset: IntentPreset | null;
  onPromptClick: (question: string) => void;
  onSaveSuggestedEvent: (item: SuggestedEventDraft) => void;
  disabled: boolean;
  savingEventKey: string | null;
  savedEventKeys: string[];
}

export function ContextCard({
  context,
  intentPreset,
  onPromptClick,
  onSaveSuggestedEvent,
  disabled,
  savingEventKey,
  savedEventKeys,
}: ContextCardProps) {
  const recommendedQuestions = (intentPreset
    ? Array.from(new Set([...intentPreset.questions, ...context.suggestedPrompts]))
    : context.suggestedPrompts
  ).slice(0, 2);

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-4 shadow-[0_18px_36px_rgba(23,32,51,0.06)] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Compass className="h-3.5 w-3.5" />
            这次世界易追问
          </div>
          <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">
            {context.report ? `已锚定报告 ${context.report.pattern} / ${context.report.currentDaYun}` : '当前对话未绑定具体报告'}
          </h3>
        </div>
        <Link
          href={context.report ? `/result/${context.report.id}` : '/events'}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
        >
          {context.report ? '返回报告' : '查看事件'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {context.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {context.focusAreas.map((item) => (
            <span key={item} className="rounded-md bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              {item}
            </span>
          ))}
        </div>
      )}

      {recommendedQuestions.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {recommendedQuestions.map((question) => (
            <QuickQuestionButton
              key={question}
              question={question}
              onClick={() => onPromptClick(question)}
              disabled={disabled}
            />
          ))}
        </div>
      ) : null}

      {(context.recentEvents.length > 0 || context.report) ? (
        <details className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
            上下文详情
            <CalendarClock className="h-4 w-4" />
          </summary>
          <div className="grid gap-3 border-t border-[color:var(--line)] p-3 md:grid-cols-2">
            {context.report ? (
              <div className="rounded-lg bg-[color:var(--paper)] px-3 py-3 text-sm leading-6 text-[color:var(--ink)]">
                {`结构 ${context.report.pattern}，阶段重点 ${context.report.currentDaYun} / ${context.report.bestWindow}。`}
              </div>
            ) : null}
            {context.recentEvents.map((event) => (
              <div key={event.id} className="rounded-lg bg-[color:var(--paper)] px-3 py-3">
                <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  {event.date} · {mapEventTypeLabel(event.type)} · {mapImpactLabel(event.impact)}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {context.validationSummary?.headline && (
        <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">最近反馈</div>
          <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{context.validationSummary.headline}</div>
        </div>
      )}

      {context.focusedEvent && (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)]/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--alert)]">本次重点问题</div>
          <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{context.focusedEvent.title}</div>
          <div className="mt-2 text-sm text-[color:var(--ink)]">
            {context.focusedEvent.reason || context.focusedEvent.notes || '当前对话应优先围绕这条已出现偏差的事件做纠偏分析。'}
          </div>
        </div>
      )}

      {context.correctionPrompts.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)]/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--signal-strong)]">建议先问</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {context.correctionPrompts.map((item) => (
              <CorrectionPromptButton
                key={item.key}
                question={item.question}
                helper={item.helper}
                onClick={() => onPromptClick(item.question)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {context.suggestedEventDrafts.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--line)] bg-[rgba(178,149,93,0.08)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">可以顺手记下的提醒</div>
          <div className="mt-3 grid gap-3">
            {context.suggestedEventDrafts.slice(0, 2).map((item) => {
              const eventKey = `suggestion:${item.key}`;
              const isSaved = savedEventKeys.includes(eventKey);

              return (
                <div key={item.key} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {item.date} · {mapEventTypeLabel(item.type)} · {mapImpactLabel(item.impact)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSaveSuggestedEvent(item)}
                      disabled={disabled || isSaved || savingEventKey === eventKey}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaved ? <CheckCircle2 className="h-4 w-4 text-[color:var(--data-up)]" /> : null}
                      {isSaved ? '已保存' : savingEventKey === eventKey ? '保存中...' : '记下来'}
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-[color:var(--ink)]">{item.reason}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
