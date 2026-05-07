'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { ReportActionSuggestion } from '@/lib/report-v2';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildChatHref } from '@/lib/chat-entry';
import {
  buildEstimatedPastEventDescription,
  getEstimatedPastEventDateKey,
} from '@/lib/event-view';

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
}

export default function ReportEventCapture({
  reportId,
  suggestions,
  ctaStrategyKey,
  sourceFamily,
  pastEventTemplates = [],
}: ReportEventCaptureProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [error, setError] = useState('');

  const saveSuggestion = async (item: ReportActionSuggestion) => {
    if (savingKey) return;
    setSavingKey(item.key);
    setError('');

    try {
      const response = await fetch('/api/events', {
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
      });
      const data = await response.json();
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
    } catch {
      setError('网络异常，保存事件失败');
    } finally {
      setSavingKey(null);
    }
  };

  const savePastTemplate = async (item: NonNullable<ReportEventCaptureProps['pastEventTemplates']>[number]) => {
    if (savingKey) return;
    setSavingKey(item.key);
    setError('');

    try {
      const response = await fetch('/api/events', {
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
      });
      const data = await response.json();
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
    } catch {
      setError('网络异常，保存历史事件失败');
    } finally {
      setSavingKey(null);
    }
  };

  if (suggestions.length === 0 && pastEventTemplates.length === 0) {
    return null;
  }

  return (
    <div
      id="result-event-capture"
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
          <CalendarPlus className="h-4 w-4" />
        </div>
        <div>
          <div className="text-base font-bold text-[color:var(--ink-1)]">把报告判断落成事件</div>
          <div className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">
            先把关键建议存成事件，再回到聊天页或结果页做后续复盘。
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5">
        {suggestions.map((item) => {
          const isSaved = savedKeys.includes(item.key);
          return (
            <div
              key={item.key}
              className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[color:var(--ink-1)]">{item.title}</div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] tabular-nums text-[color:var(--ink-5)]">
                    <span>{item.date}</span>
                    <span>·</span>
                    <span>{mapEventTypeLabel(item.type)}</span>
                    <span>·</span>
                    <span>{mapImpactLabel(item.impact)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void saveSuggestion(item)}
                  disabled={isSaved || savingKey === item.key}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius)] border px-3 text-xs font-bold transition disabled:cursor-not-allowed ${
                    isSaved
                      ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                      : 'border-[color:var(--hairline-strong)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)] disabled:opacity-50'
                  }`}
                >
                  {isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                  {isSaved ? '已保存' : savingKey === item.key ? '保存中…' : '存为事件'}
                </button>
              </div>
              <div className="mt-2 text-xs leading-5 text-[color:var(--ink-2)]">
                {item.description}
              </div>
              <div className="mt-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 text-xs leading-5 text-[color:var(--ink-3)]">
                {item.reason}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
          {error}
        </div>
      )}

      {pastEventTemplates.length > 0 ? (
        <div className="mt-5">
          <div className="text-sm font-bold text-[color:var(--ink-1)]">回看过去是否发生过这些节点</div>
          <div className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">
            如果其中某条确实发生过，直接存下来。系统会先按今天建一条历史样本，后续你再补真实日期。
          </div>
          <div className="mt-3 grid gap-2.5">
            {pastEventTemplates.map((item) => {
              const isSaved = savedKeys.includes(item.key);
              return (
                <div
                  key={item.key}
                  className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[color:var(--ink-1)]">{item.title}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 font-mono text-[10px] font-semibold text-[color:var(--ink-4)]">
                          {mapEventTypeLabel(item.type)}
                        </span>
                        {item.occurrenceWindow ? (
                          <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 font-mono text-[10px] tabular-nums text-[color:var(--ink-4)]">
                            {item.occurrenceWindow}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex h-5 items-center rounded-[var(--radius-sm)] border px-1.5 text-[10px] font-bold ${
                            item.confidenceLabel === 'high'
                              ? 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
                              : 'border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] text-[color:var(--ink-4)]'
                          }`}
                        >
                          {item.confidenceLabel === 'high' ? '高概率' : '中概率'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void savePastTemplate(item)}
                      disabled={isSaved || savingKey === item.key}
                      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius)] border px-3 text-xs font-bold transition disabled:cursor-not-allowed ${
                        isSaved
                          ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                          : 'border-[color:var(--hairline-strong)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)] disabled:opacity-50'
                      }`}
                    >
                      {isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      {isSaved ? '已记为发生过' : savingKey === item.key ? '保存中…' : '这条发生过'}
                    </button>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-[color:var(--ink-2)]">
                    {item.description}
                  </div>
                  <div className="mt-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs leading-5 text-[color:var(--ink-3)]">
                    {item.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildChatHref({
            reportId,
            question: '请结合我刚刚记录或确认过的这些事件，帮我继续复盘这份报告：哪些判断已经被验证，哪些地方还需要继续观察？',
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
                target: 'chat',
                source: 'report_event_capture',
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              },
            });
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
        >
          去 AI 深问这份报告
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
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
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
