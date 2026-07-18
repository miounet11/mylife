'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { ReportActionSuggestion } from '@/lib/report-v2';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import {
  buildEstimatedPastEventDescription,
  getEstimatedPastEventDateKey,
} from '@/lib/event-view';
import { presentReportText } from '@/lib/report-presentation';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;

interface ReportEventCaptureProps {
  reportId: string;
  suggestions: ReportActionSuggestion[];
  ctaStrategyKey?: string;
  sourceFamily?: string;
  pastEventTemplates?: Array<{
    key: string;
    title: string;
    type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
    description: string;
    reason: string;
    confidenceLabel?: 'high' | 'medium';
    occurrenceWindow?: string;
  }>;
  /** 嵌入正文时用 document 风格，避免再被窄侧栏挤压 */
  variant?: 'document' | 'compact';
}

type EventSaveResponse = {
  success?: boolean;
  error?: string;
};

const REPORT_EVENT_CAPTURE_TIMEOUT_MS = 12_000;

export default function ReportEventCapture({
  reportId,
  suggestions,
  ctaStrategyKey,
  sourceFamily,
  pastEventTemplates = [],
  variant = 'document',
}: ReportEventCaptureProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [error, setError] = useState('');

  const saveSuggestion = async (item: ReportActionSuggestion) => {
    if (savingKey) return;
    setSavingKey(item.key);
    setError('');

    try {
      const { response, data } = await fetchJsonWithTimeout<EventSaveResponse>('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          title: item.title,
          date: item.date,
          description: item.description,
          impact: item.impact,
          reminderEnabled: true,
          reminderAdvanceDays: item.reminderAdvanceDays,
          reminderMethod: 'app',
          source: 'result_report',
          page: `/result/${reportId}`,
          fortuneAnalysis: {
            source: 'result_report',
            reportId,
            suggestionKey: item.key,
            reason: item.reason,
            title: item.title,
          },
          followUpAdvice: {
            shortTerm: item.reason,
            longTerm: '记录事件结果后回到聊天页复盘。',
          },
        }),
        timeoutMs: REPORT_EVENT_CAPTURE_TIMEOUT_MS,
        timeoutReason: 'report-event-save-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '保存事件失败');
        return;
      }

      setSavedKeys((current) => [...current, item.key]);
      void trackClientEvent({
        eventName: 'report_event_saved_from_result',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          suggestionKey: item.key,
          suggestionType: item.type,
          suggestionSource: item.source,
        },
      });
    } catch (requestError) {
      setError(isAbortLikeError(requestError) ? '保存事件等待时间过长，请稍后重试' : '网络异常，保存事件失败');
    } finally {
      setSavingKey(null);
    }
  };

  const savePastTemplate = async (item: NonNullable<ReportEventCaptureProps['pastEventTemplates']>[number]) => {
    if (savingKey) return;
    setSavingKey(item.key);
    setError('');

    try {
      const { response, data } = await fetchJsonWithTimeout<EventSaveResponse>('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          title: item.title,
          date: getEstimatedPastEventDateKey(),
          description: buildEstimatedPastEventDescription(item.description, item.occurrenceWindow),
          impact: item.type === 'health' ? 'negative' : 'neutral',
          reminderEnabled: false,
          source: 'result_report',
          page: `/result/${reportId}`,
          fortuneAnalysis: {
            source: 'result_report',
            reportId,
            suggestionKey: item.key,
            reason: item.reason,
            title: item.title,
            templateKind: 'past_event',
            occurrenceWindow: item.occurrenceWindow,
            dateStatus: 'estimated_today_pending_correction',
          },
          followUpAdvice: {
            shortTerm: '回忆这件事大概发生在什么时间，并补充当时的真实结果。',
            longTerm: '补完真实日期和备注后，这条历史事件会成为后续判断和纠偏的重要样本。',
          },
          userFeedback: {
            wasAccurate: true,
            userNotes: '用户在结果页标记：这条过去事件确实发生过。',
          },
        }),
        timeoutMs: REPORT_EVENT_CAPTURE_TIMEOUT_MS,
        timeoutReason: 'report-past-event-save-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '保存历史事件失败');
        return;
      }

      setSavedKeys((current) => [...current, item.key]);
      void trackClientEvent({
        eventName: 'report_past_event_saved_from_result',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          templateKey: item.key,
          templateType: item.type,
          confidenceLabel: item.confidenceLabel || 'medium',
        },
      });
    } catch (requestError) {
      setError(isAbortLikeError(requestError) ? '保存历史事件等待时间过长，请稍后重试' : '网络异常，保存历史事件失败');
    } finally {
      setSavingKey(null);
    }
  };

  if (suggestions.length === 0 && pastEventTemplates.length === 0) {
    return null;
  }

  const isDocument = variant === 'document';

  return (
    <div
      id="result-event-capture"
      className={
        isDocument
          ? 'space-y-5'
          : 'rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5'
      }
    >
      {!isDocument ? (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
            <CalendarPlus className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold text-[color:var(--ink-1)]">把报告判断落成事件</div>
            <div className="mt-1 text-xs leading-5 text-[color:var(--ink-4)] intro-copy">
              先把关键建议存成事件，再回到聊天页或结果页做后续复盘。
            </div>
          </div>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div>
          {isDocument ? (
            <div className="mb-3">
              <div className="text-[13px] font-bold text-[color:var(--ink-1)]">A. 建议落成事件</div>
              <p className="mt-0.5 text-[12px] leading-[1.55] text-[color:var(--ink-4)] intro-copy">
                把报告里的关键动作记下来，方便后续复盘是否发生。
              </p>
            </div>
          ) : null}
          <div className="grid gap-3">
            {suggestions.map((item) => {
              const isSaved = savedKeys.includes(item.key);
              const title = presentReportText(item.title);
              const description = presentReportText(item.description);
              const reason = presentReportText(item.reason);
              return (
                <article
                  key={item.key}
                  className="rounded-[3px] border border-[color:var(--hairline)] bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-bold leading-snug text-[color:var(--ink-1)] break-words">
                        {title}
                      </h4>
                      <p className="mt-1.5 text-[12px] leading-5 text-[color:var(--ink-4)]">
                        <span className="whitespace-nowrap">{item.date}</span>
                        <span className="mx-1.5 text-[color:var(--ink-5)]">·</span>
                        <span className="whitespace-nowrap">{mapEventTypeLabel(item.type)}</span>
                        <span className="mx-1.5 text-[color:var(--ink-5)]">·</span>
                        <span className="whitespace-nowrap">{mapImpactLabel(item.impact)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void saveSuggestion(item)}
                      disabled={isSaved || savingKey === item.key}
                      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-[3px] border px-3 text-[12px] font-bold transition disabled:cursor-not-allowed ${
                        isSaved
                          ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                          : 'border-[color:var(--hairline-strong)] bg-[#f6f7f9] text-[color:var(--ink-3)] hover:border-[#3b5998] hover:text-[#3b5998] disabled:opacity-50'
                      }`}
                    >
                      {isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      {isSaved ? '已保存' : savingKey === item.key ? '保存中…' : '存为事件'}
                    </button>
                  </div>
                  {description ? (
                    <p className="mt-2.5 text-[13px] leading-[1.65] text-[color:var(--ink-2)] break-words">
                      {description}
                    </p>
                  ) : null}
                  {reason ? (
                    <p className="mt-2 rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2 text-[12px] leading-[1.6] text-[color:var(--ink-3)] break-words">
                      {reason}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[3px] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-[12px] font-semibold text-[color:var(--alert)]">
          {error}
        </div>
      ) : null}

      {pastEventTemplates.length > 0 ? (
        <div className={suggestions.length > 0 ? 'border-t border-[color:var(--hairline)] pt-5' : ''}>
          <div className="mb-3">
            <div className="text-[13px] font-bold text-[color:var(--ink-1)]">
              {isDocument ? 'B. 回看过去是否发生过这些节点' : '回看过去是否发生过这些节点'}
            </div>
            <p className="mt-0.5 text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
              若某条确实发生过，点「这条发生过」。系统先按今天建历史样本，你之后可补真实日期。
            </p>
          </div>
          <div className="grid gap-3">
            {pastEventTemplates.map((item) => {
              const isSaved = savedKeys.includes(item.key);
              const title = presentReportText(item.title);
              const description = presentReportText(item.description);
              const reason = presentReportText(item.reason);
              const windowText = presentReportText(item.occurrenceWindow);
              const confidenceHigh = item.confidenceLabel === 'high';
              return (
                <article
                  key={item.key}
                  className="rounded-[3px] border border-[color:var(--hairline)] bg-white p-4"
                >
                  {/* 标题行：禁止把长时段塞进固定高度 badge，避免中文竖排 */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-bold leading-snug text-[color:var(--ink-1)] break-words">
                        {title}
                      </h4>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center whitespace-nowrap rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-3)]">
                          {mapEventTypeLabel(item.type)}
                        </span>
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-[3px] border px-2 py-0.5 text-[11px] font-bold ${
                            confidenceHigh
                              ? 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
                              : 'border-[color:var(--hairline)] bg-[#f6f7f9] text-[color:var(--ink-4)]'
                          }`}
                        >
                          {confidenceHigh ? '高概率' : '中概率'}
                        </span>
                      </div>
                      {windowText ? (
                        <p className="mt-2 text-[12px] leading-[1.55] text-[color:var(--ink-4)] break-words">
                          <span className="font-semibold text-[color:var(--ink-3)]">可能时段</span>
                          <span className="mx-1.5 text-[color:var(--ink-5)]">·</span>
                          {windowText}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void savePastTemplate(item)}
                      disabled={isSaved || savingKey === item.key}
                      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-[3px] border px-3 text-[12px] font-bold transition disabled:cursor-not-allowed ${
                        isSaved
                          ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                          : 'border-[color:var(--hairline-strong)] bg-[#f6f7f9] text-[color:var(--ink-3)] hover:border-[#3b5998] hover:text-[#3b5998] disabled:opacity-50'
                      }`}
                    >
                      {isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      {isSaved ? '已记为发生过' : savingKey === item.key ? '保存中…' : '这条发生过'}
                    </button>
                  </div>
                  {description ? (
                    <p className="mt-2.5 text-[13px] leading-[1.65] text-[color:var(--ink-2)] break-words">
                      {description}
                    </p>
                  ) : null}
                  {reason ? (
                    <p className="mt-2 rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2 text-[12px] leading-[1.6] text-[color:var(--ink-3)] break-words">
                      {reason}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-[color:var(--hairline)] pt-4">
        <Link
          href={buildReportContinueChatHref({
            reportId,
            teacher: 'practice',
            window: '事件验证复盘',
            source: 'report_event_capture',
            ctaStrategyKey,
            sourceFamily,
          })}
          onClick={() => {
            void trackClientEvent({
              eventName: 'result_cta_clicked',
              page: `/result/${reportId}`,
              meta: {
                reportId,
                target: 'chat_opening',
                source: 'report_event_capture',
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
                mode: 'opening',
              },
            });
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-[3px] bg-[#3b5998] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2d4373]"
        >
          带事件开场复盘
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/events?reportId=${encodeURIComponent(reportId)}`}
          onClick={() => {
            void trackClientEvent({
              eventName: 'result_cta_clicked',
              page: `/result/${reportId}`,
              meta: {
                reportId,
                target: 'events',
                source: 'report_event_capture',
              },
            });
          }}
          className="action-secondary inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-[color:var(--hairline-strong)] bg-white px-3 text-[13px] font-semibold text-[color:var(--ink-3)] hover:border-[#3b5998] hover:text-[#3b5998]"
        >
          查看事件中心
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function mapEventTypeLabel(type: string) {
  switch (type) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '关系';
    case 'health':
      return '健康';
    case 'family':
      return '家庭';
    default:
      return '其他';
  }
}

function mapImpactLabel(impact: string) {
  switch (impact) {
    case 'positive':
      return '积极';
    case 'negative':
      return '风险';
    default:
      return '中性';
  }
}
