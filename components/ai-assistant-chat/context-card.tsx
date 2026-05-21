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

// v5-D60: FB Messenger 2017 风上下文卡片

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
    <div className="fb-card space-y-3 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#3b5998]">
            <Compass className="h-3 w-3" />
            这次世界易追问
          </div>
          <h3 className="mt-1.5 text-[14px] font-bold text-[#1d2129]">
            {context.report ? `已锚定报告 ${context.report.pattern} / ${context.report.currentDaYun}` : '当前对话未绑定具体报告'}
          </h3>
        </div>
        <Link
          href={context.report ? `/result/${context.report.id}` : '/events'}
          className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-[#1d2129]"
        >
          {context.report ? '返回报告' : '查看事件'}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {context.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {context.focusAreas.map((item) => (
            <span
              key={item}
              className="rounded-[4px] border border-[#dddfe2] bg-[#f5f6f7] px-2 py-0.5 text-[11px] font-semibold text-[#3b5998]"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {recommendedQuestions.length > 0 ? (
        <div className="grid gap-1.5 md:grid-cols-2">
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
        <details className="rounded-[3px] border border-[#dddfe2] bg-[#f5f6f7]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 text-[12px] font-semibold text-[#606770]">
            上下文详情
            <CalendarClock className="h-3.5 w-3.5" />
          </summary>
          <div className="grid gap-2 border-t border-[#dddfe2] p-2.5 md:grid-cols-2">
            {context.report ? (
              <div className="rounded-[3px] bg-white px-2.5 py-2 text-[13px] leading-5 text-[#1d2129]">
                {`结构 ${context.report.pattern}，阶段重点 ${context.report.currentDaYun} / ${context.report.bestWindow}。`}
              </div>
            ) : null}
            {context.recentEvents.map((event) => (
              <div key={event.id} className="rounded-[3px] bg-white px-2.5 py-2">
                <div className="text-[13px] font-semibold text-[#1d2129]">{event.title}</div>
                <div className="mt-0.5 text-[11px] text-[#606770]">
                  {event.date} · {mapEventTypeLabel(event.type)} · {mapImpactLabel(event.impact)}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {context.validationSummary?.headline && (
        <div className="rounded-[3px] border border-[#dddfe2] bg-[#f5f6f7] px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#606770]">最近反馈</div>
          <div className="mt-1 text-[12px] leading-5 text-[#1d2129]">{context.validationSummary.headline}</div>
        </div>
      )}

      {context.focusedEvent && (
        <div className="rounded-[3px] border border-[#bd4c42] bg-[#fdecea] px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#bd4c42]">本次重点问题</div>
          <div className="mt-1 text-[14px] font-semibold text-[#1d2129]">{context.focusedEvent.title}</div>
          <div className="mt-1 text-[13px] text-[#1d2129]">
            {context.focusedEvent.reason || context.focusedEvent.notes || '当前对话应优先围绕这条已出现偏差的事件做纠偏分析。'}
          </div>
        </div>
      )}

      {context.correctionPrompts.length > 0 && (
        <div className="rounded-[3px] border border-[#f0c674] bg-[#fff7e6] px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a87f2c]">建议先问</div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
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
        <div className="rounded-[3px] border border-dashed border-[#dddfe2] bg-[#f5f6f7] px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#606770]">可以顺手记下的提醒</div>
          <div className="mt-2 grid gap-2">
            {context.suggestedEventDrafts.slice(0, 2).map((item) => {
              const eventKey = `suggestion:${item.key}`;
              const isSaved = savedEventKeys.includes(eventKey);

              return (
                <div key={item.key} className="rounded-[3px] bg-white px-3 py-2 border border-[#dddfe2]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#1d2129]">{item.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#606770]">
                        {item.date} · {mapEventTypeLabel(item.type)} · {mapImpactLabel(item.impact)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSaveSuggestedEvent(item)}
                      disabled={disabled || isSaved || savingEventKey === eventKey}
                      className="fb-btn inline-flex shrink-0 items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaved ? <CheckCircle2 className="h-3 w-3 text-[#2f7d52]" /> : null}
                      {isSaved ? '已保存' : savingEventKey === eventKey ? '保存中...' : '记下来'}
                    </button>
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#1d2129]">{item.reason}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
